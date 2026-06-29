import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { calculateDashboardMission } from "@/lib/dashboard/dashboardMission";
import { calculateDashboardMetrics } from "@/lib/dashboard/dashboardMetrics";
import { summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

export default async function DashboardPage() {
  const jobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const sources = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const packetCounts = {
    draft: await db.applicationPacket.count({ where: { status: "DRAFT" } }),
    ready: await db.applicationPacket.count({ where: { status: "READY" } })
  };
  const metrics = calculateDashboardMetrics(jobs);
  const mission = calculateDashboardMission(jobs, sources, profile);
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const readinessWarning = mission.sourceReadiness.missing.length > 0 || mission.profileWarnings.length > 0;

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
      <GlassCard className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Phase 4.0 daily mission</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Today&apos;s Mission
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-200">
            Start with jobs ready to apply, follow-ups, and source readiness. Local SQLite active; Gmail is not connected.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NeonButton href="/jobs?view=ready">Jobs Ready To Apply</NeonButton>
            <NeonButton href="/resumes" className="border-white/20 text-ink-100">Resume Lab</NeonButton>
            <NeonButton href="/jobs" className="border-white/20 text-ink-100">Paste Job</NeonButton>
            <NeonButton href="/pipeline" className="border-white/20 text-ink-100">Pipeline</NeonButton>
          </div>
        </div>
        <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Mission counts</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{mission.readyToApplyJobs.length}</div>
              <div className="text-xs text-ink-400">מוכן להגשה</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-100">{mission.dueFollowUps.length + mission.overdueFollowUps.length}</div>
              <div className="text-xs text-ink-400">Follow-ups</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-100">{mission.highPriorityJobs.length}</div>
              <div className="text-xs text-ink-400">High priority</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{mission.sourceReadiness.readyCount}/{mission.sourceReadiness.totalCount}</div>
              <div className="text-xs text-ink-400">Sources</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{evidence.readyCount}/{evidence.totalCount}</div>
              <div className="text-xs text-ink-400">Evidence</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{packetCounts.ready}/{packetCounts.draft + packetCounts.ready}</div>
              <div className="text-xs text-ink-400">Packets</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Planned workflow</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Future search and export support</h2>
          </div>
          <ScoreBadge tone="muted">Planned for later phases</ScoreBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["Find jobs automatically — planned", "Career pages first, then LinkedIn, Indeed, Drushim, AllJobs, and other sources after safety design."],
            ["Gmail job alerts intake — planned", "Future fallback for saved job alerts. Gmail is not connected and no email is read."],
            ["Export CV/PDF packet — planned", "Future DOCX/PDF/TXT exports with RTL/LTR support. Current packets stay manual text."]
          ].map(([title, note]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 opacity-85">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-2 text-sm leading-6 text-ink-300">{note}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {readinessWarning ? (
        <GlassCard className="border border-signal-red/30 bg-signal-red/10">
          <h2 className="text-xl font-semibold text-white">Profile and Sources need work</h2>
          <p className="mt-3 text-sm leading-6 text-ink-200">
            Profile and Sources are not ready for serious AI/CV work yet. Add CV, LinkedIn, GitHub/projects, certificates, and academic sources first.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {mission.profileWarnings.slice(0, 3).map((warning) => <ScoreBadge key={warning} tone="warning">{warning}</ScoreBadge>)}
            {mission.sourceReadiness.missing.map((item) => <ScoreBadge key={item.label} tone="warning">Missing {item.label}</ScoreBadge>)}
            {evidence.fieldsMissingEvidence.slice(0, 4).map((field) => <ScoreBadge key={field.key} tone="warning">{field.label} evidence missing</ScoreBadge>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <NeonButton href="/profile">Update Profile</NeonButton>
            <NeonButton href="/sources" className="border-white/20 text-ink-100">Update Sources</NeonButton>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">Jobs Ready To Apply</h2>
            <Link href="/jobs?view=ready" className="text-sm font-semibold text-aqua-400">Open all</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {mission.readyToApplyJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-aqua-400/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-white hover:text-aqua-400">{job.title}</Link>
                    <div className="mt-1 text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "No metadata"}</div>
                  </div>
                  <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus === "RISKY" ? "דורש בדיקה" : "משרה מתאימה"}</ScoreBadge>
                </div>
                {job.riskNotes ? <p className="mt-3 line-clamp-2 text-sm text-ink-300">{job.riskNotes}</p> : null}
                <Link href={`/jobs/${job.id}/application`} className="mt-3 inline-flex rounded-lg border border-aqua-400/40 px-3 py-2 text-xs font-semibold text-aqua-400">Prepare</Link>
              </div>
            ))}
            {mission.readyToApplyJobs.length === 0 ? <p className="text-sm text-ink-400">No ready jobs yet. Paste a job description in Job Inbox.</p> : null}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">Follow-ups</h2>
          <div className="mt-5 grid gap-4">
            <Link href="/jobs?view=follow-up-due" className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-ink-400">Due today</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.dueFollowUps.length}</div>
            </Link>
            <Link href="/jobs?view=follow-up-due" className="rounded-lg border border-signal-red/30 bg-signal-red/10 p-4">
              <div className="text-sm text-ink-400">Overdue</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.overdueFollowUps.length}</div>
            </Link>
            <Link href="/jobs?view=high-priority" className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-ink-400">High priority jobs</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.highPriorityJobs.length}</div>
            </Link>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">Recent local jobs</h2>
          <div className="mt-5 divide-y divide-white/10">
            {mission.recentJobs.map((job) => (
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
          <h2 className="text-2xl font-semibold text-white">Campaign summary</h2>
          <p className="mt-3 text-sm leading-6 text-ink-200">
            Useful metrics stay below the mission view so they do not dominate first open.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {metricCards.slice(0, 6).map(([label, value, note]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
                <p className="mt-2 text-xs leading-5 text-ink-300">{note}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

