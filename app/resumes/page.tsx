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
    <div className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="mt-3 grid min-w-0 gap-2 text-sm text-ink-100">
        {items.length === 0 ? <p className="font-semibold text-signal-red">חסר</p> : items.slice(0, 5).map((item) => <div key={item} className="break-words">{item}</div>)}
        {items.length > 5 ? <p className="text-ink-400">+ {items.length - 5} נוספים</p> : null}
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
    { key: "languages", label: "שפות", value: profile?.languages },
    { key: "technicalSkills", label: "כישורים טכניים", value: profile?.technicalSkills },
    { key: "fieldExperience", label: "ניסיון מעשי", value: profile?.fieldExperience },
    { key: "education", label: "השכלה", value: profile?.education },
    { key: "certificates", label: "תעודות", value: profile?.certificates },
    { key: "githubProjects", label: "פרויקטי GitHub", value: profile?.githubProjects },
    { key: "portfolioLinks", label: "קישורי Portfolio", value: profile?.portfolioLinks }
  ];
  const missingProfileItems = profileChecks.filter((item) => !hasProfileText(item.value));
  const missingEvidenceFields = evidence.fieldsMissingEvidence
    .map((field) => getProfileSourceTargetField(field.key) ?? field)
    .slice(0, 8);

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Resume Lab / CV / קורות חיים</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">השלמת טקסט פרופיל וראיות</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-100">
          Resume Lab עדיין ידני. טקסט הפרופיל הוא הבסיס ל-CV ולהגשות, וקישורי ראיות מראים מה תומך בכל שדה. יצוא DOCX/PDF מתוכנן להמשך; כרגע העמוד בודק מוכנות ידנית בלבד.
        </p>
      </GlassCard>

      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-white">נתוני פרופיל</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{missingProfileItems.length === 0 ? "מוכן" : `${missingProfileItems.length} חסרים`}</div>
          <p className="mt-2 break-words text-sm text-ink-400">הטקסט האמיתי שישמש בהמשך ל-CV ולהגשות.</p>
        </GlassCard>
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-white">רשומות מקור</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{sourceReadiness.readyCount} / {sourceReadiness.totalCount}</div>
          <p className="mt-2 break-words text-sm text-ink-400">קבצים, URLs, טקסט מודבק או הערות שנשמרו מקומית.</p>
        </GlassCard>
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-lg font-semibold text-white">קישורי ראיות</h3>
          <div className="mt-3 text-3xl font-semibold text-white">{evidence.readyCount} / {evidence.totalCount}</div>
          <p className="mt-2 break-words text-sm text-ink-400">קישורים ידניים בין Sources לשדות בפרופיל.</p>
        </GlassCard>
      </div>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מה להשלים עכשיו</h3>
        <p className="mt-2 break-words text-sm leading-6 text-ink-200">
          יש כאן שתי משימות נפרדות: למלא טקסט אמיתי בפרופיל, ואז לקשר ראיות. שתיהן ידניות ומקומיות.
        </p>
        <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
          <div className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words font-semibold text-white">מלא טקסט פרופיל</div>
                <p className="mt-1 break-words text-sm text-ink-400">אם חסר טקסט, טיוטות CV לא יקבלו מספיק מידע אמיתי.</p>
              </div>
              <Link href="/profile" className="rounded-lg border border-aqua-400 bg-aqua-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
                פתח פרופיל
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ink-100">
              {missingProfileItems.length === 0 ? <p className="font-semibold text-aqua-400">מוכן</p> : null}
              {missingProfileItems.map((item) => <p key={item.key} className="break-words">חסר: {item.label}</p>)}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="break-words font-semibold text-white">קשר ראיות</div>
                <p className="mt-1 break-words text-sm text-ink-400">מקורות צריכים להיות מקושרים ידנית לשדות בפרופיל.</p>
              </div>
              <Link href="/sources" className="rounded-lg border border-aqua-400 bg-aqua-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">
                פתח Sources
              </Link>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-ink-100">
              {missingEvidenceFields.length === 0 ? <p className="font-semibold text-aqua-400">מוכן</p> : null}
              {missingEvidenceFields.map((item) => <p key={item.key} className="break-words">חסר: {item.label}</p>)}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">נתוני CV בסיסיים מהפרופיל</h3>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <ValueList label="שפות" value={profile?.languages} />
          <ValueList label="כישורים טכניים" value={profile?.technicalSkills} />
          <ValueList label="השכלה" value={profile?.education} />
          <ValueList label="תעודות" value={profile?.certificates} />
          <ValueList label="פרויקטי GitHub" value={profile?.githubProjects} />
          <ValueList label="קישורי Portfolio" value={profile?.portfolioLinks} />
          <ValueList label="ניסיון מעשי" value={profile?.fieldExperience} />
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">חבילות הגשה אחרונות</h3>
          <Link href="/jobs?view=ready" className="rounded-lg border border-aqua-400 bg-aqua-400 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-aqua-500">מצא משרות מוכנות</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["READY", "DRAFT"].map((status) => (
            <ScoreBadge key={status} tone={status === "READY" ? "aqua" : "muted"}>
              {status}: {packetStatusCounts[status] ?? 0}
            </ScoreBadge>
          ))}
        </div>
        <div className="mt-5 grid min-w-0 gap-3">
          {packets.length === 0 ? <p className="text-sm text-ink-400">אין עדיין חבילות הגשה. פתח משרה ובחר הכנת הגשה.</p> : null}
          {packets.map((packet) => (
            <Link key={packet.id} href={`/jobs/${packet.jobId}/application`} className="min-w-0 overflow-hidden rounded-lg border border-white/20 bg-white/[0.08] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-semibold text-white">{packet.job.title}</div>
                  <div className="mt-1 break-words text-sm text-ink-200">{packet.job.company ?? "חברה לא ידועה"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge>{packet.status}</ScoreBadge>
                  <ScoreBadge tone="muted">{packet.cvLanguage ?? "שפה לא נקבעה"}</ScoreBadge>
                </div>
              </div>
              <p className="mt-3 break-words text-sm text-ink-400">{packet.applicationDecision ?? "החלטה עדיין לא נשמרה"}</p>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
