import { getReadyToApplyJobs, isActionableJob, type ReadinessJob } from "../jobs/jobReadiness";
import { calculateSourceReadiness, type SourceReadinessSource } from "../sources/sourceReadiness";

export type MissionJob = ReadinessJob & {
  title: string;
  id?: string;
  company?: string | null;
  location?: string | null;
  riskNotes?: string | null;
};

export type MissionProfile = {
  fullName?: string | null;
  location?: string | null;
  degreeStatus?: string | null;
  technicalSkills?: unknown;
  education?: unknown;
};

function startOfDay(now: Date) {
  const value = new Date(now);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(now: Date) {
  const value = new Date(now);
  value.setHours(23, 59, 59, 999);
  return value;
}

function hasListValue(value: unknown) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

export function calculateDashboardMission(
  jobs: MissionJob[],
  sources: SourceReadinessSource[] = [],
  profile?: MissionProfile | null,
  now: Date = new Date()
) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const actionableJobs = jobs.filter(isActionableJob);
  const dueFollowUps = actionableJobs.filter((job) => {
    if (!job.nextActionAt) return false;
    const due = new Date(job.nextActionAt);
    return due >= todayStart && due <= todayEnd;
  });
  const overdueFollowUps = actionableJobs.filter((job) => {
    if (!job.nextActionAt) return false;
    return new Date(job.nextActionAt) < todayStart;
  });
  const highPriorityJobs = actionableJobs.filter((job) => job.priority === "HIGH" || job.priority === "CRITICAL");
  const recentJobs = [...jobs].sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()).slice(0, 5);
  const sourceReadiness = calculateSourceReadiness(sources);
  const profileWarnings = [
    !profile ? "Profile is missing." : null,
    profile && !profile.fullName ? "Add full name." : null,
    profile && !profile.location ? "Add location." : null,
    profile && !profile.degreeStatus ? "Add degree status." : null,
    profile && !hasListValue(profile.technicalSkills) ? "Add technical skills." : null,
    profile && !hasListValue(profile.education) ? "Add education." : null
  ].filter((warning): warning is string => Boolean(warning));

  return {
    readyToApplyJobs: getReadyToApplyJobs(jobs),
    dueFollowUps,
    overdueFollowUps,
    highPriorityJobs,
    recentJobs,
    sourceReadiness,
    profileWarnings
  };
}
