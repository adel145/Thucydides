"use server";

import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { APPLICATION_DRAFT_KIND, generateApplicationDraft, validateApplicationDraftOutput } from "@/lib/ai/applicationDrafting";
import { getOpenAiDraftingConfig } from "@/lib/ai/openaiClient";
import {
  buildApplicationPacketSummary,
  sanitizeApplicationDecisionForJob,
  sanitizeApplicationPacketStatusForJob,
  normalizeCvLanguage
} from "@/lib/applications/applicationPacket";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";

export async function saveApplicationPacket(formData: FormData) {
  const jobId = requiredString(formData.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) redirect("/jobs");

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const sources = await db.sourceFile.findMany();
  const draft = {
    cvTailoringNotes: optionalString(formData.get("cvTailoringNotes")),
    recruiterMessageDraft: optionalString(formData.get("recruiterMessageDraft")),
    coverLetterDraft: optionalString(formData.get("coverLetterDraft")),
    followUpPlan: optionalString(formData.get("followUpPlan"))
  };
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], draft);
  const cvLanguage = normalizeCvLanguage(optionalString(formData.get("cvLanguage")) ?? summary.cvLanguage);
  const applicationDecision = sanitizeApplicationDecisionForJob(job, optionalString(formData.get("applicationDecision")) ?? summary.applicationDecision, summary.applicationDecision);
  const status = sanitizeApplicationPacketStatusForJob(job, optionalString(formData.get("status")), applicationDecision, summary);

  await db.applicationPacket.upsert({
    where: { jobId },
    update: {
      status,
      cvLanguage,
      applicationDecision,
      checklist: summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue,
      cvTailoringNotes: draft.cvTailoringNotes,
      skillsToHighlight: optionalString(formData.get("skillsToHighlight")),
      experienceBulletsDraft: optionalString(formData.get("experienceBulletsDraft")),
      coverLetterDraft: draft.coverLetterDraft,
      recruiterMessageDraft: draft.recruiterMessageDraft,
      followUpPlan: draft.followUpPlan
    },
    create: {
      jobId,
      status,
      cvLanguage,
      applicationDecision,
      checklist: summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue,
      cvTailoringNotes: draft.cvTailoringNotes,
      skillsToHighlight: optionalString(formData.get("skillsToHighlight")),
      experienceBulletsDraft: optionalString(formData.get("experienceBulletsDraft")),
      coverLetterDraft: draft.coverLetterDraft,
      recruiterMessageDraft: draft.recruiterMessageDraft,
      followUpPlan: draft.followUpPlan
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/application`);
  revalidatePath("/pipeline");
  revalidatePath("/resumes");
  const readyBlocked = optionalString(formData.get("status")) === "READY" && status !== "READY";
  redirect(`/jobs/${jobId}/application?saved=1${readyBlocked ? "&readyBlocked=1" : ""}`);
}

export async function markApplicationPacketReady(formData: FormData) {
  const jobId = requiredString(formData.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId }, include: { applicationPacket: true } });
  if (!job) redirect("/jobs");

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const sources = await db.sourceFile.findMany();
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], job.applicationPacket ?? {});
  const applicationDecision = sanitizeApplicationDecisionForJob(job, job.applicationPacket?.applicationDecision ?? summary.applicationDecision, summary.applicationDecision);
  const status = sanitizeApplicationPacketStatusForJob(job, "READY", applicationDecision, summary);

  if (status !== "READY") {
    redirect(`/jobs/${jobId}/application?readyBlocked=1`);
  }

  await db.applicationPacket.update({
    where: { jobId },
    data: {
      status,
      applicationDecision,
      checklist: summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/application`);
  revalidatePath("/resumes");
  redirect(`/jobs/${jobId}/application?ready=1`);
}

export async function generateApplicationAiDraft(formData: FormData) {
  const jobId = requiredString(formData.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId }, include: { applicationPacket: true } });
  if (!job) redirect("/jobs");

  const config = getOpenAiDraftingConfig();
  if (!config.enabled) redirect(`/jobs/${jobId}/application?aiDisabled=1`);
  if (job.validationStatus === "FORBIDDEN" || job.status === "ARCHIVED" || job.status === "REJECTED") {
    redirect(`/jobs/${jobId}/application?aiBlocked=1`);
  }

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const sources = await db.sourceFile.findMany({ orderBy: { updatedAt: "desc" } });
  const draft = job.applicationPacket ?? {};
  const summary = buildApplicationPacketSummary(job, profile, sources, profile?.sourceLinks ?? [], draft);
  const packet = await db.applicationPacket.upsert({
    where: { jobId },
    update: {
      checklist: summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue
    },
    create: {
      jobId,
      status: "DRAFT",
      cvLanguage: summary.cvLanguage,
      applicationDecision: summary.applicationDecision,
      checklist: summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue
    }
  });

  let aiRedirect = "aiDraft=1";
  try {
    const result = await generateApplicationDraft(job, profile, sources, profile?.sourceLinks ?? [], draft);
    await db.aiDraftRun.create({
      data: {
        applicationPacketId: packet.id,
        kind: APPLICATION_DRAFT_KIND,
        status: "DRAFT",
        model: result.model,
        promptVersion: "phase5.1-application-packet-draft-v1",
        inputSummary: result.inputSummary as Prisma.InputJsonValue,
        output: result.output as unknown as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    await db.aiDraftRun.create({
      data: {
        applicationPacketId: packet.id,
        kind: APPLICATION_DRAFT_KIND,
        status: "ERROR",
        model: config.model,
        promptVersion: "phase5.1-application-packet-draft-v1",
        inputSummary: summary as unknown as Prisma.InputJsonValue,
        error: error instanceof Error ? error.message : "Unknown AI drafting error."
      }
    });
    aiRedirect = "aiError=1";
  }

  redirect(`/jobs/${jobId}/application?${aiRedirect}`);
}

export async function saveAiDraftToPacket(formData: FormData) {
  const runId = requiredString(formData.get("runId"));
  const run = await db.aiDraftRun.findUnique({
    where: { id: runId },
    include: { applicationPacket: true }
  });
  if (!run) redirect("/jobs");

  const output = validateApplicationDraftOutput(run.output);
  if (!output) redirect(`/jobs/${run.applicationPacket.jobId}/application?aiError=1`);

  await db.applicationPacket.update({
    where: { id: run.applicationPacketId },
    data: {
      status: "DRAFT",
      cvTailoringNotes: output.cvTailoringNotes,
      skillsToHighlight: output.skillsToHighlight.join("\n"),
      experienceBulletsDraft: output.experienceBulletsDraft.map((item) => `- ${item}`).join("\n"),
      coverLetterDraft: output.coverLetterDraft,
      recruiterMessageDraft: output.recruiterMessageDraft,
      followUpPlan: output.followUpPlan
    }
  });

  revalidatePath(`/jobs/${run.applicationPacket.jobId}/application`);
  revalidatePath("/resumes");
  redirect(`/jobs/${run.applicationPacket.jobId}/application?aiSaved=1`);
}
