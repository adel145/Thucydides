export const DISCOVERY_PROVIDERS = {
  COMPANY_CAREERS: "COMPANY_CAREERS",
  GREENHOUSE: "GREENHOUSE",
  TAVILY: "TAVILY",
  SERPAPI_GOOGLE_JOBS: "SERPAPI_GOOGLE_JOBS",
  GMAIL_ALERT: "GMAIL_ALERT"
} as const;

export type DiscoveryProvider = (typeof DISCOVERY_PROVIDERS)[keyof typeof DISCOVERY_PROVIDERS];

export type DiscoveryProviderStatus = {
  tavilyConfigured: boolean;
  serpApiConfigured: boolean;
  gmailConnected: false;
  maxResults: number;
  country: string;
};

function envValue(env: NodeJS.ProcessEnv | Record<string, string | undefined>, key: string) {
  return env[key]?.trim() ?? "";
}

export function getDiscoveryProviderStatus(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): DiscoveryProviderStatus {
  const maxResults = Number.parseInt(envValue(env, "JOB_DISCOVERY_MAX_RESULTS"), 10);
  return {
    tavilyConfigured: envValue(env, "TAVILY_API_KEY").length > 0,
    serpApiConfigured: envValue(env, "SERPAPI_API_KEY").length > 0,
    gmailConnected: false,
    maxResults: Number.isFinite(maxResults) && maxResults > 0 ? Math.min(maxResults, 50) : 20,
    country: envValue(env, "JOB_DISCOVERY_COUNTRY") || "israel"
  };
}

export function getDiscoveryProviderLabel(provider: string | null | undefined) {
  switch (provider) {
    case "COMPANY_CAREERS":
      return "Company careers";
    case "GREENHOUSE":
      return "Greenhouse";
    case "TAVILY":
      return "Tavily web search";
    case "SERPAPI_GOOGLE_JOBS":
      return "SerpApi Google Jobs";
    case "GMAIL_ALERT":
      return "Gmail job alert";
    default:
      return provider ?? "Unknown provider";
  }
}
