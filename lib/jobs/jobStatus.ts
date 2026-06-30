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
  FOUND: "נמצאה",
  ANALYZED: "נבדקה",
  READY_TO_APPLY: "מוכן להגשה",
  APPLIED: "הוגשה",
  REPLIED: "התקבלה תגובה",
  INTERVIEW: "ראיון",
  REJECTED: "נדחתה",
  OFFER: "הצעה",
  ARCHIVED: "ארכיון"
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
