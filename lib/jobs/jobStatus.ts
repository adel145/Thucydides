export const JOB_STATUSES = [
  "FOUND",
  "ANALYZED",
  "READY_TO_APPLY",
  "APPLIED",
  "REPLIED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
  "ARCHIVED"
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobStatusLabels: Record<JobStatus, string> = {
  FOUND: "Found",
  ANALYZED: "Analyzed",
  READY_TO_APPLY: "Ready",
  APPLIED: "Applied",
  REPLIED: "Replied",
  INTERVIEW: "Interview",
  REJECTED: "Rejected",
  OFFER: "Offer",
  ARCHIVED: "Archived"
};

export function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.includes(value as JobStatus);
}

export function normalizeJobStatus(value: string | null | undefined): JobStatus {
  return value && isJobStatus(value) ? value : "FOUND";
}

export function archiveStatus() {
  return "ARCHIVED" satisfies JobStatus;
}
