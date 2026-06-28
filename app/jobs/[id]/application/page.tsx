import Link from "next/link";
import { notFound } from "next/navigation";
import { saveApplicationPacket, markApplicationPacketReady } from "@/app/jobs/[id]/application/actions";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { APPLICATION_DECISIONS, APPLICATION_PACKET_STATUSES, CV_LANGUAGES, buildApplicationPacketSummary } from "@/lib/applications/applicationPacket";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { getProfileSourceTargetField, summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";
import { sourceTypeLabels } from "@/lib/sources/sourceTypes";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function FieldTextArea({ label, name, value, min = "min-h-28" }: { label: string; name: string; value?: string | null; min?: string }) {
  return (
    <label>
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <textarea name={name} defaultValue={value ?? ""} className={`mt-2 ${min} w-full rounded-lg border border-white/10 bg-navy-950/70 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70`} />
    </label>
  );
}

export default async function ApplicationPacketPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; ready?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const job = await db.job.findUnique({
    where: { id },
    include: { applicationPacket: true }
  });
  if (!job) notFound();

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: { include: { source: true }, orderBy: { updatedAt: "desc" } } }
  });
  const sources = await db.sourceFile.findMany({ orderBy: { updatedAt: "desc" } });
  const packet = job.applicationPacket;
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], packet ?? {});
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const forbiddenFlags = jsonToStringArray(job.forbiddenFlags);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Application Packet</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{job.title}</h2>
            <p className="mt-2 text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "No metadata"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Manual workspace. No AI generated this. Nothing is sent automatically. Use this page to prepare before applying.
        </p>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Application packet saved locally.</div> : null}
        {notices?.ready ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Application packet marked ready.</div> : null}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Packet readiness</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Decision</div>
              <div className="mt-2 font-semibold text-white">{packet?.applicationDecision ?? summary.applicationDecision}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">CV language</div>
              <div className="mt-2 font-semibold text-white">{packet?.cvLanguage ?? summary.cvLanguage}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Checklist</div>
              <div className="mt-2 font-semibold text-white">{summary.readyCount} / {summary.totalCount}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {summary.checklist.map((item) => (
              <div key={item.label} className={`rounded-lg border p-3 text-sm ${item.done ? "border-aqua-400/30 bg-aqua-400/10 text-ink-100" : "border-signal-red/30 bg-signal-red/10 text-ink-100"}`}>
                <span className="font-semibold">{item.done ? "Done" : "Missing"}:</span> {item.label}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Save packet fields</h3>
          <form action={saveApplicationPacket} className="mt-5 grid gap-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Packet status</span>
                <select name="status" defaultValue={packet?.status ?? "DRAFT"} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                  {APPLICATION_PACKET_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">CV language</span>
                <select name="cvLanguage" defaultValue={packet?.cvLanguage ?? summary.cvLanguage} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                  {CV_LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Decision</span>
                <select name="applicationDecision" defaultValue={packet?.applicationDecision ?? summary.applicationDecision} className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-navy-950/70 px-3 text-sm text-white">
                  {APPLICATION_DECISIONS.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
                </select>
              </label>
            </div>
            <FieldTextArea label="CV tailoring notes" name="cvTailoringNotes" value={packet?.cvTailoringNotes} />
            <FieldTextArea label="Skills to highlight" name="skillsToHighlight" value={packet?.skillsToHighlight} />
            <FieldTextArea label="Experience bullets draft" name="experienceBulletsDraft" value={packet?.experienceBulletsDraft} min="min-h-36" />
            <FieldTextArea label="Cover letter / cover note draft" name="coverLetterDraft" value={packet?.coverLetterDraft} min="min-h-36" />
            <FieldTextArea label="Recruiter message draft" name="recruiterMessageDraft" value={packet?.recruiterMessageDraft} />
            <FieldTextArea label="Follow-up plan" name="followUpPlan" value={packet?.followUpPlan} />
            <div><NeonButton>Save packet</NeonButton></div>
          </form>
          {packet ? (
            <form action={markApplicationPacketReady} className="mt-3">
              <input type="hidden" name="jobId" value={job.id} />
              <NeonButton className="border-white/20 text-ink-100">Mark ready</NeonButton>
            </form>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Profile evidence</h3>
        <div className="mt-4 grid gap-3">
          {Object.entries(evidence.grouped).map(([targetField, links]) => {
            const field = getProfileSourceTargetField(targetField);
            return (
              <div key={targetField} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="font-semibold text-white">{field?.label ?? targetField} ({links.length})</div>
                <div className="mt-2 grid gap-2 text-sm text-ink-200">
                  {links.length === 0 ? <p className="text-ink-400">No linked evidence.</p> : null}
                  {links.map((link) => (
                    <Link key={link.id} href={`/sources/${link.sourceId}`} className="rounded-lg border border-white/10 bg-navy-950/50 p-2">
                      {link.source.filename} | {sourceTypeLabels[link.source.type as keyof typeof sourceTypeLabels] ?? link.source.type}
                      {link.note ? ` | ${link.note}` : ""}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Risks and blockers</h3>
        <div className="mt-4 grid gap-3 text-sm text-ink-200">
          {forbiddenFlags.length > 0 ? <div className="rounded-lg border border-signal-red/30 bg-signal-red/10 p-3">Forbidden flags: {forbiddenFlags.join(", ")}</div> : null}
          {job.riskNotes ? <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 whitespace-pre-wrap">{job.riskNotes}</div> : null}
          {forbiddenFlags.length === 0 && !job.riskNotes ? <p className="text-ink-400">No stored risk notes or forbidden flags.</p> : null}
        </div>
      </GlassCard>

      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-aqua-400">Back to job detail</Link>
    </div>
  );
}
