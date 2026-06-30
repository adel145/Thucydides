import Link from "next/link";
import { archiveJob, createJob } from "@/app/jobs/actions";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { filterJobs, hasActiveJobFilters, normalizeJobSort } from "@/lib/jobs/jobFilters";
import { JOB_STATUSES, jobStatusLabels } from "@/lib/jobs/jobStatus";

const validationStatuses = ["ALLOWED", "RISKY", "FORBIDDEN", "UNREVIEWED"];
const quickViews = [
  ["מוכן להגשה", "ready", "מוכן להגשה"],
  ["עדיפות גבוהה", "high-priority", "עדיפות גבוהה"],
  ["מעקב להיום", "follow-up-due", "פעולה הבאה"],
  ["דורש בדיקה", "risky", "דורש בדיקה"],
  ["חסומות / לארכיון", "forbidden", "בדיקת ארכיון"]
] as const;

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function companyInitials(company: string | null) {
  const words = (company ?? "Unknown").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";
}

function readinessContext(validationStatus: string, status: string) {
  if (status === "ARCHIVED") return "בארכיון";
  if (status === "REJECTED") return "נדחתה";
  if (validationStatus === "ALLOWED") return "מוכן להגשה";
  if (validationStatus === "RISKY") return "דורש בדיקה ידנית";
  if (validationStatus === "FORBIDDEN") return "חסום";
  return "דורש ולידציה";
}

function uniqueOptions(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
}

