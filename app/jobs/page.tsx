import Link from "next/link";
import { archiveJob, createJob } from "@/app/jobs/actions";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { filterJobs, hasActiveJobFilters, normalizeJobSort } from "@/lib/jobs/jobFilters";
import { JOB_STATUSES, jobStatusLabels } from "@/lib/jobs/jobStatus";

const validationStatuses = ["ALLOWED", "RISKY", "FORBIDDEN", "UNREVIEWED"];

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

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Job Inbox</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Search, filter, and intake local jobs</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Search and filters are applied from query params against local SQLite data. Manual job creation still reruns deterministic validation.
        </p>
        {params.deleted ? (
          <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Job deleted locally.</div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Filters</h3>
        <form className="mt-5 grid gap-4" action="/jobs">
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
        <h3 className="text-xl font-semibold text-white">Add manual job</h3>
        <form action={createJob} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Title", "title"],
              ["Company", "company"],
              ["Source", "source"],
              ["Source URL", "sourceUrl"],
              ["Location", "location"],
              ["Language", "language"],
              ["Role category", "roleCategory"],
              ["Salary text", "salaryText"]
            ].map(([label, name]) => (
              <label key={name} className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
                <input className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" name={name} required={name === "title" || name === "source"} />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Raw job description</span>
            <textarea className="mt-2 min-h-40 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" name="rawDescription" required />
          </label>
          <div><NeonButton>Save and validate job</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Local jobs</h3>
          <span className="text-sm text-ink-400">{jobs.length} shown / {allJobs.length} stored</span>
        </div>
        <div className="mt-5 divide-y divide-white/10">
          {jobs.map((job) => {
            const allowedCount = jsonToStringArray(job.allowedSignals).length;
            const forbiddenCount = jsonToStringArray(job.forbiddenFlags).length;
            return (
              <div key={job.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link href={`/jobs/${job.id}`} className="font-semibold text-white hover:text-aqua-400">{job.title}</Link>
                    <div className="mt-1 text-sm text-ink-200">{[job.company, job.location, job.source].filter(Boolean).join(" | ") || "No metadata"}</div>
                    <div className="mt-2 text-xs text-ink-400">Created {job.createdAt.toLocaleDateString()} | Updated {job.updatedAt.toLocaleDateString()} | Signals {allowedCount} | Flags {forbiddenCount}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={job.status} />
                    <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/jobs/${job.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Details</Link>
                  <Link href={`/jobs/${job.id}/edit`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Edit</Link>
                  <form action={archiveJob}>
                    <input type="hidden" name="id" value={job.id} />
                    <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Archive</button>
                  </form>
                </div>
              </div>
            );
          })}
          {jobs.length === 0 ? <p className="py-4 text-sm text-ink-400">No jobs match the current filters.</p> : null}
        </div>
      </GlassCard>
    </div>
  );
}
