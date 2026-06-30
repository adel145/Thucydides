import Link from "next/link";
import { notFound } from "next/navigation";
import { createProfileSourceLinks, deleteProfileSourceLink, deleteSourceRecord, updateSourceRecord } from "@/app/sources/actions";
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
  const recommendedFieldKeys = new Set(recommendedFields.map((field) => field.key));
  const linkedTargetFields = new Set(source.profileLinks.map((link) => link.targetField));

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Source Detail / Evidence</p>
        <h2 dir="auto" className="mt-3 break-words text-3xl font-semibold text-white">{source.filename}</h2>
        <p className="mt-3 break-words text-sm leading-6 text-ink-200">
          בדיקת מקור ראיה ידני אחד. קבצים נשארים מקומיים, קישורים נשארים URLs, ושום דבר לא עובר parsing, scraping או קישור אוטומטי.
        </p>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">המקור נשמר.</div> : null}
        {notices?.linked ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">קישורי ראיות נשמרו. כפילויות דולגו.</div> : null}
        {notices?.unlinked ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">קישור ראיה הוסר.</div> : null}
        {notices?.linkError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">בחר לפחות שדה פרופיל חדש ותקין.</div> : null}
        {notices?.deleteError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">הקלד DELETE כדי להסיר את המקור.</div> : null}
      </GlassCard>

      {source.path ? (
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-xl font-semibold text-white">קובץ מקומי</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Path שמור</div>
              <div dir="ltr" className="mt-2 break-all text-left text-sm text-white">{source.path}</div>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">גודל קובץ</div>
              <div className="mt-2 text-sm text-white">{formatFileSize(source.uploadSizeBytes)}</div>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">MIME type</div>
              <div className="mt-2 text-sm text-white">{source.uploadMimeType ?? "Unknown"}</div>
            </div>
          </div>
          <p className="mt-3 break-words text-sm text-ink-400">הקובץ נשמר מקומית בלבד. תוכן טקסט לא מחולץ אוטומטית.</p>
        </GlassCard>
      ) : null}

      {source.url ? (
        <GlassCard className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white">קישור מקור</h3>
              <p dir="ltr" className="mt-2 max-w-3xl break-all text-left text-sm leading-6 text-ink-100">{source.url}</p>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-aqua-400 bg-aqua-400 px-5 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
              פתח קישור מקור
            </a>
          </div>
          <p className="mt-3 break-words text-sm text-ink-400">פתיחת הקישור ידנית. Thucydides לא מושך, לא עושה scraping ולא קורא את ה-URL.</p>
        </GlassCard>
      ) : null}

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">קישור ראיות לפרופיל</h3>
        <p className="mt-3 break-words text-sm leading-6 text-ink-200">
          ידני בלבד: בחר את שדות הפרופיל שהמקור תומך בהם, ואז שמור. זה לא מפרש קבצים, לא קורא קישורים ולא מעדכן טקסט בפרופיל.
        </p>
        <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-4 text-sm text-ink-100">
          <div className="font-semibold text-white">מומלץ למקור הזה</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendedFields.map((field) => (
              <span key={field.key} className="rounded-full border border-aqua-400/40 bg-aqua-400/10 px-3 py-1 text-xs font-semibold text-aqua-400">
                {field.label}
              </span>
            ))}
            {recommendedFields.length === 0 ? <span className="text-ink-400">הערות מקור</span> : null}
          </div>
        </div>
        {profile ? (
          <form action={createProfileSourceLinks} className="mt-5 grid gap-4">
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="sourceId" value={source.id} />
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">שדות פרופיל</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {PROFILE_SOURCE_TARGET_FIELDS.map((field) => {
                  const alreadyLinked = linkedTargetFields.has(field.key);
                  const recommended = recommendedFieldKeys.has(field.key);
                  return (
                    <label key={field.key} className={`rounded-lg border p-3 ${alreadyLinked ? "border-aqua-400/30 bg-aqua-400/10" : recommended ? "border-white/20 bg-white/[0.09]" : "border-white/10 bg-white/[0.04]"}`}>
                      <span className="flex items-start gap-3">
                        <input
                          name="targetFields"
                          type="checkbox"
                          value={field.key}
                          defaultChecked={recommended && !alreadyLinked}
                          disabled={alreadyLinked}
                          className="mt-1 h-4 w-4 accent-aqua-400"
                        />
                        <span>
                          <span className="font-semibold text-white">{field.label}</span>
                          {recommended ? <span className="mr-2 text-xs font-semibold text-aqua-400">מומלץ</span> : null}
                          {alreadyLinked ? <span className="mr-2 text-xs font-semibold text-aqua-400">כבר מקושר</span> : null}
                          <span className="mt-1 block text-xs leading-5 text-ink-400">{field.description}</span>
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערת ראיה</span>
              <input name="note" placeholder="הערה אופציונלית לכל שדה שנבחר" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <div><NeonButton className="min-h-12 border-aqua-400 bg-aqua-400 px-5 text-base text-navy-950 hover:bg-aqua-500">קשר ראיות</NeonButton></div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink-400">צור פרופיל לפני קישור ראיות.</p>
        )}

        <div className="mt-6 grid gap-3">
          <h4 className="font-semibold text-white">שדות מקושרים קיימים</h4>
          {source.profileLinks.length === 0 ? <p className="text-sm text-ink-400">אין עדיין קישורי ראיות לפרופיל.</p> : null}
          {source.profileLinks.map((link) => {
            const field = getProfileSourceTargetField(link.targetField);
            return (
              <div key={link.id} className="rounded-lg border border-white/20 bg-white/[0.07] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{field?.label ?? link.targetField}</div>
                    {link.note ? <p dir="auto" className="mt-1 break-words text-sm text-ink-200">{link.note}</p> : null}
                  </div>
                  <form action={deleteProfileSourceLink}>
                    <input type="hidden" name="id" value={link.id} />
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-ink-200">נתק</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">עריכת מקור</h3>
        <form action={updateSourceRecord} className="mt-5 grid gap-4">
          <input type="hidden" name="id" value={source.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">כותרת / שם קובץ</span>
              <input dir="auto" name="filename" defaultValue={source.filename} required className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סוג</span>
              <select name="type" defaultValue={source.type} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70">
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Path</span>
              <input dir="ltr" name="path" defaultValue={source.path ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-left text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">URL</span>
              <input dir="ltr" name="url" defaultValue={source.url ?? ""} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-left text-sm text-white outline-none focus:border-aqua-400/70" />
            </label>
          </div>
          <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">תוכן טקסט מודבק</span>
            <textarea dir="auto" name="extractedText" defaultValue={source.extractedText ?? ""} className="mt-2 min-h-52 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות</span>
            <textarea dir="auto" name="notes" defaultValue={source.notes ?? ""} className="mt-2 min-h-28 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <div className="flex flex-wrap gap-3">
            <NeonButton>שמור מקור</NeonButton>
            <Link href="/sources" className="inline-flex min-h-10 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-ink-200">
              חזרה ל-Sources
            </Link>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מחיקת מקור</h3>
        <p className="mt-3 break-words text-sm text-ink-200">זה מסיר רק את רשומת המקור המקומית. הקלד DELETE לאישור.</p>
        <form action={deleteSourceRecord} className="mt-4 flex flex-wrap gap-3">
          <input type="hidden" name="id" value={source.id} />
          <input name="confirmText" placeholder="Type DELETE" className="min-h-10 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-signal-red/70" />
          <DangerButton>מחק מקור</DangerButton>
        </form>
      </GlassCard>
    </div>
  );
}
