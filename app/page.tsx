import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { calculateDashboardMission } from "@/lib/dashboard/dashboardMission";
import { calculateDashboardMetrics } from "@/lib/dashboard/dashboardMetrics";
import { getDiscoveryProviderStatus } from "@/lib/discovery/discoveryProviders";
import { countDiscoveryLeads } from "@/lib/discovery/jobDiscoveryCounts";
import { summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

export default async function DashboardPage() {
  const jobs = await db.job.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const sources = await db.sourceFile.findMany({
    orderBy: { updatedAt: "desc" }
  });
  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const packetCounts = {
    draft: await db.applicationPacket.count({ where: { status: "DRAFT" } }),
    ready: await db.applicationPacket.count({ where: { status: "READY" } })
  };
  const discoveryRuns = await db.jobDiscoveryRun.count();
  const discoveryLeads = await db.jobDiscoveryLead.findMany({
    select: { status: true, importedJobId: true, validationStatus: true, extractedDescription: true, rawText: true, discoverySource: true }
  });
  const discoveryCounts = countDiscoveryLeads(discoveryLeads);
  const providerStatus = getDiscoveryProviderStatus();
  const metrics = calculateDashboardMetrics(jobs);
  const mission = calculateDashboardMission(jobs, sources, profile);
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const readinessWarning = mission.sourceReadiness.missing.length > 0 || mission.profileWarnings.length > 0;

  const metricCards = [
    ["יעד ראיונות", `${metrics.interviewGoalCurrent} / ${metrics.interviewGoalTarget}`, "ראיונות מקומיים מול יעד המשימה."],
    ["משרות שנמצאו", `${metrics.jobsFound}`, `${metrics.activeJobs} פעילות, ${metrics.archived} בארכיון.`],
    ["משרות שנבדקו", `${metrics.jobsAnalyzed}`, "משרות שעברו ולידציה דטרמיניסטית או התקדמו מעבר למציאה."],
    ["מוכנות להגשה", `${metrics.applicationsReady}`, "משרות שהוכנו להגשה."],
    ["הוגשו", `${metrics.applicationsSent}`, "משרות שסומנו כהוגשו."],
    ["תגובות", `${metrics.replies}`, "משרות שסומנו כתגובה התקבלה."],
    ["ראיונות", `${metrics.interviews}`, "משרות שנמצאות בשלב ראיון."],
    ["הצעות", `${metrics.offers}`, "משרות שסומנו כהצעה."],
    ["דחיות", `${metrics.rejections}`, "משרות שסומנו כדחייה."],
    ["ארכיון", `${metrics.archived}`, "משרות שנשמרו מקומית מחוץ לקמפיין הפעיל."],
    ["מעקבים להיום", `${metrics.dueFollowUps}`, "משרות פעילות עם פעולה הבאה להיום או לפני."],
    ["מעקבים באיחור", `${metrics.overdueFollowUps}`, "משרות פעילות עם פעולה הבאה לפני היום."],
    ["עדיפות גבוהה", `${metrics.highPriorityJobs}`, "משרות פעילות בעדיפות גבוהה או קריטית."]
  ];

  return (
    <>
      <GlassCard className="grid min-w-0 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">המשימה של היום</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            המשימה של היום
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-200">
            מתחילים ממשרות מוכנות להגשה, מעקבים, ומוכנות מקורות. SQLite מקומי פעיל; Gmail לא מחובר.
          </p>
          <p className="mt-3 text-sm text-ink-300">
            קודם אתרי קריירה של חברות, אחר כך פלטפורמות, ובסוף התראות Gmail ידניות. לידים לבדיקה: <span className="font-semibold text-aqua-400">{discoveryCounts.needsReview}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NeonButton href="/discovery">מצא משרות מתאימות</NeonButton>
            <NeonButton href="/jobs?view=ready">משרות מוכנות להגשה</NeonButton>
            <NeonButton href="/resumes" className="border-white/20 text-ink-100">מעבדת קורות חיים</NeonButton>
            <NeonButton href="/jobs" className="border-white/20 text-ink-100">הדבק משרה</NeonButton>
            <NeonButton href="/gmail" className="border-white/20 text-ink-100">בדוק לידים מ־Gmail</NeonButton>
            <NeonButton href="/pipeline" className="border-white/20 text-ink-100">תהליך הגשה</NeonButton>
          </div>
        </div>
        <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">ספירת משימה</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{mission.readyToApplyJobs.length}</div>
              <div className="text-xs text-ink-400">מוכן להגשה</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-100">{mission.dueFollowUps.length + mission.overdueFollowUps.length}</div>
              <div className="text-xs text-ink-400">מעקבים</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-ink-100">{mission.highPriorityJobs.length}</div>
              <div className="text-xs text-ink-400">עדיפות גבוהה</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{mission.sourceReadiness.readyCount}/{mission.sourceReadiness.totalCount}</div>
              <div className="text-xs text-ink-400">מקורות</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{evidence.readyCount}/{evidence.totalCount}</div>
              <div className="text-xs text-ink-400">ראיות</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{packetCounts.ready}/{packetCounts.draft + packetCounts.ready}</div>
              <div className="text-xs text-ink-400">חבילות</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-aqua-400">{discoveryCounts.needsReview}</div>
              <div className="text-xs text-ink-400">לידים לבדיקה</div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">זרימה מתוכננת</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">חיפוש וייצוא בשלבים הבאים</h2>
          </div>
          <ScoreBadge tone="muted">מתוכנן לשלבים הבאים</ScoreBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["מצא משרות מתאימות", `קודם אתרי קריירה. Tavily ${providerStatus.tavilyConfigured ? "מוגדר" : "לא מוגדר"}, SerpApi ${providerStatus.serpApiConfigured ? "מוגדר" : "לא מוגדר"}.`],
            ["קליטת התראות Gmail — הדבקה מקומית", "מדביקים התראות משרות ידנית. Gmail לא מחובר ולא נקרא אימייל."],
            ["ייצוא CV/PDF — מתוכנן", "בעתיד DOCX/PDF/TXT עם תמיכת RTL/LTR. כרגע חבילות נשארות טקסט ידני."]
          ].map(([title, note]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 opacity-85">
              <div className="font-semibold text-white">{title}</div>
              <p dir="auto" className="mt-2 text-sm leading-6 text-ink-300">{note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ScoreBadge tone="muted">{discoveryRuns} הרצות גילוי</ScoreBadge>
          <ScoreBadge tone="aqua">{discoveryCounts.enrichedLeads} לידים מועשרים</ScoreBadge>
          <ScoreBadge tone="warning">{discoveryCounts.blocked} לידים חסומים</ScoreBadge>
        </div>
      </GlassCard>

      {readinessWarning ? (
        <GlassCard className="border border-signal-red/30 bg-signal-red/10">
          <h2 className="text-xl font-semibold text-white">הפרופיל והמקורות דורשים עבודה</h2>
          <p className="mt-3 text-sm leading-6 text-ink-200">
            הפרופיל והמקורות עדיין לא מוכנים לעבודה רצינית עם AI או CV. קודם צריך להוסיף CV, LinkedIn, GitHub/פרויקטים, תעודות ומקורות אקדמיים.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {mission.profileWarnings.slice(0, 3).map((warning) => <ScoreBadge key={warning} tone="warning">{warning}</ScoreBadge>)}
            {mission.sourceReadiness.missing.map((item) => <ScoreBadge key={item.label} tone="warning">חסר {item.label}</ScoreBadge>)}
            {evidence.fieldsMissingEvidence.slice(0, 4).map((field) => <ScoreBadge key={field.key} tone="warning">חסרה ראיה: {field.label}</ScoreBadge>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <NeonButton href="/profile">עדכן פרופיל</NeonButton>
            <NeonButton href="/sources" className="border-white/20 text-ink-100">עדכן מקורות</NeonButton>
          </div>
        </GlassCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">משרות מוכנות להגשה</h2>
            <Link href="/jobs?view=ready" className="text-sm font-semibold text-aqua-400">פתח הכל</Link>
          </div>
          <div className="mt-5 grid gap-3">
            {mission.readyToApplyJobs.slice(0, 5).map((job) => (
              <div key={job.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-aqua-400/50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link dir="auto" href={`/jobs/${job.id}`} className="font-semibold text-white hover:text-aqua-400">{job.title}</Link>
                    <div dir="auto" className="mt-1 break-words text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "אין פרטים"}</div>
                  </div>
                  <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus === "RISKY" ? "דורש בדיקה" : "משרה מתאימה"}</ScoreBadge>
                </div>
                {job.riskNotes ? <p dir="auto" className="mt-3 line-clamp-2 text-sm text-ink-300">{job.riskNotes}</p> : null}
                <Link href={`/jobs/${job.id}/application`} className="mt-3 inline-flex rounded-lg border border-aqua-400/40 px-3 py-2 text-xs font-semibold text-aqua-400">הכן הגשה</Link>
              </div>
            ))}
            {mission.readyToApplyJobs.length === 0 ? <p className="text-sm text-ink-400">אין עדיין משרות מוכנות. הדבק תיאור משרה בתיבת המשרות.</p> : null}
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">מעקבים</h2>
          <div className="mt-5 grid gap-4">
            <Link href="/jobs?view=follow-up-due" className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-ink-400">להיום</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.dueFollowUps.length}</div>
            </Link>
            <Link href="/jobs?view=follow-up-due" className="rounded-lg border border-signal-red/30 bg-signal-red/10 p-4">
              <div className="text-sm text-ink-400">באיחור</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.overdueFollowUps.length}</div>
            </Link>
            <Link href="/jobs?view=high-priority" className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-ink-400">משרות בעדיפות גבוהה</div>
              <div className="mt-2 text-3xl font-semibold text-white">{mission.highPriorityJobs.length}</div>
            </Link>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">משרות מקומיות אחרונות</h2>
          <div className="mt-5 divide-y divide-white/10">
            {mission.recentJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div dir="auto" className="font-semibold text-white">{job.title}</div>
                  <div dir="auto" className="mt-1 break-words text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "אין פרטים"}</div>
                </div>
                <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
              </Link>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-2xl font-semibold text-white">סיכום קמפיין</h2>
          <p className="mt-3 text-sm leading-6 text-ink-200">
            מדדים שימושיים נשארים מתחת למשימה כדי שלא ישתלטו על המסך הראשון.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {metricCards.slice(0, 6).map(([label, value, note]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
                <p className="mt-2 text-xs leading-5 text-ink-300">{note}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

