import Link from "next/link";
import { deleteJob } from "@/app/jobs/actions";
import { DangerButton } from "@/components/ui/DangerButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/lib/db";

export default async function DeleteJobPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id } });

  if (!job) {
    return (
      <GlassCard>
        <h2 className="text-3xl font-semibold text-white">Job not found</h2>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-signal-red">Confirm hard delete</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{job.title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Archive is safer and keeps the local history. Hard delete permanently removes this job and its event history from SQLite.
      </p>
      <form action={deleteJob} className="mt-6 grid gap-4">
        <input type="hidden" name="id" value={job.id} />
        <label>
          <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Confirmation</span>
          <input
            required
            pattern="DELETE"
            placeholder="Type DELETE"
            className="mt-2 min-h-11 w-full max-w-sm rounded-lg border border-signal-red/40 bg-navy-950/70 px-3 text-sm text-white outline-none focus:border-signal-red"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <DangerButton>Delete permanently</DangerButton>
          <Link href={`/jobs/${job.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-ink-200">
            Cancel
          </Link>
        </div>
      </form>
    </GlassCard>
  );
}
