import { JOB_STATUSES, type JobStatus, normalizeJobStatus } from "../jobs/jobStatus";

export type DashboardMetricJob = {
  status: string;
  validationStatus: string;
  nextActionAt?: Date | string | null;
  priority?: string | null;
};

export type DashboardMetrics = {
  interviewGoalCurrent: number;
  interviewGoalTarget: 10;
  jobsFound: number;
  activeJobs: number;
  jobsAnalyzed: number;
  applicationsReady: number;
  applicationsSent: number;
  replies: number;
  interviews: number;
  offers: number;
  rejections: number;
  archived: number;
  forbiddenJobs: number;
  riskyJobs: number;
  allowedJobs: number;
  dueFollowUps: number;
  overdueFollowUps: number;
  highPriorityJobs: number;
  byStatus: Record<JobStatus, number>;
};

export function calculateDashboardMetrics(jobs: DashboardMetricJob[], now: Date = new Date()): DashboardMetrics {
  const byStatus = Object.fromEntries(JOB_STATUSES.map((status) => [status, 0])) as Record<JobStatus, number>;
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const activeJobs = jobs.filter((job) => normalizeJobStatus(job.status) !== "ARCHIVED");
  const dueJobs = activeJobs.filter((job) => {
    if (!job.nextActionAt) return false;
    const due = new Date(job.nextActionAt);
    return due <= todayEnd;
  });

  for (const job of jobs) {
    byStatus[normalizeJobStatus(job.status)] += 1;
  }

  return {
    interviewGoalCurrent: byStatus.INTERVIEW,
    interviewGoalTarget: 10,
    jobsFound: jobs.length,
    activeJobs: activeJobs.length,
    jobsAnalyzed: jobs.filter((job) => job.validationStatus !== "UNREVIEWED" || normalizeJobStatus(job.status) !== "FOUND").length,
    applicationsReady: byStatus.READY_TO_APPLY,
    applicationsSent: byStatus.APPLIED,
    replies: byStatus.REPLIED,
    interviews: byStatus.INTERVIEW,
    offers: byStatus.OFFER,
    rejections: byStatus.REJECTED,
    archived: byStatus.ARCHIVED,
    forbiddenJobs: jobs.filter((job) => job.validationStatus === "FORBIDDEN").length,
    riskyJobs: jobs.filter((job) => job.validationStatus === "RISKY").length,
    allowedJobs: jobs.filter((job) => job.validationStatus === "ALLOWED").length,
    dueFollowUps: dueJobs.length,
    overdueFollowUps: dueJobs.filter((job) => new Date(job.nextActionAt as Date | string) < todayStart).length,
    highPriorityJobs: activeJobs.filter((job) => job.priority === "HIGH" || job.priority === "CRITICAL").length,
    byStatus
  };
}
