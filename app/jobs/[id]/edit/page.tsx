import Link from "next/link";
import { updateJob } from "@/app/jobs/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { db } from "@/lib/db";

function Field({
  label,
  name,
  defaultValue,
  required = false
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    </label>
  );
}

export default async function EditJobPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id } });

  if (!job) {
    return (
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-signal-red">עריכת משרה</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">המשרה לא נמצאה</h2>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="min-w-0 overflow-hidden">
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">עריכת משרה</p>
      <h2 dir="auto" className="mt-3 break-words text-3xl font-semibold text-white">{job.title}</h2>
      <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
        שמירה מריצה validation דטרמיניסטי מחדש ושומרת אירוע JOB_UPDATED.
      </p>

      <form action={updateJob} className="mt-6 grid min-w-0 gap-4">
        <input type="hidden" name="id" value={job.id} />
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Field label="כותרת" name="title" defaultValue={job.title} required />
          <Field label="חברה" name="company" defaultValue={job.company} />
          <Field label="מקור" name="source" defaultValue={job.source} required />
          <Field label="Source URL" name="sourceUrl" defaultValue={job.sourceUrl} />
          <Field label="מיקום" name="location" defaultValue={job.location} />
          <Field label="שפה" name="language" defaultValue={job.language} />
          <Field label="קטגוריית תפקיד" name="roleCategory" defaultValue={job.roleCategory} />
          <Field label="טקסט שכר" name="salaryText" defaultValue={job.salaryText} />
        </div>
        <label className="block min-w-0">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-400">תיאור משרה גולמי</span>
          <textarea
            dir="auto"
            className="mt-2 min-h-48 w-full min-w-0 rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
            name="rawDescription"
            defaultValue={job.rawDescription}
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NeonButton>שמור שינויים</NeonButton>
          <Link href={`/jobs/${job.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ink-200">
            ביטול
          </Link>
        </div>
      </form>
    </GlassCard>
  );
}
