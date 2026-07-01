import { isProviderAuthFailureMessage, type DiscoveryProviderDiagnostic } from "./providerDiagnostics";

export const DISCOVERY_PROVIDER_STATUS_COOKIE = "thucydides_discovery_provider_status";

export type PersistedProviderTestStatusValue = {
  provider: DiscoveryProviderDiagnostic["provider"];
  status: "verified" | "auth_failed" | "failed";
  message: string;
  timestamp: string;
};

export type PersistedProviderTestStatuses = Partial<Record<DiscoveryProviderDiagnostic["provider"], PersistedProviderTestStatusValue>>;

export function providerStatusFromDiagnostic(result: DiscoveryProviderDiagnostic): PersistedProviderTestStatusValue["status"] {
  if (result.ok) return "verified";
  if (isProviderAuthFailureMessage(result.message)) return "auth_failed";
  return "failed";
}

export function parseProviderTestStatusCookie(value: string | undefined | null): PersistedProviderTestStatuses {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Partial<Record<string, Partial<PersistedProviderTestStatusValue>>>;
    const result: PersistedProviderTestStatuses = {};
    for (const provider of ["TAVILY", "SERPAPI_GOOGLE_JOBS"] as const) {
      const item = parsed[provider];
      if (!item || item.provider !== provider) continue;
      if (item.status !== "verified" && item.status !== "auth_failed" && item.status !== "failed") continue;
      if (typeof item.message !== "string" || typeof item.timestamp !== "string") continue;
      result[provider] = {
        provider,
        status: item.status,
        message: item.message,
        timestamp: item.timestamp
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function serializeProviderTestStatusCookie(statuses: PersistedProviderTestStatuses) {
  return JSON.stringify(statuses);
}

export function updateProviderTestStatuses(
  statuses: PersistedProviderTestStatuses,
  result: DiscoveryProviderDiagnostic,
  timestamp = new Date().toISOString()
): PersistedProviderTestStatuses {
  return {
    ...statuses,
    [result.provider]: {
      provider: result.provider,
      status: providerStatusFromDiagnostic(result),
      message: result.message,
      timestamp
    }
  };
}

export function providerTestStateFromPersisted(status: PersistedProviderTestStatusValue | null | undefined) {
  if (!status) return undefined;
  return {
    ok: status.status === "verified",
    message: status.message
  };
}

export function getEffectiveProviderTestState(
  provider: DiscoveryProviderDiagnostic["provider"],
  input: {
    queryProvider?: DiscoveryProviderDiagnostic["provider"] | null;
    queryState?: { ok: boolean; message?: string | null } | undefined;
    persistedStatuses?: PersistedProviderTestStatuses;
  }
) {
  if (input.queryProvider === provider && input.queryState) return input.queryState;
  return providerTestStateFromPersisted(input.persistedStatuses?.[provider]);
}
