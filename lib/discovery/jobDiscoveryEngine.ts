import { Prisma } from "@/generated/prisma/client";
import { validateJob } from "../rules/validateJob";
import { detectGreenhouseBoardToken, detectGreenhouseJobId, fetchGreenhouseBoardJobs } from "./companyCareerDiscovery";
import { DISCOVERY_PROVIDERS, getDiscoveryProviderStatus } from "./discoveryProviders";
import { buildCompanyCareerQueries, buildPlatformDiscoveryQueries } from "./discoveryQueries";
import { extractJobDescriptionFromHtml, extractJsonLdJobPosting } from "./jobDescriptionExtractor";
import { fetchPublicJobPage } from "./jobPageFetcher";
import { scoreDiscoveryLead } from "./jobDiscoveryScoring";
import { classifyDiscoverySource, isImportableSourceClassification, SOURCE_CLASSIFICATIONS } from "./pageClassifier";
import { getSerpApiConfig, mapSerpApiJobsToLeads, serpApiGoogleJobsSearch } from "./serpApiJobsClient";
import { getTavilyConfig, mapTavilyResultsToLeads, tavilySearch, type DiscoverySearchLead } from "./tavilySearchClient";

export type PreparedDiscoveryLead = {
  sourceType: string;
  provider?: string | null;
  discoverySource?: string | null;
  discoveryProvider?: string | null;
  discoveryQuery?: string | null;
  discoveredUrl?: string | null;
  canonicalUrl?: string | null;
  title: string;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  rawSnippet: string;
  rawText?: string | null;
  extractedTitle?: string | null;
  extractedCompany?: string | null;
  extractedLocation?: string | null;
  extractedDescription?: string | null;
  extractedRequirements?: string | null;
  extractedRemotePolicy?: string | null;
  extractedLanguage?: string | null;
  confidence?: string | null;
  fitScore?: number | null;
  fitReasons?: string[];
  sourceClassification?: string | null;
  validationStatus: string;
  forbiddenFlags: string[];
  allowedSignals: string[];
  riskNotes: string;
  status: string;
  lastEnrichedAt?: Date | null;
};

export type PreparedDiscoverySourceCandidate = {
  provider?: string | null;
  source?: string | null;
  query?: string | null;
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  rawText?: string | null;
  classification: string;
  confidence?: string | null;
  reason?: string | null;
  extractedCompany?: string | null;
  extractedJobCount?: number | null;
  status: string;
  createdLeadCount: number;
  error?: string | null;
  leads: PreparedDiscoveryLead[];
};

