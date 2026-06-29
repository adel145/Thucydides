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
    <div className="rounded-lg border border-white/20 bg-white/[0.08] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="mt-3 grid gap-2 text-sm text-ink-100">
        {items.length === 0 ? <p className="font-semibold text-signal-red">Missing / ناقص</p> : items.slice(0, 5).map((item) => <div key={item}>{item}</div>)}
        {items.length > 5 ? <p className="text-ink-400">+ {items.length - 5} more</p> : null}
      </div>
    </div>
  );
}

function hasProfileText(value: unknown) {
  return jsonToStringArray(value).length > 0;
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
  const profileChecks = [
    { key: "languages", label: "Languages", value: profile?.languages },
    { key: "technicalSkills", label: "Technical skills", value: profile?.technicalSkills },
    { key: "fieldExperience", label: "Field experience", value: profile?.fieldExperience },
    { key: "education", label: "Education", value: profile?.education },
    { key: "certificates", label: "Certificates", value: profile?.certificates },
    { key: "githubProjects", label: "GitHub projects", value: profile?.githubProjects },
    { key: "portfolioLinks", label: "Portfolio links", value: profile?.portfolioLinks }
  ];
  const missingProfileItems = profileChecks.filter((item) => !hasProfileText(item.value));
  const missingEvidenceFields = evidence.fieldsMissingEvidence
    .map((field) => getProfileSourceTargetField(field.key) ?? field)
    .slice(0, 8);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Resume Lab / CV / קורות חיים</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Complete profile text and evidence</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-100">
          Resume Lab is still manual. Profile text is what CV/application drafts can use. Evidence links show which source supports each field. DOCX/PDF export is planned; this page currently reviews manual packet text only.
        </p>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Profile data</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{missingProfileItems.length === 0 ? "Ready / جاهز" : `${missingProfileItems.length} missing`}</div>
          <p className="mt-2 text-sm text-ink-400">Actual text used later for CV and application material.</p>
        </GlassCard>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Source records</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{sourceReadiness.readyCount} / {sourceReadiness.totalCount}</div>
          <p className="mt-2 text-sm text-ink-400">Files, URLs, pasted text, or notes saved locally.</p>
        </GlassCard>
        <GlassCard>
          <h3 className="text-lg font-semibold text-white">Evidence links</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{evidence.readyCount} / {evidence.totalCount}</div>
          <p className="mt-2 text-sm text-ink-400">Manual links from sources to profile fields.</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">What to complete next</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">
          Two separate jobs: fill the profile text, then link evidence. Both are manual and local.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/20 bg-white/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white">Fill profile text / عبي بياناتك</div>
                <p className="mt-1 text-sm text-ink-400">Missing text means CV drafts will not have enough real data.</p>
              </div>
              <Link href="/profile" className="rounded-lg border border-aqua-400 bg-aqua-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
                Open Profile
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ink-100">
              {missingProfileItems.length === 0 ? <p className="font-semibold text-aqua-400">Ready / جاهز</p> : null}
              {missingProfileItems.map((item) => <p key={item.key}>Missing / ناقص: {item.label}</p>)}
            </div>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/[0.08] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white">Link evidence / اربط إثبات</div>
                <p className="mt-1 text-sm text-ink-400">Sources must be manually linked to profile fields.</p>
              </div>
              <Link href="/sources" className="rounded-lg border border-aqua-400 bg-aqua-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
                Open Sources
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ink-100">
              {missingEvidenceFields.length === 0 ? <p className="font-semibold text-aqua-400">Ready / جاهز</p> : null}
              {missingEvidenceFields.map((item) => <p key={item.key}>Missing / ناقص: {item.label}</p>)}
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
          <Link href="/jobs?view=ready" className="rounded-lg border border-aqua-400 bg-aqua-400 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">Find ready jobs</Link>
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
            <Link key={packet.id} href={`/jobs/${packet.jobId}/application`} className="rounded-lg border border-white/20 bg-white/[0.08] p-4">
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
              <p className="mt-3 text-sm text-ink-400">{packet.applicationDecision ?? "Decision not saved yet"}</p>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
