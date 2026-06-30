import Link from "next/link";
import { enrichDiscoveryLead, enumerateSourceCandidate, hideOldNonImportableDiscoveryLeads, importDiscoveryLeadToInbox, markDiscoveryLeadDuplicate, retryClassifySourceCandidate, runJobDiscovery, skipDiscoveryLead, skipNonImportedLeadsFromRun, skipSourceCandidate, testDiscoveryProviderAction } from "@/app/discovery/actions";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { db } from "@/lib/db";
import { getDiscoveryProviderStatus, getDiscoveryProviderLabel } from "@/lib/discovery/discoveryProviders";
import { discoveryPostingActionState, isLegacyOrNoisyDiscoveryLead, isVerifiedImportableDiscoveryLead } from "@/lib/discovery/discoveryLeadViews";
import { countDiscoveryLeads } from "@/lib/discovery/jobDiscoveryCounts";
import { isImportableSourceClassification } from "@/lib/discovery/pageClassifier";
import { providerStatusLabel } from "@/lib/discovery/providerDiagnostics";
import { findDuplicateJobForLead } from "@/lib/gmail/jobLeadImport";
import { jsonToStringArray } from "@/lib/formParsing";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleString();
}

function candidateNeedsAction(candidate: { status: string; classification: string; source?: string | null; createdLeadCount?: number | null }) {
  if (candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED") return false;
  if (candidate.source === "CAREER_LINK_EXTRACTION" && (candidate.createdLeadCount ?? 0) === 0) return true;
  return (
    !isImportableSourceClassification(candidate.classification) &&
    ["ATS_BOARD", "CAREERS_LISTING", "COMPANY_CAREERS_HOME", "SEARCH_RESULTS_PAGE", "UNKNOWN"].includes(candidate.classification)
  );
}

function isUnsupportedAggregator(candidate: { classification: string; title?: string | null; url?: string | null }) {
  return candidate.classification === "THIRD_PARTY_AGGREGATOR_LIST" || /glassdoor|linkedin\.com\/jobs|indeed|alljobs|drushim/i.test(`${candidate.title ?? ""} ${candidate.url ?? ""}`);
}

function domainFromUrl(value?: string | null) {
  if (!value) return "No URL";
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Invalid URL";
  }
}

