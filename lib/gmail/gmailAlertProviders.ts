export const GMAIL_ALERT_PROVIDERS = {
  LINKEDIN: "LINKEDIN",
  INDEED: "INDEED",
  DRUSHIM: "DRUSHIM",
  ALLJOBS: "ALLJOBS",
  GLASSDOOR: "GLASSDOOR",
  GOOGLE_JOBS: "GOOGLE_JOBS",
  OTHER: "OTHER"
} as const;

export type GmailAlertProvider = (typeof GMAIL_ALERT_PROVIDERS)[keyof typeof GMAIL_ALERT_PROVIDERS];

export const gmailAlertProviderLabels: Record<GmailAlertProvider, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  DRUSHIM: "Drushim",
  ALLJOBS: "AllJobs",
  GLASSDOOR: "Glassdoor",
  GOOGLE_JOBS: "Google Jobs",
  OTHER: "אחר"
};

const providerPatterns: Record<GmailAlertProvider, string[]> = {
  LINKEDIN: ["linkedin", "jobs-noreply@linkedin", "linkedin job alert"],
  INDEED: ["indeed", "alert@indeed", "indeed job alert"],
  DRUSHIM: ["drushim", "דרושים", "דרושים il"],
  ALLJOBS: ["alljobs", "all jobs", "אולג'ובס", "אול ג'ובס"],
  GLASSDOOR: ["glassdoor"],
  GOOGLE_JOBS: ["google jobs", "jobs on google", "google job alert", "התראות google"],
  OTHER: []
};

export function normalizeGmailProvider(value: string | null | undefined): GmailAlertProvider {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return Object.values(GMAIL_ALERT_PROVIDERS).includes(normalized as GmailAlertProvider) ? (normalized as GmailAlertProvider) : "OTHER";
}

export function getGmailAlertProviderLabel(provider: string | null | undefined) {
  return gmailAlertProviderLabels[normalizeGmailProvider(provider)] ?? gmailAlertProviderLabels.OTHER;
}

function normalizeText(value: string | null | undefined) {
  return value?.toLocaleLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

export function classifyGmailAlertProvider(input: {
  provider?: string | null;
  sender?: string | null;
  subject?: string | null;
  rawText?: string | null;
}): GmailAlertProvider {
  const explicit = normalizeGmailProvider(input.provider);
  if (explicit !== "OTHER") return explicit;

  const text = normalizeText([input.sender, input.subject, input.rawText].filter(Boolean).join(" "));
  for (const provider of Object.values(GMAIL_ALERT_PROVIDERS)) {
    if (provider === "OTHER") continue;
    if (providerPatterns[provider].some((pattern) => text.includes(normalizeText(pattern)))) return provider;
  }

  return "OTHER";
}
