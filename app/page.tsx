import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { calculateDashboardMetrics } from "@/lib/dashboard/dashboardMetrics";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

export default async function DashboardPage() {
  const jobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50
  });
  const recentJobs = jobs.slice(0, 5);
  const metrics = calculateDashboardMetrics(jobs);

  const metricCards = [
    ["Interview Goal", `${metrics.interviewGoalCurrent} / ${metrics.interviewGoalTarget}`, "Local interviews tracked against the mission target."],
    ["Jobs Found", `${metrics.jobsFound}`, `${metrics.activeJobs} active, ${metrics.archived} archived.`],
    ["Jobs Analyzed", `${metrics.jobsAnalyzed}`, "Jobs with deterministic validation or moved beyond found."],
    ["Applications Ready", `${metrics.applicationsReady}`, "Jobs staged for application."],
    ["Applications Sent", `${metrics.applicationsSent}`, "Jobs marked applied."],
    ["Replies", `${metrics.replies}`, "Jobs marked replied."],
    ["Interviews", `${metrics.interviews}`, "Jobs currently at interview stage."],
    ["Offers", `${metrics.offers}`, "Jobs marked offer."],
    ["Rejections", `${metrics.rejections}`, "Jobs marked rejected."],
    ["Archived", `${metrics.archived}`, "Jobs kept locally but out of the active campaign."],
    ["Due Follow-ups", `${metrics.dueFollowUps}`, "Active jobs with next action due today or earlier."],
    ["Overdue Follow-ups", `${metrics.overdueFollowUps}`, "Active jobs with next action before today."],
    ["High Priority", `${metrics.highPriorityJobs}`, "Active jobs marked high or critical priority."]
  ];

  return (
    <>
      <GlassCard className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Phase 3 campaign intelligence</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Thucydides is preparing the campaign intelligence layer toward 10 interviews.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-200">
            Metrics now come from the local SQLite database. AI, Gmail, scraping, and resume generation remain intentionally unimplemented.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NeonButton href="/jobs">Open Job Inbox</NeonButton>
            <NeonButton href="/pipeline" className="border-white/20 text-ink-100">Open Pipeline</NeonButton>
          </div>
        </div>
        <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Validation mix</div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{metrics.allowedJobs}</div>
              <div className="text-xs text-ink-400">Allowed</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-100">{metrics.riskyJobs}</div>
              <div className="text-xs text-ink-400">Risky</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-signal-red">{metrics.forbiddenJobs}</div>
              <div className="text-xs text-ink-400">Forbidden</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map(([label, value, note]) => (
          <MetricCard key={label} label={label} value={value} note={note} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">Recent jobs</h2>
          <div className="mt-5 divide-y divide-white/10">
            {recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-semibold text-white">{job.title}</div>
                  <div className="mt-1 text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "No metadata"}</div>
                </div>
                <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
              </Link>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">Phase boundary</h2>
          <p className="mt-3 text-sm leading-6 text-ink-200">
            This operational layer is local and deterministic. Future fit scores, agent council, Gmail, and CV generation are still placeholders until later phases.
          </p>
        </GlassCard>
      </div>
    </>
  );
}

