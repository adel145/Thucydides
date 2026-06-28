import { isActiveJob, isReadyToApplyJob, type ReadinessJob } from "../jobs/jobReadiness";
import { type ProfileSourceLinkLike, summarizeProfileEvidence } from "../profile/profileSourceLinks";
import { type SourceReadinessSource, calculateSourceReadiness } from "../sources/sourceReadiness";

export const APPLICATION_PACKET_STATUSES = ["DRAFT", "READY"] as const;
export const APPLICATION_DECISIONS = ["READY_TO_PREPARE", "NEEDS_MANUAL_REVIEW", "NEEDS_PROFILE_EVIDENCE", "DO_NOT_APPLY", "CLOSED"] as const;
export const CV_LANGUAGES = ["English", "Hebrew"] as const;

export type ApplicationPacketStatus = (typeof APPLICATION_PACKET_STATUSES)[number];
export type ApplicationDecision = (typeof APPLICATION_DECISIONS)[number];
export type CvLanguage = (typeof CV_LANGUAGES)[number];

export type ApplicationPacketJob = ReadinessJob & {
  language?: string | null;
  rawDescription?: string | null;
  validationStatus: string;
  status: string;
  forbiddenFlags?: unknown;
  riskNotes?: string | null;
};

export type ApplicationPacketProfile = {
  fullName?: string | null;
  location?: string | null;
  degreeStatus?: string | null;
  technicalSkills?: unknown;
  education?: unknown;
};

export type ApplicationPacketDraft = {
  cvTailoringNotes?: string | null;
  recruiterMessageDraft?: string | null;
  coverLetterDraft?: string | null;
  followUpPlan?: string | null;
};

export type PacketChecklistItem = {
  label: string;
  done: boolean;
  missingText: string;
  critical?: boolean;
};

const evidenceFields = ["technicalSkills", "education", "githubProjects", "certificates"] as const;

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

function hebrewCharCount(value: string) {
  return (value.match(/[\u0590-\u05FF]/g) ?? []).length;
}

function latinWordCount(value: string) {
  return (value.match(/[a-zA-Z]{2,}/g) ?? []).length;
}

export function normalizeApplicationPacketStatus(value: string | null | undefined): ApplicationPacketStatus {
  return APPLICATION_PACKET_STATUSES.includes(value as ApplicationPacketStatus) ? (value as ApplicationPacketStatus) : "DRAFT";
}

export function normalizeApplicationDecision(value: string | null | undefined): ApplicationDecision {
  return APPLICATION_DECISIONS.includes(value as ApplicationDecision) ? (value as ApplicationDecision) : "NEEDS_PROFILE_EVIDENCE";
}

export function normalizeCvLanguage(value: string | null | undefined): CvLanguage {
  return CV_LANGUAGES.includes(value as CvLanguage) ? (value as CvLanguage) : "English";
}

export function isApplicationDecisionSafeForReady(decision: ApplicationDecision) {
  return decision === "READY_TO_PREPARE" || decision === "NEEDS_MANUAL_REVIEW";
}

export function getCriticalChecklistItems(checklist: PacketChecklistItem[]) {
  return checklist.filter((item) => item.critical);
}

export function canMarkApplicationPacketReady(summary: { applicationDecision: ApplicationDecision; checklist: PacketChecklistItem[] }) {
  return isApplicationDecisionSafeForReady(summary.applicationDecision) && getCriticalChecklistItems(summary.checklist).every((item) => item.done);
}

export function sanitizeApplicationDecisionForJob(
  job: ApplicationPacketJob,
  requestedDecision: string | null | undefined,
  deterministicDecision: ApplicationDecision
): ApplicationDecision {
  const normalizedRequestedDecision = normalizeApplicationDecision(requestedDecision);
  if (deterministicDecision === "DO_NOT_APPLY" || deterministicDecision === "CLOSED") return deterministicDecision;
  if (job.validationStatus === "RISKY") return "NEEDS_MANUAL_REVIEW";
  return normalizedRequestedDecision;
}

export function sanitizeApplicationPacketStatusForJob(
  job: ApplicationPacketJob,
  requestedStatus: string | null | undefined,
  applicationDecision: ApplicationDecision,
  summary: { checklist: PacketChecklistItem[] }
): ApplicationPacketStatus {
  const normalizedRequestedStatus = normalizeApplicationPacketStatus(requestedStatus);
  if (normalizedRequestedStatus !== "READY") return "DRAFT";
  if (job.validationStatus === "FORBIDDEN" || !isActiveJob(job)) return "DRAFT";
  return canMarkApplicationPacketReady({ applicationDecision, checklist: summary.checklist }) ? "READY" : "DRAFT";
}

