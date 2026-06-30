import Link from "next/link";
import { notFound } from "next/navigation";
import { generateApplicationAiDraft, saveAiDraftToPacket, saveApplicationPacket, markApplicationPacketReady } from "@/app/jobs/[id]/application/actions";
import { PriorityBadge } from "@/components/jobs/PriorityBadge";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { canRequestApplicationAiDraft, validateApplicationDraftOutput } from "@/lib/ai/applicationDrafting";
import { getOpenAiDraftingConfig } from "@/lib/ai/openaiClient";
import { APPLICATION_DECISIONS, APPLICATION_PACKET_STATUSES, CV_LANGUAGES, buildApplicationPacketSummary, canMarkApplicationPacketReady } from "@/lib/applications/applicationPacket";
import { db } from "@/lib/db";
import { jsonToStringArray } from "@/lib/formParsing";
import { getProfileSourceTargetField, summarizeProfileEvidence } from "@/lib/profile/profileSourceLinks";
import { calculateSourceReadiness } from "@/lib/sources/sourceReadiness";
import { sourceTypeLabels } from "@/lib/sources/sourceTypes";

function validationTone(status: string) {
  if (status === "FORBIDDEN") return "warning";
  if (status === "ALLOWED") return "aqua";
  return "muted";
}

function FieldTextArea({ label, name, value, min = "min-h-28" }: { label: string; name: string; value?: string | null; min?: string }) {
  return (
    <label className="min-w-0">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</span>
      <textarea dir="auto" name={name} defaultValue={value ?? ""} className={`mt-2 ${min} w-full min-w-0 rounded-lg border border-white/20 bg-navy-950/60 p-3 text-sm leading-6 text-white outline-none focus:border-aqua-400/70`} />
    </label>
  );
}

