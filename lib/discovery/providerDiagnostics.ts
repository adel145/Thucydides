import { getSerpApiConfig, serpApiGoogleJobsSearch } from "./serpApiJobsClient";
import { getTavilyConfig, tavilySearch } from "./tavilySearchClient";

export type DiscoveryProviderDiagnostic = {
  ok: boolean;
  provider: "TAVILY" | "SERPAPI_GOOGLE_JOBS";
  message: string;
};

export function formatProviderDiagnosticError(provider: DiscoveryProviderDiagnostic["provider"], error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "Unknown provider error.");
  if (provider === "SERPAPI_GOOGLE_JOBS" && /\b401\b/.test(message)) {
    return "SerpApi authorization failed: check SERPAPI_API_KEY/account.";
  }
  if (provider === "TAVILY" && /\b401\b/.test(message)) {
    return "Tavily authorization failed: check TAVILY_API_KEY/account.";
  }
  if (provider === "SERPAPI_GOOGLE_JOBS") return `SerpApi test failed: ${message}`;
  return `Tavily test failed: ${message}`;
}

export function isProviderAuthFailureMessage(message: string) {
  return /authorization failed|failed:\s*401|\b401\b/i.test(message);
}

export function dedupeProviderMessages(messages: string[]) {
  return [...new Set(messages.filter(Boolean))];
}

export function providerStatusLabel(provider: DiscoveryProviderDiagnostic["provider"], keyPresent: boolean, tested?: { ok: boolean; message?: string | null }) {
  const name = provider === "SERPAPI_GOOGLE_JOBS" ? "SerpApi" : "Tavily";
  if (tested) {
    if (tested.ok) return `${name} verified`;
    if (provider === "SERPAPI_GOOGLE_JOBS" && tested.message && isProviderAuthFailureMessage(tested.message)) return "SerpApi auth failed";
    return `${name} failed`;
  }
  return `${name} ${keyPresent ? "key present" : "key missing"}`;
}

export async function testDiscoveryProvider(
  provider: DiscoveryProviderDiagnostic["provider"],
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): Promise<DiscoveryProviderDiagnostic> {
  try {
    if (provider === "TAVILY") {
      const config = getTavilyConfig(env);
      if (!config.enabled) return { ok: false, provider, message: "Tavily is not configured." };
      await tavilySearch("software engineer Israel", { apiKey: config.apiKey, maxResults: 1, timeoutMs: 7000 });
      return { ok: true, provider, message: "Tavily test succeeded." };
    }

    const config = getSerpApiConfig(env);
    if (!config.enabled) return { ok: false, provider, message: "SerpApi is not configured." };
    await serpApiGoogleJobsSearch("software engineer Israel", { apiKey: config.apiKey, location: "Israel", maxResults: 1, timeoutMs: 7000 });
    return { ok: true, provider, message: "SerpApi test succeeded." };
  } catch (error) {
    return { ok: false, provider, message: formatProviderDiagnosticError(provider, error) };
  }
}
