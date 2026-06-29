export const SOURCE_CLASSIFICATIONS = {
  ACTUAL_JOB_POSTING: "ACTUAL_JOB_POSTING",
  ATS_JOB_POSTING: "ATS_JOB_POSTING",
  ATS_BOARD: "ATS_BOARD",
  CAREERS_LISTING: "CAREERS_LISTING",
  COMPANY_CAREERS_HOME: "COMPANY_CAREERS_HOME",
  SEARCH_RESULTS_PAGE: "SEARCH_RESULTS_PAGE",
  THIRD_PARTY_AGGREGATOR_LIST: "THIRD_PARTY_AGGREGATOR_LIST",
  GENERIC_COMPANY_PAGE: "GENERIC_COMPANY_PAGE",
  NOISY_PAGE: "NOISY_PAGE",
  BLOCKED_OR_UNFETCHABLE: "BLOCKED_OR_UNFETCHABLE",
  UNKNOWN: "UNKNOWN"
} as const;

export type SourceClassification = (typeof SOURCE_CLASSIFICATIONS)[keyof typeof SOURCE_CLASSIFICATIONS];

export type PageClassificationResult = {
  classification: SourceClassification;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  importable: boolean;
};

const broadTitlePatterns = [
  /search\s+(israel\s+)?jobs/i,
  /search\s+for\s+jobs/i,
  /open\s+positions/i,
  /jobs\s*&\s*careers/i,
  /careers\s+at/i,
  /this\s+page/i,
  /glassdoor/i
];

const exactJobSignals = [
  /job\s+description/i,
  /job\s+id/i,
  /apply\s+now/i,
  /responsibilities/i,
  /requirements/i,
  /qualifications/i,
  /משרה/i,
  /דרישות/i
];

function normalized(value: string | null | undefined) {
  return value?.toLocaleLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function looksLikeGenericCompanyOnly(title: string, companyNames: string[] = []) {
  const text = normalized(title).replace(/[|–—-].+$/, "").trim();
  if (!text) return false;
  const known = companyNames.map(normalized).filter(Boolean);
  return known.includes(text) || /^[a-z0-9 .&]+$/.test(text) && text.split(" ").length <= 3 && !/(developer|engineer|analyst|qa|student|software|job|career)/i.test(text);
}

export function isImportableSourceClassification(classification: string | null | undefined) {
  return classification === SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING || classification === SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING;
}

export function classifyDiscoverySource(input: {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  rawText?: string | null;
  hasJsonLdJobPosting?: boolean;
  greenhouseBoardToken?: string | null;
  greenhouseJobId?: string | null;
  extractedTitle?: string | null;
  extractedDescription?: string | null;
  companyNames?: string[];
}): PageClassificationResult {
  const title = input.title ?? "";
  const text = [input.title, input.url, input.snippet, input.rawText].filter(Boolean).join(" ");
  const lowerUrl = normalized(input.url);

  if (input.hasJsonLdJobPosting) {
    return { classification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING, confidence: "HIGH", reason: "Structured JSON-LD JobPosting detected.", importable: true };
  }
  if (input.greenhouseJobId) {
    return { classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING, confidence: "HIGH", reason: "Exact Greenhouse job URL detected.", importable: true };
  }
  if (input.greenhouseBoardToken) {
    return { classification: SOURCE_CLASSIFICATIONS.ATS_BOARD, confidence: "HIGH", reason: "Greenhouse board/listing URL detected; enumerate matching jobs first.", importable: false };
  }
  if (/myworkdayjobs\.com/i.test(lowerUrl) && /search/i.test(lowerUrl + " " + title)) {
    return { classification: SOURCE_CLASSIFICATIONS.ATS_BOARD, confidence: "HIGH", reason: "Workday search/listing page is not a single job posting.", importable: false };
  }
  if (broadTitlePatterns.some((pattern) => pattern.test(text))) {
    const aggregator = /glassdoor|linkedin|indeed|alljobs|drushim/i.test(text);
    return {
      classification: aggregator ? SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST : SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE,
      confidence: "HIGH",
      reason: "Broad search/listing/careers result is not a single job posting.",
      importable: false
    };
  }
  if (looksLikeGenericCompanyOnly(title, input.companyNames)) {
    return { classification: SOURCE_CLASSIFICATIONS.GENERIC_COMPANY_PAGE, confidence: "HIGH", reason: "Generic company page title is not a job posting.", importable: false };
  }
  if (/\/careers?\/?$/i.test(lowerUrl) || /\/jobs?\/?$/i.test(lowerUrl)) {
    return { classification: SOURCE_CLASSIFICATIONS.COMPANY_CAREERS_HOME, confidence: "MEDIUM", reason: "Career home/listing URL must be enumerated before import.", importable: false };
  }
  if (input.extractedTitle && input.extractedDescription && exactJobSignals.some((signal) => signal.test(input.extractedDescription ?? ""))) {
    return { classification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING, confidence: "MEDIUM", reason: "Single job-like page with title and job-detail wording detected.", importable: true };
  }
  if (!input.snippet && !input.rawText) {
    return { classification: SOURCE_CLASSIFICATIONS.NOISY_PAGE, confidence: "LOW", reason: "No useful content was available for classification.", importable: false };
  }
  return { classification: SOURCE_CLASSIFICATIONS.UNKNOWN, confidence: "LOW", reason: "Could not verify this source as a single job posting.", importable: false };
}
