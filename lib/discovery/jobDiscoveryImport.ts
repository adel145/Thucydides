import { getDiscoveryProviderLabel } from "./discoveryProviders";
import { discoveryPostingReviewReason, isReadyToImportDiscoveryLead } from "./discoveryLeadViews";
import { scoreDiscoveryLead } from "./jobDiscoveryScoring";
import { validateJob } from "../rules/validateJob";

export type DiscoveryLeadForImport = {
  title: string;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  rawSnippet: string;
  rawText?: string | null;
  provider?: string | null;
  discoverySource?: string | null;
  discoveryProvider?: string | null;
  extractedDescription?: string | null;
  extractedRequirements?: string | null;
  extractedRemotePolicy?: string | null;
  extractedLanguage?: string | null;
  confidence?: string | null;
  sourceClassification?: string | null;
  fitScore?: number | null;
  validationStatus?: string | null;
  allowedSignals?: unknown;
};

function sourceLabel(lead: DiscoveryLeadForImport) {
  if (lead.discoveryProvider === "GREENHOUSE" || lead.discoverySource === "COMPANY_CAREERS") {
    return `Company careers: ${lead.company ?? "Unknown company"}`;
  }
  if (lead.discoveryProvider === "SERPAPI_GOOGLE_JOBS") return "SerpApi Google Jobs";
  if (lead.discoveryProvider === "TAVILY") return "Tavily web search";
  return getDiscoveryProviderLabel(lead.discoveryProvider ?? lead.provider);
}

export function buildDiscoveryLeadRawDescription(lead: DiscoveryLeadForImport) {
  const description = lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet;
  return [
    `Imported manually from discovery source: ${sourceLabel(lead)}.`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.location ? `Location: ${lead.location}` : null,
    lead.sourceUrl ? `Source URL: ${lead.sourceUrl}` : null,
    lead.extractedRemotePolicy ? `Remote policy: ${lead.extractedRemotePolicy}` : null,
    lead.extractedLanguage ? `Language: ${lead.extractedLanguage}` : null,
    "",
    "Extracted description:",
    description,
    lead.extractedRequirements ? ["", "Extracted requirements:", lead.extractedRequirements].join("\n") : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function prepareJobCreateFromDiscoveryLead(lead: DiscoveryLeadForImport) {
  const meaningfulDescription = lead.extractedDescription ?? lead.rawText;
  const earlyValidation = validateJob({
    title: lead.title,
    company: lead.company,
    location: lead.location,
    rawDescription: meaningfulDescription ?? lead.rawSnippet
  });
  const scoring = scoreDiscoveryLead({
    title: lead.title,
    company: lead.company,
    location: lead.location,
    description: meaningfulDescription ?? lead.rawSnippet,
    validationStatus: earlyValidation.validationStatus,
    allowedSignals: earlyValidation.allowedSignals,
    forbiddenFlags: earlyValidation.forbiddenFlags,
    riskNotes: earlyValidation.riskNotes.join("\n")
  });
  if (earlyValidation.validationStatus === "FORBIDDEN") {
    return {
      ok: false as const,
      reason: "FORBIDDEN" as const,
      validation: earlyValidation
    };
  }

  const readyForImport = isReadyToImportDiscoveryLead({
    ...lead,
    extractedDescription: meaningfulDescription,
    validationStatus: earlyValidation.validationStatus,
    allowedSignals: earlyValidation.allowedSignals,
    fitScore: scoring.score
  });
  if (!readyForImport) {
    return {
      ok: false as const,
      reason: "NOT_IMPORTABLE" as const,
      validation: earlyValidation,
      reviewReason: discoveryPostingReviewReason({
        ...lead,
        extractedDescription: meaningfulDescription,
        validationStatus: earlyValidation.validationStatus,
        allowedSignals: earlyValidation.allowedSignals,
        fitScore: scoring.score
      })
    };
  }

  const rawDescription = buildDiscoveryLeadRawDescription(lead);
  const validation = validateJob({
    title: lead.title,
    company: lead.company,
    location: lead.location,
    rawDescription
  });

  if (validation.validationStatus === "FORBIDDEN") {
    return {
      ok: false as const,
      reason: "FORBIDDEN" as const,
      validation
    };
  }

  return {
    ok: true as const,
    data: {
      title: lead.title,
      company: lead.company ?? null,
      source: sourceLabel(lead),
      sourceUrl: lead.sourceUrl ?? null,
      location: lead.location ?? null,
      rawDescription,
      status: "FOUND",
      validationStatus: validation.validationStatus,
      forbiddenFlags: validation.forbiddenFlags,
      allowedSignals: validation.allowedSignals,
      riskNotes: validation.riskNotes.join("\n")
    },
    validation
  };
}
