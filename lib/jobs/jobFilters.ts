import type { Job } from "../../generated/prisma/client";
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

export function filterJobs<T extends Pick<Job, "title" | "company" | "location" | "rawDescription" | "validationStatus" | "status" | "source" | "language" | "roleCategory">>(
  jobs: T[],
  params: JobFilterParams
) {
  const q = (params.q ?? "").trim().toLocaleLowerCase();
  return jobs.filter((job) => {
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
      params.validationStatus ||
      params.status ||
      params.source ||
      params.language ||
      params.location ||
      params.roleCategory ||
      (params.sort && normalizeJobSort(params.sort) !== "updated")
  );
}
