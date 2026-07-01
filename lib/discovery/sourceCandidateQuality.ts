export type DiscoverySourceCandidateQualityItem = {
  classification?: string | null;
  source?: string | null;
  provider?: string | null;
  status?: string | null;
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  rawText?: string | null;
  reason?: string | null;
  error?: string | null;
  confidence?: string | null;
  createdLeadCount?: number | null;
  extractedJobCount?: number | null;
};

const SOURCE_CLASSIFICATIONS = {
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

function isImportableSourceClassification(classification: string | null | undefined) {
  return classification === SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING || classification === SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING;
}

export type SourceCandidateQualityTier = "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";

export type SourceCandidateQualityScore = {
  score: number;
  tier: SourceCandidateQualityTier;
  reasons: string[];
};

export type GroupedSourceCandidate<T extends DiscoverySourceCandidateQualityItem> = {
  key: string;
  primary: T;
  candidates: T[];
  duplicateCount: number;
  quality: SourceCandidateQualityScore;
};

const targetRolePattern =
  /(software|developer|engineer|backend|front\s*end|frontend|full\s*stack|fullstack|python|java|node|react|qa|automation|tester|test\s+engineer|data|bi\b|machine learning|\bml\b|deep learning|computer vision|algorithm|ai\b|research student|student|intern|junior|technical support|application support|product support|noc|soc|it\b|system administrator|devops|implementation|integration|solutions engineer)/i;

const preferredLocationPattern =
  /(israel|tel aviv|haifa|jerusalem|beer\s*sheva|beersheba|b[eé]r\s*sh[eé]va|rehovot|yokneam|herzliya|ramat gan|petah tikva|petach tikva|raanana|netanya|remote from israel|remote\s*-\s*israel|israel remote|hybrid.*israel|remote|hybrid|\u05d9\u05e9\u05e8\u05d0\u05dc|\u05ea\u05dc\s*\u05d0\u05d1\u05d9\u05d1|\u05d7\u05d9\u05e4\u05d4|\u05d9\u05e8\u05d5\u05e9\u05dc\u05d9\u05dd|\u05d1\u05d0\u05e8\s*\u05e9\u05d1\u05e2|\u05d1\u05e8\u05e9\u05d1\u05e2|\u05e8\u05d7\u05d5\u05d1\u05d5\u05ea|\u05d9\u05e7\u05e0\u05e2\u05dd|\u05d4\u05e8\u05e6\u05dc\u05d9\u05d4|\u05e8\u05de\u05ea\s*\u05d2\u05df|\u05e4\u05ea\u05d7\s*\u05ea\u05e7\u05d5\u05d5\u05d4|\u05e8\u05e2\u05e0\u05e0\u05d4|\u05e0\u05ea\u05e0\u05d9\u05d4)/i;

const remoteFromIsraelPattern =
  /(remote from israel|remote\s*-\s*israel|israel remote|hybrid.*israel|\u05e8\u05d9\u05de\u05d5\u05d8.*\u05d9\u05e9\u05e8\u05d0\u05dc|\u05d4\u05d9\u05d1\u05e8\u05d9\u05d3\u05d9.*\u05d9\u05e9\u05e8\u05d0\u05dc)/i;

const clearNonTargetLocationPattern =
  /\b(united states|usa|u\.s\.|us-only|us only|us-ca|california|santa clara|san jose|austin|new york|seattle|boston|london|united kingdom|uk only|germany|berlin|munich|india|bengaluru|bangalore|pune|hyderabad|singapore|canada|toronto|vancouver)\b/i;

const classificationBaseScore: Record<string, number> = {
  [SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING]: 72,
  [SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING]: 72,
  [SOURCE_CLASSIFICATIONS.ATS_BOARD]: 56,
  [SOURCE_CLASSIFICATIONS.CAREERS_LISTING]: 48,
  [SOURCE_CLASSIFICATIONS.COMPANY_CAREERS_HOME]: 42,
  [SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE]: 24,
  [SOURCE_CLASSIFICATIONS.UNKNOWN]: 22,
  [SOURCE_CLASSIFICATIONS.GENERIC_COMPANY_PAGE]: 14,
  [SOURCE_CLASSIFICATIONS.NOISY_PAGE]: 8,
  [SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST]: 4,
  [SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE]: 2
};

const actionableSourceClassifications: string[] = [
  SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
  SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
  SOURCE_CLASSIFICATIONS.ATS_BOARD,
  SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
  SOURCE_CLASSIFICATIONS.COMPANY_CAREERS_HOME,
  SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE,
  SOURCE_CLASSIFICATIONS.UNKNOWN
];

function normalizeText(value: string | null | undefined) {
  return value?.toLocaleLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function parseUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizedHostname(value: string | null | undefined) {
  return parseUrl(value)?.hostname.toLocaleLowerCase().replace(/^www\./, "") ?? "";
}

function isWorkdaySource(candidate: DiscoverySourceCandidateQualityItem) {
  return /myworkdayjobs\.com/i.test(`${candidate.url ?? ""} ${candidate.title ?? ""}`);
}

function isExactWorkdayJobSource(candidate: DiscoverySourceCandidateQualityItem) {
  const url = parseUrl(candidate.url);
  if (!url || !/myworkdayjobs\.com$/i.test(url.hostname)) return false;
  return /\/job\//i.test(url.pathname) || /\/\d{4,}|_JR\d+|JR\d+/i.test(url.pathname);
}

function isGenericWorkdayBoard(candidate: DiscoverySourceCandidateQualityItem) {
  if (!isWorkdaySource(candidate) || isExactWorkdayJobSource(candidate)) return false;
  return candidate.classification === SOURCE_CLASSIFICATIONS.ATS_BOARD || /search|jobs|search for jobs/i.test(`${candidate.url ?? ""} ${candidate.title ?? ""}`);
}

function sourcePathCategory(candidate: DiscoverySourceCandidateQualityItem) {
  const url = parseUrl(candidate.url);
  const text = `${candidate.title ?? ""} ${candidate.url ?? ""}`;
  if (/glassdoor|linkedin\.com\/jobs|indeed|alljobs|drushim/i.test(text)) return "aggregator";
  if (url?.hostname.toLocaleLowerCase().endsWith("myworkdayjobs.com")) {
    return isExactWorkdayJobSource(candidate) ? "workday-job" : "workday-search";
  }
  if (/greenhouse\.io/i.test(candidate.url ?? "")) {
    return /\/jobs\/?\d+/i.test(url?.pathname ?? "") ? "greenhouse-job" : "greenhouse-board";
  }
  if (/\/careers?\/?$|\/jobs?\/?$/i.test(url?.pathname ?? "")) return "company-careers";
  if (candidate.classification === SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING || candidate.classification === SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING) return "job";
  return "unknown";
}

function simplifiedTitle(value: string | null | undefined) {
  const normalized = normalizeText(value)
    .replace(/\bsearch for jobs\b/g, "search jobs")
    .replace(/\bmyworkdayjobs\.com\b/g, "workday")
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, " ")
    .replace(/\b(jobs?|careers?|open positions?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || "untitled";
}

export function sourceCandidateQualityText(candidate: DiscoverySourceCandidateQualityItem) {
  return [
    candidate.title,
    candidate.url,
    candidate.snippet,
    candidate.rawText,
    candidate.reason,
    candidate.error,
    candidate.source,
    candidate.provider,
    candidate.classification
  ]
    .filter(Boolean)
    .join(" ");
}

export function hasTargetRoleSignal(value: string | DiscoverySourceCandidateQualityItem | null | undefined) {
  const text = typeof value === "string" ? value : sourceCandidateQualityText(value ?? {});
  return targetRolePattern.test(text);
}

export function hasPreferredLocationSignal(value: string | DiscoverySourceCandidateQualityItem | null | undefined) {
  const text = typeof value === "string" ? value : sourceCandidateQualityText(value ?? {});
  return preferredLocationPattern.test(text);
}

export function hasRemoteFromIsraelSignal(value: string | DiscoverySourceCandidateQualityItem | null | undefined) {
  const text = typeof value === "string" ? value : sourceCandidateQualityText(value ?? {});
  return remoteFromIsraelPattern.test(text);
}

export function hasClearNonTargetLocationSignal(value: string | DiscoverySourceCandidateQualityItem | null | undefined) {
  const text = typeof value === "string" ? value : sourceCandidateQualityText(value ?? {});
  return clearNonTargetLocationPattern.test(text) && !hasRemoteFromIsraelSignal(text);
}

function confidenceBoost(confidence: string | null | undefined) {
  if (confidence === "HIGH") return 12;
  if (confidence === "MEDIUM") return 6;
  return 0;
}

export function isProcessedSourceCandidate(candidate: DiscoverySourceCandidateQualityItem) {
  return (candidate.createdLeadCount ?? 0) > 0 || (candidate.extractedJobCount ?? 0) > 0;
}

export function scoreSourceCandidateQuality(candidate: DiscoverySourceCandidateQualityItem): SourceCandidateQualityScore {
  const classification = candidate.classification ?? SOURCE_CLASSIFICATIONS.UNKNOWN;
  let score = classificationBaseScore[classification] ?? classificationBaseScore[SOURCE_CLASSIFICATIONS.UNKNOWN];
  const reasons: string[] = [];

  const text = sourceCandidateQualityText(candidate);
  const targetRole = hasTargetRoleSignal(text);
  const preferredLocation = hasPreferredLocationSignal(text);
  const clearNonTargetLocation = hasClearNonTargetLocationSignal(text);
  const normalizedUrl = normalizeText(candidate.url);
  const genericWorkdayBoard = isGenericWorkdayBoard(candidate);

  score += confidenceBoost(candidate.confidence);

  if (!genericWorkdayBoard && /greenhouse|workday|company_careers|careers/i.test(`${candidate.provider ?? ""} ${candidate.source ?? ""} ${candidate.url ?? ""}`)) {
    score += 8;
    reasons.push("trusted public careers source");
  }
  if (targetRole) {
    score += genericWorkdayBoard && !preferredLocation ? 4 : 14;
    reasons.push("target role signal");
  }
  if (preferredLocation) {
    score += 20;
    reasons.push("Israel/remote signal");
  }
  if (/\/job\//i.test(normalizedUrl) || /jobposting|job_posting|jr\d+/i.test(normalizedUrl)) {
    score += 8;
    reasons.push("specific job URL shape");
  }
  if (clearNonTargetLocation) {
    score -= 70;
    reasons.push("clear non-target location");
  }
  if (candidate.error) {
    score -= 18;
    reasons.push("has fetch/classification error");
  }
  if (candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED") {
    score -= 80;
    reasons.push("skipped or unsupported");
  }
  if (classification === SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST || classification === SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE) {
    score -= 30;
    reasons.push("non-actionable source type");
  }
  if (isProcessedSourceCandidate(candidate) && !isImportableSourceClassification(classification)) {
    score -= 12;
    reasons.push("already processed source");
  }
  if (genericWorkdayBoard) {
    score -= preferredLocation ? 10 : 30;
    reasons.push("generic Workday board");
    if ((candidate.createdLeadCount ?? 0) === 0) {
      score -= 8;
      reasons.push("generic Workday board produced no leads yet");
    }
    if (candidate.extractedJobCount === 0 || candidate.error) {
      score -= 10;
      reasons.push("generic Workday board did not yield public job links");
    }
  }

  score = Math.max(0, Math.min(100, score));
  const tier: SourceCandidateQualityTier = score >= 72 ? "HIGH" : score >= 44 ? "MEDIUM" : score >= 20 ? "LOW" : "VERY_LOW";
  return { score, tier, reasons };
}

export function hasMeaningfulSourceCandidateNextAction(candidate: DiscoverySourceCandidateQualityItem) {
  if (candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED") return false;
  if (hasClearNonTargetLocationSignal(candidate)) return false;
  const quality = scoreSourceCandidateQuality(candidate);
  if (quality.tier === "VERY_LOW") return false;
  if (isProcessedSourceCandidate(candidate) && !isImportableSourceClassification(candidate.classification)) return false;
  return actionableSourceClassifications.includes(candidate.classification ?? "");
}

export function rankSourceCandidates<T extends DiscoverySourceCandidateQualityItem>(candidates: T[]) {
  return [...candidates].sort((a, b) => {
    const qualityA = scoreSourceCandidateQuality(a).score;
    const qualityB = scoreSourceCandidateQuality(b).score;
    if (qualityA !== qualityB) return qualityB - qualityA;
    return normalizeText(a.title).localeCompare(normalizeText(b.title));
  });
}

export function canonicalSourceCandidateKey(candidate: DiscoverySourceCandidateQualityItem) {
  const host = normalizedHostname(candidate.url) || "no-host";
  const category = sourcePathCategory(candidate);
  const classification = candidate.classification ?? SOURCE_CLASSIFICATIONS.UNKNOWN;
  const title = category === "workday-search" || category === "greenhouse-board" ? category : simplifiedTitle(candidate.title);
  return [host, category, classification, title].join("|");
}

export function collapseSourceCandidateGroups<T extends DiscoverySourceCandidateQualityItem>(candidates: T[]): GroupedSourceCandidate<T>[] {
  const groups = new Map<string, T[]>();
  for (const candidate of candidates) {
    const key = canonicalSourceCandidateKey(candidate);
    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }
  return [...groups.entries()]
    .map(([key, groupCandidates]) => {
      const ranked = rankSourceCandidates(groupCandidates);
      const primary = ranked[0];
      return {
        key,
        primary,
        candidates: ranked,
        duplicateCount: Math.max(0, ranked.length - 1),
        quality: scoreSourceCandidateQuality(primary)
      };
    })
    .sort((a, b) => {
      if (a.quality.score !== b.quality.score) return b.quality.score - a.quality.score;
      if (a.duplicateCount !== b.duplicateCount) return b.duplicateCount - a.duplicateCount;
      return normalizeText(a.primary.title).localeCompare(normalizeText(b.primary.title));
    });
}

export function groupSourceCandidatesForDiscoveryReview<T extends DiscoverySourceCandidateQualityItem>(candidates: T[]) {
  const primary: T[] = [];
  const processed: T[] = [];
  const skippedOrUnsupported: T[] = [];
  const lowQuality: T[] = [];

  for (const candidate of candidates) {
    if (candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED") {
      skippedOrUnsupported.push(candidate);
    } else if (isProcessedSourceCandidate(candidate)) {
      processed.push(candidate);
    } else if (hasMeaningfulSourceCandidateNextAction(candidate)) {
      primary.push(candidate);
    } else {
      lowQuality.push(candidate);
    }
  }

  const primaryGroups = collapseSourceCandidateGroups(primary);
  const processedGroups = collapseSourceCandidateGroups(processed);
  const lowQualityGroups = collapseSourceCandidateGroups(lowQuality);
  const skippedOrUnsupportedGroups = collapseSourceCandidateGroups(skippedOrUnsupported);

  return {
    primary: primaryGroups.map((group) => group.primary),
    processed: processedGroups.map((group) => group.primary),
    lowQuality: lowQualityGroups.map((group) => group.primary),
    skippedOrUnsupported: skippedOrUnsupportedGroups.map((group) => group.primary),
    primaryGroups,
    processedGroups,
    lowQualityGroups,
    skippedOrUnsupportedGroups
  };
}
