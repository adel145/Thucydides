import Link from "next/link";
import { createSourceLinkRecord, createSourceRecord, uploadSourceFile } from "@/app/sources/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";
import { SOURCE_TYPES, sourceTypeLabels } from "@/lib/sources/sourceTypes";
import { formatFileSize } from "@/lib/sources/sourceUploads";

const linkSourceTypes = ["LINKEDIN_TEXT", "GITHUB_PROJECTS", "PORTFOLIO", "CERTIFICATE", "ACADEMIC_DOCUMENT", "OTHER"] as const;

const inputClass = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white outline-none focus:border-aqua-400/70";
const textAreaClass = "mt-2 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70";
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
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Sources / Evidence / הוכחות</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">הוסף קבצים, קישורים והערות שאפשר לסמוך עליהם</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-100">
          שמור CV, תעודות, מסמכים אקדמיים, LinkedIn, GitHub, Portfolio וטקסט ידני. אין parsing, אין scraping, ואין שליחה ל-OpenAI.
        </p>
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
          {[
            ["העלאת קבצים", "CV, תעודות, מסמכים אקדמיים"],
            ["הוספת קישורים", "LinkedIn, GitHub, Portfolio, קורסים"],
            ["הדבקת טקסט", "טקסט מועתק והערות ראיה ידניות"]
          ].map(([title, body]) => (
            <div key={title} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.07] p-3">
              <div className="break-words font-semibold text-white">{title}</div>
              <p className="mt-1 break-words text-sm text-ink-200">{body}</p>
            </div>
          ))}
        </div>
        {notices?.uploaded ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">הקובץ נשמר כמקור מקומי ידני. לא חולץ ממנו טקסט.</div> : null}
        {notices?.linkedSource ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">מקור קישור נוסף לבדיקה ידנית.</div> : null}
        {notices?.uploadError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">בחר קובץ לפני העלאה.</div> : null}
        {notices?.linkSourceError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-signal-red">הוסף URL לפני שמירת קישור.</div> : null}
        {notices?.deleted ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">המקור נמחק מקומית.</div> : null}
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">מוכנות מקורות</h3>
          <span className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-sm text-ink-100">{readiness.readyCount} / {readiness.totalCount} מוכנים</span>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-4">
          {readiness.items.map((item) => (
            <div key={item.label} className={`min-w-0 overflow-hidden rounded-lg border p-3 ${item.ready ? "border-aqua-400/30 bg-aqua-400/10" : "border-signal-red/30 bg-signal-red/10"}`}>
              <div className="break-words font-semibold text-white">{item.label}</div>
              <p className="mt-2 break-words text-xs text-ink-200">{item.ready ? "מוכן" : item.note}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-xl font-semibold text-white">העלאת קובץ מקומי</h3>
          <p className="mt-2 break-words text-sm leading-6 text-ink-200">
            מתאים ל-CV, תעודות, מסמכים אקדמיים וקבצי פרויקט. הקובץ נשמר תחת local_uploads; אין חילוץ טקסט.
          </p>
          <form action={uploadSourceFile} className="mt-5 grid min-w-0 gap-4">
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">קובץ</span>
              <input name="file" type="file" required className={`${inputClass} py-2 file:ml-3 file:rounded-md file:border-0 file:bg-aqua-400 file:px-3 file:py-1 file:text-navy-950`} />
            </label>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סוג</span>
                <select name="type" defaultValue="CV" className={inputClass}>
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">כותרת תצוגה</span>
              <input dir="auto" name="filename" placeholder="אופציונלי; ברירת מחדל היא שם הקובץ" className={inputClass} />
              </label>
            </div>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות</span>
              <input dir="auto" name="notes" placeholder="מה הקובץ הזה אמור להוכיח" className={inputClass} />
            </label>
            <div><NeonButton className={primaryButtonClass}>העלה קובץ מקומי</NeonButton></div>
          </form>
        </GlassCard>

        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-xl font-semibold text-white">הוספת מקור קישור</h3>
          <p className="mt-2 break-words text-sm leading-6 text-ink-200">
            מתאים ל-LinkedIn, GitHub, Portfolio, אתר אישי, תעודה או קורס. האפליקציה שומרת את ה-URL בלבד.
          </p>
          <form action={createSourceLinkRecord} className="mt-5 grid min-w-0 gap-4">
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">כותרת</span>
                <input dir="auto" name="filename" required placeholder="LinkedIn profile, GitHub, portfolio..." className={inputClass} />
              </label>
              <label className="min-w-0">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סוג קישור</span>
                <select name="type" defaultValue="LINKEDIN_TEXT" className={inputClass}>
                  {linkSourceTypes.map((type) => (
                    <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">URL</span>
              <input dir="ltr" name="url" type="url" required placeholder="https://..." className={`${inputClass} text-left`} />
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות</span>
              <textarea dir="auto" name="notes" className={`${textAreaClass} min-h-24`} placeholder="למה הקישור חשוב ל-CV או להגשות" />
            </label>
            <div><NeonButton className={primaryButtonClass}>הוסף מקור קישור</NeonButton></div>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">הוספת טקסט מודבק / הערות</h3>
        <p className="mt-2 break-words text-sm leading-6 text-ink-200">
          מתאים לטקסט מ-LinkedIn, הערות פרויקט, קטעי CV או הערות חיפוש עבודה. זה אחסון ידני, לא parsing אוטומטי.
        </p>
        <form action={createSourceRecord} className="mt-5 grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">כותרת</span>
              <input dir="auto" name="filename" required className={inputClass} />
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סוג</span>
              <select name="type" className={inputClass}>
                {SOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{sourceTypeLabels[type]}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Path אופציונלי או סימוכין</span>
            <input dir="ltr" name="path" className={`${inputClass} text-left`} />
          </label>
          <label className="min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">תוכן טקסט מודבק</span>
            <textarea dir="auto" name="extractedText" className={`${textAreaClass} min-h-40`} />
          </label>
          <label className="min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות</span>
            <textarea dir="auto" name="notes" className={`${textAreaClass} min-h-24`} />
          </label>
          <div>
            <NeonButton>הוסף מקור טקסט</NeonButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">מקורות קיימים</h3>
          <span className="text-sm text-ink-400">{sources.length} רשומות</span>
        </div>
        {sources.length === 0 ? <p className="mt-4 text-sm text-ink-400">אין עדיין מקורות שמורים.</p> : null}
        <div className="mt-5 grid min-w-0 gap-4">
          {sources.map((source) => (
            <div key={source.id} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.07] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div dir="auto" className="break-words font-semibold text-white">{source.filename}</div>
                  <div className="mt-1 break-words text-sm text-ink-100">{sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}</div>
                </div>
                <Link href={`/sources/${source.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-ink-100 hover:border-aqua-400/50 hover:text-aqua-400">בדיקה</Link>
              </div>
              <div className="mt-3 grid min-w-0 gap-2 text-sm text-ink-100">
                {source.path ? <div dir="ltr" className="break-all text-left">Path: {source.path}</div> : null}
                {source.uploadSizeBytes ? <div className="break-words">קובץ: {formatFileSize(source.uploadSizeBytes)}{source.uploadMimeType ? ` | ${source.uploadMimeType}` : ""}</div> : null}
                {source.url ? (
                  <div className="break-all">
                    URL: <a dir="ltr" href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-aqua-400 hover:text-aqua-500">{source.url}</a>
                  </div>
                ) : null}
                {source.notes ? <div dir="auto" className="break-words">הערות: {source.notes}</div> : null}
                {source.extractedText ? <p dir="auto" className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-navy-950/60 p-3">{source.extractedText}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