export function recommendCvLanguage(job: Pick<ApplicationPacketJob, "language" | "rawDescription">): CvLanguage {
  const language = (job.language ?? "").toLocaleLowerCase();
  const rawDescription = job.rawDescription ?? "";
  if (language.includes("hebrew") || language.includes("עברית")) return "Hebrew";
  if (language.includes("english")) return hebrewCharCount(rawDescription) > latinWordCount(rawDescription) * 2 ? "Hebrew" : "English";
  return hebrewCharCount(rawDescription) > latinWordCount(rawDescription) ? "Hebrew" : "English";
}

export function getApplicationDecision(
  job: ApplicationPacketJob,
  profile: ApplicationPacketProfile | null | undefined,
  sources: SourceReadinessSource[],
  links: ProfileSourceLinkLike[]
): ApplicationDecision {
  if (job.validationStatus === "FORBIDDEN") return "DO_NOT_APPLY";
  if (!isActiveJob(job)) return "CLOSED";
  if (job.validationStatus === "RISKY") return "NEEDS_MANUAL_REVIEW";

  const checklist = buildApplicationChecklist(job, profile, sources, links, {});
  const hasProfileEvidenceGap = checklist.some(
    (item) => item.critical && !item.done && (item.label.includes("Profile") || item.label.includes("Source"))
  );
  if (hasProfileEvidenceGap || !profile) return "NEEDS_PROFILE_EVIDENCE";
  if (isReadyToApplyJob(job)) return "READY_TO_PREPARE";
  return "NEEDS_MANUAL_REVIEW";
}

export function buildApplicationChecklist(
  job: ApplicationPacketJob,
  profile: ApplicationPacketProfile | null | undefined,
  sources: SourceReadinessSource[],
  links: ProfileSourceLinkLike[],
  draft: ApplicationPacketDraft
): PacketChecklistItem[] {
  const sourceReadiness = calculateSourceReadiness(sources);
  const evidence = summarizeProfileEvidence(links);
  return [
    { label: "Job is allowed/risky, not forbidden", done: job.validationStatus === "ALLOWED" || job.validationStatus === "RISKY", missingText: "Review forbidden flags before preparing.", critical: true },
    { label: "Job is active, not archived/rejected", done: isActiveJob(job), missingText: "Closed jobs should not be prepared.", critical: true },
    { label: "Profile has full name/location/degree/skills/education", done: Boolean(profile?.fullName && profile.location && profile.degreeStatus && hasValue(profile.technicalSkills) && hasValue(profile.education)), missingText: "Complete required profile fields.", critical: true },
    { label: "Source readiness exists", done: sourceReadiness.readyCount > 0, missingText: "Add CV, LinkedIn, GitHub/projects, certificates, or academic sources.", critical: true },
    ...evidenceFields.map((field) => ({
      label: `${field} evidence linked`,
      done: evidence.grouped[field].length > 0,
      missingText: `Link source evidence for ${field}.`,
      critical: false
    })),
    { label: "CV tailoring notes written", done: hasText(draft.cvTailoringNotes), missingText: "Write manual CV tailoring notes.", critical: true },
    { label: "Recruiter message or cover note written", done: hasText(draft.recruiterMessageDraft) || hasText(draft.coverLetterDraft), missingText: "Write a recruiter message or cover note.", critical: true },
    { label: "Follow-up plan written", done: hasText(draft.followUpPlan), missingText: "Write a follow-up plan.", critical: true }
  ];
}

export function buildApplicationPacketSummary(
  job: ApplicationPacketJob,
  profile: ApplicationPacketProfile | null | undefined,
  sources: SourceReadinessSource[],
  links: ProfileSourceLinkLike[],
  draft: ApplicationPacketDraft = {}
) {
  const checklist = buildApplicationChecklist(job, profile, sources, links, draft);
  const missingItems = checklist.filter((item) => !item.done).map((item) => item.missingText);
  const evidence = summarizeProfileEvidence(links);

  return {
    cvLanguage: recommendCvLanguage(job),
    applicationDecision: getApplicationDecision(job, profile, sources, links),
    checklist,
    missingItems,
    profileEvidenceSummary: {
      readyCount: evidence.readyCount,
      totalCount: evidence.totalCount,
      fieldsWithEvidence: evidence.fieldsWithEvidence.map((field) => field.key),
      fieldsMissingEvidence: evidence.fieldsMissingEvidence.map((field) => field.key)
    },
    readyCount: checklist.filter((item) => item.done).length,
    totalCount: checklist.length
  };
}
