import { Prisma } from "@/generated/prisma/client";
import { validateJob } from "../rules/validateJob";
import { detectGreenhouseBoardToken, fetchGreenhouseBoardJobs } from "./companyCareerDiscovery";
import { DISCOVERY_PROVIDERS, getDiscoveryProviderStatus } from "./discoveryProviders";
import { buildCompanyCareerQueries, buildPlatformDiscoveryQueries } from "./discoveryQueries";
import { extractJobDescriptionFromHtml } from "./jobDescriptionExtractor";
import { fetchPublicJobPage } from "./jobPageFetcher";
import { scoreDiscoveryLead } from "./jobDiscoveryScoring";
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
  validationStatus: string;
  forbiddenFlags: string[];
  allowedSignals: string[];
  riskNotes: string;
  status: string;
  lastEnrichedAt?: Date | null;
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
      const greenhouseLeads = await fetchGreenhouseBoardJobs(boardToken);
      return greenhouseLeads[0] ?? lead;
    } catch {
      return lead;
    }
  }

  try {
    const html = await fetchPublicJobPage(lead.sourceUrl);
    const extracted = extractJobDescriptionFromHtml(html);
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
  const leads: DiscoverySearchLead[] = [];
  const errors: string[] = [];

  if (options.includeCompanyCareers !== false && tavilyConfig.enabled) {
    for (const query of buildCompanyCareerQueries().slice(0, 6)) {
      if (leads.length >= maxResults) break;
      try {
        leads.push(...mapTavilyResultsToLeads(query, await tavilySearch(query, { apiKey: tavilyConfig.apiKey, maxResults: 4, includeRawContent: true })));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Tavily company-career search failed.");
      }
    }
  }

  if (options.includePlatforms !== false) {
    const queries = buildPlatformDiscoveryQueries(undefined, options.locationScope ?? "Israel").slice(0, 4);
    if (tavilyConfig.enabled) {
      for (const query of queries) {
        if (leads.length >= maxResults) break;
        try {
          leads.push(...mapTavilyResultsToLeads(query, await tavilySearch(query, { apiKey: tavilyConfig.apiKey, maxResults: 4, includeRawContent: false })));
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "Tavily platform search failed.");
        }
      }
    }
    if (serpConfig.enabled) {
      for (const query of queries.slice(0, 2)) {
        if (leads.length >= maxResults) break;
        try {
          leads.push(...mapSerpApiJobsToLeads(query, await serpApiGoogleJobsSearch(query, { apiKey: serpConfig.apiKey, location: "Israel", maxResults: 10 })));
        } catch (error) {
          errors.push(error instanceof Error ? error.message : "SerpApi Google Jobs search failed.");
        }
      }
    }
  }

  const selected = dedupeLeads(leads).slice(0, maxResults);
  const enriched: PreparedDiscoveryLead[] = [];
  for (const lead of selected) {
    const shouldEnrich = lead.discoveryProvider === DISCOVERY_PROVIDERS.TAVILY && Boolean(lead.sourceUrl);
    const next = shouldEnrich ? await enrichDiscoveryLeadFromUrl(lead) : lead;
    enriched.push(prepareDiscoveryLeadForCreate(next));
  }

  return {
    leads: enriched,
    errors,
    providersConfigured: {
      tavily: tavilyConfig.enabled,
      serpApi: serpConfig.enabled
    }
  };
}
