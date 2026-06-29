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
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
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
    <div className="grid gap-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Gmail Job Alerts Intake / تنبيهات وظائف Gmail</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Paste job-alert emails for local review</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
              Manual paste intake only. Gmail OAuth is not connected, no inbox is read, no email is sent, and no application is submitted automatically.
            </p>
          </div>
          <ScoreBadge tone="warning">Gmail not connected</ScoreBadge>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ScoreBadge tone="muted">Local SQLite only</ScoreBadge>
          <ScoreBadge tone="muted">No scraping</ScoreBadge>
          <ScoreBadge tone="muted">No browser automation</ScoreBadge>
          <ScoreBadge tone="aqua">{awaitingReview} manual leads awaiting review</ScoreBadge>
        </div>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Gmail alert saved locally. Extracted {notices.leads ?? "0"} candidate leads.</div> : null}
        {notices?.blocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Import blocked: this lead is FORBIDDEN by deterministic rules.</div> : null}
        {notices?.duplicate ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">Import blocked: this lead looks like an existing local job.</div> : null}
        {notices?.missingLead ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Lead not found.</div> : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Save pasted alert</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">Paste one job-alert email body from LinkedIn, Indeed, Drushim, AllJobs, Glassdoor, Google Jobs, or another provider.</p>
        <form action={createGmailJobAlertAndExtractLeads} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Provider</span>
              <select name="provider" defaultValue={GMAIL_ALERT_PROVIDERS.OTHER} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                {Object.values(GMAIL_ALERT_PROVIDERS).map((provider) => (
                  <option key={provider} value={provider}>{gmailAlertProviderLabels[provider]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Received date</span>
              <input name="receivedAt" type="date" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Sender optional</span>
              <input name="sender" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" placeholder="jobs-noreply@linkedin.com" />
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Subject optional</span>
              <input name="subject" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" placeholder="New jobs for Junior Software Engineer" />
            </label>
          </div>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Raw pasted email text required</span>
            <textarea name="rawText" required className="mt-2 min-h-56 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <label>
            <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Notes optional</span>
            <textarea name="notes" className="mt-2 min-h-20 w-full rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70" />
          </label>
          <div><NeonButton>Save and extract leads</NeonButton></div>
        </form>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-white">Lead review cards</h3>
          <ScoreBadge tone="muted">{leads.length} recent local leads</ScoreBadge>
        </div>
        <div className="mt-5 grid gap-4">
          {leads.length === 0 ? <p className="text-sm text-ink-400">No pasted Gmail alert leads yet.</p> : null}
          {leads.map((lead) => {
            const allowedSignals = jsonToStringArray(lead.allowedSignals);
            const forbiddenFlags = jsonToStringArray(lead.forbiddenFlags);
            const duplicate = findDuplicateJobForLead(lead, existingJobs);
            const blocked = lead.validationStatus === "FORBIDDEN";
            const imported = lead.status === "IMPORTED" && lead.importedJobId;
            const inactive = imported || lead.status === "SKIPPED" || lead.status === "DUPLICATE";
            return (
              <div key={lead.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{lead.title}</h4>
                    <p className="mt-1 text-sm text-ink-200">{[lead.company, lead.location].filter(Boolean).join(" | ") || "Company/location missing"}</p>
                    <p className="mt-1 text-xs text-ink-400">{getGmailAlertProviderLabel(lead.provider)} | {lead.gmailAlert?.subject ?? "No subject"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScoreBadge tone={validationTone(lead.validationStatus)}>{lead.validationStatus}</ScoreBadge>
                    <ScoreBadge tone="muted">{lead.status}</ScoreBadge>
                  </div>
                </div>
                {lead.sourceUrl ? <Link href={lead.sourceUrl} className="mt-3 inline-flex text-sm font-semibold text-aqua-400">Open source URL</Link> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {allowedSignals.map((signal) => <ScoreBadge key={signal} tone="aqua">{signal}</ScoreBadge>)}
                  {forbiddenFlags.map((flag) => <ScoreBadge key={flag} tone="warning">{flag}</ScoreBadge>)}
                  {duplicate && !imported ? <ScoreBadge tone="warning">Possible duplicate</ScoreBadge> : null}
                </div>
                {lead.riskNotes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-200">{lead.riskNotes}</p> : null}
                {duplicate && !imported ? <p className="mt-3 text-sm text-signal-red">Looks like existing job: {duplicate.title}{duplicate.company ? ` at ${duplicate.company}` : ""}.</p> : null}
                <p className="mt-4 whitespace-pre-wrap rounded-lg border border-white/10 bg-navy-950/40 p-3 text-sm leading-6 text-ink-200">{lead.rawSnippet}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {imported ? <NeonButton href={`/jobs/${lead.importedJobId}`}>Open imported job</NeonButton> : null}
                  {!inactive ? (
                    <form action={importJobLeadToInbox}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton disabled={blocked || Boolean(duplicate)}>Import to Job Inbox</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={skipJobLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">Skip</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={markJobLeadDuplicate}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">Mark duplicate</NeonButton>
                    </form>
                  ) : null}
                </div>
                {blocked ? <p className="mt-3 text-sm text-signal-red">Forbidden leads stay here for review and cannot be imported in this phase.</p> : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Recent saved alerts</h3>
        <div className="mt-5 grid gap-3">
          {alerts.length === 0 ? <p className="text-sm text-ink-400">No saved pasted alerts yet.</p> : null}
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{alert.subject ?? "No subject"}</div>
                  <div className="mt-1 text-sm text-ink-200">{getGmailAlertProviderLabel(alert.provider)} | {alert.sender ?? "No sender"}</div>
                  <div className="mt-1 text-xs text-ink-400">Received {formatDate(alert.receivedAt)} | Saved {formatDate(alert.createdAt)}</div>
                </div>
                <ScoreBadge tone="muted">{alert.leads.length} leads</ScoreBadge>
              </div>
              {alert.notes ? <p className="mt-3 text-sm text-ink-300">{alert.notes}</p> : null}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
