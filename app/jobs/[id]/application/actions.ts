"use server";

import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildApplicationPacketSummary, normalizeApplicationDecision, normalizeApplicationPacketStatus, normalizeCvLanguage } from "@/lib/applications/applicationPacket";
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
  const applicationDecision = normalizeApplicationDecision(optionalString(formData.get("applicationDecision")) ?? summary.applicationDecision);
  const status = normalizeApplicationPacketStatus(optionalString(formData.get("status")));

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
  redirect(`/jobs/${jobId}/application?saved=1`);
}

export async function markApplicationPacketReady(formData: FormData) {
  const jobId = requiredString(formData.get("jobId"));
  await db.applicationPacket.update({
    where: { jobId },
    data: { status: "READY" }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/application`);
  revalidatePath("/resumes");
  redirect(`/jobs/${jobId}/application?ready=1`);
}
