import Link from "next/link";
import { enrichDiscoveryLead, enumerateSourceCandidate, hideOldNonImportableDiscoveryLeads, importDiscoveryLeadToInbox, markDiscoveryLeadDuplicate, retryClassifySourceCandidate, runJobDiscovery, skipDiscoveryLead, skipNonImportedLeadsFromRun, skipSourceCandidate, testDiscoveryProviderAction } from "@/app/discovery/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { getDiscoveryProviderStatus, getDiscoveryProviderLabel } from "@/lib/discovery/discoveryProviders";
import { discoveryPostingActionState, groupDiscoveryPostingLeadsForDisplay, isLegacyOrNoisyDiscoveryLead, isVerifiedImportableDiscoveryLead } from "@/lib/discovery/discoveryLeadViews";
import { countDiscoveryLeads } from "@/lib/discovery/jobDiscoveryCounts";
import { groupSourceCandidatesForDiscoveryReview, scoreSourceCandidateQuality } from "@/lib/discovery/sourceCandidateQuality";
import { isImportableSourceClassification } from "@/lib/discovery/pageClassifier";
import { isProviderAuthFailureMessage } from "@/lib/discovery/providerDiagnostics";
import { findDuplicateJobForLead } from "@/lib/gmail/jobLeadImport";
import { jsonToStringArray } from "@/lib/formParsing";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "אין תאריך";
  return new Date(value).toLocaleString("he-IL");
}

function isUnsupportedAggregator(candidate: { classification: string; title?: string | null; url?: string | null }) {
  return candidate.classification === "THIRD_PARTY_AGGREGATOR_LIST" || /glassdoor|linkedin\.com\/jobs|indeed|alljobs|drushim/i.test(`${candidate.title ?? ""} ${candidate.url ?? ""}`);
}

function domainFromUrl(value?: string | null) {
  if (!value) return "אין URL";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "URL לא תקין";
  }
}

function isUglyTitle(value?: string | null) {
  const title = value?.trim();
  if (!title) return true;
  const compact = title.replace(/\s+/g, "");
  return (
    /^Untitled job link from Workday$/i.test(title) ||
    /^Untitled job link from career page$/i.test(title) ||
    /^[a-f0-9]{8,}$/i.test(compact) ||
    /^[A-Z0-9]{8,}$/.test(compact)
  );
}

function sourceTitle(title?: string | null, url?: string | null) {
  if (!isUglyTitle(title)) return title;
  return /myworkdayjobs\.com/i.test(url ?? "")
    ? "קישור משרה מ־Workday ללא כותרת ברורה"
    : "קישור משרה ללא כותרת ברורה";
}

function hebrewPostingState(lead: { status?: string | null; importedJobId?: string | null; validationStatus?: string | null }, duplicate: boolean, readyLabel: string) {
  if (lead.status === "IMPORTED" && lead.importedJobId) return { label: "כבר יובא", tone: "aqua" as const };
  if (lead.validationStatus === "FORBIDDEN") return { label: "חסום — לא ניתן לייבא", tone: "warning" as const };
  if (duplicate || lead.status === "DUPLICATE") return { label: "כפול", tone: "warning" as const };
  if (readyLabel === "Ready to import") return { label: "מוכן לייבוא", tone: "aqua" as const };
  return { label: "דורש בדיקה — עדיין לא מוכן", tone: "muted" as const };
}

function hebrewImportReason(input: {
  blocked: boolean;
  duplicate: boolean;
  importBlockedReason: string | null;
  forbiddenFlags: string[];
}) {
  if (input.blocked) {
    const flags = input.forbiddenFlags.length > 0 ? `: ${input.forbiddenFlags.slice(0, 3).join(" / ")}` : "";
    return `נחסם בגלל כלל קשיח${flags}`;
  }
  if (input.duplicate) return "נראה כמו משרה שכבר קיימת במערכת.";
  if (input.importBlockedReason === "Low confidence.") return "דורש בדיקה: ביטחון נמוך במידע.";
  if (input.importBlockedReason === "Missing meaningful job description.") return "דורש בדיקה: חסר תיאור משרה ברור.";
  if (input.importBlockedReason) return "דורש בדיקה: המקור עדיין לא אומת כמשרה יחידה.";
  return null;
}

