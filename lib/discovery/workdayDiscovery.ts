import { extractCareerJobLinks, type ExtractedCareerJobLink } from "./careerLinkExtractor";
import { DISCOVERY_PROVIDERS } from "./discoveryProviders";
import { extractJobDescriptionFromHtml } from "./jobDescriptionExtractor";
import type { DiscoverySearchLead } from "./tavilySearchClient";

export function isWorkdayUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    return new URL(value).hostname.toLocaleLowerCase().endsWith("myworkdayjobs.com");
  } catch {
    return false;
  }
}

export function isWorkdaySearchUrl(value: string | null | undefined) {
  if (!isWorkdayUrl(value)) return false;
  try {
    const url = new URL(value ?? "");
    return /search|jobs/i.test(`${url.pathname} ${url.search}`);
  } catch {
    return false;
  }
}

export function isWorkdayExactJobUrl(value: string | null | undefined) {
  if (!isWorkdayUrl(value)) return false;
  try {
    const url = new URL(value ?? "");
    return /\/job\//i.test(url.pathname) || /\/\d{4,}|_JR\d+|JR\d+/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function extractWorkdayJobLinks(html: string, baseUrl: string): ExtractedCareerJobLink[] {
  return extractCareerJobLinks(html, baseUrl)
    .filter((link) => isWorkdayExactJobUrl(link.url));
}

export function isLikelyJsOnlyWorkdayPage(html: string) {
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return visible.length < 120 && /workday|wday|wd5|workdayjobs/i.test(html);
}

export function prepareWorkdayLeadFromHtml(input: {
  url: string;
  html: string;
  fallbackTitle?: string | null;
  fallbackSnippet?: string | null;
  query?: string | null;
}): DiscoverySearchLead | null {
  if (!isWorkdayExactJobUrl(input.url)) return null;
  const extracted = extractJobDescriptionFromHtml(input.html);
  const title = extracted.title ?? input.fallbackTitle;
  const description = extracted.description;
  if (!title || !description || description.trim().length < 80) return null;

  return {
    title,
    company: extracted.company ?? null,
    location: extracted.location ?? null,
    sourceUrl: input.url,
    rawSnippet: description.slice(0, 1200),
    rawText: description,
    discoverySource: "WORKDAY_PUBLIC",
    discoveryProvider: DISCOVERY_PROVIDERS.COMPANY_CAREERS,
    discoveryQuery: input.query ?? "workday",
    confidence: extracted.confidence === "HIGH" ? "HIGH" : "MEDIUM"
  };
}

export function classifyWorkdaySource(url: string | null | undefined) {
  if (!isWorkdayUrl(url)) return null;
  if (isWorkdayExactJobUrl(url)) {
    return {
      classification: "ATS_JOB_POSTING" as const,
      confidence: "HIGH" as const,
      reason: "Exact public Workday job URL detected; fetch before import.",
      importable: true
    };
  }
  return {
    classification: "ATS_BOARD" as const,
    confidence: "HIGH" as const,
    reason: "Workday search/listing page is not a single job posting; enumerate public links first.",
    importable: false
  };
}
