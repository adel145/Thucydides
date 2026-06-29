import { DISCOVERY_PROVIDERS, getDiscoveryProviderStatus } from "./discoveryProviders";
import type { DiscoverySearchLead } from "./tavilySearchClient";

export type SerpApiGoogleJob = {
  title?: string;
  company_name?: string;
  location?: string;
  via?: string;
  description?: string;
  related_links?: Array<{ link?: string; text?: string }>;
  extensions?: string[];
};

export function getSerpApiConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env) {
  const status = getDiscoveryProviderStatus(env);
  const apiKey = env.SERPAPI_API_KEY?.trim() ?? "";
  return {
    enabled: status.serpApiConfigured,
    apiKey,
    maxResults: status.maxResults,
    country: status.country
  };
}

export async function serpApiGoogleJobsSearch(
  query: string,
  options: { apiKey: string; location?: string; maxResults?: number; timeoutMs?: number }
): Promise<SerpApiGoogleJob[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", query);
    url.searchParams.set("api_key", options.apiKey);
    if (options.location) url.searchParams.set("location", options.location);
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`SerpApi Google Jobs failed: ${response.status}`);
    const json = await response.json() as { jobs_results?: SerpApiGoogleJob[] };
    return (json.jobs_results ?? []).slice(0, Math.min(options.maxResults ?? 10, 20));
  } finally {
    clearTimeout(timeout);
  }
}

export function mapSerpApiJobsToLeads(query: string, jobs: SerpApiGoogleJob[]): DiscoverySearchLead[] {
  return jobs
    .filter((job) => job.title)
    .map((job) => ({
      title: job.title ?? "Untitled job",
      company: job.company_name ?? null,
      location: job.location ?? null,
      sourceUrl: job.related_links?.find((link) => link.link)?.link ?? null,
      rawSnippet: job.description ?? [job.title, job.company_name, job.location].filter(Boolean).join(" | "),
      rawText: [job.description, ...(job.extensions ?? [])].filter(Boolean).join("\n"),
      discoverySource: "GOOGLE_JOBS",
      discoveryProvider: DISCOVERY_PROVIDERS.SERPAPI_GOOGLE_JOBS,
      discoveryQuery: query,
      confidence: job.description ? "MEDIUM" : "LOW"
    }));
}
