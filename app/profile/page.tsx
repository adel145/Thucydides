import Link from "next/link";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/lib/db";
import { jsonToTextarea } from "@/lib/formParsing";
import { getProfileSourceTargetField, summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";
import { sourceTypeLabels } from "@/lib/sources/sourceTypes";

export default async function ProfilePage() {
  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: { include: { source: true }, orderBy: { updatedAt: "desc" } } }
  });
  const sourceFiles = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });

  const values = {
    id: profile?.id ?? "",
    fullName: profile?.fullName ?? "",
    preferredName: profile?.preferredName ?? "",
    location: profile?.location ?? "",
    targetSalaryGrossNis: profile?.targetSalaryGrossNis ?? "",
    minimumSalaryGrossNis: profile?.minimumSalaryGrossNis ?? "",
    availability: profile?.availability ?? "",
    degreeStatus: profile?.degreeStatus ?? "",
    expectedCompletion: profile?.expectedCompletion ?? "",
    mobility: profile?.mobility ?? "",
    languages: jsonToTextarea(profile?.languages),
    technicalSkills: jsonToTextarea(profile?.technicalSkills),
    softSkills: jsonToTextarea(profile?.softSkills),
    fieldExperience: jsonToTextarea(profile?.fieldExperience),
    education: jsonToTextarea(profile?.education),
    certificates: jsonToTextarea(profile?.certificates),
    githubProjects: jsonToTextarea(profile?.githubProjects),
    portfolioLinks: jsonToTextarea(profile?.portfolioLinks),
    sourceNotes: profile?.sourceNotes ?? ""
  };
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Profile Intelligence</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Adel&apos;s career source of truth</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          This data is stored locally in SQLite. The form now validates required fields, salary consistency, and honest degree wording before saving.
        </p>
        <ProfileForm values={values} />
      </GlassCard>

      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Evidence links</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Profile source evidence</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Manual evidence links show which local sources support each profile field. They do not parse files or update the profile automatically.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-4">
            <div className="text-2xl font-semibold text-white">{evidence.readyCount} / {evidence.totalCount}</div>
            <div className="mt-1 text-sm text-ink-300">fields with linked evidence</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
            <div className="font-semibold text-white">Missing evidence</div>
            <p className="mt-2 text-sm text-ink-300">
              {evidence.fieldsMissingEvidence.length > 0 ? evidence.fieldsMissingEvidence.map((field) => field.label).join(", ") : "All profile fields have at least one evidence link."}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {Object.entries(evidence.grouped).map(([targetField, links]) => {
            const field = getProfileSourceTargetField(targetField);
            return (
              <div key={targetField} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{field?.label ?? targetField}</div>
                    <p className="mt-1 text-xs text-ink-400">{field?.description}</p>
                  </div>
                  <span className="text-sm text-ink-400">{links.length} links</span>
                </div>
                <div className="mt-3 grid gap-2">
                  {links.length === 0 ? <p className="text-sm text-ink-400">No linked evidence yet.</p> : null}
                  {links.map((link) => (
                    <Link key={link.id} href={`/sources/${link.sourceId}`} className="rounded-lg border border-white/10 bg-navy-950/50 p-3 text-sm text-ink-200">
                      <span className="font-semibold text-white">{link.source.filename}</span>
                      <span className="text-ink-400"> | {sourceTypeLabels[link.source.type as keyof typeof sourceTypeLabels] ?? link.source.type}</span>
                      {link.note ? <span> | {link.note}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Source files</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Profile sources live in Sources</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Add CV, LinkedIn, GitHub, project, certificate, and academic source records in Sources. Upload parsing is planned for later phases, so keep important details in pasted text or notes for now.
        </p>
        <div className="mt-5 divide-y divide-white/10">
          {sourceFiles.length === 0 ? (
            <p className="text-sm text-ink-400">No source files recorded yet.</p>
          ) : (
            sourceFiles.map((file) => (
              <div key={file.id} className="py-3">
                <div className="font-semibold text-white">{file.filename}</div>
                <div className="mt-1 text-sm text-ink-200">{[file.type, file.path, file.url].filter(Boolean).join(" | ") || "No path or URL recorded"}</div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
