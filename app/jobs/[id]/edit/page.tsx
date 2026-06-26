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
    <label className="block">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <input
        className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
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
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-signal-red">Edit Job</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Job not found</h2>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Edit Job</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{job.title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Saving reruns deterministic validation and records a `JOB_UPDATED` event.
      </p>

      <form action={updateJob} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={job.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" name="title" defaultValue={job.title} required />
          <Field label="Company" name="company" defaultValue={job.company} />
          <Field label="Source" name="source" defaultValue={job.source} required />
          <Field label="Source URL" name="sourceUrl" defaultValue={job.sourceUrl} />
          <Field label="Location" name="location" defaultValue={job.location} />
          <Field label="Language" name="language" defaultValue={job.language} />
          <Field label="Role category" name="roleCategory" defaultValue={job.roleCategory} />
          <Field label="Salary text" name="salaryText" defaultValue={job.salaryText} />
        </div>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Raw job description</span>
          <textarea
            className="mt-2 min-h-48 w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none transition focus:border-aqua-400/70 focus:shadow-glow"
            name="rawDescription"
            defaultValue={job.rawDescription}
            required
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <NeonButton>Save changes</NeonButton>
          <Link href={`/jobs/${job.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-ink-200">
            Cancel
          </Link>
        </div>
      </form>
    </GlassCard>
  );
}
