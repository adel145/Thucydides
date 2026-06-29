import Link from "next/link";
import { createSourceRecord, uploadSourceFile } from "@/app/sources/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";
import { formatFileSize } from "@/lib/sources/sourceUploads";

export default async function SourcesPage({
  searchParams
}: {
  searchParams?: Promise<{ uploaded?: string; uploadError?: string; deleted?: string }>;
}) {
  const notices = await searchParams;
  const sources = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const readiness = calculateSourceReadiness(sources);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Sources</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Manual source records and text intake</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Track CVs, LinkedIn text, GitHub projects, certificates, academic documents, and job-search notes locally. Uploads stay local and are not parsed.
        </p>
        {notices?.uploaded ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">File uploaded as a manual source record. No text was extracted.</div> : null}
        {notices?.uploadError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Choose a file before uploading.</div> : null}
        {notices?.deleted ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Source deleted locally.</div> : null}
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Source readiness</h3>
          <span className="text-sm text-ink-400">{readiness.readyCount} / {readiness.totalCount} ready</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {readiness.items.map((item) => (
            <div key={item.label} className={`rounded-lg border p-3 ${item.ready ? "border-aqua-400/30 bg-aqua-400/10" : "border-signal-red/30 bg-signal-red/10"}`}>
              <div className="font-semibold text-white">{item.label}</div>
              <p className="mt-2 text-xs text-ink-300">{item.ready ? "Recorded" : item.note}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Upload local source file</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">
          Store the file locally for review and manual evidence linking. No automatic parsing, extraction, or OpenAI file processing happens.
        </p>
        <form action={uploadSourceFile} encType="multipart/form-data" className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">File</span>
              <input name="file" type="file" required className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 py-2 text-sm text-white outline-none file:mr-3 file:rounded-md file:border-0 file:bg-aqua-400/20 file:px-3 file:py-1 file:text-aqua-400 focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Type</span>
              <select name="type" defaultValue="CV" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70">
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Display title</span>
              <input name="filename" placeholder="Optional; defaults to file name" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
              <input name="notes" placeholder="What this file should support" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
          </div>
          <div><NeonButton>Upload local file</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Add manual source record</h3>
        <form action={createSourceRecord} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Title / filename</span>
              <input name="filename" required className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Type</span>
              <select name="type" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70">
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Path</span>
              <input name="path" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">URL</span>
              <input name="url" className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
          </div>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Pasted text content</span>
            <textarea name="extractedText" className="mt-2 min-h-40 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm text-white outline-none focus:border-aqua-400/70" />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
            <textarea name="notes" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm text-white outline-none focus:border-aqua-400/70" />
          </label>
          <div>
            <NeonButton>Add source</NeonButton>
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
            <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{source.filename}</div>
                  <div className="mt-1 text-sm text-ink-200">{sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}</div>
                </div>
                <Link href={`/sources/${source.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Edit</Link>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-ink-200">
                {source.path ? <div>Path: {source.path}</div> : null}
                {source.uploadSizeBytes ? <div>File: {formatFileSize(source.uploadSizeBytes)}{source.uploadMimeType ? ` | ${source.uploadMimeType}` : ""}</div> : null}
                {source.url ? <div>URL: {source.url}</div> : null}
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
