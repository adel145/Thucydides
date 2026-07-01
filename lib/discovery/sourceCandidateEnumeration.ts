import { detectGreenhouseBoardToken, detectGreenhouseJobId, fetchGreenhouseBoardJobs } from "./companyCareerDiscovery";
import { extractCareerJobLinks, type ExtractedCareerJobLink } from "./careerLinkExtractor";
import { extractJobDescriptionFromHtml, extractJsonLdJobPosting, isMeaningfulJobDescription } from "./jobDescriptionExtractor";
import { fetchPublicJobPage } from "./jobPageFetcher";
import { prepareDiscoveryLeadForCreate, type PreparedDiscoveryLead, type PreparedDiscoverySourceCandidate } from "./jobDiscoveryEngine";
import { classifyDiscoverySource, isImportableSourceClassification, SOURCE_CLASSIFICATIONS } from "./pageClassifier";
import { extractWorkdayJobLinks, isLikelyJsOnlyWorkdayPage, isWorkdayExactJobUrl, isWorkdayUrl, prepareWorkdayLeadFromHtml } from "./workdayDiscovery";
import type { DiscoverySearchLead } from "./tavilySearchClient";

export type SourceCandidateForEnumeration = {
  id?: string;
  discoveryRunId?: string | null;
  provider?: string | null;
  source?: string | null;
  query?: string | null;
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  rawText?: string | null;
  classification?: string | null;
  confidence?: string | null;
  createdLeadCount?: number | null;
};

export type SourceCandidateEnumerationResult = {
  candidateUpdate: {
    classification?: string;
    confidence?: string | null;
    reason?: string | null;
    extractedCompany?: string | null;
    extractedJobCount?: number | null;
    status?: string;
    createdLeadCount?: number;
    error?: string | null;
    rawText?: string | null;
  };
  newCandidates: PreparedDiscoverySourceCandidate[];
  leads: PreparedDiscoveryLead[];
};

export function normalizeDiscoveryUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim() || null;
  }
}