function sortJobs<T extends { createdAt: Date; updatedAt: Date; company: string | null; title: string; validationStatus: string; status: string }>(jobs: T[], sort: string | undefined) {
  const normalized = normalizeJobSort(sort);
  return [...jobs].sort((a, b) => {
    if (normalized === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
    if (normalized === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    if (normalized === "company") return (a.company ?? "").localeCompare(b.company ?? "");
    if (normalized === "title") return a.title.localeCompare(b.title);
    if (normalized === "validation") return a.validationStatus.localeCompare(b.validationStatus);
    if (normalized === "status") return a.status.localeCompare(b.status);
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export default async function JobsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const allJobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const jobs = sortJobs(filterJobs(allJobs, params), params.sort);
  const activeFilters = hasActiveJobFilters(params);

  const sources = uniqueOptions(allJobs.map((job) => job.source));
  const languages = uniqueOptions(allJobs.map((job) => job.language));
  const locations = uniqueOptions(allJobs.map((job) => job.location));
  const roleCategories = uniqueOptions(allJobs.map((job) => job.roleCategory));
  const activeView = params.view ?? "";

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">תיבת משרות</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">בדיקת משרות והכנת הגשות</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-100">
          רשימת בדיקה יומית נקייה. פתח קודם התאמות חזקות, בדוק ידנית משרות מסוכנות, והעבר חסומות לארכיון.
        </p>
        {params.deleted ? (
          <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">המשרה נמחקה מקומית.</div>
        ) : null}
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">סינון מהיר</h3>
        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          <Link href="/jobs" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${activeView ? "border-white/20 text-ink-100 hover:border-aqua-400/50 hover:text-aqua-400" : "border-aqua-400 bg-aqua-400 text-navy-950"}`}>
            כל המשרות
          </Link>
          {quickViews.map(([label, view, helper]) => (
            <Link key={view} href={`/jobs?view=${view}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${activeView === view ? "border-aqua-400 bg-aqua-400 text-navy-950" : "border-white/20 text-ink-100 hover:border-aqua-400/50 hover:text-aqua-400"}`}>
              {label} <span className={activeView === view ? "text-navy-950" : "text-ink-400"}>{helper}</span>
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">הדבק תיאור משרה</h3>
        <p className="mt-2 text-sm text-ink-200">הדבק תיאור משרה, הוסף פרטים בסיסיים, ואז שמור והרץ ולידציה.</p>
        <form action={createJob} className="mt-5 grid min-w-0 gap-4">
          <label className="block min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">תיאור משרה</span>
            <textarea dir="auto" className="mt-2 min-h-64 w-full min-w-0 rounded-lg border border-aqua-400/30 bg-navy-950/60 p-4 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" name="rawDescription" required />
          </label>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {[
              ["כותרת", "title", true],
              ["מקור", "source", true],
              ["חברה", "company", false],
              ["URL מקור", "sourceUrl", false],
              ["מיקום", "location", false],
              ["שפה", "language", false],
              ["קטגוריית תפקיד", "roleCategory", false],
              ["טקסט שכר", "salaryText", false]
            ].map(([label, name, required]) => (
              <label key={name as string} className="block min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label as string}</span>
                <input className={inputClass} name={name as string} required={Boolean(required)} />
              </label>
            ))}
          </div>
          <div><NeonButton className="border-aqua-400 bg-aqua-400 text-navy-950 hover:bg-aqua-500">שמור והרץ ולידציה</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מסננים</h3>
        <form className="mt-5 grid min-w-0 gap-4" action="/jobs">
          {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
          <div className="grid min-w-0 gap-4 md:grid-cols-3">
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">חיפוש</span>
              <input name="q" defaultValue={params.q ?? ""} className={inputClass} />
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">ולידציה</span>
              <select name="validationStatus" defaultValue={params.validationStatus ?? ""} className={inputClass}>
                <option value="">הכל</option>
                {validationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סטטוס</span>
              <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
                <option value="">הכל</option>
                {JOB_STATUSES.map((status) => <option key={status} value={status}>{jobStatusLabels[status]}</option>)}
              </select>
            </label>
            {[
              ["מקור", "source", sources],
              ["שפה", "language", languages],
              ["מיקום", "location", locations],
              ["קטגוריית תפקיד", "roleCategory", roleCategories]
            ].map(([label, name, options]) => (
              <label key={name as string} className="min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label as string}</span>
                <select name={name as string} defaultValue={params[name as string] ?? ""} className={inputClass}>
                  <option value="">הכל</option>
                  {(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">מיון</span>
              <select name="sort" defaultValue={normalizeJobSort(params.sort)} className={inputClass}>
                <option value="updated">עודכנו לאחרונה</option>
                <option value="newest">חדשות קודם</option>
                <option value="oldest">ישנות קודם</option>
                <option value="company">חברה A-Z</option>
                <option value="title">כותרת A-Z</option>
                <option value="validation">סטטוס ולידציה</option>
                <option value="status">סטטוס משרה</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <NeonButton>החל מסננים</NeonButton>
            {activeFilters ? (
              <Link href="/jobs" className="inline-flex min-h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-ink-100">
                נקה מסננים
              </Link>
            ) : null}
          </div>
          {activeFilters ? <p className="text-sm text-aqua-400">מסננים פעילים. מוצגות {jobs.length} מתוך {allJobs.length} משרות.</p> : null}
        </form>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">משרות מקומיות</h3>
          <span className="text-sm text-ink-400">{jobs.length} מוצגות / {allJobs.length} שמורות</span>
        </div>
        <div className="mt-5 grid min-w-0 gap-4">
          {jobs.map((job) => {
            const allowedCount = jsonToStringArray(job.allowedSignals).length;
            const forbiddenCount = jsonToStringArray(job.forbiddenFlags).length;
            const riskPreview = forbiddenCount > 0 ? jsonToStringArray(job.forbiddenFlags)[0] : job.riskNotes?.split(/\r?\n/)[0];
            return (
              <article key={job.id} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.09] p-5 shadow-sm transition hover:border-aqua-400/50 hover:bg-white/[0.12]">
                <div className="flex min-w-0 flex-wrap items-start gap-4">
                  <div dir="ltr" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-aqua-400/30 bg-aqua-400/10 text-sm font-bold text-aqua-400">
                    {companyInitials(job.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link dir="auto" href={`/jobs/${job.id}`} className="break-words text-2xl font-semibold text-white hover:text-aqua-400">{job.title}</Link>
                        <div dir="auto" className="mt-1 break-words text-base font-semibold text-ink-100">{job.company ?? "חברה לא ידועה"}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
                        <StatusBadge status={job.status} />
                        <PriorityBadge priority={job.priority} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-200">
                      <span dir="auto" className="break-words">{job.location ?? "מיקום לא צוין"}</span>
                      <span className="font-semibold text-ink-100">{readinessContext(job.validationStatus, job.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 rounded-lg border border-white/20 bg-navy-950/40 p-3 text-sm text-ink-200 sm:grid-cols-4">
                  <div><span className="text-ink-400">סימנים</span><div className="mt-1 text-white">{allowedCount}</div></div>
                  <div><span className="text-ink-400">דגלים</span><div className={forbiddenCount > 0 ? "mt-1 text-signal-red" : "mt-1 text-white"}>{forbiddenCount}</div></div>
                  <div><span className="text-ink-400">פעולה הבאה</span><div className="mt-1 text-white">{job.nextActionAt ? job.nextActionAt.toLocaleDateString("he-IL") : "לא נקבע"}</div></div>
                  <div><span className="text-ink-400">עודכן</span><div className="mt-1 text-white">{job.updatedAt.toLocaleDateString("he-IL")}</div></div>
                </div>
                {riskPreview ? (
                  <p dir="auto" className={`mt-3 line-clamp-2 break-words rounded-lg border p-3 text-sm ${forbiddenCount > 0 ? "border-signal-red/30 bg-signal-red/10 text-signal-red" : "border-white/20 bg-navy-950/40 text-ink-100"}`}>
                    {forbiddenCount > 0 ? "חסום: " : "בדיקה ידנית: "}{riskPreview}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/jobs/${job.id}/application`} className="rounded-lg border border-aqua-400 bg-aqua-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">הכן הגשה</Link>
                  <Link href={`/jobs/${job.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-ink-100">פרטים</Link>
                  <Link href={`/jobs/${job.id}/edit`} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-ink-100">עריכה</Link>
                  <form action={archiveJob}>
                    <input type="hidden" name="id" value={job.id} />
                    <button className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-ink-100">ארכיון</button>
                  </form>
                </div>
              </article>
            );
          })}
          {jobs.length === 0 ? <p className="py-4 text-sm text-ink-400">אין משרות שתואמות למסננים.</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}
