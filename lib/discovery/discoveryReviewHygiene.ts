import { discoveryPostingActionState, isVerifiedDiscoveryPostingLead, type DiscoveryLeadViewItem } from "./discoveryLeadViews";
import { isProviderAuthFailureMessage } from "./providerDiagnostics";
import { type DiscoverySourceCandidateQualityItem, groupSourceCandidatesForDiscoveryReview, scoreSourceCandidateQuality } from "./sourceCandidateQuality";

export type DiscoveryRunIssueItem = {
  id?: string | null;
  status?: string | null;
  provider?: string | null;
  query?: string | null;
  error?: string | null;
  resultCount?: number | null;
  startedAt?: Date | string | null;
  finishedAt?: Date | string | null;
};

export type DiscoveryProviderIssueGroup<T extends DiscoveryRunIssueItem> = {
  key: "SERPAPI_AUTH_FAILED" | "OTHER_PROVIDER_ISSUES";
  title: string;
  message: string;
  actionHint: string;
  runs: T[];
  count: number;
};

function hasSerpApiAuthFailure(run: DiscoveryRunIssueItem) {
  return /serpapi/i.test(`${run.provider ?? ""} ${run.error ?? ""}`) && isProviderAuthFailureMessage(run.error ?? "");
}

export function groupDiscoveryProviderIssues<T extends DiscoveryRunIssueItem>(runs: T[]): DiscoveryProviderIssueGroup<T>[] {
  const serpApiAuthRuns = runs.filter(hasSerpApiAuthFailure);
  const otherRuns = runs.filter((run) => Boolean(run.error) && !hasSerpApiAuthFailure(run));
  const groups: DiscoveryProviderIssueGroup<T>[] = [];

  if (serpApiAuthRuns.length > 0) {
    groups.push({
      key: "SERPAPI_AUTH_FAILED",
      title: "SerpApi נכשל בגלל הרשאה",
      message: "המפתח קיים אבל SerpApi מחזיר 401. תקן את המפתח/החשבון מחוץ לאפליקציה, או המשך עם Tavily בלבד בינתיים.",
      actionHint: "בינתיים Discovery יסתמך בעיקר על Tavily ולא יציף את הלוח בכשלונות SerpApi.",
      runs: serpApiAuthRuns,
      count: serpApiAuthRuns.length
    });
  }

  if (otherRuns.length > 0) {
    groups.push({
      key: "OTHER_PROVIDER_ISSUES",
      title: "בעיות ספקים / ריצות כושלות",
      message: "נמצאו ריצות עם שגיאות ספק או fetch. הן נשמרות לביקורת, אבל לא מוצגות כעבודה דחופה.",
      actionHint: "פתח את הפרטים רק אם צריך להבין למה ריצה מסוימת לא החזירה תוצאות.",
      runs: otherRuns,
      count: otherRuns.length
    });
  }

  return groups;
}

export function isLowPriorityStaleSourceCandidate(candidate: DiscoverySourceCandidateQualityItem) {
  if (candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED") return false;
  if (candidate.classification === "ACTUAL_JOB_POSTING" || candidate.classification === "ATS_JOB_POSTING") return false;
  if ((candidate.createdLeadCount ?? 0) > 0 || (candidate.extractedJobCount ?? 0) > 0) return false;
  const quality = scoreSourceCandidateQuality(candidate);
  return (
    quality.tier === "VERY_LOW" ||
    candidate.classification === "THIRD_PARTY_AGGREGATOR_LIST" ||
    candidate.classification === "GENERIC_COMPANY_PAGE" ||
    candidate.classification === "NOISY_PAGE" ||
    candidate.classification === "BLOCKED_OR_UNFETCHABLE" ||
    Boolean(candidate.error)
  );
}

export function discoveryUsefulWorkCounts(
  input: {
    leads: DiscoveryLeadViewItem[];
    candidates: DiscoverySourceCandidateQualityItem[];
    providerIssueCount: number;
    duplicateForLead?: (lead: DiscoveryLeadViewItem) => boolean;
  }
) {
  const candidateGroups = groupSourceCandidatesForDiscoveryReview(input.candidates);
  const verifiedLeads = input.leads.filter(isVerifiedDiscoveryPostingLead);
  const ready = verifiedLeads.filter((lead) => discoveryPostingActionState(lead, { duplicate: input.duplicateForLead?.(lead) }).label === "Ready to import").length;
  const needsReview = verifiedLeads.filter((lead) => discoveryPostingActionState(lead, { duplicate: input.duplicateForLead?.(lead) }).label === "Needs review — not ready").length;
  const hiddenNoise = input.leads.filter((lead) => lead.status === "SKIPPED").length + candidateGroups.skippedOrUnsupportedGroups.length;

  return {
    readyToImport: ready,
    needsReview,
    actionableSources: candidateGroups.primaryGroups.length,
    processedSources: candidateGroups.processedGroups.length,
    providerIssues: input.providerIssueCount,
    hiddenNoise
  };
}
