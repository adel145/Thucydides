import Link from "next/link";
import { archiveJob, changeJobStatus, markLastContactedToday, rerunValidation, setNextAction, updateJobPriority } from "@/app/jobs/actions";
import { EventTimeline } from "@/components/jobs/EventTimeline";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { JOB_PRIORITIES, jobPriorityLabels } from "@/lib/jobs/jobPriority";
import { JOB_STATUSES, jobStatusLabels } from "@/lib/jobs/jobStatus";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

export default async function JobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; validated?: string; archived?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const job = await db.job.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "desc" } } }
  });

  if (!job) {
    return (
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-signal-red">Job Detail</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Job not found</h2>
        <p className="mt-4 text-sm leading-6 text-ink-200">No local job exists for id `{id}`.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Job Detail</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{job.title}</h2>
            <p className="mt-2 text-sm text-ink-200">{job.company ?? "Unknown company"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
          </div>
        </div>
        {notices?.saved || notices?.validated || notices?.archived ? (
          <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">
            {notices.saved ? "Job saved and validation rerun." : notices.validated ? "Validation rerun completed." : "Job archived."}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton href={`/jobs/${job.id}/edit`}>Edit job</NeonButton>
          <form action={rerunValidation}>
            <input type="hidden" name="id" value={job.id} />
            <NeonButton>Rerun validation</NeonButton>
          </form>
          <form action={archiveJob}>
            <input type="hidden" name="id" value={job.id} />
            <NeonButton className="border-white/20 text-ink-100">Archive</NeonButton>
          </form>
          <NeonButton href={`/jobs/${job.id}/delete`} className="border-signal-red/50 text-signal-red">Hard delete</NeonButton>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Follow-up discipline</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Priority</div>
            <div className="mt-2"><PriorityBadge priority={job.priority} /></div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Next action</div>
            <div className="mt-2 text-sm text-white">{job.nextActionAt ? job.nextActionAt.toLocaleDateString() : "Not set"}</div>
            {job.nextActionNote ? <p className="mt-2 text-sm text-ink-200">{job.nextActionNote}</p> : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Last contacted</div>
            <div className="mt-2 text-sm text-white">{job.lastContactedAt ? job.lastContactedAt.toLocaleDateString() : "Not recorded"}</div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <form action={updateJobPriority} className="grid gap-2">
            <input type="hidden" name="id" value={job.id} />
            <select name="priority" defaultValue={job.priority ?? "MEDIUM"} className="min-h-10 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
              {JOB_PRIORITIES.map((priority) => <option key={priority} value={priority}>{jobPriorityLabels[priority]}</option>)}
            </select>
            <NeonButton>Set priority</NeonButton>
          </form>
          <form action={setNextAction} className="grid gap-2">
            <input type="hidden" name="id" value={job.id} />
            <input type="date" name="nextActionAt" defaultValue={job.nextActionAt ? job.nextActionAt.toISOString().slice(0, 10) : ""} className="min-h-10 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white" />
            <input name="nextActionNote" defaultValue={job.nextActionNote ?? ""} placeholder="Next action note" className="min-h-10 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white" />
            <NeonButton>Set next action</NeonButton>
          </form>
          <form action={markLastContactedToday} className="self-end">
            <input type="hidden" name="id" value={job.id} />
            <NeonButton>Mark contacted today</NeonButton>
          </form>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Move through pipeline</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {JOB_STATUSES.map((status) => (
            <form key={status} action={changeJobStatus}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value={status} />
              <button className="min-h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-ink-200 transition hover:border-aqua-400/50 hover:text-aqua-400">
                {jobStatusLabels[status]}
              </button>
            </form>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Stored metadata</h3>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["Source", job.source],
            ["Source URL", job.sourceUrl],
            ["Location", job.location],
            ["Language", job.language],
            ["Salary text", job.salaryText],
            ["Role category", job.roleCategory]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</dt>
              <dd className="mt-2 text-sm text-white">{value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Validation result</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Allowed signals</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {jsonToStringArray(job.allowedSignals).map((signal) => (
                <span key={signal} className="rounded-full border border-aqua-400/30 px-2 py-1 text-xs text-aqua-400">{signal}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Forbidden flags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {jsonToStringArray(job.forbiddenFlags).map((flag) => (
                <span key={flag} className="rounded-full border border-signal-red/40 px-2 py-1 text-xs text-signal-red">{flag}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Risk notes</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-200">{job.riskNotes || "No risk notes."}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Raw description</h3>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink-200">{job.rawDescription}</p>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Application event history</h3>
        <div className="mt-4">
          <EventTimeline events={job.events} />
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        {["Future fit score", "Future agent council", "Future CV generation"].map((title) => (
          <GlassCard key={title}>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-200">Planned for later phases after profile, sources, and review flows are ready.</p>
          </GlassCard>
        ))}
      </div>

      <Link href="/jobs" className="text-sm font-semibold text-aqua-400">
        Back to jobs
      </Link>
    </div>
  );
}
