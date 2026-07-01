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

export function shouldDisableProviderForRunAfterError(provider: DiscoveryProviderDiagnostic["provider"], message: string) {
  return provider === "SERPAPI_GOOGLE_JOBS" && isProviderAuthFailureMessage(message);
}

export function dedupeProviderMessages(messages: string[]) {
  return [...new Set(messages.filter(Boolean))];
}

export type DiscoveryProviderStatusKind = "MISSING_KEY" | "KEY_PRESENT" | "VERIFIED" | "AUTH_FAILED" | "DISABLED_FOR_RUN" | "FAILED";

export function providerStatusKind(
  provider: DiscoveryProviderDiagnostic["provider"],
  keyPresent: boolean,
  tested?: { ok: boolean; message?: string | null },
  options: { disabledForRun?: boolean } = {}
): DiscoveryProviderStatusKind {
  if (!keyPresent) return "MISSING_KEY";
  if (options.disabledForRun) return "DISABLED_FOR_RUN";
  if (!tested) return "KEY_PRESENT";
  if (tested.ok) return "VERIFIED";
  if (provider === "SERPAPI_GOOGLE_JOBS" && tested.message && isProviderAuthFailureMessage(tested.message)) return "AUTH_FAILED";
  return "FAILED";
}

export function providerStatusLabel(provider: DiscoveryProviderDiagnostic["provider"], keyPresent: boolean, tested?: { ok: boolean; message?: string | null }) {
  const name = provider === "SERPAPI_GOOGLE_JOBS" ? "SerpApi" : "Tavily";
  const kind = providerStatusKind(provider, keyPresent, tested);
  if (kind === "MISSING_KEY") return `${name} key missing`;
  if (kind === "KEY_PRESENT") return `${name} key present`;
  if (kind === "VERIFIED") return `${name} verified`;
  if (kind === "AUTH_FAILED") return "SerpApi auth failed";
  if (kind === "DISABLED_FOR_RUN") return `${name} disabled for this run`;
  return `${name} failed`;
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