function PreviewText({ value, detailsLabel }: { value?: string | null; detailsLabel: string }) {
  if (!value) return null;
  return (
    <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-navy-950/40 p-3">
      <p dir="auto" className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-200">{value}</p>
      <details className="mt-2 min-w-0 text-sm text-ink-300">
        <summary className="cursor-pointer font-semibold text-aqua-400">{detailsLabel}</summary>
        <p dir="auto" className="mt-2 max-w-full whitespace-pre-wrap break-words text-ink-200">{value}</p>
      </details>
    </div>
  );
}

function LtrText({ children }: { children: React.ReactNode }) {
  return <span dir="ltr" className="inline-flex max-w-full break-all text-left">{children}</span>;
}

function hebrewProviderStatusLabel(provider: "TAVILY" | "SERPAPI_GOOGLE_JOBS", keyPresent: boolean, tested?: { ok: boolean; message?: string | null }) {
  const name = provider === "SERPAPI_GOOGLE_JOBS" ? "SerpApi" : "Tavily";
  if (tested) {
    if (tested.ok) return `${name} אומת`;
    if (tested.message && isProviderAuthFailureMessage(tested.message)) return `${name} הרשאה נכשלה`;
    return `${name} נכשל`;
  }
  return `${name} ${keyPresent ? "מוגדר" : "לא מוגדר"}`;
}

