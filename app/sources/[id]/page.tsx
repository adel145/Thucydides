import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSourceRecord, updateSourceRecord } from "@/app/sources/actions";
import { DangerButton } from "@/components/ui/DangerButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";

export default async function SourceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; deleteError?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const source = await db.sourceFile.findUnique({ where: { id } });
  if (!source) notFound();

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Source Detail</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{source.filename}</h2>
        <p className="mt-3 text-sm leading-6 text-ink-200">
          Edit manual source data only. No file upload parsing or automatic profile linking happens here.
        </p>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Source saved.</div> : null}
        {notices?.deleteError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Type DELETE to remove this source.</div> : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Edit source</h3>
        <form action={updateSourceRecord} className="mt-5 grid gap-4">
          <input type="hidden" name="id" value={source.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Title / filename</span>
              <input name="filename" defaultValue={source.filename} required className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Type</span>
              <select name="type" defaultValue={source.type} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70">
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Path</span>
              <input name="path" defaultValue={source.path ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">URL</span>
              <input name="url" defaultValue={source.url ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
          </div>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Pasted text content</span>
            <textarea name="extractedText" defaultValue={source.extractedText ?? ""} className="mt-2 min-h-52 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes</span>
            <textarea name="notes" defaultValue={source.notes ?? ""} className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <div className="flex flex-wrap gap-3">
            <NeonButton>Save source</NeonButton>
            <Link href="/sources" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-ink-200">
              Back to Sources
            </Link>
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Delete source</h3>
        <p className="mt-3 text-sm text-ink-200">This only removes the local source record. Type DELETE to confirm.</p>
        <form action={deleteSourceRecord} className="mt-4 flex flex-wrap gap-3">
          <input type="hidden" name="id" value={source.id} />
          <input name="confirmText" placeholder="Type DELETE" className="min-h-10 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-signal-red/70" />
          <DangerButton>Delete source</DangerButton>
        </form>
      </GlassCard>
    </div>
  );
}
