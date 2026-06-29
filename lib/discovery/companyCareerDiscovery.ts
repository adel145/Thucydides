import { DISCOVERY_PROVIDERS } from "./discoveryProviders";
import type { DiscoverySearchLead } from "./tavilySearchClient";

export type GreenhouseJob = {
  id?: number;
  title?: string;
  absolute_url?: string;
  content?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string }>;
};

export function detectGreenhouseBoardToken(urlValue: string | null | undefined) {
  if (!urlValue) return null;
  try {
    const url = new URL(urlValue);
    const path = url.pathname.split("/").filter(Boolean);
    if (url.hostname === "boards.greenhouse.io" && path[0]) return path[0];
    const boardIndex = path.findIndex((part) => part === "boards");
    if (url.hostname === "boards-api.greenhouse.io" && boardIndex >= 0 && path[boardIndex + 1]) return path[boardIndex + 1];
    if (url.hostname.endsWith("greenhouse.io") && path[0] && path[0] !== "v1") return path[0];
  } catch {
    return null;
  }
  return null;
}

function stripHtml(value: string | null | undefined) {
  return value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

export function mapGreenhouseJobToLead(boardToken: string, job: GreenhouseJob): DiscoverySearchLead | null {
  if (!job.title) return null;
  const location = job.location?.name ?? job.offices?.map((office) => office.name).filter(Boolean).join(" / ") ?? null;
  return {
    title: job.title,
    company: boardToken,
    location,
    sourceUrl: job.absolute_url ?? null,
    rawSnippet: stripHtml(job.content) || job.title,
    rawText: stripHtml(job.content),
    discoverySource: "COMPANY_CAREERS",
    discoveryProvider: DISCOVERY_PROVIDERS.GREENHOUSE,
    discoveryQuery: `greenhouse:${boardToken}`,
    confidence: job.content ? "HIGH" : "MEDIUM"
  };
}

export async function fetchGreenhouseBoardJobs(boardToken: string, options: { timeoutMs?: number } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Greenhouse board fetch failed: ${response.status}`);
    const json = await response.json() as { jobs?: GreenhouseJob[] };
    return (json.jobs ?? []).map((job) => mapGreenhouseJobToLead(boardToken, job)).filter((lead): lead is DiscoverySearchLead => Boolean(lead));
  } finally {
    clearTimeout(timeout);
  }
}
