import Link from "next/link";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/lib/db";
import { jsonToStringArray, jsonToTextarea } from "@/lib/formParsing";
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
  const realDataChecks = [
    { key: "technicalSkills", label: "כישורים טכניים", value: profile?.technicalSkills, example: "React, Node.js, Python, SQL, Git" },
    { key: "githubProjects", label: "פרויקטי GitHub", value: profile?.githubProjects, example: "שם פרויקט, stack, GitHub URL" },
    { key: "portfolioLinks", label: "קישורי Portfolio", value: profile?.portfolioLinks, example: "Portfolio URL, demo, עמוד פרויקט" },
    { key: "fieldExperience", label: "ניסיון מעשי", value: profile?.fieldExperience, example: "פרויקטים, תמיכה, implementation, QA" },
    { key: "certificates", label: "תעודות", value: profile?.certificates, example: "שם קורס/תעודה, גוף מנפיק, URL" }
  ];
  const missingRealData = realDataChecks.filter((item) => jsonToStringArray(item.value).length === 0);

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">פרופיל</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">מקור האמת של הקריירה של Adel</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          זה הטקסט האמיתי שישמש בהמשך ל-CV ולהגשות. מקורות הם ראיות בלבד; הם לא ממלאים את הפרופיל אוטומטית.
        </p>
        <div className="mt-5 min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="break-words font-semibold text-white">נתונים אמיתיים להשלמה</h3>
              <p className="mt-1 break-words text-sm text-ink-400">השדות הכי חשובים לפני עבודה רצינית על CV והגשות.</p>
            </div>
            <span className="rounded-full border border-white/20 px-3 py-1 text-sm text-ink-100">
              {missingRealData.length === 0 ? "מוכן" : `${missingRealData.length} חסרים`}
            </span>
          </div>
          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {realDataChecks.map((item) => {
              const ready = jsonToStringArray(item.value).length > 0;
              return (
                <div key={item.key} className={`min-w-0 overflow-hidden rounded-lg border p-3 ${ready ? "border-aqua-400/30 bg-aqua-400/10" : "border-signal-red/30 bg-signal-red/10"}`}>
                  <div className="break-words font-semibold text-white">{item.label}</div>
                  <p className="mt-1 text-xs text-ink-200">{ready ? "מוכן" : "חסר"}</p>
                  {!ready ? <p className="mt-2 break-words text-xs leading-5 text-ink-200">דוגמה: {item.example}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
        <ProfileForm values={values} />
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">ראיות</p>
        <h2 className="mt-3 break-words text-2xl font-semibold text-white">קישורי מקור לפרופיל</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          קישורי ראיות ידניים מראים איזה מקור מקומי תומך בכל שדה בפרופיל. הם לא מפרשים קבצים ולא מעדכנים טקסט לבד.
        </p>
        <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-4">
            <div className="text-2xl font-semibold text-white">{evidence.readyCount} / {evidence.totalCount}</div>
            <div className="mt-1 text-sm text-ink-400">שדות עם ראיות מקושרות</div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4 md:col-span-2">
            <div className="font-semibold text-white">ראיות חסרות</div>
            <p className="mt-2 break-words text-sm text-ink-400">
              {evidence.fieldsMissingEvidence.length > 0 ? evidence.fieldsMissingEvidence.map((field) => field.label).join(", ") : "לכל שדות הפרופיל יש לפחות קישור ראיה אחד."}
            </p>
          </div>
        </div>
        <div className="mt-5 grid min-w-0 gap-4">
          {Object.entries(evidence.grouped).map(([targetField, links]) => {
            const field = getProfileSourceTargetField(targetField);
            return (
              <div key={targetField} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words font-semibold text-white">{field?.label ?? targetField}</div>
                    <p className="mt-1 break-words text-xs text-ink-400">{field?.description}</p>
                  </div>
                  <span className="text-sm text-ink-400">{links.length} קישורים</span>
                </div>
                <div className="mt-3 grid min-w-0 gap-2">
                  {links.length === 0 ? <p className="text-sm text-ink-400">אין עדיין ראיות מקושרות.</p> : null}
                  {links.map((link) => (
                    <Link key={link.id} href={`/sources/${link.sourceId}`} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.07] p-3 text-sm text-ink-200">
                      <span className="break-words font-semibold text-white">{link.source.filename}</span>
                      <span className="text-ink-400"> | {sourceTypeLabels[link.source.type as keyof typeof sourceTypeLabels] ?? link.source.type}</span>
                      {link.note ? <span className="break-words"> | {link.note}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Sources</p>
        <h2 className="mt-3 break-words text-2xl font-semibold text-white">מקורות הפרופיל נמצאים בעמוד Sources</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          הוסף רשומות CV, LinkedIn, GitHub, פרויקטים, תעודות ומסמכים אקדמיים בעמוד Sources. פענוח קבצים מתוכנן לשלבים מאוחרים יותר, אז כרגע חשוב לשמור פרטים חשובים כטקסט מודבק או הערות.
        </p>
        <div className="mt-5 divide-y divide-white/10">
          {sourceFiles.length === 0 ? (
            <p className="text-sm text-ink-400">אין עדיין מקורות שמורים.</p>
          ) : (
            sourceFiles.map((file) => (
              <div key={file.id} className="min-w-0 py-3">
                <div className="break-words font-semibold text-white">{file.filename}</div>
                <div className="mt-1 break-all text-sm text-ink-200">{[file.type, file.path, file.url].filter(Boolean).join(" | ") || "לא נשמר path או URL"}</div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
