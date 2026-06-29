import { buildApplicationPacketSummary, type ApplicationPacketDraft, type ApplicationPacketJob, type ApplicationPacketProfile } from "../applications/applicationPacket";
import { isActiveJob } from "../jobs/jobReadiness";
import { type ProfileSourceLinkLike } from "../profile/profileSourceLinks";
import { type SourceReadinessSource } from "../sources/sourceReadiness";
import { createOpenAiJsonResponse, type OpenAiDraftingConfig } from "./openaiClient";

export const APPLICATION_DRAFT_KIND = "APPLICATION_PACKET_DRAFT";
export const APPLICATION_DRAFT_PROMPT_VERSION = "phase5.1-application-packet-draft-v1";

export type ApplicationDraftOutput = {
  cvTailoringNotes: string;
  skillsToHighlight: string[];
  experienceBulletsDraft: string[];
  coverLetterDraft: string;
  recruiterMessageDraft: string;
  followUpPlan: string;
  missingEvidence: string[];
  warnings: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  evidenceNotes: string[];
};

type DraftSource = SourceReadinessSource & {
  filename?: string | null;
  notes?: string | null;
  extractedText?: string | null;
};

export const applicationDraftOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "cvTailoringNotes",
    "skillsToHighlight",
    "experienceBulletsDraft",
    "coverLetterDraft",
    "recruiterMessageDraft",
    "followUpPlan",
    "missingEvidence",
    "warnings",
    "confidence",
    "evidenceNotes"
  ],
  properties: {
    cvTailoringNotes: { type: "string" },
    skillsToHighlight: { type: "array", items: { type: "string" } },
    experienceBulletsDraft: { type: "array", items: { type: "string" } },
    coverLetterDraft: { type: "string" },
    recruiterMessageDraft: { type: "string" },
    followUpPlan: { type: "string" },
    missingEvidence: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
    evidenceNotes: { type: "array", items: { type: "string" } }
  }
} as const;

function truncate(value: string | null | undefined, maxLength = 900) {
  const text = value?.trim() ?? "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isDraftOutput(value: unknown): value is ApplicationDraftOutput {
  if (!value || typeof value !== "object") return false;
  const output = value as Partial<ApplicationDraftOutput>;
  return (
    typeof output.cvTailoringNotes === "string" &&
    isStringArray(output.skillsToHighlight) &&
    isStringArray(output.experienceBulletsDraft) &&
    typeof output.coverLetterDraft === "string" &&
    typeof output.recruiterMessageDraft === "string" &&
    typeof output.followUpPlan === "string" &&
    isStringArray(output.missingEvidence) &&
    isStringArray(output.warnings) &&
    (output.confidence === "LOW" || output.confidence === "MEDIUM" || output.confidence === "HIGH") &&
    isStringArray(output.evidenceNotes)
  );
}

export function validateApplicationDraftOutput(value: unknown): ApplicationDraftOutput | null {
  if (!isDraftOutput(value)) return null;
  const hasGeneratedText = [
    value.cvTailoringNotes,
    value.coverLetterDraft,
    value.recruiterMessageDraft,
    value.followUpPlan,
    ...value.skillsToHighlight,
    ...value.experienceBulletsDraft
  ].some((item) => item.trim().length > 0);

  return hasGeneratedText ? value : null;
}

export function canRequestApplicationAiDraft(job: Pick<ApplicationPacketJob, "status" | "validationStatus">) {
  return job.validationStatus !== "FORBIDDEN" && isActiveJob(job);
}

export function getApplicationAiDraftBlockReason(config: OpenAiDraftingConfig, job: Pick<ApplicationPacketJob, "status" | "validationStatus">) {
  if (!config.enabled) return "AI_DISABLED" as const;
  if (!canRequestApplicationAiDraft(job)) return "JOB_BLOCKED" as const;
  return null;
}

export function buildAiDraftRunSuccessRecord(
  applicationPacketId: string,
  result: { model: string; inputSummary: Record<string, unknown>; output: ApplicationDraftOutput }
) {
  return {
    applicationPacketId,
    kind: APPLICATION_DRAFT_KIND,
    status: "DRAFT",
    model: result.model,
    promptVersion: APPLICATION_DRAFT_PROMPT_VERSION,
    inputSummary: result.inputSummary,
    output: result.output
  };
}