function truncate(value: string | null | undefined, max = 1200) {
  const text = value?.trim() ?? "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

export async function enrichDiscoveryLeadFromUrl(lead: DiscoverySearchLead) {
  if (!lead.sourceUrl) return lead;
  const boardToken = detectGreenhouseBoardToken(lead.sourceUrl);
  if (boardToken) {
    try {
      const greenhouseLeads = await fetchGreenhouseBoardJobs(boardToken, { exactJobId: detectGreenhouseJobId(lead.sourceUrl) });
      return greenhouseLeads[0] ?? lead;
    } catch {
      return lead;
    }
  }

  try {
    const fetched = await fetchPublicJobPage(lead.sourceUrl);
    if (!fetched.ok) return lead;
    const extracted = extractJobDescriptionFromHtml(fetched.html);
    return {
      ...lead,
      title: extracted.title ?? lead.title,
      company: extracted.company ?? lead.company,
      location: extracted.location ?? lead.location,
      rawSnippet: truncate(extracted.description ?? lead.rawSnippet),
      rawText: extracted.description ?? lead.rawText,
      confidence: extracted.confidence,
      extractedTitle: extracted.title,
      extractedCompany: extracted.company,
      extractedLocation: extracted.location,
      extractedDescription: extracted.description,
      extractedRequirements: extracted.requirements,
      extractedRemotePolicy: extracted.remotePolicy,
      extractedLanguage: extracted.language
    };
  } catch {
    return lead;
  }
}

export function prepareDiscoveryLeadForCreate(lead: DiscoverySearchLead & Partial<PreparedDiscoveryLead>): PreparedDiscoveryLead {
  const description = lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet;
  const validation = validateJob({
    title: lead.extractedTitle ?? lead.title,
    company: lead.extractedCompany ?? lead.company,
    location: lead.extractedLocation ?? lead.location,
    rawDescription: description
  });
  const scoring = scoreDiscoveryLead({
    title: lead.extractedTitle ?? lead.title,
    company: lead.extractedCompany ?? lead.company,
    location: lead.extractedLocation ?? lead.location,
    description,
    validationStatus: validation.validationStatus,
    allowedSignals: validation.allowedSignals,
    forbiddenFlags: validation.forbiddenFlags,
    riskNotes: validation.riskNotes.join("\n")
  });

  return {
    sourceType: "INTERNET_DISCOVERY",
    provider: lead.discoveryProvider,
    discoverySource: lead.discoverySource,
    discoveryProvider: lead.discoveryProvider,
    discoveryQuery: lead.discoveryQuery,
    discoveredUrl: lead.sourceUrl,
    canonicalUrl: normalizeUrl(lead.sourceUrl),
    title: lead.extractedTitle ?? lead.title,
    company: lead.extractedCompany ?? lead.company ?? null,
    location: lead.extractedLocation ?? lead.location ?? null,
    sourceUrl: lead.sourceUrl ?? null,
    rawSnippet: truncate(lead.rawSnippet || description),
    rawText: description,
    extractedTitle: lead.extractedTitle ?? null,
    extractedCompany: lead.extractedCompany ?? null,
    extractedLocation: lead.extractedLocation ?? null,
    extractedDescription: lead.extractedDescription ?? null,
    extractedRequirements: lead.extractedRequirements ?? null,
    extractedRemotePolicy: lead.extractedRemotePolicy ?? null,
    extractedLanguage: lead.extractedLanguage ?? null,
    confidence: scoring.confidence,
    fitScore: scoring.score,
    fitReasons: scoring.reasons,
    sourceClassification: lead.sourceClassification ?? null,
    validationStatus: validation.validationStatus,
    forbiddenFlags: validation.forbiddenFlags,
    allowedSignals: validation.allowedSignals,
    riskNotes: validation.riskNotes.join("\n"),
    status: "NEW",
    lastEnrichedAt: lead.extractedDescription ? new Date() : null
  };
}

export function asPrismaDiscoveryLeadCreate(lead: PreparedDiscoveryLead, discoveryRunId: string): Prisma.JobDiscoveryLeadCreateManyInput {
  return {
    ...lead,
    discoveryRunId,
    forbiddenFlags: lead.forbiddenFlags as Prisma.InputJsonValue,
    allowedSignals: lead.allowedSignals as Prisma.InputJsonValue,
    fitReasons: lead.fitReasons as Prisma.InputJsonValue
  };
}

export function asPrismaSourceCandidateCreate(candidate: PreparedDiscoverySourceCandidate, discoveryRunId: string): Prisma.DiscoverySourceCandidateCreateInput {
  return {
    discoveryRun: { connect: { id: discoveryRunId } },
    provider: candidate.provider,
    source: candidate.source,
    query: candidate.query,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    rawText: candidate.rawText,
    classification: candidate.classification,
    confidence: candidate.confidence,
    reason: candidate.reason,
    extractedCompany: candidate.extractedCompany,
    extractedJobCount: candidate.extractedJobCount,
    status: candidate.status,
    createdLeadCount: candidate.createdLeadCount,
    error: candidate.error
  };
}

async function classifyAndExpandSourceCandidate(lead: DiscoverySearchLead): Promise<PreparedDiscoverySourceCandidate> {
  const boardToken = detectGreenhouseBoardToken(lead.sourceUrl);
  const greenhouseJobId = detectGreenhouseJobId(lead.sourceUrl);
  const base = {
    provider: lead.discoveryProvider,
    source: lead.discoverySource,
    query: lead.discoveryQuery,
    url: lead.sourceUrl,
    title: lead.title,
    snippet: lead.rawSnippet,
    rawText: lead.rawText,
    status: "REVIEW"
  };

  if (boardToken) {
    try {
      const greenhouseLeads = await fetchGreenhouseBoardJobs(boardToken, { exactJobId: greenhouseJobId, targetOnly: true });
      const classification = greenhouseJobId ? SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING : SOURCE_CLASSIFICATIONS.ATS_BOARD;
      const prepared = greenhouseLeads.map((item) => prepareDiscoveryLeadForCreate({ ...item, sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING }));
      return {
        ...base,
        classification,
        confidence: "HIGH",
        reason: greenhouseJobId ? "Exact Greenhouse job URL mapped." : "Greenhouse board enumerated; only matching Israel/remote target jobs became leads.",
        extractedCompany: boardToken,
        extractedJobCount: greenhouseLeads.length,
        createdLeadCount: prepared.length,
        leads: prepared
      };
    } catch (error) {
      return {
        ...base,
        classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
        confidence: "LOW",
        reason: "Greenhouse source could not be fetched.",
        error: error instanceof Error ? error.message : "Greenhouse fetch failed.",
        createdLeadCount: 0,
        leads: []
      };
    }
  }

  const fetched = lead.sourceUrl ? await fetchPublicJobPage(lead.sourceUrl) : null;
  const html = fetched?.ok ? fetched.html : null;
  const jsonLd = html ? extractJsonLdJobPosting(html) : null;
  const extracted = html ? extractJobDescriptionFromHtml(html) : null;
  const classification = classifyDiscoverySource({
    title: extracted?.title ?? lead.title,
    url: lead.sourceUrl,
    snippet: lead.rawSnippet,
    rawText: extracted?.description ?? lead.rawText,
    hasJsonLdJobPosting: Boolean(jsonLd),
    extractedTitle: extracted?.title,
    extractedDescription: extracted?.description
  });
  const importable = classification.importable && isImportableSourceClassification(classification.classification);
  const prepared = importable && extracted
    ? [prepareDiscoveryLeadForCreate({
        ...lead,
        title: extracted.title ?? lead.title,
        company: extracted.company ?? lead.company,
        location: extracted.location ?? lead.location,
        rawSnippet: truncate(extracted.description ?? lead.rawSnippet),
        rawText: extracted.description ?? lead.rawText,
        extractedTitle: extracted.title,
        extractedCompany: extracted.company,
        extractedLocation: extracted.location,
        extractedDescription: extracted.description,
        extractedRequirements: extracted.requirements,
        extractedRemotePolicy: extracted.remotePolicy,
        extractedLanguage: extracted.language,
        sourceClassification: classification.classification,
        confidence: classification.confidence
      })]
    : [];

  return {
    ...base,
    rawText: extracted?.description ?? lead.rawText,
    classification: fetched && !fetched.ok ? SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE : classification.classification,
    confidence: fetched && !fetched.ok ? "LOW" : classification.confidence,
    reason: fetched && !fetched.ok ? fetched.reason : classification.reason,
    extractedCompany: extracted?.company ?? null,
    extractedJobCount: prepared.length,
    error: fetched && !fetched.ok ? fetched.reason : null,
    createdLeadCount: prepared.length,
    leads: prepared
  };
}

function sourceCandidateFromStructuredLead(lead: DiscoverySearchLead) {
  const hasSpecificFields = Boolean(lead.title && lead.company && lead.rawSnippet && lead.rawSnippet.length >= 40);
  const classification = hasSpecificFields ? SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING : SOURCE_CLASSIFICATIONS.UNKNOWN;
  const prepared = hasSpecificFields
    ? [prepareDiscoveryLeadForCreate({ ...lead, sourceClassification: classification, extractedDescription: lead.rawSnippet, confidence: "MEDIUM" })]
    : [];
  return {
    provider: lead.discoveryProvider,
    source: lead.discoverySource,
    query: lead.discoveryQuery,
    url: lead.sourceUrl,
    title: lead.title,
    snippet: lead.rawSnippet,
    rawText: lead.rawText,
    classification,
    confidence: hasSpecificFields ? "MEDIUM" : "LOW",
    reason: hasSpecificFields ? "Structured Google Jobs result with title, company, and description." : "Structured result lacked title/company/description.",
    extractedCompany: lead.company,
    extractedJobCount: prepared.length,
    status: "REVIEW",
    createdLeadCount: prepared.length,
    leads: prepared
  } satisfies PreparedDiscoverySourceCandidate;
}

function dedupeLeads(leads: DiscoverySearchLead[]) {
  const seen = new Set<string>();
  return leads.filter((lead) => {
    const key = [normalizeUrl(lead.sourceUrl), lead.title, lead.company].filter(Boolean).join("|").toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function runInternetJobDiscovery(options: {
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  maxResults?: number;
  includeCompanyCareers?: boolean;
  includePlatforms?: boolean;
  locationScope?: string;
}) {
  const env = options.env ?? process.env;
  const status = getDiscoveryProviderStatus(env);
  const maxResults = Math.min(options.maxResults ?? status.maxResults, status.maxResults, 50);
  const tavilyConfig = getTavilyConfig(env);
  const serpConfig = getSerpApiConfig(env);
  const searchResults: DiscoverySearchLead[] = [];
  const structuredLeads: DiscoverySearchLead[] = [];
  const errors: string[] = [];

  if (options.includeCompanyCareers !== false && tavilyConfig.enabled) {
    for (const query of buildCompanyCareerQueries().slice(0, 6)) {
      if (searchResults.length >= maxResults) break;
      try {
        searchResults.push(...mapTavilyResultsToLeads(query, await tavilySearch(query, { apiKey: tavilyConfig.apiKey, maxResults: 4, includeRawContent: true })));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Tavily company-career search failed.");
      }
    }
  }

  if (options.includePlatforms !== false) {
    const queries = buildPlatformDiscoveryQueries(undefined, options.locationScope ?? "Israel").slice(0, 4);
    if (tavilyConfig.enabled) {
      for (const query of queries) {
        if (searchResults.length >= maxResults) break;
        try {
          searchResults.push(...mapTavilyResultsToLeads(query, await tavilySearch(query, { apiKey: tavilyConfig.apiKey, maxResults: 4, includeRawContent: false })));
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Tavily platform search failed.");
        }
      }
    }
    if (serpConfig.enabled) {
      for (const query of queries.slice(0, 2)) {
        if (structuredLeads.length >= maxResults) break;
        try {
          structuredLeads.push(...mapSerpApiJobsToLeads(query, await serpApiGoogleJobsSearch(query, { apiKey: serpConfig.apiKey, location: "Israel", maxResults: 10 })));
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "SerpApi Google Jobs search failed.");
        }
      }
    }
  }

  const selected = dedupeLeads(searchResults).slice(0, maxResults);
  const sourceCandidates: PreparedDiscoverySourceCandidate[] = [];
  for (const lead of selected) {
    sourceCandidates.push(await classifyAndExpandSourceCandidate(lead));
  }
  for (const lead of dedupeLeads(structuredLeads).slice(0, maxResults)) {
    sourceCandidates.push(sourceCandidateFromStructuredLead(lead));
  }
  const preparedLeads = sourceCandidates.flatMap((candidate) => candidate.leads);

  return {
    sourceCandidates,
    leads: preparedLeads,
    errors,
    providersConfigured: {
      tavily: tavilyConfig.enabled,
      serpApi: serpConfig.enabled
    }
  };
}
