import { normalizeJobPriority, priorityRank } from "./jobPriority";
import { normalizeJobStatus } from "./jobStatus";

export type ReadinessJob = {
  status: string;
  validationStatus: string;
  priority?: string | null;
  nextActionAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

const completedOrClosedStatuses = new Set(["APPLIED", "REPLIED", "INTERVIEW", "OFFER", "ARCHIVED", "REJECTED"]);
const applicationProgressStatuses = new Set(["APPLIED", "REPLIED", "INTERVIEW", "OFFER"]);

function dateTime(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

export function isReadyToApplyJob(job: ReadinessJob) {
  const status = normalizeJobStatus(job.status);
  return isActiveJob(job) && !applicationProgressStatuses.has(status) && (job.validationStatus === "ALLOWED" || job.validationStatus === "RISKY");
}

export function isCompletedOrClosedJob(job: ReadinessJob) {
  return completedOrClosedStatuses.has(normalizeJobStatus(job.status));
}

export function isActiveJob(job: ReadinessJob) {
  const status = normalizeJobStatus(job.status);
  return status !== "ARCHIVED" && status !== "REJECTED";
}

export function isActionableJob(job: ReadinessJob) {
  return isActiveJob(job) && job.validationStatus !== "FORBIDDEN";
}

export function getReadyToApplyJobs<T extends ReadinessJob>(jobs: T[]) {
  return jobs
    .filter(isReadyToApplyJob)
    .sort((a, b) => {
      const priorityDiff = priorityRank(normalizeJobPriority(b.priority)) - priorityRank(normalizeJobPriority(a.priority));
      if (priorityDiff !== 0) return priorityDiff;

      const nextActionDiff = dateTime(a.nextActionAt) - dateTime(b.nextActionAt);
      if (nextActionDiff !== 0) return nextActionDiff;

      return dateTime(b.updatedAt) - dateTime(a.updatedAt);
    });
}