export function buildAiDraftRunErrorRecord(
  applicationPacketId: string,
  model: string | null | undefined,
  inputSummary: unknown,
  error: unknown
) {
  return {
    applicationPacketId,
    kind: APPLICATION_DRAFT_KIND,
    status: "ERROR",
    model: model ?? null,
    promptVersion: APPLICATION_DRAFT_PROMPT_VERSION,
    inputSummary,
    error: error instanceof Error ? error.message : "Unknown AI drafting error."
  };
}

export function buildPacketDraftReplacement(output: ApplicationDraftOutput) {
  return {
    status: "DRAFT",
    cvTailoringNotes: output.cvTailoringNotes,
    skillsToHighlight: output.skillsToHighlight.join("\n"),
    experienceBulletsDraft: output.experienceBulletsDraft.map((item) => `- ${item}`).join("\n"),
    coverLetterDraft: output.coverLetterDraft,
    recruiterMessageDraft: output.recruiterMessageDraft,
    followUpPlan: output.followUpPlan
  };
}

export function buildApplicationDraftRequest(
  job: ApplicationPacketJob,
  profile: ApplicationPacketProfile | null | undefined,
  sources: DraftSource[],
  links: ProfileSourceLinkLike[],
  draft: ApplicationPacketDraft = {}
): { instructions: string; input: string; inputSummary: Record<string, unknown> } {
  const summary = buildApplicationPacketSummary(job, profile, sources, links, draft);
  const sourceSnippets = sources.slice(0, 8).map((source) => ({
    type: source.type,
    filename: source.filename ?? null,
    notes: truncate(source.notes, 400),
    excerpt: truncate(source.extractedText, 900)
  }));
  const inputSummary = {
    promptVersion: APPLICATION_DRAFT_PROMPT_VERSION,
    jobTitle: "title" in job ? (job as { title?: unknown }).title : undefined,
    validationStatus: job.validationStatus,
    jobStatus: job.status,
    applicationDecision: summary.applicationDecision,
    missingItems: summary.missingItems,
    sourceCount: sources.length,
    linkedEvidenceCount: links.length
  };

  return {
    inputSummary,
    instructions: [
      "You draft review-only application packet text for Adel Mohsen.",
      "Do not apply to jobs, do not send emails, and do not imply anything was submitted.",
      "Use only the supplied job, profile, packet notes, and source evidence.",
      "Do not invent degrees, employment, achievements, tools, dates, certifications, army experience, security clearance, salary history, or fluent language claims.",
      "If evidence is weak or missing, say so in missingEvidence and warnings.",
      "Keep text concise, honest, and suitable for manual review before use.",
      "Return JSON only."
    ].join("\n"),
    input: JSON.stringify({
      job: {
        title: "title" in job ? (job as { title?: unknown }).title : null,
        company: "company" in job ? (job as { company?: unknown }).company : null,
        location: "location" in job ? (job as { location?: unknown }).location : null,
        language: job.language ?? null,
        validationStatus: job.validationStatus,
        status: job.status,
        riskNotes: job.riskNotes ?? null,
        rawDescription: truncate(job.rawDescription, 1800)
      },
      profile: {
        fullName: profile?.fullName ?? null,
        location: profile?.location ?? null,
        degreeStatus: profile?.degreeStatus ?? null,
        technicalSkills: asStringArray(profile?.technicalSkills),
        education: asStringArray(profile?.education)
      },
      packet: draft,
      deterministicSummary: summary,
      sourceSnippets
    })
  };
}

export async function generateApplicationDraft(
  job: ApplicationPacketJob,
  profile: ApplicationPacketProfile | null | undefined,
  sources: DraftSource[],
  links: ProfileSourceLinkLike[],
  draft: ApplicationPacketDraft = {}
) {
  if (!canRequestApplicationAiDraft(job)) {
    throw new Error("AI drafting is blocked for forbidden, archived, or rejected jobs.");
  }

  const request = buildApplicationDraftRequest(job, profile, sources, links, draft);
  const response = await createOpenAiJsonResponse({
    instructions: request.instructions,
    input: request.input,
    schemaName: "application_packet_draft",
    schema: applicationDraftOutputSchema,
    maxOutputTokens: 1800
  });
  const parsed = JSON.parse(response.outputText) as unknown;
  const output = validateApplicationDraftOutput(parsed);
  if (!output) throw new Error("OpenAI returned an invalid application draft.");

  return {
    output,
    inputSummary: request.inputSummary,
    model: response.model
  };
}