export function dedupePreparedSourceCandidates(candidates: PreparedDiscoverySourceCandidate[], existingUrls: Array<string | null | undefined> = []) {
  const seen = new Set(existingUrls.map(normalizeDiscoveryUrl).filter(Boolean));
  return candidates.filter((candidate) => {
    const key = normalizeDiscoveryUrl(candidate.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function discoveryLeadIdentity(lead: { canonicalUrl?: string | null; sourceUrl?: string | null; title?: string | null; company?: string | null }) {
  return [
    normalizeDiscoveryUrl(lead.canonicalUrl ?? lead.sourceUrl),
    lead.title?.trim().toLocaleLowerCase() ?? "",
    lead.company?.trim().toLocaleLowerCase() ?? ""
  ].join("|");
}

export function dedupePreparedDiscoveryLeads(leads: PreparedDiscoveryLead[], existingLeads: Array<{ canonicalUrl?: string | null; sourceUrl?: string | null; title?: string | null; company?: string | null }> = []) {
  const seen = new Set(existingLeads.map(discoveryLeadIdentity));
  return leads.filter((lead) => {
    const key = discoveryLeadIdentity(lead);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function unsupportedAggregatorReason(url: string | null | undefined, title: string | null | undefined) {
  const text = `${url ?? ""} ${title ?? ""}`;
  if (/glassdoor|linkedin\.com\/jobs|indeed|alljobs|drushim/i.test(text)) {
    return "Unsupported aggregator/listing page. Keep as a source candidate; do not create leads.";
  }
  return null;
}

function candidateFromLink(parent: SourceCandidateForEnumeration, link: ExtractedCareerJobLink): PreparedDiscoverySourceCandidate {
  return {
    provider: parent.provider ?? "COMPANY_CAREERS",
    source: "CAREER_LINK_EXTRACTION",
    query: parent.query,
    url: link.url,
    title: link.title,
    snippet: link.snippet,
    rawText: link.snippet,
    classification: isWorkdayExactJobUrl(link.url)
      ? SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING
      : isWorkdayUrl(link.url)
        ? SOURCE_CLASSIFICATIONS.ATS_BOARD
        : SOURCE_CLASSIFICATIONS.UNKNOWN,
    confidence: link.preferredLocationSignal ? "MEDIUM" : "LOW",
    reason: "Specific job-like link extracted from a public career listing; verify before import.",
    extractedJobCount: 0,
    status: "REVIEW",
    createdLeadCount: 0,
    leads: []
  };
}

function leadFromExtractedPage(candidate: SourceCandidateForEnumeration, html: string, classification: string): PreparedDiscoveryLead | null {
  const extracted = extractJobDescriptionFromHtml(html);
  const description = extracted.description;
  if (!description) return null;
  if (!isMeaningfulJobDescription(description)) return null;
  const lead: DiscoverySearchLead = {
    title: extracted.title ?? candidate.title ?? "Untitled job",
    company: extracted.company ?? null,
    location: extracted.location ?? null,
    sourceUrl: candidate.url ?? null,
    rawSnippet: description.slice(0, 1200),
    rawText: description,
    discoverySource: candidate.source ?? "COMPANY_CAREERS",
    discoveryProvider: candidate.provider ?? "COMPANY_CAREERS",
    discoveryQuery: candidate.query ?? "source candidate enumeration",
    confidence: extracted.confidence === "HIGH" ? "HIGH" : "MEDIUM"
  };
  return prepareDiscoveryLeadForCreate({
    ...lead,
    extractedTitle: extracted.title,
    extractedCompany: extracted.company,
    extractedLocation: extracted.location,
    extractedDescription: description,
    extractedRequirements: extracted.requirements,
    extractedRemotePolicy: extracted.remotePolicy,
    extractedLanguage: extracted.language,
    sourceClassification: classification
  });
}

export function enumerateCandidateFromHtml(candidate: SourceCandidateForEnumeration, html: string): SourceCandidateEnumerationResult {
  const url = candidate.url ?? "";
  const searchableContent = [html, candidate.rawText, candidate.snippet].filter(Boolean).join("\n");
  const unsupported = unsupportedAggregatorReason(candidate.url, candidate.title);
  if (unsupported) {
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST,
        confidence: "LOW",
        reason: unsupported,
        extractedJobCount: 0,
        status: "UNSUPPORTED",
        error: unsupported
      },
      newCandidates: [],
      leads: []
    };
  }
  const workdayLead = isWorkdayUrl(url)
    ? prepareWorkdayLeadFromHtml({
        url,
        html,
        fallbackTitle: candidate.title,
        fallbackSnippet: candidate.snippet,
        query: candidate.query
      })
    : null;
  if (workdayLead) {
    const lead = prepareDiscoveryLeadForCreate({ ...workdayLead, sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING });
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
        confidence: "MEDIUM",
        reason: "Exact public Workday job page verified from fetched content.",
        extractedJobCount: 1,
        createdLeadCount: (candidate.createdLeadCount ?? 0) + 1,
        status: "REVIEW",
        error: null,
        rawText: workdayLead.rawText
      },
      newCandidates: [],
      leads: [lead]
    };
  }

  if (isWorkdayUrl(url)) {
    const links = extractWorkdayJobLinks(searchableContent, url);
    if (links.length > 0) {
      return {
        candidateUpdate: {
          classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
          confidence: "MEDIUM",
          reason: `Found ${links.length} specific public Workday job links; created source candidates for verification.`,
          extractedJobCount: links.length,
          status: "REVIEW",
          error: null
        },
        newCandidates: links.map((link) => candidateFromLink(candidate, link)),
        leads: []
      };
    }
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
        confidence: "LOW",
        reason: isLikelyJsOnlyWorkdayPage(html) ? "Workday page appears JS-only or blocked; no public job links were visible." : "No specific public Workday job links found.",
        extractedJobCount: 0,
        status: "UNSUPPORTED",
        error: isLikelyJsOnlyWorkdayPage(html) ? "Workday JS-only/blocked page; no browser automation used." : "No Workday job links found."
      },
      newCandidates: [],
      leads: []
    };
  }

  const jsonLd = extractJsonLdJobPosting(html);
  const extracted = extractJobDescriptionFromHtml(html);
  const classification = classifyDiscoverySource({
    title: extracted.title ?? candidate.title,
    url,
    snippet: candidate.snippet,
    rawText: extracted.description ?? candidate.rawText,
    hasJsonLdJobPosting: Boolean(jsonLd),
    extractedTitle: extracted.title,
    extractedDescription: extracted.description
  });
  if (classification.importable && isImportableSourceClassification(classification.classification) && isMeaningfulJobDescription(extracted.description)) {
    const lead = leadFromExtractedPage(candidate, html, classification.classification);
    if (lead) {
      return {
        candidateUpdate: {
          classification: classification.classification,
          confidence: classification.confidence,
          reason: classification.reason,
          extractedCompany: lead.company,
          extractedJobCount: 1,
          createdLeadCount: (candidate.createdLeadCount ?? 0) + 1,
          status: "REVIEW",
          error: null,
          rawText: lead.rawText
        },
        newCandidates: [],
        leads: [lead]
      };
    }
  }

  const links = extractCareerJobLinks(searchableContent, url);
  if (links.length > 0) {
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
        confidence: "MEDIUM",
        reason: `Found ${links.length} job-like links; created source candidates for verification.`,
        extractedJobCount: links.length,
        status: "REVIEW",
        error: null
      },
      newCandidates: links.map((link) => candidateFromLink(candidate, link)),
      leads: []
    };
  }

  return {
    candidateUpdate: {
      classification: classification.classification,
      confidence: classification.confidence,
      reason: "No specific job links found; source remains a non-importable candidate.",
      extractedJobCount: 0,
      status: "UNSUPPORTED",
      error: "No job links found."
    },
    newCandidates: [],
    leads: []
  };
}

