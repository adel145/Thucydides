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
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-signal-red">פרטי משרה</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">המשרה לא נמצאה</h2>
        <p dir="ltr" className="mt-4 break-all text-left text-sm leading-6 text-ink-200">לא קיימת משרה מקומית עבור id `{id}`.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">פרטי משרה</p>
            <h2 dir="auto" className="mt-3 break-words text-3xl font-semibold text-white">{job.title}</h2>
            <p dir="auto" className="mt-2 break-words text-sm text-ink-200">{job.company ?? "חברה לא ידועה"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
          </div>
        </div>
        {notices?.saved || notices?.validated || notices?.archived ? (
          <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">
            {notices.saved ? "המשרה נשמרה וה-validation הורץ מחדש." : notices.validated ? "ה-validation הסתיים." : "המשרה הועברה לארכיון."}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton href={`/jobs/${job.id}/application`}>הכן Application Packet</NeonButton>
          <NeonButton href={`/jobs/${job.id}/edit`}>ערוך משרה</NeonButton>
          <form action={rerunValidation}>
            <input type="hidden" name="id" value={job.id} />
            <NeonButton>הרץ validation מחדש</NeonButton>
          </form>
          <form action={archiveJob}>
            <input type="hidden" name="id" value={job.id} />
            <NeonButton className="border-white/20 text-ink-100">ארכיון</NeonButton>
          </form>
          <NeonButton href={`/jobs/${job.id}/delete`} className="border-signal-red/50 text-signal-red">מחיקה קשיחה</NeonButton>
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מעקב ופעולה הבאה</h3>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">עדיפות</div>
            <div className="mt-2"><PriorityBadge priority={job.priority} /></div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">פעולה הבאה</div>
            <div className="mt-2 text-sm text-white">{job.nextActionAt ? job.nextActionAt.toLocaleDateString("he-IL") : "לא נקבע"}</div>
            {job.nextActionNote ? <p dir="auto" className="mt-2 break-words text-sm text-ink-200">{job.nextActionNote}</p> : null}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">קשר אחרון</div>
            <div className="mt-2 text-sm text-white">{job.lastContactedAt ? job.lastContactedAt.toLocaleDateString("he-IL") : "לא נרשם"}</div>
          </div>
        </div>
        <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-3">
          <form action={updateJobPriority} className="grid min-w-0 gap-2">
            <input type="hidden" name="id" value={job.id} />
            <select name="priority" defaultValue={job.priority ?? "MEDIUM"} className="min-h-10 min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
              {JOB_PRIORITIES.map((priority) => <option key={priority} value={priority}>{jobPriorityLabels[priority]}</option>)}
            </select>
            <NeonButton>שמור עדיפות</NeonButton>
          </form>
          <form action={setNextAction} className="grid min-w-0 gap-2">
            <input type="hidden" name="id" value={job.id} />
            <input type="date" name="nextActionAt" defaultValue={job.nextActionAt ? job.nextActionAt.toISOString().slice(0, 10) : ""} className="min-h-10 min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white" />
            <input name="nextActionNote" defaultValue={job.nextActionNote ?? ""} placeholder="הערת פעולה הבאה" className="min-h-10 min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white" />
            <NeonButton>שמור פעולה הבאה</NeonButton>
          </form>
          <form action={markLastContactedToday} className="self-end">
            <input type="hidden" name="id" value={job.id} />
            <NeonButton>סמן שנוצר קשר היום</NeonButton>
          </form>
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">העבר ב-Pipeline</h3>
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

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">Metadata שמור</h3>
        <dl className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          {[
            ["מקור", job.source],
            ["Source URL", job.sourceUrl],
            ["מיקום", job.location],
            ["שפה", job.language],
            ["טקסט שכר", job.salaryText],
            ["קטגוריית תפקיד", job.roleCategory]
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</dt>
              <dd dir={label === "Source URL" ? "ltr" : "auto"} className={label === "Source URL" ? "mt-2 break-all text-left text-sm text-white" : "mt-2 break-words text-sm text-white"}>{value || "לא סופק"}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">תוצאת validation</h3>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Allowed signals</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {jsonToStringArray(job.allowedSignals).map((signal) => (
                <span key={signal} className="rounded-full border border-aqua-400/30 px-2 py-1 text-xs text-aqua-400">{signal}</span>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Forbidden flags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {jsonToStringArray(job.forbiddenFlags).map((flag) => (
                <span key={flag} className="rounded-full border border-signal-red/40 px-2 py-1 text-xs text-signal-red">{flag}</span>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Risk notes</div>
            <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-200">{job.riskNotes || "אין הערות סיכון."}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">תיאור משרה גולמי</h3>
        <p dir="auto" className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-ink-200">{job.rawDescription}</p>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">היסטוריית אירועים</h3>
        <div className="mt-4">
          <EventTimeline events={job.events} />
        </div>
      </GlassCard>

      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {["ציון התאמה עתידי", "Agent Council עתידי", "יצירת CV עתידית"].map((title) => (
          <GlassCard key={title} className="min-w-0 overflow-hidden">
            <h3 className="break-words text-lg font-semibold text-white">{title}</h3>
            <p className="mt-3 break-words text-sm leading-6 text-ink-200">מתוכנן לשלבים מאוחרים יותר אחרי שהפרופיל, המקורות ותהליכי הבדיקה יהיו מוכנים.</p>
          </GlassCard>
        ))}
      </div>

      <Link href="/jobs" className="text-sm font-semibold text-aqua-400">
        חזרה למשרות
      </Link>
    </div>
  );
}
