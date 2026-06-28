import { ProfileForm } from "@/components/profile/ProfileForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/lib/db";
import { jsonToTextarea } from "@/lib/formParsing";

export default async function ProfilePage() {
  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" }
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
