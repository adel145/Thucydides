import { normalizeJobPriority, priorityRank } from "./jobPriority";
import { normalizeJobStatus } from "./jobStatus";

export type ReadinessJob = {
  status: string;
  validationStatus: string;
  priority?: string | null;
  nextActionAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

const completedStatuses = new Set(["APPLIED", "REPLIED", "INTERVIEW", "OFFER", "ARCHIVED", "REJECTED"]);

function dateTime(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

export function isReadyToApplyJob(job: ReadinessJob) {
  const status = normalizeJobStatus(job.status);
  return !completedStatuses.has(status) && (job.validationStatus === "ALLOWED" || job.validationStatus === "RISKY");
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
