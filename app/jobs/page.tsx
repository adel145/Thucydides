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
  ["Ready To Apply", "ready", "מוכן להגשה"],
  ["High Priority", "high-priority", "Priority"],
  ["Follow-up Due", "follow-up-due", "Next action"],
  ["Risky Review", "risky", "דורש בדיקה"],
  ["Forbidden / Archive Review", "forbidden", "חסם"]
] as const;

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
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
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Job Inbox</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Paste jobs and review cards</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Paste job descriptions for deterministic validation. Use the cards below to decide what is ready, risky, or blocked.
        </p>
        {params.deleted ? (
          <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Job deleted locally.</div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Quick review</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/jobs" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${activeView ? "border-white/10 text-ink-200" : "border-aqua-400/60 text-aqua-400"}`}>
            All jobs
          </Link>
          {quickViews.map(([label, view, hebrew]) => (
            <Link key={view} href={`/jobs?view=${view}`} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${activeView === view ? "border-aqua-400/60 text-aqua-400" : "border-white/10 text-ink-200"}`}>
              {label} <span className="text-ink-400">{hebrew}</span>
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Paste job description</h3>
        <p className="mt-2 text-sm text-ink-300">Paste job description, add basic metadata, then save and validate.</p>
        <form action={createJob} className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Job description</span>
            <textarea className="mt-2 min-h-64 w-full rounded-lg border border-aqua-400/30 bg-navy-950/70 p-4 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" name="rawDescription" required />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Title", "title", true],
              ["Source", "source", true],
              ["Company", "company", false],
              ["Source URL", "sourceUrl", false],
              ["Location", "location", false],
              ["Language", "language", false],
              ["Role category", "roleCategory", false],
              ["Salary text", "salaryText", false]
            ].map(([label, name, required]) => (
              <label key={name as string} className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label as string}</span>
                <input className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" name={name as string} required={Boolean(required)} />
              </label>
            ))}
          </div>
          <div><NeonButton>Save and validate job</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Filters</h3>
        <form className="mt-5 grid gap-4" action="/jobs">
          {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Search</span>
              <input name="q" defaultValue={params.q ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Validation</span>
              <select name="validationStatus" defaultValue={params.validationStatus ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                <option value="">Any</option>
                {validationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Status</span>
              <select name="status" defaultValue={params.status ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                <option value="">Any</option>
                {JOB_STATUSES.map((status) => <option key={status} value={status}>{jobStatusLabels[status]}</option>)}
              </select>
            </label>
            {[
              ["Source", "source", sources],
              ["Language", "language", languages],
              ["Location", "location", locations],
              ["Role category", "roleCategory", roleCategories]
            ].map(([label, name, options]) => (
              <label key={name as string}>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label as string}</span>
                <select name={name as string} defaultValue={params[name as string] ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                  <option value="">Any</option>
                  {(options as string[]).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Sort</span>
              <select name="sort" defaultValue={normalizeJobSort(params.sort)} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                <option value="updated">Updated recently</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company A-Z</option>
                <option value="title">Title A-Z</option>
                <option value="validation">Validation status</option>
                <option value="status">Job status</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <NeonButton>Apply filters</NeonButton>
            {activeFilters ? (
              <Link href="/jobs" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-ink-200">
                Clear filters
              </Link>
            ) : null}
          </div>
          {activeFilters ? <p className="text-sm text-aqua-400">Active filters are applied. Showing {jobs.length} of {allJobs.length} jobs.</p> : null}
        </form>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Local jobs</h3>
          <span className="text-sm text-ink-400">{jobs.length} shown / {allJobs.length} stored</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => {
            const allowedCount = jsonToStringArray(job.allowedSignals).length;
            const forbiddenCount = jsonToStringArray(job.forbiddenFlags).length;
            const riskPreview = forbiddenCount > 0 ? jsonToStringArray(job.forbiddenFlags)[0] : job.riskNotes?.split(/\r?\n/)[0];
            return (
              <article key={job.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-white hover:text-aqua-400">{job.title}</Link>
                    <div className="mt-1 text-sm text-ink-200">{[job.company, job.location, job.source].filter(Boolean).join(" | ") || "No metadata"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={job.status} />
                    <PriorityBadge priority={job.priority} />
                    <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-ink-200 sm:grid-cols-2">
                  <div>Signals: <span className="text-white">{allowedCount}</span></div>
                  <div>Flags: <span className={forbiddenCount > 0 ? "text-signal-red" : "text-white"}>{forbiddenCount}</span></div>
                  <div>Next: <span className="text-white">{job.nextActionAt ? job.nextActionAt.toLocaleDateString() : "not set"}</span></div>
                  <div>Updated: <span className="text-white">{job.updatedAt.toLocaleDateString()}</span></div>
                </div>
                {riskPreview ? (
                  <p className={`mt-3 line-clamp-2 rounded-lg border p-3 text-sm ${forbiddenCount > 0 ? "border-signal-red/30 bg-signal-red/10 text-signal-red" : "border-white/10 bg-navy-950/50 text-ink-200"}`}>
                    {forbiddenCount > 0 ? "Blocker חסם: " : "Risk דורש בדיקה: "}{riskPreview}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/jobs/${job.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Details</Link>
                  <Link href={`/jobs/${job.id}/edit`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Edit</Link>
                  <form action={archiveJob}>
                    <input type="hidden" name="id" value={job.id} />
                    <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Archive</button>
                  </form>
                </div>
              </article>
            );
          })}
          {jobs.length === 0 ? <p className="py-4 text-sm text-ink-400">No jobs match the current filters.</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}
