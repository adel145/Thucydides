import Link from "next/link";
import { notFound } from "next/navigation";
import { generateApplicationAiDraft, saveAiDraftToPacket, saveApplicationPacket, markApplicationPacketReady } from "@/app/jobs/[id]/application/actions";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { canRequestApplicationAiDraft, validateApplicationDraftOutput } from "@/lib/ai/applicationDrafting";
import { getOpenAiDraftingConfig } from "@/lib/ai/openaiClient";
import { APPLICATION_DECISIONS, APPLICATION_PACKET_STATUSES, CV_LANGUAGES, buildApplicationPacketSummary, canMarkApplicationPacketReady } from "@/lib/applications/applicationPacket";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { getProfileSourceTargetField, summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";
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
      <textarea name={name} defaultValue={value ?? ""} className={`mt-2 ${min} w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70`} />
    </label>
  );
}

export default async function ApplicationPacketPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; ready?: string; readyBlocked?: string; packetMissing?: string; aiDisabled?: string; aiBlocked?: string; aiDraft?: string; aiSaved?: string; aiError?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const job = await db.job.findUnique({
    where: { id },
    include: { applicationPacket: { include: { aiDraftRuns: { orderBy: { createdAt: "desc" }, take: 3 } } } }
  });
  if (!job) notFound();

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: { include: { source: true }, orderBy: { updatedAt: "desc" } } }
  });
  const sources = await db.sourceFile.findMany({ orderBy: { updatedAt: "desc" } });
  const packet = job.applicationPacket;
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], packet ?? {});
  const canMarkReady = canMarkApplicationPacketReady(summary);
  const aiConfig = getOpenAiDraftingConfig();
  const canRequestAiDraft = aiConfig.enabled && canRequestApplicationAiDraft(job);
  const latestAiRun = packet?.aiDraftRuns[0];
  const latestAiOutput = validateApplicationDraftOutput(latestAiRun?.output);
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const sourceReadiness = calculateSourceReadiness(sources);
  const forbiddenFlags = jsonToStringArray(job.forbiddenFlags);
  const missingEvidenceFields = summary.profileEvidenceSummary.fieldsMissingEvidence
    .map((field) => getProfileSourceTargetField(field))
    .filter((field): field is NonNullable<typeof field> => Boolean(field));
  const blockingItems = summary.checklist.filter((item) => item.critical && !item.done);
  const savedDecision = packet?.applicationDecision ?? summary.applicationDecision;
  const savedLanguage = packet?.cvLanguage ?? summary.cvLanguage;

  return (
    <div className="grid gap-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Application prep / جهّز الطلب</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Prepare application packet</h2>
            <p className="mt-2 text-lg font-semibold text-ink-100">{job.title}</p>
            <p className="mt-1 text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "No metadata"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Manual workspace for one job. Review evidence, edit packet fields, and keep everything under Adel confirmation. Nothing is sent automatically.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-aqua-400">Recommendation</div>
            <div className="mt-2 text-lg font-semibold text-white">{savedDecision}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Packet status</div>
            <div className="mt-2 text-lg font-semibold text-white">{packet?.status ?? "DRAFT"}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">CV language</div>
            <div className="mt-2 text-lg font-semibold text-white">{savedLanguage}</div>
          </div>
        </div>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Application packet saved locally.</div> : null}
        {notices?.ready ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Application packet marked ready.</div> : null}
        {notices?.readyBlocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Ready was blocked by the safety gate. Fix critical checklist items or review the job decision first.</div> : null}
        {notices?.packetMissing ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Create and save an application packet before marking it ready.</div> : null}
        {notices?.aiDisabled ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">AI drafting is not configured. Add both OPENAI_API_KEY and OPENAI_MODEL to enable it.</div> : null}
        {notices?.aiBlocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">AI drafting is blocked for forbidden, archived, or rejected jobs.</div> : null}
        {notices?.aiDraft ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">AI draft generated for review. Nothing was sent.</div> : null}
        {notices?.aiSaved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">AI draft replaced packet draft fields for manual editing. Nothing was sent.</div> : null}
        {notices?.aiError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">AI drafting failed. Check the latest draft run error or configuration.</div> : null}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Packet readiness / جاهز</h3>
          <p className="mt-2 text-sm leading-6 text-ink-200">READY is blocked until required items are complete. Evidence helps manual review, but profile text still has to be filled by Adel.</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Decision</div>
              <div className="mt-2 font-semibold text-white">{savedDecision}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">CV language</div>
              <div className="mt-2 font-semibold text-white">{savedLanguage}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Checklist</div>
              <div className="mt-2 font-semibold text-white">{summary.readyCount} / {summary.totalCount}</div>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-navy-950/40 p-4">
            <h4 className="font-semibold text-white">What is blocking READY</h4>
            <div className="mt-3 grid gap-2 text-sm text-ink-200">
              {blockingItems.length === 0 ? <p className="text-aqua-400">No critical blockers. Review evidence and save the packet before applying.</p> : null}
              {blockingItems.map((item) => <p key={item.label}>{item.missingText}</p>)}
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {summary.checklist.map((item) => (
              <div key={item.label} className={`rounded-lg border p-3 text-sm ${item.done ? "border-aqua-400/30 bg-aqua-400/10 text-ink-100" : "border-signal-red/30 bg-signal-red/10 text-ink-100"}`}>
                <span className="font-semibold">{item.done ? "Done" : "Missing"}:</span> {item.label}{item.critical ? <span className="ml-2 text-xs uppercase tracking-[0.14em] text-ink-400">Required</span> : null}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Packet editing fields</h3>
          <p className="mt-2 text-sm leading-6 text-ink-200">Write draft material for Adel to review. Saving here does not send or apply anything.</p>
          <form action={saveApplicationPacket} className="mt-5 grid gap-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Packet status</span>
              <select name="status" defaultValue={packet?.status ?? "DRAFT"} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                  {APPLICATION_PACKET_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">CV language</span>
              <select name="cvLanguage" defaultValue={packet?.cvLanguage ?? summary.cvLanguage} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                  {CV_LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Decision</span>
              <select name="applicationDecision" defaultValue={packet?.applicationDecision ?? summary.applicationDecision} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
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
            <div><NeonButton className="border-aqua-400 bg-aqua-400 text-navy-950 hover:bg-aqua-500">Save packet</NeonButton></div>
          </form>
          {packet ? (
            <form action={markApplicationPacketReady} className="mt-3">
              <input type="hidden" name="jobId" value={job.id} />
              <NeonButton className="border-white/20 text-ink-100" disabled={!canMarkReady}>Mark ready / جاهز</NeonButton>
            </form>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Controlled AI drafting</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-200">
              Optional draft helper for this packet only. It uses saved profile, source, and job data. Adel still reviews and decides what to use.
            </p>
          </div>
          <form action={generateApplicationAiDraft}>
            <input type="hidden" name="jobId" value={job.id} />
            <NeonButton disabled={!canRequestAiDraft}>Generate draft for review</NeonButton>
          </form>
        </div>
        {!aiConfig.enabled ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-200">
            AI/Gmail not connected. Set `OPENAI_API_KEY` and `OPENAI_MODEL` to enable controlled drafting.
          </div>
        ) : null}
        {aiConfig.enabled && !canRequestApplicationAiDraft(job) ? (
          <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">
            Drafting is blocked for forbidden, archived, or rejected jobs.
          </div>
        ) : null}
        {latestAiRun?.status === "ERROR" ? (
          <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">
            Latest run failed: {latestAiRun.error ?? "Unknown error"}
          </div>
        ) : null}
        {latestAiOutput ? (
          <div className="mt-5 grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">CV tailoring notes</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-100">{latestAiOutput.cvTailoringNotes}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Skills</div>
                <ul className="mt-2 grid gap-1 text-sm text-ink-100">
                  {latestAiOutput.skillsToHighlight.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Warnings</div>
                <ul className="mt-2 grid gap-1 text-sm text-ink-100">
                  {[...latestAiOutput.missingEvidence, ...latestAiOutput.warnings].map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Recruiter message</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-100">{latestAiOutput.recruiterMessageDraft}</p>
            </div>
            <form action={saveAiDraftToPacket}>
              <input type="hidden" name="runId" value={latestAiRun?.id} />
              <p className="mb-3 max-w-3xl text-sm leading-6 text-ink-200">
                This is a manual copy action. It will replace the current packet draft fields, but nothing is sent or applied automatically.
              </p>
              <NeonButton className="border-white/20 text-ink-100">Replace packet fields with this AI draft</NeonButton>
            </form>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Profile evidence / הוכחה</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">
          Manual evidence links only. Review CV, LinkedIn, GitHub, projects, certificates, and academic sources before applying.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Before applying, add/review these sources</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {sourceReadiness.missing.length === 0 && missingEvidenceFields.length === 0 ? <p className="text-aqua-400">Core source groups and evidence links are covered.</p> : null}
              {sourceReadiness.missing.map((item) => <p key={item.label}>{item.note}</p>)}
              {missingEvidenceFields.slice(0, 6).map((field) => <p key={field.key}>Link evidence for {field.label}.</p>)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Available source records</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {sources.length === 0 ? <p className="text-ink-400">No sources yet.</p> : null}
              {sources.slice(0, 6).map((source) => (
                <Link key={source.id} href={`/sources/${source.id}`} className="rounded-lg border border-white/20 bg-white/[0.07] p-2 hover:border-aqua-400/50">
                  {source.filename} | {sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}
                </Link>
              ))}
              {sources.length > 6 ? <Link href="/sources" className="text-aqua-400">Review all sources</Link> : null}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {Object.entries(evidence.grouped).map(([targetField, links]) => {
            const field = getProfileSourceTargetField(targetField);
            return (
              <div key={targetField} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="font-semibold text-white">{field?.label ?? targetField} ({links.length})</div>
                <div className="mt-2 grid gap-2 text-sm text-ink-200">
                  {links.length === 0 ? <p className="text-ink-400">No linked evidence.</p> : null}
                  {links.map((link) => (
                    <Link key={link.id} href={`/sources/${link.sourceId}`} className="rounded-lg border border-white/20 bg-white/[0.07] p-2 hover:border-aqua-400/50">
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