export default async function ApplicationPacketPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; ready?: string; readyBlocked?: string; packetMissing?: string; aiDisabled?: string; aiBlocked?: string; aiDraft?: string; aiSaved?: string; aiError?: string }>;
}) {
  const { id } = await params;
  const notices = await searchParams;
  const job = await db.job.findUnique({
    where: { id },
    include: { applicationPacket: { include: { aiDraftRuns: { orderBy: { createdAt: "desc" }, take: 3 } } } }
  });
  if (!job) notFound();

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: { include: { source: true }, orderBy: { updatedAt: "desc" } } }
  });
  const sources = await db.sourceFile.findMany({ orderBy: { updatedAt: "desc" } });
  const packet = job.applicationPacket;
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], packet ?? {});
  const canMarkReady = canMarkApplicationPacketReady(summary);
  const aiConfig = getOpenAiDraftingConfig();
  const canRequestAiDraft = aiConfig.enabled && canRequestApplicationAiDraft(job);
  const latestAiRun = packet?.aiDraftRuns[0];
  const latestAiOutput = validateApplicationDraftOutput(latestAiRun?.output);
  const evidence = summarizeProfileEvidence(profile?.sourceLinks ?? []);
  const sourceReadiness = calculateSourceReadiness(sources);
  const forbiddenFlags = jsonToStringArray(job.forbiddenFlags);
  const missingEvidenceFields = summary.profileEvidenceSummary.fieldsMissingEvidence
    .map((field) => getProfileSourceTargetField(field))
    .filter((field): field is NonNullable<typeof field> => Boolean(field));
  const blockingItems = summary.checklist.filter((item) => item.critical && !item.done);
  const savedDecision = packet?.applicationDecision ?? summary.applicationDecision;
  const savedLanguage = packet?.cvLanguage ?? summary.cvLanguage;
  const readyNeedsManualReview = packet?.status === "READY" && savedDecision === "NEEDS_MANUAL_REVIEW";

  return (
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Application Packet</p>
            <h2 className="mt-3 break-words text-3xl font-semibold text-white">הכנת חבילת הגשה</h2>
            <p dir="auto" className="mt-2 text-lg font-semibold text-ink-100">{job.title}</p>
            <p dir="auto" className="mt-1 break-words text-sm text-ink-200">{[job.company, job.location].filter(Boolean).join(" | ") || "אין metadata"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            <ScoreBadge tone={validationTone(job.validationStatus)}>{job.validationStatus}</ScoreBadge>
          </div>
        </div>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          סביבת עבודה ידנית למשרה אחת. בדוק ראיות, ערוך שדות חבילה, והשאר הכל באישור Adel. שום דבר לא נשלח אוטומטית.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-aqua-400">המלצה</div>
            <div className="mt-2 text-lg font-semibold text-white">{savedDecision}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">סטטוס חבילה</div>
            <div className="mt-2 text-lg font-semibold text-white">{packet?.status ?? "DRAFT"}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">שפת CV</div>
            <div className="mt-2 text-lg font-semibold text-white">{savedLanguage}</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-ink-200">
          READY אומר ששדות החבילה ופריטי checklist קריטיים הושלמו. NEEDS_MANUAL_REVIEW אומר ש-Adel עדיין בודק התאמה לפני הגשה.
          {readyNeedsManualReview ? <div className="mt-2 font-semibold text-aqua-400">מוכן אחרי בדיקה ידנית</div> : null}
        </div>
        {notices?.saved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">חבילת ההגשה נשמרה מקומית.</div> : null}
        {notices?.ready ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">חבילת ההגשה סומנה READY.</div> : null}
        {notices?.readyBlocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">READY נחסם על ידי safety gate. תקן פריטים קריטיים או בדוק קודם את החלטת המשרה.</div> : null}
        {notices?.packetMissing ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">צור ושמור Application Packet לפני סימון READY.</div> : null}
        {notices?.aiDisabled ? <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-100">AI drafting לא מוגדר. הוסף OPENAI_API_KEY וגם OPENAI_MODEL כדי להפעיל אותו.</div> : null}
        {notices?.aiBlocked ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">AI drafting חסום למשרות forbidden, archived או rejected.</div> : null}
        {notices?.aiDraft ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">טיוטת AI נוצרה לבדיקה. שום דבר לא נשלח.</div> : null}
        {notices?.aiSaved ? <div className="mt-4 rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-aqua-400">טיוטת AI החליפה את שדות הטיוטה בחבילה לעריכה ידנית. שום דבר לא נשלח.</div> : null}
        {notices?.aiError ? <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">AI drafting נכשל. בדוק את שגיאת הריצה האחרונה או את ההגדרות.</div> : null}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-xl font-semibold text-white">מוכנות חבילת הגשה</h3>
          <p className="mt-2 break-words text-sm leading-6 text-ink-200">READY חסום עד שפריטים נדרשים הושלמו. ראיות עוזרות לבדיקה ידנית, אבל טקסט הפרופיל עדיין צריך להיכתב על ידי Adel.</p>
          <div className="mt-4 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">החלטה</div>
              <div className="mt-2 font-semibold text-white">{savedDecision}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">שפת CV</div>
              <div className="mt-2 font-semibold text-white">{savedLanguage}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Checklist</div>
              <div className="mt-2 font-semibold text-white">{summary.readyCount} / {summary.totalCount}</div>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-white/10 bg-navy-950/40 p-4">
            <h4 className="font-semibold text-white">מה חוסם READY</h4>
            <div className="mt-3 grid gap-2 text-sm text-ink-200">
              {blockingItems.length === 0 ? <p className="text-aqua-400">אין חסמים קריטיים. בדוק ראיות ושמור את החבילה לפני הגשה.</p> : null}
              {blockingItems.map((item) => <p key={item.label}>{item.missingText}</p>)}
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {summary.checklist.map((item) => (
              <div key={item.label} className={`rounded-lg border p-3 text-sm ${item.done ? "border-aqua-400/30 bg-aqua-400/10 text-ink-100" : "border-signal-red/30 bg-signal-red/10 text-ink-100"}`}>
                <span className="font-semibold">{item.done ? "בוצע" : "חסר"}:</span> {item.label}{item.critical ? <span className="mr-2 text-xs uppercase tracking-[0.14em] text-ink-400">נדרש</span> : null}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="min-w-0 overflow-hidden">
          <h3 className="text-xl font-semibold text-white">שדות עריכת חבילה</h3>
          <p className="mt-2 break-words text-sm leading-6 text-ink-200">כתוב חומר טיוטה לבדיקה של Adel. שמירה כאן לא שולחת ולא מגישה כלום. יצוא DOCX/PDF מתוכנן להמשך; כרגע נשמר טקסט חבילה ידני בלבד.</p>
          <form action={saveApplicationPacket} className="mt-5 grid gap-4">
            <input type="hidden" name="jobId" value={job.id} />
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">סטטוס חבילה</span>
              <select name="status" defaultValue={packet?.status ?? "DRAFT"} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                  {APPLICATION_PACKET_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">שפת CV</span>
              <select name="cvLanguage" defaultValue={packet?.cvLanguage ?? summary.cvLanguage} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                  {CV_LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-[0.16em] text-ink-400">החלטה</span>
              <select name="applicationDecision" defaultValue={packet?.applicationDecision ?? summary.applicationDecision} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-navy-950/60 px-3 text-sm text-white">
                  {APPLICATION_DECISIONS.map((decision) => <option key={decision} value={decision}>{decision}</option>)}
                </select>
              </label>
            </div>
            <FieldTextArea label="הערות התאמת CV" name="cvTailoringNotes" value={packet?.cvTailoringNotes} />
            <FieldTextArea label="כישורים להדגשה" name="skillsToHighlight" value={packet?.skillsToHighlight} />
            <FieldTextArea label="טיוטת bullet points לניסיון" name="experienceBulletsDraft" value={packet?.experienceBulletsDraft} min="min-h-36" />
            <FieldTextArea label="טיוטת cover letter / cover note" name="coverLetterDraft" value={packet?.coverLetterDraft} min="min-h-36" />
            <FieldTextArea label="טיוטת הודעה למגייס" name="recruiterMessageDraft" value={packet?.recruiterMessageDraft} />
            <FieldTextArea label="תוכנית follow-up" name="followUpPlan" value={packet?.followUpPlan} />
            <div><NeonButton className="border-aqua-400 bg-aqua-400 text-navy-950 hover:bg-aqua-500">שמור חבילה</NeonButton></div>
          </form>
          {packet ? (
            <form action={markApplicationPacketReady} className="mt-3">
              <input type="hidden" name="jobId" value={job.id} />
              <NeonButton className="border-white/20 text-ink-100" disabled={!canMarkReady}>סמן READY</NeonButton>
            </form>
          ) : null}
        </GlassCard>
      </div>

      <GlassCard className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-white">AI drafting מבוקר</h3>
            <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-ink-200">
              עוזר טיוטה אופציונלי לחבילה הזו בלבד. הוא משתמש בפרופיל, Sources ונתוני משרה שמורים. Adel עדיין בודק ומחליט מה להשתמש.
            </p>
          </div>
          <form action={generateApplicationAiDraft}>
            <input type="hidden" name="jobId" value={job.id} />
            <NeonButton disabled={!canRequestAiDraft}>צור טיוטה לבדיקה</NeonButton>
          </form>
        </div>
        {!aiConfig.enabled ? (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-ink-200">
            AI drafting לא מוגדר. הגדר `OPENAI_API_KEY` ו-`OPENAI_MODEL` כדי להפעיל ניסוח מבוקר. Gmail נפרד ולא מחובר.
          </div>
        ) : null}
        {aiConfig.enabled && !canRequestApplicationAiDraft(job) ? (
          <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">
            ניסוח חסום למשרות forbidden, archived או rejected.
          </div>
        ) : null}
        {latestAiRun?.status === "ERROR" ? (
          <div className="mt-4 rounded-lg border border-signal-red/30 bg-signal-red/10 p-3 text-sm text-ink-100">
            הריצה האחרונה נכשלה: <span dir="auto">{latestAiRun.error ?? "שגיאה לא ידועה"}</span>
          </div>
        ) : null}
        {latestAiOutput ? (
          <div className="mt-5 grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">הערות התאמת CV</div>
              <p dir="auto" className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-100">{latestAiOutput.cvTailoringNotes}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">כישורים</div>
                <ul className="mt-2 grid gap-1 text-sm text-ink-100">
                  {latestAiOutput.skillsToHighlight.map((item) => <li dir="auto" key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-400">אזהרות</div>
                <ul className="mt-2 grid gap-1 text-sm text-ink-100">
                  {[...latestAiOutput.missingEvidence, ...latestAiOutput.warnings].map((item) => <li dir="auto" key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-[0.16em] text-ink-400">הודעה למגייס</div>
              <p dir="auto" className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-100">{latestAiOutput.recruiterMessageDraft}</p>
            </div>
            <form action={saveAiDraftToPacket}>
              <input type="hidden" name="runId" value={latestAiRun?.id} />
              <p className="mb-3 max-w-3xl text-sm leading-6 text-ink-200">
                זו פעולת העתקה ידנית. היא תחליף את שדות הטיוטה הנוכחיים בחבילה, אבל שום דבר לא נשלח או מוגש אוטומטית.
              </p>
              <NeonButton className="border-white/20 text-ink-100">החלף את שדות החבילה בטיוטת AI הזו</NeonButton>
            </form>
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">ראיות פרופיל</h3>
        <p className="mt-2 break-words text-sm leading-6 text-ink-200">
          קישורי ראיות ידניים בלבד. בדוק CV, LinkedIn, GitHub, פרויקטים, תעודות ומקורות אקדמיים לפני הגשה.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">לפני הגשה, הוסף/בדוק את המקורות האלה</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {sourceReadiness.missing.length === 0 && missingEvidenceFields.length === 0 ? <p className="text-aqua-400">Core source groups and evidence links are covered.</p> : null}
              {sourceReadiness.missing.map((item) => <p key={item.label}>{item.note}</p>)}
              {missingEvidenceFields.slice(0, 6).map((field) => <p key={field.key}>קשר ראיה עבור {field.label}.</p>)}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-400">Sources זמינים</div>
            <div className="mt-2 grid gap-2 text-sm text-ink-200">
              {sources.length === 0 ? <p className="text-ink-400">אין עדיין Sources.</p> : null}
              {sources.slice(0, 6).map((source) => (
                <Link key={source.id} href={`/sources/${source.id}`} className="rounded-lg border border-white/20 bg-white/[0.07] p-2 hover:border-aqua-400/50">
                  <span dir="auto">{source.filename}</span> | {sourceTypeLabels[source.type as keyof typeof sourceTypeLabels] ?? source.type}
                </Link>
              ))}
              {sources.length > 6 ? <Link href="/sources" className="text-aqua-400">בדוק את כל ה-Sources</Link> : null}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {Object.entries(evidence.grouped).map(([targetField, links]) => {
            const field = getProfileSourceTargetField(targetField);
            return (
              <div key={targetField} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="font-semibold text-white">{field?.label ?? targetField} ({links.length})</div>
                <div className="mt-2 grid gap-2 text-sm text-ink-200">
                  {links.length === 0 ? <p className="text-ink-400">אין ראיות מקושרות.</p> : null}
                  {links.map((link) => (
                    <Link key={link.id} href={`/sources/${link.sourceId}`} className="rounded-lg border border-white/20 bg-white/[0.07] p-2 hover:border-aqua-400/50">
                      <span dir="auto">{link.source.filename}</span> | {sourceTypeLabels[link.source.type as keyof typeof sourceTypeLabels] ?? link.source.type}
                      {link.note ? <span dir="auto"> | {link.note}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">סיכונים וחסמים</h3>
        <div className="mt-4 grid gap-3 text-sm text-ink-200">
          {forbiddenFlags.length > 0 ? <div className="rounded-lg border border-signal-red/30 bg-signal-red/10 p-3">Forbidden flags: {forbiddenFlags.join(", ")}</div> : null}
          {job.riskNotes ? <div dir="auto" className="rounded-lg border border-white/10 bg-white/[0.03] p-3 whitespace-pre-wrap break-words">{job.riskNotes}</div> : null}
          {forbiddenFlags.length === 0 && !job.riskNotes ? <p className="text-ink-400">אין הערות סיכון או forbidden flags שמורים.</p> : null}
        </div>
      </GlassCard>

      <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-aqua-400">חזרה לפרטי משרה</Link>
    </div>
  );
}
