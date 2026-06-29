"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { enrichDiscoveryLeadFromUrl, prepareDiscoveryLeadForCreate, runInternetJobDiscovery, asPrismaDiscoveryLeadCreate } from "@/lib/discovery/jobDiscoveryEngine";
import { prepareJobCreateFromDiscoveryLead } from "@/lib/discovery/jobDiscoveryImport";
import { findDuplicateJobForLead } from "@/lib/gmail/jobLeadImport";

function optionalPositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function runJobDiscovery(formData: FormData) {
  const maxResults = Math.min(optionalPositiveInt(formData.get("maxResults"), 20), 50);
  const locationScope = optionalString(formData.get("locationScope")) ?? "Israel";
  const run = await db.jobDiscoveryRun.create({
    data: {
      status: "RUNNING",
      sourcePriority: "COMPANY_CAREERS_FIRST",
      query: `default role families; ${locationScope}`,
      provider: "TAVILY_SERPAPI_OPTIONAL"
    }
  });

  try {
    const result = await runInternetJobDiscovery({ maxResults, locationScope });
    await db.jobDiscoveryLead.createMany({
      data: result.leads.map((lead) => asPrismaDiscoveryLeadCreate(lead, run.id))
    });
    const missingProviders = !result.providersConfigured.tavily && !result.providersConfigured.serpApi;
    await db.jobDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        resultCount: result.leads.length,
        error: missingProviders ? "No Tavily or SerpApi key configured; discovery run created no web/API leads." : result.errors.join("\n") || null
      }
    });
  } catch (error) {
    await db.jobDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown discovery error."
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/discovery");
  redirect(`/discovery?run=${run.id}`);
}

export async function enrichDiscoveryLead(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.findUnique({ where: { id } });
  if (!lead) redirect("/discovery?missingLead=1");
  if (!lead.sourceUrl) redirect("/discovery?noUrl=1");

  const enriched = await enrichDiscoveryLeadFromUrl({
    title: lead.title,
    company: lead.company,
    location: lead.location,
    sourceUrl: lead.sourceUrl,
    rawSnippet: lead.rawSnippet,
    rawText: lead.rawText,
    discoverySource: lead.discoverySource ?? "WEB_SEARCH",
    discoveryProvider: lead.discoveryProvider ?? lead.provider ?? "UNKNOWN",
    discoveryQuery: lead.discoveryQuery ?? "",
    confidence: lead.confidence === "HIGH" || lead.confidence === "MEDIUM" ? lead.confidence : "LOW"
  });
  const prepared = prepareDiscoveryLeadForCreate(enriched);

  await db.jobDiscoveryLead.update({
    where: { id },
    data: {
      title: prepared.title,
      company: prepared.company,
      location: prepared.location,
      rawSnippet: prepared.rawSnippet,
      rawText: prepared.rawText,
      extractedTitle: prepared.extractedTitle,
      extractedCompany: prepared.extractedCompany,
      extractedLocation: prepared.extractedLocation,
      extractedDescription: prepared.extractedDescription,
      extractedRequirements: prepared.extractedRequirements,
      extractedRemotePolicy: prepared.extractedRemotePolicy,
      extractedLanguage: prepared.extractedLanguage,
      confidence: prepared.confidence,
      fitScore: prepared.fitScore,
      fitReasons: prepared.fitReasons as Prisma.InputJsonValue,
      validationStatus: prepared.validationStatus,
      forbiddenFlags: prepared.forbiddenFlags as Prisma.InputJsonValue,
      allowedSignals: prepared.allowedSignals as Prisma.InputJsonValue,
      riskNotes: prepared.riskNotes,
      lastEnrichedAt: new Date()
    }
  });

  revalidatePath("/discovery");
  redirect("/discovery?enriched=1");
}

export async function importDiscoveryLeadToInbox(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.findUnique({ where: { id } });
  if (!lead) redirect("/discovery?missingLead=1");
  if (lead.status === "IMPORTED" && lead.importedJobId) redirect(`/jobs/${lead.importedJobId}`);

  const prepared = prepareJobCreateFromDiscoveryLead(lead);
  if (!prepared.ok) {
    await db.jobDiscoveryLead.update({
      where: { id },
      data: {
        validationStatus: prepared.validation.validationStatus,
        forbiddenFlags: prepared.validation.forbiddenFlags as Prisma.InputJsonValue,
        allowedSignals: prepared.validation.allowedSignals as Prisma.InputJsonValue,
        riskNotes: prepared.validation.riskNotes.join("\n"),
        notes: "Import blocked because deterministic validation marked this lead FORBIDDEN."
      }
    });
    revalidatePath("/discovery");
    redirect("/discovery?blocked=1");
  }

  const existingJobs = await db.job.findMany({ select: { id: true, title: true, company: true, sourceUrl: true } });
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
    revalidatePath("/discovery");
    redirect("/discovery?duplicate=1");
  }

  const job = await db.job.create({
    data: {
      ...prepared.data,
      forbiddenFlags: prepared.data.forbiddenFlags as Prisma.InputJsonValue,
      allowedSignals: prepared.data.allowedSignals as Prisma.InputJsonValue,
      events: {
        create: {
          type: "JOB_IMPORTED_FROM_DISCOVERY",
          notes: `Imported manually from discovery lead ${lead.id}.`
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
  if (lead.discoveryRunId) {
    await db.jobDiscoveryRun.update({
      where: { id: lead.discoveryRunId },
      data: { importedCount: { increment: 1 } }
    });
  }

  revalidatePath("/");
  revalidatePath("/discovery");
  revalidatePath("/jobs");
  revalidatePath("/pipeline");
  redirect(`/jobs/${job.id}?importedLead=1`);
}

export async function skipDiscoveryLead(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.update({
    where: { id },
    data: { status: "SKIPPED", notes: "Skipped during discovery review." }
  });
  if (lead.discoveryRunId) {
    await db.jobDiscoveryRun.update({ where: { id: lead.discoveryRunId }, data: { skippedCount: { increment: 1 } } });
  }
  revalidatePath("/");
  revalidatePath("/discovery");
}

export async function markDiscoveryLeadDuplicate(formData: FormData) {
  const id = requiredString(formData.get("leadId"));
  const lead = await db.jobDiscoveryLead.findUnique({ where: { id } });
  if (!lead) redirect("/discovery?missingLead=1");
  const existingJobs = await db.job.findMany({ select: { id: true, title: true, company: true, sourceUrl: true } });
  const duplicate = findDuplicateJobForLead(lead, existingJobs);
  await db.jobDiscoveryLead.update({
    where: { id },
    data: {
      status: "DUPLICATE",
      duplicateOfJobId: duplicate?.id ?? null,
      notes: duplicate ? "Marked duplicate of an existing local job." : "Marked duplicate during discovery review."
    }
  });
  revalidatePath("/");
  revalidatePath("/discovery");
}
