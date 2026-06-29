import { getGmailAlertProviderLabel } from "./gmailAlertProviders";
import { validateJob } from "../rules/validateJob";

export type JobLeadForImport = {
  title: string;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  rawSnippet: string;
  rawText?: string | null;
  provider?: string | null;
  validationStatus?: string | null;
  forbiddenFlags?: unknown;
};

export type ExistingJobForDuplicateCheck = {
  id: string;
  title: string;
  company?: string | null;
  sourceUrl?: string | null;
};

export function normalizeLeadIdentity(value: string | null | undefined) {
  return value?.toLocaleLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

export function findDuplicateJobForLead(lead: JobLeadForImport, jobs: ExistingJobForDuplicateCheck[]) {
  const leadUrl = normalizeLeadIdentity(lead.sourceUrl);
  if (leadUrl) {
    const match = jobs.find((job) => normalizeLeadIdentity(job.sourceUrl) === leadUrl);
    if (match) return match;
  }

  const leadTitle = normalizeLeadIdentity(lead.title);
  const leadCompany = normalizeLeadIdentity(lead.company);
  if (!leadTitle || !leadCompany) return null;

  return jobs.find((job) => normalizeLeadIdentity(job.title) === leadTitle && normalizeLeadIdentity(job.company) === leadCompany) ?? null;
}

export function buildLeadRawDescription(lead: JobLeadForImport) {
  const providerLabel = getGmailAlertProviderLabel(lead.provider);
  return [
    `Imported manually from Gmail job alert: ${providerLabel}.`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.location ? `Location: ${lead.location}` : null,
    lead.sourceUrl ? `Source URL: ${lead.sourceUrl}` : null,
    "",
    "Lead snippet:",
    lead.rawSnippet,
    lead.rawText && lead.rawText !== lead.rawSnippet ? ["", "Raw lead text:", lead.rawText].join("\n") : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function prepareJobCreateFromLead(lead: JobLeadForImport) {
  const rawDescription = buildLeadRawDescription(lead);
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
      source: `Gmail job alert: ${getGmailAlertProviderLabel(lead.provider)}`,
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
