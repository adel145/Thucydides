import Link from "next/link";
import { changeJobStatus, markLastContactedToday, setNextAction, updateJobPriority } from "@/app/jobs/actions";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { JOB_PRIORITIES, jobPriorityLabels } from "@/lib/jobs/jobPriority";
import { JOB_STATUSES, jobStatusLabels, normalizeJobStatus, type JobStatus } from "@/lib/jobs/jobStatus";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

export default async function PipelinePage() {
  const jobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const grouped = JOB_STATUSES.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<JobStatus, typeof jobs>
  );

  for (const job of jobs) {
    grouped[normalizeJobStatus(job.status)].push(job);
  }

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Pipeline</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">תהליך הגשה מקומי</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          משרות מקובצות לפי סטטוס ידני. כל שינוי סטטוס נשמר כ-ApplicationEvent מסוג STATUS_CHANGED.
        </p>
      </GlassCard>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        {JOB_STATUSES.map((status) => (
          <GlassCard key={status} className="min-h-60 min-w-0 overflow-hidden">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h3 className="break-words text-lg font-semibold text-white">{jobStatusLabels[status]}</h3>
              <span className="text-sm text-ink-400">{grouped[status].length}</span>
            </div>
            <div className="mt-4 grid min-w-0 gap-3">
              {grouped[status].map((job) => (
                <div key={job.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                    <Link href={`/jobs/${job.id}`} className="min-w-0 break-words font-semibold text-white hover:text-aqua-400">
                      {job.title}
                    </Link>
                    <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
                  </div>
                  <p className="mt-2 break-words text-sm text-ink-200">{[job.company, job.location, job.source].filter(Boolean).join(" | ") || "אין metadata"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={job.status} />
                    <PriorityBadge priority={job.priority} />
                  </div>
                  <p className="mt-2 break-words text-xs text-ink-400">
                    פעולה הבאה: {job.nextActionAt ? job.nextActionAt.toLocaleDateString("he-IL") : "לא נקבע"}
                    {job.nextActionNote ? ` | ${job.nextActionNote}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {JOB_STATUSES.filter((next) => next !== status).map((next) => (
                      <form key={next} action={changeJobStatus}>
                        <input type="hidden" name="id" value={job.id} />
                        <input type="hidden" name="status" value={next} />
                        <button className="min-h-8 rounded-lg border border-white/10 px-2 text-xs font-semibold text-ink-200 hover:border-aqua-400/50 hover:text-aqua-400">
                          {jobStatusLabels[next]}
                        </button>
                      </form>
                    ))}
                  </div>
                  <div className="mt-3 grid min-w-0 gap-2">
                    <form action={updateJobPriority} className="flex min-w-0 gap-2">
                      <input type="hidden" name="id" value={job.id} />
                      <select name="priority" defaultValue={job.priority ?? "MEDIUM"} className="min-h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-navy-950/70 px-2 text-xs text-white">
                        {JOB_PRIORITIES.map((priority) => <option key={priority} value={priority}>{jobPriorityLabels[priority]}</option>)}
                      </select>
                      <button className="rounded-lg border border-white/10 px-2 text-xs font-semibold text-ink-200">שמור</button>
                    </form>
                    <form action={setNextAction} className="grid min-w-0 gap-2">
                      <input type="hidden" name="id" value={job.id} />
                      <input type="date" name="nextActionAt" defaultValue={job.nextActionAt ? job.nextActionAt.toISOString().slice(0, 10) : ""} className="min-h-8 min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-2 text-xs text-white" />
                      <input name="nextActionNote" defaultValue={job.nextActionNote ?? ""} placeholder="הערת פעולה הבאה" className="min-h-8 min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-2 text-xs text-white" />
                      <button className="rounded-lg border border-white/10 px-2 py-2 text-xs font-semibold text-ink-200">שמור תזכורת</button>
                    </form>
                    <form action={markLastContactedToday}>
                      <input type="hidden" name="id" value={job.id} />
                      <button className="rounded-lg border border-white/10 px-2 py-2 text-xs font-semibold text-ink-200">נוצר קשר היום</button>
                    </form>
                  </div>
                </div>
              ))}
              {grouped[status].length === 0 ? <p className="text-sm text-ink-400">אין משרות בשלב הזה.</p> : null}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
