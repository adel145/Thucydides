export const JOB_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const jobPriorityLabels: Record<JobPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

export function isJobPriority(value: string): value is JobPriority {
  return JOB_PRIORITIES.includes(value as JobPriority);
}

export function normalizeJobPriority(value: string | null | undefined): JobPriority {
  return value && isJobPriority(value) ? value : "MEDIUM";
}

export function priorityRank(value: string | null | undefined) {
  const priority = normalizeJobPriority(value);
  return JOB_PRIORITIES.indexOf(priority);
}
