"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { classifyGmailAlertProvider } from "@/lib/gmail/gmailAlertProviders";
import { parseGmailJobAlertText } from "@/lib/gmail/gmailJobAlertParser";
import { findDuplicateJobForLead, prepareJobCreateFromLead } from "@/lib/gmail/jobLeadImport";
import { validateJob } from "@/lib/rules/validateJob";

function optionalDate(value: FormDataEntryValue | null) {
  const text = optionalString(value);
  if (!text) return null;
  const date = new Date(`${text}T09:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function leadValidationInput(lead: { title: string; company?: string | null; location?: string | null; rawSnippet: string; rawText?: string | null }) {
  return {
    title: lead.title,
    company: lead.company,
    location: lead.location,
    rawDescription: [lead.rawSnippet, lead.rawText].filter(Boolean).join("\n\n")
  };
}

export async function createGmailJobAlertAndExtractLeads(formData: FormData) {
  const sender = optionalString(formData.get("sender"));
  const subject = optionalString(formData.get("subject"));
  const rawText = requiredString(formData.get("rawText"));
  const notes = optionalString(formData.get("notes"));
  const provider = classifyGmailAlertProvider({
    provider: optionalString(formData.get("provider")),
    sender,
    subject,
    rawText
  });
  const receivedAt = optionalDate(formData.get("receivedAt"));
  const parsedLeads = parseGmailJobAlertText({ provider, sender, subject, rawText });

  await db.gmailJobAlert.create({
    data: {
      provider,
      sender,
      subject,
      receivedAt,
      rawText,
      notes,
      leads: {
        create: parsedLeads.map((lead) => {
          const validation = validateJob(leadValidationInput(lead));
          return {
            sourceType: "GMAIL_ALERT",
            provider: lead.provider,
            title: lead.title,
            company: lead.company,
            location: lead.location,
            sourceUrl: lead.sourceUrl,
            rawSnippet: lead.rawSnippet,
            rawText: lead.rawText,
            validationStatus: validation.validationStatus,
            forbiddenFlags: validation.forbiddenFlags as Prisma.InputJsonValue,
            allowedSignals: validation.allowedSignals as Prisma.InputJsonValue,
            riskNotes: validation.riskNotes.join("\n"),
            status: "NEW"
          };
        })
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/gmail");
  redirect(`/gmail?saved=1&leads=${parsedLeads.length}`);
}

export async function importJobLeadToInbox(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.findUnique({ where: { id } });
  if (!lead) redirect("/gmail?missingLead=1");

  if (lead.status === "IMPORTED" && lead.importedJobId) {
    redirect(`/jobs/${lead.importedJobId}`);
  }

  const prepared = prepareJobCreateFromLead(lead);
  if (!prepared.ok) {
    await db.jobDiscoveryLead.update({
      where: { id },
      data: {
        validationStatus: prepared.validation.validationStatus,
        forbiddenFlags: prepared.validation.forbiddenFlags as Prisma.InputJsonValue,
        allowedSignals: prepared.validation.allowedSignals as Prisma.InputJsonValue,
        riskNotes: prepared.validation.riskNotes.join("\n"),
        notes: "הייבוא נחסם כי validation דטרמיניסטי סימן את הליד כ-FORBIDDEN."
      }
    });
    revalidatePath("/gmail");
    redirect("/gmail?blocked=1");
  }

  const existingJobs = await db.job.findMany({
    select: { id: true, title: true, company: true, sourceUrl: true }
  });
  const duplicate = findDuplicateJobForLead(lead, existingJobs);
  if (duplicate) {
    await db.jobDiscoveryLead.update({
      where: { id },
      data: {
        status: "DUPLICATE",
        duplicateOfJobId: duplicate.id,
        notes: "Import blocked because this lead looks like an existing local job."
      }
    });
    revalidatePath("/");
    revalidatePath("/gmail");
    redirect("/gmail?duplicate=1");
  }

  const job = await db.job.create({
    data: {
      ...prepared.data,
      forbiddenFlags: prepared.data.forbiddenFlags as Prisma.InputJsonValue,
      allowedSignals: prepared.data.allowedSignals as Prisma.InputJsonValue,
      events: {
        create: {
          type: "JOB_IMPORTED_FROM_GMAIL_ALERT",
          notes: `יובא ידנית מליד מקומי של התראת Gmail ${lead.id}.`
        }
      }
    }
  });

  await db.jobDiscoveryLead.update({
    where: { id },
    data: {
      status: "IMPORTED",
      importedJobId: job.id,
      validationStatus: prepared.validation.validationStatus,
      forbiddenFlags: prepared.validation.forbiddenFlags as Prisma.InputJsonValue,
      allowedSignals: prepared.validation.allowedSignals as Prisma.InputJsonValue,
      riskNotes: prepared.validation.riskNotes.join("\n")
    }
  });

  revalidatePath("/");
  revalidatePath("/gmail");
  revalidatePath("/jobs");
  revalidatePath("/pipeline");
  redirect(`/jobs/${job.id}?importedLead=1`);
}

export async function skipJobLead(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  await db.jobDiscoveryLead.update({
    where: { id },
    data: { status: "SKIPPED", notes: "דולג במהלך בדיקה ידנית של התראת Gmail." }
  });

  revalidatePath("/");
  revalidatePath("/gmail");
}

export async function markJobLeadDuplicate(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.findUnique({ where: { id } });
  if (!lead) redirect("/gmail?missingLead=1");
  const existingJobs = await db.job.findMany({
    select: { id: true, title: true, company: true, sourceUrl: true }
  });
  const duplicate = findDuplicateJobForLead(lead, existingJobs);

  await db.jobDiscoveryLead.update({
    where: { id },
    data: {
      status: "DUPLICATE",
      duplicateOfJobId: duplicate?.id ?? null,
      notes: duplicate ? "סומן ככפול של משרה מקומית קיימת." : "סומן ככפול במהלך בדיקה ידנית של התראת Gmail."
    }
  });

  revalidatePath("/");
  revalidatePath("/gmail");
}
