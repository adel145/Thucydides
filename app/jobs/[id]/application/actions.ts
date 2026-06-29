"use server";

import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildAiDraftRunErrorRecord,
  buildAiDraftRunSuccessRecord,
  buildPacketDraftReplacement,
  generateApplicationDraft,
  getApplicationAiDraftBlockReason,
  validateApplicationDraftOutput
} from "@/lib/ai/applicationDrafting";
import { getOpenAiDraftingConfig } from "@/lib/ai/openaiClient";
import {
  buildApplicationPacketSummary,
  prepareApplicationPacketSave,
  prepareMarkApplicationPacketReady
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
  const prepared = prepareApplicationPacketSave(job, profile, sources, profile?.sourceLinks ?? [], draft, {
    status: optionalString(formData.get("status")),
    applicationDecision: optionalString(formData.get("applicationDecision")),
    cvLanguage: optionalString(formData.get("cvLanguage"))
  });

  await db.applicationPacket.upsert({
    where: { jobId },
    update: {
      status: prepared.status,
      cvLanguage: prepared.cvLanguage,
      applicationDecision: prepared.applicationDecision,
      checklist: prepared.summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: prepared.summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: prepared.summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue,
      cvTailoringNotes: draft.cvTailoringNotes,
      skillsToHighlight: optionalString(formData.get("skillsToHighlight")),
      experienceBulletsDraft: optionalString(formData.get("experienceBulletsDraft")),
      coverLetterDraft: draft.coverLetterDraft,
      recruiterMessageDraft: draft.recruiterMessageDraft,
      followUpPlan: draft.followUpPlan
    },
    create: {
      jobId,
      status: prepared.status,
      cvLanguage: prepared.cvLanguage,
      applicationDecision: prepared.applicationDecision,
      checklist: prepared.summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: prepared.summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: prepared.summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue,
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
  redirect(`/jobs/${jobId}/application?saved=1${prepared.readyBlocked ? "&readyBlocked=1" : ""}`);
}

export async function markApplicationPacketReady(formData: FormData) {
  const jobId = requiredString(formData.get("jobId"));
  const job = await db.job.findUnique({ where: { id: jobId }, include: { applicationPacket: true } });
  if (!job) redirect("/jobs");
  if (!job.applicationPacket) redirect(`/jobs/${jobId}/application?packetMissing=1`);

  const profile = await db.candidateProfile.findFirst({
    orderBy: { createdAt: "asc" },
    include: { sourceLinks: true }
  });
  const sources = await db.sourceFile.findMany();
  const prepared = prepareMarkApplicationPacketReady(job, profile, sources, profile?.sourceLinks ?? [], job.applicationPacket);

  if (!prepared.ok) {
    redirect(`/jobs/${jobId}/application?readyBlocked=1`);
  }

  await db.applicationPacket.update({
    where: { jobId },
    data: {
      status: prepared.status,
      applicationDecision: prepared.applicationDecision,
      checklist: prepared.summary.checklist as unknown as Prisma.InputJsonValue,
      missingItems: prepared.summary.missingItems as unknown as Prisma.InputJsonValue,
      profileEvidenceSummary: prepared.summary.profileEvidenceSummary as unknown as Prisma.InputJsonValue
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
  const blockReason = getApplicationAiDraftBlockReason(config, job);
  if (blockReason === "AI_DISABLED") redirect(`/jobs/${jobId}/application?aiDisabled=1`);
  if (blockReason === "JOB_BLOCKED") redirect(`/jobs/${jobId}/application?aiBlocked=1`);

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
      data: buildAiDraftRunSuccessRecord(packet.id, result) as Prisma.AiDraftRunUncheckedCreateInput
    });
  } catch (error) {
    await db.aiDraftRun.create({
      data: buildAiDraftRunErrorRecord(packet.id, config.enabled ? config.model : null, summary, error) as Prisma.AiDraftRunUncheckedCreateInput
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
    data: buildPacketDraftReplacement(output)
  });

  revalidatePath(`/jobs/${run.applicationPacket.jobId}/application`);
  revalidatePath("/resumes");
  redirect(`/jobs/${run.applicationPacket.jobId}/application?aiSaved=1`);
}
