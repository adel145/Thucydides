import { DISCOVERY_PROVIDERS, getDiscoveryProviderStatus } from "./discoveryProviders";

export type TavilySearchResult = {
  title: string;
  url: string;
  content?: string | null;
  rawContent?: string | null;
  score?: number | null;
};

export type DiscoverySearchLead = {
  title: string;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  rawSnippet: string;
  rawText?: string | null;
  discoverySource: string;
  discoveryProvider: string;
  discoveryQuery: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

export function getTavilyConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env) {
  const status = getDiscoveryProviderStatus(env);
  const apiKey = env.TAVILY_API_KEY?.trim() ?? "";
  return {
    enabled: status.tavilyConfigured,
    apiKey,
    maxResults: status.maxResults,
    country: status.country
  };
}

export async function tavilySearch(
  query: string,
  options: { apiKey: string; maxResults?: number; includeRawContent?: boolean; timeoutMs?: number }
): Promise<TavilySearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        query,
        max_results: Math.min(options.maxResults ?? 10, 20),
        include_raw_content: Boolean(options.includeRawContent),
        search_depth: "basic"
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Tavily search failed: ${response.status}`);
    const json = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string; raw_content?: string; score?: number }> };
    return (json.results ?? [])
      .filter((result) => result.title && result.url)
      .map((result) => ({
        title: result.title ?? "Untitled result",
        url: result.url ?? "",
        content: result.content ?? null,
        rawContent: result.raw_content ?? null,
        score: result.score ?? null
      }));
  } finally {
    clearTimeout(timeout);
  }
}

export function mapTavilyResultsToLeads(query: string, results: TavilySearchResult[]): DiscoverySearchLead[] {
  return results.map((result) => ({
    title: result.title,
    sourceUrl: result.url,
    rawSnippet: result.content ?? result.title,
    rawText: result.rawContent ?? result.content ?? result.title,
    discoverySource: "WEB_SEARCH",
    discoveryProvider: DISCOVERY_PROVIDERS.TAVILY,
    discoveryQuery: query,
    confidence: result.rawContent ? "MEDIUM" : "LOW"
  }));
}
