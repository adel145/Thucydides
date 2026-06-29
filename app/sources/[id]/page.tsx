import Link from "next/link";
import { notFound } from "next/navigation";
import { createProfileSourceLink, deleteProfileSourceLink, deleteSourceRecord, updateSourceRecord } from "@/app/sources/actions";
import { DangerButton } from "@/components/ui/DangerButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { getProfileSourceTargetField, getRecommendedTargetFields, PROFILE_SOURCE_TARGET_FIELDS } from "@/lib/profile/profileSourceLinks";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";
import { formatFileSize } from "@/lib/sources/sourceUploads";

export default async function SourceDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; deleteError?: string; linked?: string; unlinked?: string; linkError?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const source = await db.sourceFile.findUnique({
    where: { id },
    include: { profileLinks: { orderBy: { updatedAt: "desc" } } }
  });
  if (!source) notFound();
  const profile = await db.candidateProfile.findFirst({ orderBy: { createdAt: "asc" } });
  const recommendedFields = getRecommendedTargetFields(source.type);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Source Detail / Evidence / הוכחה</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{source.filename}</h2>
        <p className="mt-3 text-sm leading-6 text-ink-200">
          Review one manual evidence source. Files stay local, links stay as URLs, and nothing is parsed, scraped, or linked automatically.
        </p>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Source saved.</div> : null}
        {notices?.linked ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Evidence link saved.</div> : null}
        {notices?.unlinked ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Evidence link removed.</div> : null}
        {notices?.linkError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Choose a valid profile field.</div> : null}
        {notices?.deleteError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">Type DELETE to remove this source.</div> : null}
      </GlassCard>

      {source.path ? (
        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Local file</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Stored path</div>
              <div className="mt-2 break-all text-sm text-white">{source.path}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">File size</div>
              <div className="mt-2 text-sm text-white">{formatFileSize(source.uploadSizeBytes)}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">MIME type</div>
              <div className="mt-2 text-sm text-white">{source.uploadMimeType ?? "Unknown"}</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-400">This file is only stored locally. Text content is not extracted automatically.</p>
        </GlassCard>
      ) : null}

      {source.url ? (
        <GlassCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Source link</h3>
              <p className="mt-2 max-w-3xl break-all text-sm leading-6 text-ink-100">{source.url}</p>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-aqua-400 bg-aqua-400 px-4 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
              Open source link
            </a>
          </div>
          <p className="mt-3 text-sm text-ink-400">Opening the link is manual. Thucydides does not fetch, scrape, or read this URL.</p>
        </GlassCard>
      ) : null}

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Link this source to Profile</h3>
        <p className="mt-3 text-sm leading-6 text-ink-200">
          This is a manual evidence link / הוכחה. No parsing or automatic profile update happens here. Adel chooses what this source supports.
        </p>
        <div className="mt-4 rounded-lg border border-white/20 bg-white/[0.07] p-3 text-sm text-ink-100">
          Source type: <span className="font-semibold text-white">{sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}</span>
          <div className="mt-2 text-xs text-ink-400">
            Recommended: {recommendedFields.map((field) => field.label).join(", ") || "Source notes"}
          </div>
        </div>
        {profile ? (
          <form action={createProfileSourceLink} className="mt-5 grid gap-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="sourceId" value={source.id} />
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Profile field</span>
              <select name="targetField" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70">
                {PROFILE_SOURCE_TARGET_FIELDS.map((field) => (
                  <option key={field.key} value={field.key}>{field.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Evidence note</span>
              <input name="note" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <div><NeonButton className="border-aqua-400 bg-aqua-400 text-navy-950 hover:bg-aqua-500">Create evidence link / הוכחה</NeonButton></div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink-400">Create a profile before linking evidence.</p>
        )}

        <div className="mt-6 grid gap-3">
          <h4 className="font-semibold text-white">Existing links for this source</h4>
          {source.profileLinks.length === 0 ? <p className="text-sm text-ink-400">No profile evidence links yet.</p> : null}
          {source.profileLinks.map((link) => {
            const field = getProfileSourceTargetField(link.targetField);
            return (
              <div key={link.id} className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{field?.label ?? link.targetField}</div>
                    {link.note ? <p className="mt-1 text-sm text-ink-200">{link.note}</p> : null}
                  </div>
                  <form action={deleteProfileSourceLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-ink-200">Unlink</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
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
