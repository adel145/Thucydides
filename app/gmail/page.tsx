import Link from "next/link";
import { createGmailJobAlertAndExtractLeads, importJobLeadToInbox, markJobLeadDuplicate, skipJobLead } from "@/app/gmail/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { GMAIL_ALERT_PROVIDERS, getGmailAlertProviderLabel, gmailAlertProviderLabels } from "@/lib/gmail/gmailAlertProviders";
import { countGmailAlertLeadsAwaitingReview } from "@/lib/gmail/gmailLeadCounts";
import { findDuplicateJobForLead } from "@/lib/gmail/jobLeadImport";
import { jsonToStringArray } from "@/lib/formParsing";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "אין תאריך";
  return new Date(value).toLocaleDateString("he-IL");
}

export default async function GmailPage({
  searchParams
}: {
  searchParams?: Promise<{ saved?: string; leads?: string; blocked?: string; duplicate?: string; missingLead?: string }>;
}) {
  const notices = await searchParams;
  const [alerts, leads, existingJobs] = await Promise.all([
    db.gmailJobAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { leads: { orderBy: { createdAt: "desc" } } }
    }),
    db.jobDiscoveryLead.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { gmailAlert: true }
    }),
    db.job.findMany({ select: { id: true, title: true, company: true, sourceUrl: true } })
  ]);
  const awaitingReview = countGmailAlertLeadsAwaitingReview(leads);

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Gmail Job Alerts Intake</p>
            <h2 className="mt-3 break-words text-3xl font-semibold text-white">הדבקת אימיילים של התראות משרה לבדיקה מקומית</h2>
            <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
              Intake ידני בלבד. Gmail OAuth לא מחובר, אין קריאת Inbox, אין שליחת אימיילים ואין הגשה אוטומטית.
            </p>
          </div>
          <ScoreBadge tone="warning">Gmail לא מחובר</ScoreBadge>
        </div>
        <div className="mt-4">
          <NeonButton href="/discovery" className="border-white/20 text-ink-100">פתח קודם גילוי באינטרנט</NeonButton>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ScoreBadge tone="muted">SQLite מקומי בלבד</ScoreBadge>
          <ScoreBadge tone="muted">אין scraping</ScoreBadge>
          <ScoreBadge tone="muted">אין browser automation</ScoreBadge>
          <ScoreBadge tone="aqua">{awaitingReview} לידים ידניים לבדיקה</ScoreBadge>
        </div>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">ההתראה נשמרה מקומית. חולצו {notices.leads ?? "0"} לידים מועמדים.</div> : null}
        {notices?.blocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">הייבוא נחסם: הליד FORBIDDEN לפי כללים דטרמיניסטיים.</div> : null}
        {notices?.duplicate ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">הייבוא נחסם: הליד נראה כמו משרה קיימת.</div> : null}
        {notices?.missingLead ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">הליד לא נמצא.</div> : null}
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">שמירת התראה מודבקת</h3>
        <p className="mt-2 break-words text-sm leading-6 text-ink-200">הדבק גוף אימייל אחד של התראת משרות מ-LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs או מקור אחר.</p>
        <form action={createGmailJobAlertAndExtractLeads} className="mt-5 grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Provider</span>
              <select name="provider" defaultValue={GMAIL_ALERT_PROVIDERS.OTHER} className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                {Object.values(GMAIL_ALERT_PROVIDERS).map((provider) => (
                  <option key={provider} value={provider}>{gmailAlertProviderLabels[provider]}</option>
                ))}
              </select>
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">תאריך קבלה</span>
              <input name="receivedAt" type="date" className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" />
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">שולח אופציונלי</span>
              <input dir="ltr" name="sender" className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-left text-sm text-white" placeholder="jobs-noreply@linkedin.com" />
            </label>
            <label className="min-w-0">
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">נושא אופציונלי</span>
              <input dir="auto" name="subject" className="mt-2 min-h-11 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" placeholder="New jobs for Junior Software Engineer" />
            </label>
          </div>
          <label className="min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">טקסט אימייל מודבק</span>
            <textarea dir="auto" name="rawText" required className="mt-2 min-h-56 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <label className="min-w-0">
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות אופציונליות</span>
            <textarea dir="auto" name="notes" className="mt-2 min-h-20 w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <div><NeonButton>שמור וחלץ לידים</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">כרטיסי בדיקת לידים</h3>
          <ScoreBadge tone="muted">{leads.length} לידים מקומיים אחרונים</ScoreBadge>
        </div>
        <div className="mt-5 grid min-w-0 gap-4">
          {leads.length === 0 ? <p className="text-sm text-ink-400">אין עדיין לידים מהתראות Gmail מודבקות.</p> : null}
          {leads.map((lead) => {
            const allowedSignals = jsonToStringArray(lead.allowedSignals);
            const forbiddenFlags = jsonToStringArray(lead.forbiddenFlags);
            const duplicate = findDuplicateJobForLead(lead, existingJobs);
            const blocked = lead.validationStatus === "FORBIDDEN";
            const imported = lead.status === "IMPORTED" && lead.importedJobId;
            const inactive = imported || lead.status === "SKIPPED" || lead.status === "DUPLICATE";
            return (
              <div key={lead.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 dir="auto" className="break-words text-lg font-semibold text-white">{lead.title}</h4>
                    <p dir="auto" className="mt-1 break-words text-sm text-ink-200">{[lead.company, lead.location].filter(Boolean).join(" | ") || "חברה/מיקום חסרים"}</p>
                    <p dir="auto" className="mt-1 break-words text-xs text-ink-400">{getGmailAlertProviderLabel(lead.provider)} | {lead.gmailAlert?.subject ?? "אין נושא"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScoreBadge tone={validationTone(lead.validationStatus)}>{lead.validationStatus}</ScoreBadge>
                    <ScoreBadge tone="muted">{lead.status}</ScoreBadge>
                  </div>
                </div>
                {lead.sourceUrl ? <Link dir="ltr" href={lead.sourceUrl} className="mt-3 inline-flex break-all text-left text-sm font-semibold text-aqua-400">פתח URL מקור</Link> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {allowedSignals.map((signal) => <ScoreBadge key={signal} tone="aqua">{signal}</ScoreBadge>)}
                  {forbiddenFlags.map((flag) => <ScoreBadge key={flag} tone="warning">{flag}</ScoreBadge>)}
                  {duplicate && !imported ? <ScoreBadge tone="warning">כפילות אפשרית</ScoreBadge> : null}
                </div>
                {lead.riskNotes ? <p dir="auto" className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-200">{lead.riskNotes}</p> : null}
                {duplicate && !imported ? <p dir="auto" className="mt-3 break-words text-sm text-signal-red">נראה כמו משרה קיימת: {duplicate.title}{duplicate.company ? ` ב-${duplicate.company}` : ""}.</p> : null}
                <p dir="auto" className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-navy-950/40 p-3 text-sm leading-6 text-ink-200">{lead.rawSnippet}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {imported ? <NeonButton href={`/jobs/${lead.importedJobId}`}>פתח משרה שיובאה</NeonButton> : null}
                  {!inactive ? (
                    <form action={importJobLeadToInbox}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton disabled={blocked || Boolean(duplicate)}>ייבא ל-Job Inbox</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={skipJobLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">דלג</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={markJobLeadDuplicate}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">סמן ככפול</NeonButton>
                    </form>
                  ) : null}
                </div>
                {blocked ? <p className="mt-3 break-words text-sm text-signal-red">לידים FORBIDDEN נשארים לבדיקה ואי אפשר לייבא אותם בשלב הזה.</p> : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">התראות שמורות אחרונות</h3>
        <div className="mt-5 grid min-w-0 gap-3">
          {alerts.length === 0 ? <p className="text-sm text-ink-400">אין עדיין התראות מודבקות שמורות.</p> : null}
          {alerts.map((alert) => (
            <div key={alert.id} className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div dir="auto" className="break-words font-semibold text-white">{alert.subject ?? "אין נושא"}</div>
                  <div dir="auto" className="mt-1 break-words text-sm text-ink-200">{getGmailAlertProviderLabel(alert.provider)} | {alert.sender ?? "אין שולח"}</div>
                  <div className="mt-1 text-xs text-ink-400">התקבל {formatDate(alert.receivedAt)} | נשמר {formatDate(alert.createdAt)}</div>
                </div>
                <ScoreBadge tone="muted">{alert.leads.length} לידים</ScoreBadge>
              </div>
              {alert.notes ? <p dir="auto" className="mt-3 break-words text-sm text-ink-300">{alert.notes}</p> : null}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