export default async function DiscoveryPage({
  searchParams
}: {
  searchParams?: Promise<{
    run?: string;
    blocked?: string;
    duplicate?: string;
    enriched?: string;
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
  const candidatesNeedingAction = candidates.filter(candidateNeedsAction);
  const skippedOrUnsupportedCandidates = candidates.filter((candidate) => candidate.status === "SKIPPED" || candidate.status === "UNSUPPORTED");
  const verifiedLeads = leads.filter(isVerifiedImportableDiscoveryLead);
  const legacyLeads = leads.filter(isLegacyOrNoisyDiscoveryLead);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Internet Job Discovery</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Find suitable jobs for review</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
              Company career pages first, platforms second, Gmail alerts third. Discovery creates review leads only; Adel chooses what to import.
            </p>
          </div>
          <ScoreBadge tone="muted">Manual review required</ScoreBadge>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <ScoreBadge tone={providerStatus.tavilyConfigured ? "aqua" : "warning"}>
            {providerStatusLabel("TAVILY", providerStatus.tavilyConfigured, providerTest === "TAVILY" ? providerTestState : undefined)}
          </ScoreBadge>
          <ScoreBadge tone={providerStatus.serpApiConfigured ? "aqua" : "warning"}>
            {providerStatusLabel("SERPAPI_GOOGLE_JOBS", providerStatus.serpApiConfigured, providerTest === "SERPAPI_GOOGLE_JOBS" ? providerTestState : undefined)}
          </ScoreBadge>
          <ScoreBadge tone="warning">Gmail not connected</ScoreBadge>
          <ScoreBadge tone="muted">Max {providerStatus.maxResults}</ScoreBadge>
          <ScoreBadge tone="muted">{providerStatus.country}</ScoreBadge>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={testDiscoveryProviderAction}>
            <input type="hidden" name="provider" value="TAVILY" />
            <NeonButton className="border-white/20 text-ink-100">Test Tavily</NeonButton>
          </form>
          <form action={testDiscoveryProviderAction}>
            <input type="hidden" name="provider" value="SERPAPI_GOOGLE_JOBS" />
            <NeonButton className="border-white/20 text-ink-100">Test SerpApi</NeonButton>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div>
            <div className="text-sm font-semibold text-white">Clean old noisy leads</div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-300">
              Moves old non-importable discovery leads to SKIPPED. Does not delete anything and does not touch imported jobs.
            </p>
          </div>
          <form action={hideOldNonImportableDiscoveryLeads}>
            <NeonButton className="border-white/20 text-ink-100">Clean old noisy leads</NeonButton>
          </form>
        </div>
        {notices?.run ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Discovery run saved locally.</div> : null}
        {notices?.providerMessage ? (
          <div className={`mt-4 rounded-lg border p-3 text-sm ${notices.providerOk === "1" ? "border-aqua-400/30 bg-aqua-400/10 text-aqua-400" : "border-signal-red/30 bg-signal-red/10 text-ink-100"}`}>
            {notices.providerMessage}
          </div>
        ) : null}
        {notices?.enumerated ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Candidate enumeration finished: {notices.enumerated} leads and {notices.candidateLinks ?? 0} source candidates created.</div> : null}
        {notices?.enumerated === "0" && notices?.candidateLinks === "0" ? <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">Already enumerated / no new links, or no visible public job links were found.</div> : null}
        {notices?.candidateClassified ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Source candidate classification refreshed.</div> : null}
        {notices?.oldLeadsHidden ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Old non-importable discovery leads were hidden. Imported jobs were not touched.</div> : null}
        {notices?.blocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Import blocked: this lead is FORBIDDEN by deterministic rules.</div> : null}
        {notices?.duplicate ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">Import blocked: this lead looks like an existing local job.</div> : null}
        {notices?.notImportable ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">Not importable: source is a listing/search/career page, not a single job posting.</div> : null}
        {notices?.enriched ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">Lead enrichment retried from the public source URL.</div> : null}
        {notices?.missingLead ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Lead not found.</div> : null}
        {notices?.missingCandidate ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">Source candidate not found.</div> : null}
        {notices?.noUrl ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">This lead has no source URL to enrich.</div> : null}
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">What to do next</h3>
        <ol className="mt-4 grid gap-2 text-sm leading-6 text-ink-200">
          <li>1. Test Tavily.</li>
          <li>2. Ignore SerpApi until its key/account is fixed.</li>
          <li>3. Click Try enumerate jobs on Workday/company career candidates.</li>
          <li>4. Review Verified job postings.</li>
          <li>5. Import only non-blocked, non-duplicate postings.</li>
          <li>6. Clean old noisy leads when needed.</li>
        </ol>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Run discovery</h3>
          <p className="mt-2 text-sm leading-6 text-ink-200">
            Source priority is fixed: company career pages, then job platforms, then Gmail fallback. Missing provider keys simply produce no provider results.
          </p>
          <form action={runJobDiscovery} className="mt-5 grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Default role families</div>
              <div className="mt-3 grid gap-2 text-sm text-ink-100">
                {["AI/ML Research Student", "Junior Software Engineer", "QA Automation Junior", "Backend / Full Stack", "Technical Support Engineer", "NOC / IT", "Implementation / Integration"].map((role) => (
                  <label key={role} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked disabled className="h-4 w-4 accent-aqua-400" />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Location scope</span>
              <select name="locationScope" defaultValue="Israel OR remote from Israel" className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                <option value="Israel">Israel</option>
                <option value="remote from Israel">Remote from Israel</option>
                <option value="Israel OR remote from Israel">Israel + remote from Israel</option>
              </select>
            </label>
            <label>
              <span className="text-xs uppercase tracking-[0.16em] text-ink-400">Max results</span>
              <input name="maxResults" type="number" min={1} max={50} defaultValue={providerStatus.maxResults} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white" />
            </label>
            <div><NeonButton>Find suitable jobs</NeonButton></div>
          </form>
          <p className="mt-4 text-sm leading-6 text-ink-300">
            API keys: `TAVILY_API_KEY`, `SERPAPI_API_KEY`. No login, captcha bypass, email, or applications.
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-semibold text-white">Discovery counts</h3>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
            {[
              ["Runs", runs.length],
              ["Need action", candidatesNeedingAction.length],
              ["New leads", counts.newLeads],
              ["Enriched", counts.enrichedLeads],
              ["Needs review", counts.needsReview],
              ["Blocked", counts.blocked],
              ["Imported", counts.imported]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <NeonButton href="/gmail" className="border-white/20 text-ink-100">Open Gmail fallback</NeonButton>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Discovery runs</h3>
        <div className="mt-5 grid gap-3">
          {runs.length === 0 ? <p className="text-sm text-ink-400">No discovery runs yet.</p> : null}
          {runs.map((run) => (
            <div key={run.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{run.query ?? "Discovery run"}</div>
                  <div className="mt-1 text-sm text-ink-300">{run.sourcePriority ?? "Company careers first"} | {formatDate(run.startedAt)}</div>
                  {run.error ? <p className="mt-2 text-sm text-signal-red">{run.error}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge tone={run.status === "ERROR" ? "warning" : "muted"}>{run.status}</ScoreBadge>
                  <ScoreBadge tone="aqua">{run.resultCount} leads</ScoreBadge>
                </div>
              </div>
              <form action={skipNonImportedLeadsFromRun} className="mt-4">
                <input type="hidden" name="runId" value={run.id} />
                <NeonButton className="border-white/20 text-ink-100">Skip non-imported leads from this run</NeonButton>
              </form>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Sources to process</h3>
            <p className="mt-2 text-sm leading-6 text-ink-200">
              These are not jobs yet. Use Try enumerate jobs to extract specific job links, or Skip.
            </p>
          </div>
          <ScoreBadge tone="warning">{candidatesNeedingAction.length} need action</ScoreBadge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-300">
          <ScoreBadge tone="aqua">Verified job postings</ScoreBadge>
          <ScoreBadge tone="warning">Sources to process</ScoreBadge>
          <ScoreBadge tone="muted">Legacy/noisy leads</ScoreBadge>
          <ScoreBadge tone="muted">Skipped/unsupported</ScoreBadge>
        </div>
        <div className="mt-5 grid gap-3">
          {candidatesNeedingAction.length === 0 ? <p className="text-sm text-ink-400">No source candidates need enumeration right now.</p> : null}
          {candidatesNeedingAction.map((candidate) => {
            const unsupportedAggregator = isUnsupportedAggregator(candidate);
            return (
              <div key={candidate.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{candidate.title ?? candidate.url ?? "Untitled source"}</div>
                    <p className="mt-1 text-sm font-semibold text-ink-100">Not a job yet</p>
                    <p className="mt-1 text-sm text-ink-300">Domain: {domainFromUrl(candidate.url)}</p>
                    <p className="mt-1 text-sm text-ink-300">Why this is not a job yet: {candidate.reason ?? "This source has not been verified as a single posting."}</p>
                    {candidate.source === "CAREER_LINK_EXTRACTION" ? (
                      <p className="mt-2 text-sm text-aqua-400">Extracted from career listing. Click Try enumerate jobs to verify this exact job page.</p>
                    ) : null}
                    {candidate.url ? <Link href={candidate.url} className="mt-2 inline-flex text-sm font-semibold text-aqua-400">Open source</Link> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScoreBadge tone="warning">{candidate.classification}</ScoreBadge>
                    <ScoreBadge tone="warning">Needs enumeration</ScoreBadge>
                    <ScoreBadge tone="muted">{candidate.confidence ?? "LOW"}</ScoreBadge>
                    <ScoreBadge tone="aqua">{candidate.createdLeadCount} leads</ScoreBadge>
                  </div>
                </div>
                {candidate.snippet ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-300">{candidate.snippet}</p> : null}
                {candidate.error ? <p className="mt-2 text-sm text-signal-red">{candidate.error}</p> : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={retryClassifySourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url}>Retry classify</NeonButton>
                  </form>
                  <form action={enumerateSourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100" disabled={!candidate.url || unsupportedAggregator}>Try enumerate jobs</NeonButton>
                  </form>
                  <form action={skipSourceCandidate}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <NeonButton className="border-white/20 text-ink-100">Skip candidate</NeonButton>
                  </form>
                </div>
                {unsupportedAggregator ? <p className="mt-3 text-sm text-signal-red">Unsupported aggregator. Not importable and enumeration is not encouraged.</p> : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Verified job postings</h3>
        <p className="mt-2 text-sm leading-6 text-ink-200">
          These are real single job postings. Some may still be blocked by role rules.
        </p>
        <div className="mt-5 grid gap-4">
          {verifiedLeads.length === 0 ? <p className="text-sm text-ink-400">No verified internet job postings yet.</p> : null}
          {verifiedLeads.map((lead) => {
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
            const importDisabledReason = blocked
              ? "Blocked by deterministic role rules."
              : duplicate && !imported
                ? "Looks like an existing local job."
                : importBlockedReason;
            return (
              <div key={lead.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{lead.title}</h4>
                    <p className="mt-1 text-sm text-ink-200">{[lead.company, lead.location].filter(Boolean).join(" | ") || "Company/location missing"}</p>
                    <p className="mt-1 text-xs text-ink-400">{getDiscoveryProviderLabel(lead.discoveryProvider ?? lead.provider)} | {lead.discoveryQuery ?? "No query"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ScoreBadge tone={validationTone(lead.validationStatus)}>{lead.validationStatus}</ScoreBadge>
                    <ScoreBadge tone={lead.fitScore && lead.fitScore >= 70 ? "aqua" : "muted"}>{lead.fitScore ?? 0}/100</ScoreBadge>
                    <ScoreBadge tone="muted">{lead.confidence ?? "LOW"}</ScoreBadge>
                    <ScoreBadge tone={verifiedPosting ? "aqua" : "muted"}>{lead.sourceClassification ?? "UNCLASSIFIED"}</ScoreBadge>
                    <ScoreBadge tone="aqua">Verified job posting</ScoreBadge>
                    <ScoreBadge tone={postingState.tone}>{postingState.label}</ScoreBadge>
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
                {fitReasons.length > 0 ? <p className="mt-3 text-sm leading-6 text-ink-300">{fitReasons.slice(0, 3).join(" ")}</p> : null}
                {importDisabledReason ? <p className="mt-3 text-sm text-signal-red">{importDisabledReason}</p> : null}
                {!importDisabledReason && postingState.reason ? <p className="mt-3 text-sm text-ink-300">{postingState.reason}</p> : null}
                {duplicate && !imported ? <p className="mt-3 text-sm text-signal-red">Looks like existing job: {duplicate.title}{duplicate.company ? ` at ${duplicate.company}` : ""}.</p> : null}
                <p className="mt-4 line-clamp-5 whitespace-pre-wrap rounded-lg border border-white/10 bg-navy-950/40 p-3 text-sm leading-6 text-ink-200">
                  {lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {imported ? <NeonButton href={`/jobs/${lead.importedJobId}`}>Open imported job</NeonButton> : null}
                  {!inactive ? (
                    <form action={importDiscoveryLeadToInbox}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton disabled={Boolean(importDisabledReason)}>Import to Job Inbox</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={skipDiscoveryLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">Skip</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={markDiscoveryLeadDuplicate}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100">Mark duplicate</NeonButton>
                    </form>
                  ) : null}
                  {!inactive ? (
                    <form action={enrichDiscoveryLead}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <NeonButton className="border-white/20 text-ink-100" disabled={!lead.sourceUrl}>Enrich/retry</NeonButton>
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Legacy/noisy leads</h3>
            <p className="mt-2 text-sm leading-6 text-ink-200">
              Old or non-importable discovery leads live here so the main board stays trusted.
            </p>
          </div>
          <form action={hideOldNonImportableDiscoveryLeads}>
            <NeonButton className="border-white/20 text-ink-100">Hide old non-importable leads</NeonButton>
          </form>
        </div>
        <div className="mt-5 grid gap-3">
          {legacyLeads.length === 0 ? <p className="text-sm text-ink-400">No legacy/noisy leads visible.</p> : null}
          {legacyLeads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{lead.title}</div>
                  <p className="mt-1 text-sm text-ink-300">{[lead.company, lead.location].filter(Boolean).join(" | ") || "Company/location missing"}</p>
                  <p className="mt-1 text-sm text-ink-300">Old/noisy lead from earlier run</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge tone="muted">{lead.sourceClassification ?? "UNCLASSIFIED"}</ScoreBadge>
                  <ScoreBadge tone="warning">Not importable</ScoreBadge>
                  <ScoreBadge tone="muted">{lead.confidence ?? "LOW"}</ScoreBadge>
                  <ScoreBadge tone="muted">{lead.status}</ScoreBadge>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-ink-300">{lead.extractedDescription ?? lead.rawText ?? lead.rawSnippet}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={skipDiscoveryLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <NeonButton className="border-white/20 text-ink-100">Skip</NeonButton>
                </form>
                <form action={enrichDiscoveryLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <NeonButton className="border-white/20 text-ink-100" disabled={!lead.sourceUrl}>Enrich/retry</NeonButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Skipped/unsupported source candidates</h3>
        <div className="mt-5 grid gap-3">
          {skippedOrUnsupportedCandidates.length === 0 ? <p className="text-sm text-ink-400">No skipped or unsupported candidates.</p> : null}
          {skippedOrUnsupportedCandidates.map((candidate) => (
            <div key={candidate.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{candidate.title ?? candidate.url ?? "Untitled source"}</div>
                  <p className="mt-1 text-sm text-ink-300">{candidate.reason ?? candidate.error ?? "No reason saved."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge tone="muted">{candidate.classification}</ScoreBadge>
                  <ScoreBadge tone="muted">{candidate.status}</ScoreBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