export default async function DiscoveryPage({
  searchParams
}: {
  searchParams?: Promise<{
    run?: string;
    blocked?: string;
    duplicate?: string;
    enriched?: string;
    enrichFailed?: string;
    missingLead?: string;
    missingCandidate?: string;
    noUrl?: string;
    notImportable?: string;
    providerTest?: string;
    providerOk?: string;
    providerMessage?: string;
    enumerated?: string;
    candidateLinks?: string;
    candidateClassified?: string;
    oldLeadsHidden?: string;
  }>;
}) {
  const notices = await searchParams;
  const providerStatus = getDiscoveryProviderStatus();
  const [runs, candidates, leads, existingJobs] = await Promise.all([
    db.jobDiscoveryRun.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.discoverySourceCandidate.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { discoveryRun: true } }),
    db.jobDiscoveryLead.findMany({
      where: { sourceType: { not: "GMAIL_ALERT" } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { discoveryRun: true, sourceCandidate: true }
    }),
    db.job.findMany({ select: { id: true, title: true, company: true, sourceUrl: true } })
  ]);
  const counts = countDiscoveryLeads(leads);
  const providerTest = notices?.providerTest === "SERPAPI_GOOGLE_JOBS" || notices?.providerTest === "TAVILY" ? notices.providerTest : null;
  const providerTestState = notices?.providerMessage ? { ok: notices.providerOk === "1", message: notices.providerMessage } : undefined;
  const sourceCandidateGroups = groupSourceCandidatesForDiscoveryReview(candidates);
  const maxPrimarySourceGroups = 10;
  const primarySourceGroups = sourceCandidateGroups.primaryGroups;
  const visiblePrimarySourceGroups = primarySourceGroups.slice(0, maxPrimarySourceGroups);
  const lowerPrioritySourceGroups = [
    ...primarySourceGroups.slice(maxPrimarySourceGroups),
    ...sourceCandidateGroups.lowQualityGroups,
    ...sourceCandidateGroups.skippedOrUnsupportedGroups
  ];
  const processedSourceGroups = sourceCandidateGroups.processedGroups;
  const skippedOrUnsupportedCandidates = lowerPrioritySourceGroups.map((group) => group.primary);
  const verifiedLeadGroups = groupDiscoveryPostingLeadsForDisplay(
    leads.filter(isVerifiedImportableDiscoveryLead),
    (lead) => Boolean(findDuplicateJobForLead(lead, existingJobs) && !(lead.status === "IMPORTED" && lead.importedJobId))
  );
  const verifiedLeads = verifiedLeadGroups.map((group) => group.primary);
  const legacyLeads = leads.filter(isLegacyOrNoisyDiscoveryLead);
  const readyImportCount = verifiedLeads.filter((lead) => discoveryPostingActionState(lead, {
    duplicate: Boolean(findDuplicateJobForLead(lead, existingJobs) && !(lead.status === "IMPORTED" && lead.importedJobId))
  }).label === "Ready to import").length;

  return (
    <div dir="rtl" className="grid min-w-0 max-w-full gap-6 overflow-hidden text-right">
      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">גילוי משרות באינטרנט</p>
            <h2 className="mt-3 break-words text-3xl font-semibold text-white">מציאת משרות מתאימות לבדיקה</h2>
            <p className="mt-4 break-words text-sm leading-6 text-ink-200">
              קודם אתרי קריירה של חברות, אחר כך פלטפורמות, ובסוף Gmail ידני. הגילוי יוצר מועמדים לבדיקה בלבד; Adel מחליט מה לייבא.
            </p>
          </div>
          <ScoreBadge tone="muted">נדרשת בדיקה ידנית</ScoreBadge>
        </div>
        <div className="mt-5 flex min-w-0 flex-wrap gap-2">
          <ScoreBadge tone={providerStatus.tavilyConfigured ? "aqua" : "warning"}>
            <span>{hebrewProviderStatusLabel("TAVILY", providerStatus.tavilyConfigured, providerTest === "TAVILY" ? providerTestState : undefined)}</span>
          </ScoreBadge>
          <ScoreBadge tone={providerStatus.serpApiConfigured ? "aqua" : "warning"}>
            <span>{hebrewProviderStatusLabel("SERPAPI_GOOGLE_JOBS", providerStatus.serpApiConfigured, providerTest === "SERPAPI_GOOGLE_JOBS" ? providerTestState : undefined)}</span>
          </ScoreBadge>
          <ScoreBadge tone="warning">Gmail לא מחובר</ScoreBadge>
          <ScoreBadge tone="muted"><LtrText>Max {providerStatus.maxResults}</LtrText></ScoreBadge>
          <ScoreBadge tone="muted"><LtrText>{providerStatus.country}</LtrText></ScoreBadge>
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap gap-3">
          <form action={testDiscoveryProviderAction}>
            <input type="hidden" name="provider" value="TAVILY" />
            <NeonButton className="border-white/20 text-ink-100">בדוק Tavily</NeonButton>
          </form>
          <form action={testDiscoveryProviderAction}>
            <input type="hidden" name="provider" value="SERPAPI_GOOGLE_JOBS" />
            <NeonButton className="border-white/20 text-ink-100">בדוק SerpApi</NeonButton>
          </form>
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="min-w-0 max-w-2xl">
            <div className="text-sm font-semibold text-white">נקה לידים רועשים ישנים</div>
            <p className="mt-1 break-words text-sm leading-6 text-ink-300">
              מעביר לידים ישנים שלא ניתן לייבא ל־SKIPPED. לא מוחק כלום ולא נוגע במשרות שכבר יובאו.
            </p>
          </div>
          <form action={hideOldNonImportableDiscoveryLeads}>
            <NeonButton className="border-white/20 text-ink-100">נקה לידים רועשים ישנים</NeonButton>
          </form>
        </div>
        {notices?.run ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">הרצת גילוי נשמרה מקומית.</div> : null}
        {notices?.providerMessage ? (
          <div dir="ltr" className={`mt-4 max-w-full break-words rounded-lg border p-3 text-left text-sm ${notices.providerOk === "1" ? "border-aqua-400/30 bg-aqua-400/10 text-aqua-400" : "border-signal-red/30 bg-signal-red/10 text-ink-100"}`}>
            {notices.providerMessage}
          </div>
        ) : null}
        {notices?.enumerated ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">חילוץ המקור הסתיים: {notices.enumerated} לידים ו־{notices.candidateLinks ?? 0} מקורות חדשים.</div> : null}
        {notices?.enumerated === "0" && notices?.candidateLinks === "0" ? <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">כבר חולץ / אין קישורים חדשים, או שלא נמצאו קישורי משרות ציבוריים.</div> : null}
        {notices?.candidateClassified ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">סיווג המקור עודכן.</div> : null}
        {notices?.oldLeadsHidden ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">לידים ישנים ורועשים הוסתרו. משרות שיובאו לא נגעו.</div> : null}
        {notices?.blocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">הייבוא נחסם: הליד FORBIDDEN לפי הכללים הדטרמיניסטיים.</div> : null}
        {notices?.duplicate ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">הייבוא נחסם: הליד נראה כמו משרה שכבר קיימת.</div> : null}
        {notices?.notImportable ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">לא ניתן לייבא: זה מקור/רשימה/חיפוש, לא משרה יחידה.</div> : null}
        {notices?.enriched ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">בוצע ניסיון העשרה מחדש מה־URL הציבורי.</div> : null}
        {notices?.enrichFailed ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">העמוד נראה דינמי/חסום או שחסר תיאור משרה ברור. הליד נשאר לבדיקה ידנית ולא הומצא תיאור.</div> : null}
        {notices?.missingLead ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">הליד לא נמצא.</div> : null}
        {notices?.missingCandidate ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">המקור לא נמצא.</div> : null}
        {notices?.noUrl ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">אין למקור הזה URL להעשרה.</div> : null}
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מה לעשות עכשיו</h3>
        <ol className="mt-4 grid gap-2 text-sm leading-6 text-ink-200">
          <li>1. לחץ “בדוק Tavily”.</li>
          <li>2. התעלם מ־SerpApi אם הוא נכשל 401.</li>
          <li>3. במקורות, לחץ “נסה לחלץ משרות”.</li>
          <li>4. עבור ל־“משרות מאומתות”.</li>
          <li>5. ייבא רק משרות “מוכן לייבוא”.</li>
          <li>6. נקה לידים רועשים ישנים כשצריך.</li>
        </ol>
      </GlassCard>

      <div className="grid min-w-0 max-w-full gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <GlassCard className="min-w-0 max-w-full overflow-hidden">
          <h3 className="text-xl font-semibold text-white">הרצת גילוי</h3>
          <p className="mt-2 break-words text-sm leading-6 text-ink-200">
            סדר המקורות קבוע: אתרי קריירה של חברות, פלטפורמות, ואז Gmail ידני. אם חסר מפתח ספק, פשוט לא יתקבלו תוצאות מאותו ספק.
          </p>
          <form action={runJobDiscovery} className="mt-5 grid min-w-0 gap-4">
            <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">משפחות תפקידים ברירת מחדל</div>
              <div className="mt-3 grid gap-2 text-sm text-ink-100">
                {["AI/ML Research Student", "Junior Software Engineer", "QA Automation Junior", "Backend / Full Stack", "Technical Support Engineer", "NOC / IT", "Implementation / Integration"].map((role) => (
                  <label key={role} dir="ltr" className="flex min-w-0 items-center justify-end gap-2 break-words text-left">
                    <span className="min-w-0 break-words">{role}</span>
                    <input type="checkbox" defaultChecked disabled className="h-4 w-4 shrink-0 accent-aqua-400" />
                  </label>
                ))}
              </div>
            </div>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">טווח מיקום</span>
              <select name="locationScope" defaultValue="Israel OR remote from Israel" className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                <option value="Israel">Israel</option>
                <option value="remote from Israel">Remote from Israel</option>
                <option value="Israel OR remote from Israel">Israel + remote from Israel</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">מספר תוצאות מקסימלי</span>
              <input name="maxResults" type="number" min={1} max={50} defaultValue={providerStatus.maxResults} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" />
            </label>
            <div><NeonButton>מצא משרות מתאימות</NeonButton></div>
          </form>
          <p className="mt-4 break-words text-sm leading-6 text-ink-300">
            מפתחות API: <span dir="ltr">TAVILY_API_KEY</span>, <span dir="ltr">SERPAPI_API_KEY</span>. אין התחברות, עקיפת captcha, אימייל או הגשות.
          </p>
        </GlassCard>

        <GlassCard className="min-w-0 max-w-full overflow-hidden">
          <h3 className="text-xl font-semibold text-white">ספירת גילוי</h3>
          <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["הרצות", runs.length],
              ["לטיפול", primarySourceGroups.length],
              ["כבר עובדו", processedSourceGroups.length],
              ["משרות מאומתות", verifiedLeadGroups.length],
              ["מוכן לייבוא", readyImportCount],
              ["חסומים", counts.blocked],
              ["לא בעדיפות / דולגו", skippedOrUnsupportedCandidates.length]
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="break-words text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <NeonButton href="/gmail" className="border-white/20 text-ink-100">פתח Gmail ידני</NeonButton>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <h3 className="text-xl font-semibold text-white">הרצות גילוי</h3>
        <div className="mt-5 grid min-w-0 gap-3">
          {runs.length === 0 ? <p className="text-sm text-ink-400">אין עדיין הרצות גילוי.</p> : null}
          {runs.map((run) => (
            <div key={run.id} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="break-words font-semibold text-white">{run.query ?? "הרצת גילוי"}</div>
                  <div className="mt-1 break-words text-sm text-ink-300">{run.sourcePriority ?? "אתרי קריירה קודם"} | {formatDate(run.startedAt)}</div>
                  {run.error ? <p dir="ltr" className="mt-2 max-w-full break-words text-left text-sm text-signal-red">{run.error}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge tone={run.status === "ERROR" ? "warning" : "muted"}><LtrText>{run.status}</LtrText></ScoreBadge>
                  <ScoreBadge tone="aqua">{run.resultCount} לידים</ScoreBadge>
                </div>
              </div>
              <form action={skipNonImportedLeadsFromRun} className="mt-4">
                <input type="hidden" name="runId" value={run.id} />
                <NeonButton className="border-white/20 text-ink-100">דלג על לידים שלא יובאו מהרצה זו</NeonButton>
              </form>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white">מקורות שצריך לעבד</h3>
            <p className="mt-2 break-words text-sm leading-6 text-ink-200">
              אלה עדיין לא משרות. השתמש ב־“נסה לחלץ משרות” כדי למצוא קישורי משרה ספציפיים, או דלג.
            </p>
          </div>
          <ScoreBadge tone="warning">{primarySourceGroups.length} לטיפול</ScoreBadge>
        </div>
        <div className="mt-4 flex min-w-0 flex-wrap gap-2 text-xs text-ink-300">
          <ScoreBadge tone="aqua">משרות מאומתות</ScoreBadge>
          <ScoreBadge tone="warning">מקורות לעיבוד</ScoreBadge>
          <ScoreBadge tone="muted">לידים ישנים / רועשים</ScoreBadge>
          <ScoreBadge tone="muted">דולגו / לא נתמכים</ScoreBadge>
        </div>
        <div className="mt-5 grid min-w-0 gap-3">
          {primarySourceGroups.length === 0 ? <p className="text-sm text-ink-400">אין כרגע מקורות שדורשים חילוץ.</p> : null}
          {primarySourceGroups.length > visiblePrimarySourceGroups.length ? (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-300">
              עוד מקורות בעדיפות נמוכה יותר מופיעים למטה.
            </p>
          ) : null}
          {visiblePrimarySourceGroups.map((group) => {
            const candidate = group.primary;
            const unsupportedAggregator = isUnsupportedAggregator(candidate);
            const preview = candidate.snippet ?? candidate.rawText;
            const quality = scoreSourceCandidateQuality(candidate);
            return (
              <div key={group.key} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 max-w-3xl">
                    <div dir="auto" className="break-words font-semibold text-white">{sourceTitle(candidate.title, candidate.url)}</div>
                    <p className="mt-1 text-sm font-semibold text-ink-100">זה מקור, לא משרה</p>
                    <p className="mt-1 break-words text-sm text-ink-300">דומיין: <span dir="ltr">{domainFromUrl(candidate.url)}</span></p>
                    <p dir="auto" className="mt-1 break-words text-sm text-ink-300">למה זה עדיין לא משרה: {candidate.reason ?? "המקור עדיין לא אומת כמשרה יחידה."}</p>
                    <p className="mt-2 break-words text-sm text-aqua-400">
                      פעולה מומלצת: {candidate.source === "CAREER_LINK_EXTRACTION" ? "נסה לחלץ ולאמת את דף המשרה המדויק." : "נסה לחלץ משרות מהמקור או דלג עליו."}
                    </p>
                    {candidate.url ? <Link dir="ltr" href={candidate.url} className="mt-2 inline-flex max-w-full break-all text-left text-sm font-semibold text-aqua-400">פתח מקור</Link> : null}
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <ScoreBadge tone="warning"><LtrText>{candidate.classification}</LtrText></ScoreBadge>
                    <ScoreBadge tone="warning">צריך חילוץ</ScoreBadge>
                    <ScoreBadge tone={quality.tier === "HIGH" || quality.tier === "MEDIUM" ? "aqua" : "muted"}><LtrText>{quality.tier} {quality.score}</LtrText></ScoreBadge>
                    <ScoreBadge tone="muted"><LtrText>{candidate.confidence ?? "LOW"}</LtrText></ScoreBadge>
                    <ScoreBadge tone="aqua">{candidate.createdLeadCount} לידים</ScoreBadge>
                    {group.duplicateCount > 0 ? <ScoreBadge tone="muted">קובצו {group.duplicateCount + 1} מקורות דומים</ScoreBadge> : null}
                  </div>
                </div>
                <PreviewText value={preview} detailsLabel="הצג טקסט מקור" />
                {candidate.error ? <p dir="ltr" className="mt-2 max-w-full break-words text-left text-sm text-signal-red">{candidate.error}</p> : null}
                <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                  <form action={retryClassifySourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url}>סווג מחדש</NeonButton>
                  </form>
                  <form action={enumerateSourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url || unsupportedAggregator}>נסה לחלץ משרות</NeonButton>
                  </form>
                  <form action={skipSourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100">דלג</NeonButton>
                  </form>
                </div>
                {unsupportedAggregator ? <p className="mt-3 break-words text-sm text-signal-red">מקור אגרגטור לא נתמך. לא ניתן לייבוא ולא מומלץ לחלץ ממנו.</p> : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white">מקורות שכבר עובדו</h3>
            <p className="mt-2 break-words text-sm leading-6 text-ink-200">
              מקורות שכבר יצרו לידים או קישורי משרות. הם נשארים זמינים לבדיקה חוזרת, אבל לא תופסים את המקום של מקורות שדורשים פעולה עכשיו.
            </p>
          </div>
          <ScoreBadge tone="muted">{processedSourceGroups.length} עובדו</ScoreBadge>
        </div>
        <div className="mt-5 grid min-w-0 gap-3">
          {processedSourceGroups.length === 0 ? <p className="text-sm text-ink-400">אין כרגע מקורות שכבר עובדו.</p> : null}
          {processedSourceGroups.map((group) => {
            const candidate = group.primary;
            const preview = candidate.snippet ?? candidate.rawText;
            const quality = scoreSourceCandidateQuality(candidate);
            return (
              <div key={group.key} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 max-w-3xl">
                    <div dir="auto" className="break-words font-semibold text-white">{sourceTitle(candidate.title, candidate.url)}</div>
                    <p className="mt-1 text-sm font-semibold text-ink-100">זה מקור שכבר עובד</p>
                    <p className="mt-1 break-words text-sm text-ink-300">דומיין: <span dir="ltr">{domainFromUrl(candidate.url)}</span></p>
                    <p className="mt-2 break-words text-sm text-aqua-400">פעולה מומלצת: חזור אליו רק אם חסר מידע או אם צריך לנסות חילוץ מחדש.</p>
                    {candidate.url ? <Link dir="ltr" href={candidate.url} className="mt-2 inline-flex max-w-full break-all text-left text-sm font-semibold text-aqua-400">פתח מקור</Link> : null}
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <ScoreBadge tone="muted"><LtrText>{candidate.classification}</LtrText></ScoreBadge>
                    <ScoreBadge tone="muted"><LtrText>{quality.tier} {quality.score}</LtrText></ScoreBadge>
                    <ScoreBadge tone="aqua">{candidate.createdLeadCount ?? 0} לידים</ScoreBadge>
                    {group.duplicateCount > 0 ? <ScoreBadge tone="muted">מקורות דומים: {group.duplicateCount + 1}</ScoreBadge> : null}
                  </div>
                </div>
                <PreviewText value={preview} detailsLabel="הצג טקסט מקור" />
                {candidate.error ? <p dir="ltr" className="mt-2 max-w-full break-words text-left text-sm text-signal-red">{candidate.error}</p> : null}
                <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                  <form action={retryClassifySourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url}>סווג מחדש</NeonButton>
                  </form>
                  <form action={enumerateSourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url}>נסה לחלץ שוב</NeonButton>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <h3 className="text-xl font-semibold text-white">משרות מאומתות</h3>
        <p className="mt-2 break-words text-sm leading-6 text-ink-200">
          זו משרה אמיתית: דף משרה יחיד שאפשר לבדוק. חלק מהמשרות עדיין חסומות או דורשות בדיקה.
        </p>
        <div className="mt-4 flex min-w-0 flex-wrap gap-2 text-xs text-ink-300">
          <ScoreBadge tone="aqua">{readyImportCount} מוכן לייבוא</ScoreBadge>
          <ScoreBadge tone="warning">{counts.blocked} חסומות</ScoreBadge>
          <ScoreBadge tone="muted">{verifiedLeadGroups.length} משרות מאומתות</ScoreBadge>
        </div>
        <div className="mt-5 grid min-w-0 gap-4">
          {verifiedLeadGroups.length === 0 ? <p className="text-sm text-ink-400">אין עדיין משרות אינטרנט מאומתות.</p> : null}
          {verifiedLeadGroups.map((group) => {
            const lead = group.primary;
            const allowedSignals = jsonToStringArray(lead.allowedSignals);
            const forbiddenFlags = jsonToStringArray(lead.forbiddenFlags);
            const fitReasons = jsonToStringArray(lead.fitReasons);
            const duplicate = findDuplicateJobForLead(lead, existingJobs);
            const blocked = lead.validationStatus === "FORBIDDEN";
            const meaningfulDescription = lead.extractedDescription ?? lead.rawText;
            const verifiedPosting = isImportableSourceClassification(lead.sourceClassification);
            const enoughConfidence = lead.confidence === "MEDIUM" || lead.confidence === "HIGH";
            const importBlockedReason = !verifiedPosting
              ? "Not verified as a single job posting."
              : !enoughConfidence
                ? "Low confidence."
                : !meaningfulDescription || meaningfulDescription.trim().length < 80
                  ? "Missing meaningful job description."
                  : null;
            const imported = lead.status === "IMPORTED" && lead.importedJobId;
            const inactive = imported || lead.status === "SKIPPED" || lead.status === "DUPLICATE";
            const postingState = discoveryPostingActionState(lead, { duplicate: Boolean(duplicate && !imported) });
            const state = hebrewPostingState(lead, Boolean(duplicate && !imported), postingState.label);
            const hebrewReason = hebrewImportReason({
              blocked,
              duplicate: Boolean(duplicate && !imported),
              importBlockedReason,
              forbiddenFlags
            });
            const importDisabledReason = blocked
              ? "Blocked by deterministic role rules."
              : duplicate && !imported
                ? "Looks like an existing local job."
                : importBlockedReason;
            return (
              <div key={group.key} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 max-w-3xl">
                    <div className={`inline-flex min-h-11 max-w-full items-center rounded-lg border px-4 py-2 text-base font-semibold ${state.tone === "warning" ? "border-signal-red/40 bg-signal-red/10 text-signal-red" : state.tone === "aqua" ? "border-aqua-400/40 bg-aqua-400/10 text-aqua-400" : "border-white/20 bg-white/[0.08] text-ink-100"}`}>
                      <span className="break-words">{state.label}</span>
                    </div>
                    <h4 dir="auto" className="mt-3 break-words text-lg font-semibold text-white">{lead.title}</h4>
                    <p dir="auto" className="mt-1 break-words text-sm text-ink-200">{[lead.company, lead.location].filter(Boolean).join(" | ") || "חברה/מיקום חסרים"}</p>
                    <p dir="auto" className="mt-1 break-words text-xs text-ink-400">{getDiscoveryProviderLabel(lead.discoveryProvider ?? lead.provider)} | {lead.discoveryQuery ?? "אין שאילתה"}</p>
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <ScoreBadge tone={validationTone(lead.validationStatus)}><LtrText>{lead.validationStatus}</LtrText></ScoreBadge>
                    <ScoreBadge tone={lead.fitScore && lead.fitScore >= 70 ? "aqua" : "muted"}><LtrText>{lead.fitScore ?? 0}/100</LtrText></ScoreBadge>
                    <ScoreBadge tone="muted"><LtrText>{lead.confidence ?? "LOW"}</LtrText></ScoreBadge>
                    <ScoreBadge tone={verifiedPosting ? "aqua" : "muted"}><LtrText>{lead.sourceClassification ?? "UNCLASSIFIED"}</LtrText></ScoreBadge>
                    <ScoreBadge tone="aqua">זו משרה אמיתית</ScoreBadge>
                    <ScoreBadge tone="muted"><LtrText>{lead.status}</LtrText></ScoreBadge>
                    {group.duplicateCount > 0 ? <ScoreBadge tone="warning">כפול / הופיע {group.duplicateCount + 1} פעמים</ScoreBadge> : null}
                  </div>
                </div>
                {lead.sourceUrl ? <Link dir="ltr" href={lead.sourceUrl} className="mt-3 inline-flex max-w-full break-all text-left text-sm font-semibold text-aqua-400">פתח מקור</Link> : null}
                <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                  {allowedSignals.map((signal) => <ScoreBadge key={signal} tone="aqua"><LtrText>{signal}</LtrText></ScoreBadge>)}
                  {forbiddenFlags.map((flag) => <ScoreBadge key={flag} tone="warning"><LtrText>{flag}</LtrText></ScoreBadge>)}
                  {duplicate && !imported ? <ScoreBadge tone="warning">ייתכן כפול</ScoreBadge> : null}
                </div>
                {lead.riskNotes ? <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-200">{lead.riskNotes}</p> : null}
                {fitReasons.length > 0 ? <p dir="auto" className="mt-3 break-words text-sm leading-6 text-ink-300">{fitReasons.slice(0, 3).join(" ")}</p> : null}
                {hebrewReason ? <p className="mt-3 break-words text-sm font-semibold text-signal-red">{hebrewReason}</p> : null}
                {duplicate && !imported ? <p className="mt-3 break-words text-sm text-signal-red">נראה כמו משרה קיימת: {duplicate.title}{duplicate.company ? ` ב־${duplicate.company}` : ""}.</p> : null}
                <PreviewText value={lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet} detailsLabel="הצג תיאור מלא" />
                <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                  {imported ? <NeonButton href={`/jobs/${lead.importedJobId}`}>פתח משרה שיובאה</NeonButton> : null}
                  {!inactive ? (
                    <form action={importDiscoveryLeadToInbox}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton disabled={Boolean(importDisabledReason)}>ייבא ל־Job Inbox</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={skipDiscoveryLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">דלג</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={markDiscoveryLeadDuplicate}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">סמן ככפול</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={enrichDiscoveryLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100" disabled={!lead.sourceUrl}>העשר / נסה שוב</NeonButton>
                    </form>
                  ) : null}
                </div>
                {blocked ? <p className="mt-3 break-words text-sm text-signal-red">משרה חסומה נשארת כאן לבדיקה, אבל לא ניתן לייבא אותה בשלב הזה.</p> : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white">לידים ישנים / רועשים</h3>
            <p className="mt-2 break-words text-sm leading-6 text-ink-200">
              כאן נמצאים לידים ישנים או מקורות שלא ניתנים לייבוא, כדי שהלוח הראשי יישאר נקי.
            </p>
          </div>
          <form action={hideOldNonImportableDiscoveryLeads}>
            <NeonButton className="border-white/20 text-ink-100">נקה לידים רועשים ישנים</NeonButton>
          </form>
        </div>
        <div className="mt-5 grid min-w-0 gap-3">
          {legacyLeads.length === 0 ? <p className="text-sm text-ink-400">אין לידים ישנים/רועשים גלויים.</p> : null}
          {legacyLeads.map((lead) => (
            <div key={lead.id} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <div dir="auto" className="break-words font-semibold text-white">{lead.title}</div>
                  <p dir="auto" className="mt-1 break-words text-sm text-ink-300">{[lead.company, lead.location].filter(Boolean).join(" | ") || "חברה/מיקום חסרים"}</p>
                  <p className="mt-1 text-sm text-ink-300">ליד ישן או רועש מהרצה קודמת</p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <ScoreBadge tone="muted"><LtrText>{lead.sourceClassification ?? "UNCLASSIFIED"}</LtrText></ScoreBadge>
                  <ScoreBadge tone="warning">לא ניתן לייבוא</ScoreBadge>
                  <ScoreBadge tone="muted"><LtrText>{lead.confidence ?? "LOW"}</LtrText></ScoreBadge>
                  <ScoreBadge tone="muted"><LtrText>{lead.status}</LtrText></ScoreBadge>
                </div>
              </div>
              <PreviewText value={lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet} detailsLabel="הצג טקסט מלא" />
              <div className="mt-4 flex min-w-0 flex-wrap gap-3">
                <form action={skipDiscoveryLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <NeonButton className="border-white/20 text-ink-100">דלג</NeonButton>
                </form>
                <form action={enrichDiscoveryLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <NeonButton className="border-white/20 text-ink-100" disabled={!lead.sourceUrl}>העשר / נסה שוב</NeonButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 max-w-full overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מקורות לא בעדיפות / דולגו / לא נתמכים</h3>
        <div className="mt-5 grid min-w-0 gap-3">
          {skippedOrUnsupportedCandidates.length === 0 ? <p className="text-sm text-ink-400">אין מקורות לא בעדיפות, דולגו או לא נתמכים.</p> : null}
          {skippedOrUnsupportedCandidates.map((candidate) => (
            <div key={candidate.id} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <div dir="auto" className="break-words font-semibold text-white">{sourceTitle(candidate.title, candidate.url)}</div>
                  <p dir="auto" className="mt-1 break-words text-sm text-ink-300">{candidate.reason ?? candidate.error ?? "לא נשמרה סיבה."}</p>
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <ScoreBadge tone="muted"><LtrText>{candidate.classification}</LtrText></ScoreBadge>
                  <ScoreBadge tone="muted"><LtrText>{candidate.status}</LtrText></ScoreBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