export async function enumerateDiscoverySourceCandidate(candidate: SourceCandidateForEnumeration): Promise<SourceCandidateEnumerationResult> {
  const unsupported = unsupportedAggregatorReason(candidate.url, candidate.title);
  if (unsupported) {
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST,
        confidence: "LOW",
        reason: unsupported,
        extractedJobCount: 0,
        status: "UNSUPPORTED",
        error: unsupported
      },
      newCandidates: [],
      leads: []
    };
  }

  const boardToken = detectGreenhouseBoardToken(candidate.url);
  if (boardToken) {
    try {
      const greenhouseLeads = await fetchGreenhouseBoardJobs(boardToken, { exactJobId: detectGreenhouseJobId(candidate.url), targetOnly: true });
      const leads = greenhouseLeads.map((lead) => prepareDiscoveryLeadForCreate({ ...lead, sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING }));
      return {
        candidateUpdate: {
          classification: detectGreenhouseJobId(candidate.url) ? SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING : SOURCE_CLASSIFICATIONS.ATS_BOARD,
          confidence: "HIGH",
          reason: leads.length > 0 ? `Greenhouse enumeration created ${leads.length} verified job leads.` : "Greenhouse enumeration found no matching Israel/remote target jobs.",
          extractedCompany: boardToken,
          extractedJobCount: leads.length,
          createdLeadCount: (candidate.createdLeadCount ?? 0) + leads.length,
          status: "REVIEW",
          error: null
        },
        newCandidates: [],
        leads
      };
    } catch (error) {
      return {
        candidateUpdate: {
          classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
          confidence: "LOW",
          reason: "Greenhouse source could not be enumerated.",
          extractedJobCount: 0,
          status: "UNSUPPORTED",
          error: error instanceof Error ? error.message : "Greenhouse enumeration failed."
        },
        newCandidates: [],
        leads: []
      };
    }
  }

  if (!candidate.url) {
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.UNKNOWN,
        confidence: "LOW",
        reason: "Candidate has no URL to enumerate.",
        extractedJobCount: 0,
        status: "UNSUPPORTED",
        error: "No source URL."
      },
      newCandidates: [],
      leads: []
    };
  }

  const fetched = await fetchPublicJobPage(candidate.url);
  if (!fetched.ok) {
    return {
      candidateUpdate: {
        classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
        confidence: "LOW",
        reason: fetched.reason,
        extractedJobCount: 0,
        status: "UNSUPPORTED",
        error: fetched.reason
      },
      newCandidates: [],
      leads: []
    };
  }

  return enumerateCandidateFromHtml(candidate, fetched.html);
}

export async function retryClassifyDiscoverySourceCandidate(candidate: SourceCandidateForEnumeration): Promise<SourceCandidateEnumerationResult["candidateUpdate"]> {
  if (!candidate.url) {
    return {
      classification: SOURCE_CLASSIFICATIONS.UNKNOWN,
      confidence: "LOW",
      reason: "Candidate has no URL to classify.",
      error: "No source URL."
    };
  }
  const unsupported = unsupportedAggregatorReason(candidate.url, candidate.title);
  if (unsupported) {
    return {
      classification: SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST,
      confidence: "LOW",
      reason: unsupported,
      status: "UNSUPPORTED",
      error: unsupported
    };
  }
  const fetched = await fetchPublicJobPage(candidate.url);
  if (!fetched.ok) {
    return {
      classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
      confidence: "LOW",
      reason: fetched.reason,
      status: "UNSUPPORTED",
      error: fetched.reason
    };
  }
  const extracted = extractJobDescriptionFromHtml(fetched.html);
  const jsonLd = extractJsonLdJobPosting(fetched.html);
  const classification = classifyDiscoverySource({
    title: extracted.title ?? candidate.title,
    url: candidate.url,
    snippet: candidate.snippet,
    rawText: extracted.description ?? candidate.rawText,
    hasJsonLdJobPosting: Boolean(jsonLd),
    extractedTitle: extracted.title,
    extractedDescription: extracted.description
  });
  return {
    classification: classification.classification,
    confidence: classification.confidence,
    reason: classification.reason,
    rawText: extracted.description ?? candidate.rawText,
    error: null,
    status: "REVIEW"
  };
}
