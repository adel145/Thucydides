import { createSourceRecord, deleteSourceRecord } from "@/app/sources/actions";
import { DangerButton } from "@/components/ui/DangerButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";

export default async function SourcesPage() {
  const sources = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Sources</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Manual source records and text intake</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Track CVs, LinkedIn text, GitHub projects, certificates, academic documents, and job-search notes locally. Phase 3 stores pasted text only; it does not parse uploaded files.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Add source record</h3>
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
        <div className="mt-5 grid gap-4">
          {sources.length === 0 ? <p className="text-sm text-ink-400">No source records yet.</p> : null}
          {sources.map((source) => (
            <div key={source.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{source.filename}</div>
                  <div className="mt-1 text-sm text-ink-200">{sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}</div>
                </div>
                <form action={deleteSourceRecord}>
                  <input type="hidden" name="id" value={source.id} />
                  <DangerButton>Delete source</DangerButton>
                </form>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-ink-200">
                {source.path ? <div>Path: {source.path}</div> : null}
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
