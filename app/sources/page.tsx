import Link from "next/link";
import { createSourceLinkRecord, createSourceRecord, uploadSourceFile } from "@/app/sources/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";
import { formatFileSize } from "@/lib/sources/sourceUploads";

const linkSourceTypes = ["LINKEDIN_TEXT", "GITHUB_PROJECTS", "PORTFOLIO", "CERTIFICATE", "ACADEMIC_DOCUMENT", "OTHER"] as const;

const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70";
const textAreaClass = "mt-2 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70";
const primaryButtonClass = "border-aqua-400 bg-aqua-400 text-navy-950 hover:bg-aqua-500";

export default async function SourcesPage({
  searchParams
}: {
  searchParams?: Promise<{ uploaded?: string; uploadError?: string; deleted?: string; linkedSource?: string; linkSourceError?: string }>;
}) {
  const notices = await searchParams;
  const sources = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const readiness = calculateSourceReadiness(sources);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Sources / Evidence / הוכחה</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Add files, links, and notes Adel can trust</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-100">
          Upload files for CVs, certificates, and academic docs. Add links for LinkedIn, GitHub, portfolio, courses, or certificates. Paste text for copied profile details and job-search notes. Nothing is parsed, scraped, or sent to OpenAI.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["Upload files", "CV, certificates, academic docs"],
            ["Add links", "LinkedIn, GitHub, portfolio, courses"],
            ["Paste notes", "Copied text and manual evidence"]
          ].map(([title, body]) => (
            <div key={title} className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
              <div className="font-semibold text-white">{title}</div>
              <p className="mt-1 text-sm text-ink-200">{body}</p>
            </div>
          ))}
        </div>
        {notices?.uploaded ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">File uploaded as a local manual source. No text was extracted.</div> : null}
        {notices?.linkedSource ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Link source added for manual evidence review.</div> : null}
        {notices?.uploadError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Choose a file before uploading.</div> : null}
        {notices?.linkSourceError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Add a URL before saving a link source.</div> : null}
        {notices?.deleted ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Source deleted locally.</div> : null}
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Source readiness</h3>
          <span className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-sm text-ink-100">{readiness.readyCount} / {readiness.totalCount} ready / جاهز</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {readiness.items.map((item) => (
            <div key={item.label} className={`rounded-lg border p-3 ${item.ready ? "border-aqua-400/30 bg-aqua-400/10" : "border-signal-red/30 bg-signal-red/10"}`}>
              <div className="font-semibold text-white">{item.label}</div>
              <p className="mt-2 text-xs text-ink-200">{item.ready ? "Ready / جاهز" : item.note}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Upload local file</h3>
          <p className="mt-2 text-sm leading-6 text-ink-200">
            Best for CV files, certificates, academic documents, and project files. Stored under `local_uploads`; no parsing or extraction.
          </p>
          <form action={uploadSourceFile} encType="multipart/form-data" className="mt-5 grid gap-4">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">File</span>
              <input name="file" type="file" required className={`${inputClass} py-2 file:mr-3 file:rounded-md file:border-0 file:bg-aqua-400 file:px-3 file:py-1 file:text-navy-950`} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Type</span>
                <select name="type" defaultValue="CV" className={inputClass}>
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Display title</span>
                <input name="filename" placeholder="Optional; defaults to file name" className={inputClass} />
              </label>
            </div>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
              <input name="notes" placeholder="What this file should prove" className={inputClass} />
            </label>
            <div><NeonButton className={primaryButtonClass}>Upload local file</NeonButton></div>
          </form>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Add profile/link source</h3>
          <p className="mt-2 text-sm leading-6 text-ink-200">
            Use this for LinkedIn, GitHub, portfolio, personal website, certificate/course URLs, or another career link. The app records the URL only.
          </p>
          <form action={createSourceLinkRecord} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Title</span>
                <input name="filename" required placeholder="LinkedIn profile, GitHub, portfolio..." className={inputClass} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Link type</span>
                <select name="type" defaultValue="LINKEDIN_TEXT" className={inputClass}>
                  {linkSourceTypes.map((type) => (
                    <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">URL</span>
              <input name="url" type="url" required placeholder="https://..." className={inputClass} />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
              <textarea name="notes" className={`${textAreaClass} min-h-24`} placeholder="Why this link matters for CV or job applications" />
            </label>
            <div><NeonButton className={primaryButtonClass}>Add link source</NeonButton></div>
          </form>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Add pasted text / notes source</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">
          Use this for copied LinkedIn text, project notes, CV snippets, or job-search notes. It is manual text storage, not automatic parsing.
        </p>
        <form action={createSourceRecord} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Title</span>
              <input name="filename" required className={inputClass} />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Type</span>
              <select name="type" className={inputClass}>
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Optional source path or note reference</span>
            <input name="path" className={inputClass} />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Pasted text content</span>
            <textarea name="extractedText" className={`${textAreaClass} min-h-40`} />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
            <textarea name="notes" className={`${textAreaClass} min-h-24`} />
          </label>
          <div>
            <NeonButton>Add pasted text source</NeonButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Existing sources</h3>
          <span className="text-sm text-ink-400">{sources.length} records</span>
        </div>
        {sources.length === 0 ? <p className="mt-4 text-sm text-ink-400">No source records yet.</p> : null}
        <div className="mt-5 grid gap-4">
          {sources.map((source) => (
            <div key={source.id} className="rounded-lg border border-white/20 bg-white/[0.07] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{source.filename}</div>
                  <div className="mt-1 text-sm text-ink-100">{sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}</div>
                </div>
                <Link href={`/sources/${source.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-ink-100 hover:border-aqua-400/50 hover:text-aqua-400">Review</Link>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-ink-100">
                {source.path ? <div className="break-all">Path: {source.path}</div> : null}
                {source.uploadSizeBytes ? <div>File: {formatFileSize(source.uploadSizeBytes)}{source.uploadMimeType ? ` | ${source.uploadMimeType}` : ""}</div> : null}
                {source.url ? (
                  <div className="break-all">
                    URL: <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-aqua-400 hover:text-aqua-500">{source.url}</a>
                  </div>
                ) : null}
                {source.notes ? <div>Notes: {source.notes}</div> : null}
                {source.extractedText ? <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-navy-950/60 p-3">{source.extractedText}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
