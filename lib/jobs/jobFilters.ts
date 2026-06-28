import type { Job } from "../../generated/prisma/client";
import { isReadyToApplyJob } from "./jobReadiness";
import { isJobStatus } from "./jobStatus";

export const JOB_SORTS = [
  "newest",
  "oldest",
  "company",
  "title",
  "validation",
  "status",
  "updated"
] as const;

export type JobSort = (typeof JOB_SORTS)[number];

export type JobFilterParams = {
  q?: string;
  view?: string;
  validationStatus?: string;
  status?: string;
  source?: string;
  language?: string;
  location?: string;
  roleCategory?: string;
  sort?: string;
};

export function normalizeJobSort(value: string | null | undefined): JobSort {
  return JOB_SORTS.includes(value as JobSort) ? (value as JobSort) : "updated";
}

function includes(value: string | null | undefined, query: string) {
  return (value ?? "").toLocaleLowerCase().includes(query);
}

function isDue(value: Date | string | null | undefined, now = new Date()) {
  if (!value) return false;
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  return new Date(value) <= todayEnd;
}

function matchesQuickView<T extends Pick<Job, "validationStatus" | "status"> & { priority?: string | null; nextActionAt?: Date | string | null }>(
  job: T,
  view: string | undefined
) {
  if (!view) return true;
  if (view === "ready") return isReadyToApplyJob(job);
  if (view === "high-priority") return job.priority === "HIGH" || job.priority === "CRITICAL";
  if (view === "follow-up-due") return isDue(job.nextActionAt);
  if (view === "risky") return job.validationStatus === "RISKY";
  if (view === "forbidden") return job.validationStatus === "FORBIDDEN";
  return true;
}

export function filterJobs<T extends Pick<Job, "title" | "company" | "location" | "rawDescription" | "validationStatus" | "status" | "source" | "language" | "roleCategory"> & { priority?: string | null; nextActionAt?: Date | string | null }>(
  jobs: T[],
  params: JobFilterParams
) {
  const q = (params.q ?? "").trim().toLocaleLowerCase();
  return jobs.filter((job) => {
    if (!matchesQuickView(job, params.view)) return false;
    if (q && ![job.title, job.company, job.location, job.rawDescription].some((value) => includes(value, q))) return false;
    if (params.validationStatus && job.validationStatus !== params.validationStatus) return false;
    if (params.status && isJobStatus(params.status) && job.status !== params.status) return false;
    if (params.source && job.source !== params.source) return false;
    if (params.language && job.language !== params.language) return false;
    if (params.location && job.location !== params.location) return false;
    if (params.roleCategory && job.roleCategory !== params.roleCategory) return false;
    return true;
  });
}

export function hasActiveJobFilters(params: JobFilterParams) {
  return Boolean(
    params.q ||
      params.view ||
      params.validationStatus ||
      params.status ||
      params.source ||
      params.language ||
      params.location ||
      params.roleCategory ||
      (params.sort && normalizeJobSort(params.sort) !== "updated")
  );
}
