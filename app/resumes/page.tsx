import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { getProfileSourceTargetField, summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";

function ValueList({ label, value }: { label: string; value: unknown }) {
  const items = jsonToStringArray(value);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="mt-3 grid gap-2 text-sm text-ink-200">
        {items.length === 0 ? <p className="text-signal-red">Missing</p> : items.slice(0, 5).map((item) => <div key={item}>{item}</div>)}
        {items.length > 5 ? <p className="text-ink-400">+ {items.length - 5} more</p> : null}
      </div>
    </div>
  );
}

export default async function ResumesPage() {
  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const sources = await db.sourceFile.findMany({ orderBy: { updatedAt: "desc" } });
  const packets = await db.applicationPacket.findMany({
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: { job: true }
  });
  const sourceReadiness = calculateSourceReadiness(sources);
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const packetStatusCounts = packets.reduce(
    (counts, packet) => {
      counts[packet.status] = (counts[packet.status] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>
  );
  const missingEvidenceLabels = evidence.fieldsMissingEvidence
    .map((field) => getProfileSourceTargetField(field.key)?.label ?? field.label)
    .slice(0, 6);
  const missingCvInputs = [
    !profile?.languages || jsonToStringArray(profile.languages).length === 0 ? "Languages" : null,
    !profile?.technicalSkills || jsonToStringArray(profile.technicalSkills).length === 0 ? "Technical skills" : null,
    !profile?.education || jsonToStringArray(profile.education).length === 0 ? "Education" : null,
    !profile?.fieldExperience || jsonToStringArray(profile.fieldExperience).length === 0 ? "Field experience" : null,
    !profile?.githubProjects || jsonToStringArray(profile.githubProjects).length === 0 ? "GitHub projects" : null
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Resume Lab</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Manual CV preparation workspace</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Resume Lab is manual in Phase 5.3. Use it to review profile data, sources, and application packets before drafting. DOCX, PDF, and export are not connected.
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Profile readiness</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{missingCvInputs.length === 0 ? "Ready" : `${missingCvInputs.length} missing`}</div>
          <p className="mt-2 text-sm text-ink-300">{missingCvInputs.length === 0 ? "Core CV fields are filled." : missingCvInputs.join(", ")}</p>
        </GlassCard>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Source readiness</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{sourceReadiness.readyCount} / {sourceReadiness.totalCount}</div>
          <p className="mt-2 text-sm text-ink-300">CV, LinkedIn, GitHub/projects, and certificates/academic source groups.</p>
          <div className="mt-4 grid gap-2 text-sm text-ink-200">
            {sourceReadiness.items.map((item) => (
              <div key={item.label} className={item.ready ? "text-aqua-400" : "text-ink-300"}>
                {item.ready ? "Ready" : "Missing"}: {item.label}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Evidence readiness</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{evidence.readyCount} / {evidence.totalCount}</div>
          <p className="mt-2 text-sm text-ink-300">Manual source links supporting profile fields.</p>
          <div className="mt-4 text-sm text-ink-200">
            {missingEvidenceLabels.length === 0 ? <p className="text-aqua-400">All profile evidence fields have links.</p> : <p>Missing links: {missingEvidenceLabels.join(", ")}</p>}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">What to complete next</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="font-semibold text-white">Profile data</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {missingCvInputs.length === 0 ? <p className="text-aqua-400">Core CV fields are filled.</p> : missingCvInputs.map((item) => <p key={item}>Add {item.toLowerCase()}.</p>)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="font-semibold text-white">Evidence links</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {missingEvidenceLabels.length === 0 ? <p className="text-aqua-400">Evidence links are covered.</p> : missingEvidenceLabels.map((item) => <p key={item}>Link a source for {item}.</p>)}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Base CV data from Profile</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ValueList label="Languages" value={profile?.languages} />
          <ValueList label="Technical skills" value={profile?.technicalSkills} />
          <ValueList label="Education" value={profile?.education} />
          <ValueList label="Certificates" value={profile?.certificates} />
          <ValueList label="GitHub projects" value={profile?.githubProjects} />
          <ValueList label="Portfolio links" value={profile?.portfolioLinks} />
          <ValueList label="Field experience" value={profile?.fieldExperience} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Recent application packets</h3>
          <Link href="/jobs?view=ready" className="text-sm font-semibold text-aqua-400">Find ready jobs</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["READY", "DRAFT"].map((status) => (
            <ScoreBadge key={status} tone={status === "READY" ? "aqua" : "muted"}>
              {status}: {packetStatusCounts[status] ?? 0}
            </ScoreBadge>
          ))}
        </div>
        <div className="mt-5 grid gap-3">
          {packets.length === 0 ? <p className="text-sm text-ink-400">No application packets yet. Open a job and choose Prepare.</p> : null}
          {packets.map((packet) => (
            <Link key={packet.id} href={`/jobs/${packet.jobId}/application`} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{packet.job.title}</div>
                  <div className="mt-1 text-sm text-ink-200">{packet.job.company ?? "Unknown company"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge>{packet.status}</ScoreBadge>
                  <ScoreBadge tone="muted">{packet.cvLanguage ?? "Language unset"}</ScoreBadge>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-300">{packet.applicationDecision ?? "Decision not saved yet"}</p>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
