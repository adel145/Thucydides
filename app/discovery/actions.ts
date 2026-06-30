"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { enrichDiscoveryLeadFromUrl, prepareDiscoveryLeadForCreate, runInternetJobDiscovery, asPrismaDiscoveryLeadCreate, asPrismaSourceCandidateCreate, type PreparedDiscoverySourceCandidate } from "@/lib/discovery/jobDiscoveryEngine";
import { prepareJobCreateFromDiscoveryLead } from "@/lib/discovery/jobDiscoveryImport";
import { testDiscoveryProvider } from "@/lib/discovery/providerDiagnostics";
import { dedupePreparedDiscoveryLeads, dedupePreparedSourceCandidates, enumerateDiscoverySourceCandidate, retryClassifyDiscoverySourceCandidate } from "@/lib/discovery/sourceCandidateEnumeration";
import { findDuplicateJobForLead } from "@/lib/gmail/jobLeadImport";

function optionalPositiveInt(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function providerNoticeUrl(provider: string, ok: boolean, message: string) {
  const params = new URLSearchParams({
    providerTest: provider,
    providerOk: ok ? "1" : "0",
    providerMessage: message
  });
  return `/discovery?${params.toString()}`;
}

function sourceCandidateCreateInput(candidate: PreparedDiscoverySourceCandidate, discoveryRunId: string | null | undefined): Prisma.DiscoverySourceCandidateCreateInput {
  return {
    ...(discoveryRunId ? { discoveryRun: { connect: { id: discoveryRunId } } } : {}),
    provider: candidate.provider,
    source: candidate.source,
    query: candidate.query,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    rawText: candidate.rawText,
    classification: candidate.classification,
    confidence: candidate.confidence,
    reason: candidate.reason,
    extractedCompany: candidate.extractedCompany,
    extractedJobCount: candidate.extractedJobCount,
    status: candidate.status,
    createdLeadCount: candidate.createdLeadCount,
    error: candidate.error
  };
}

export async function testDiscoveryProviderAction(formData: FormData) {
  const provider = requiredString(formData.get("provider"));
  const normalized = provider === "SERPAPI_GOOGLE_JOBS" ? "SERPAPI_GOOGLE_JOBS" : "TAVILY";
  const result = await testDiscoveryProvider(normalized);
  redirect(providerNoticeUrl(normalized, result.ok, result.message));
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
    let createdLeadCount = 0;
    for (const candidate of result.sourceCandidates) {
      const createdCandidate = await db.discoverySourceCandidate.create({
        data: asPrismaSourceCandidateCreate(candidate, run.id)
      });
      if (candidate.leads.length > 0) {
        await db.jobDiscoveryLead.createMany({
          data: candidate.leads.map((lead) => ({
            ...asPrismaDiscoveryLeadCreate(lead, run.id),
            sourceCandidateId: createdCandidate.id
          }))
        });
        createdLeadCount += candidate.leads.length;
      }
    }
    const missingProviders = !result.providersConfigured.tavily && !result.providersConfigured.serpApi;
    await db.jobDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        resultCount: createdLeadCount,
        error: missingProviders ? "לא מוגדר מפתח Tavily או SerpApi; הרצת הגילוי לא יצרה לידי web/API." : result.errors.join("\n") || null
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

export async function retryClassifySourceCandidate(formData: FormData) {
  const id = requiredString(formData.get("candidateId"));
  const candidate = await db.discoverySourceCandidate.findUnique({ where: { id } });
  if (!candidate) redirect("/discovery?missingCandidate=1");
  const update = await retryClassifyDiscoverySourceCandidate(candidate);
  await db.discoverySourceCandidate.update({
    where: { id },
    data: update
  });
  revalidatePath("/discovery");
  redirect("/discovery?candidateClassified=1");
}

export async function enumerateSourceCandidate(formData: FormData) {
  const id = requiredString(formData.get("candidateId"));
  const candidate = await db.discoverySourceCandidate.findUnique({ where: { id } });
  if (!candidate) redirect("/discovery?missingCandidate=1");
  const result = await enumerateDiscoverySourceCandidate(candidate);
  const [existingCandidates, existingLeads] = await Promise.all([
    db.discoverySourceCandidate.findMany({ select: { url: true } }),
    db.jobDiscoveryLead.findMany({ select: { canonicalUrl: true, sourceUrl: true, title: true, company: true } })
  ]);
  const newCandidates = dedupePreparedSourceCandidates(result.newCandidates, existingCandidates.map((item) => item.url));
  const newLeads = dedupePreparedDiscoveryLeads(result.leads, existingLeads);

  for (const newCandidate of newCandidates) {
    await db.discoverySourceCandidate.create({
      data: sourceCandidateCreateInput(newCandidate, candidate.discoveryRunId)
    });
  }

  if (newLeads.length > 0) {
    await db.jobDiscoveryLead.createMany({
      data: newLeads.map((lead) => ({
        ...lead,
        discoveryRunId: candidate.discoveryRunId,
        sourceCandidateId: candidate.id,
        forbiddenFlags: lead.forbiddenFlags as Prisma.InputJsonValue,
        allowedSignals: lead.allowedSignals as Prisma.InputJsonValue,
        fitReasons: lead.fitReasons as Prisma.InputJsonValue
      }))
    });
  }

  await db.discoverySourceCandidate.update({
    where: { id },
    data: {
      ...result.candidateUpdate,
      reason: newCandidates.length === 0 && newLeads.length === 0 && (result.newCandidates.length > 0 || result.leads.length > 0)
        ? "Already enumerated / no new links."
        : result.candidateUpdate.reason,
      createdLeadCount: (candidate.createdLeadCount ?? 0) + newLeads.length
    }
  });

  if (candidate.discoveryRunId && newLeads.length > 0) {
    await db.jobDiscoveryRun.update({
      where: { id: candidate.discoveryRunId },
      data: { resultCount: { increment: newLeads.length } }
    });
  }

  revalidatePath("/");
  revalidatePath("/discovery");
  redirect(`/discovery?enumerated=${newLeads.length}&candidateLinks=${newCandidates.length}`);
}

export async function skipSourceCandidate(formData: FormData) {
  const id = requiredString(formData.get("candidateId"));
  await db.discoverySourceCandidate.update({
    where: { id },
    data: {
      status: "SKIPPED",
      reason: "Skipped during source-candidate review."
    }
  });
  revalidatePath("/discovery");
}

export async function hideOldNonImportableDiscoveryLeads() {
  await db.jobDiscoveryLead.updateMany({
    where: {
      sourceType: { not: "GMAIL_ALERT" },
      importedJobId: null,
      status: { notIn: ["IMPORTED", "SKIPPED"] },
      OR: [
        { sourceClassification: null },
        { sourceClassification: { notIn: ["ACTUAL_JOB_POSTING", "ATS_JOB_POSTING"] } },
        { confidence: "LOW" }
      ]
    },
    data: {
      status: "SKIPPED",
      notes: "הוסתר מהסקירה הראשית כי זה ליד ישן שלא אומת כמשרה שניתן לייבא."
    }
  });
  revalidatePath("/");
  revalidatePath("/discovery");
  redirect("/discovery?oldLeadsHidden=1");
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
        notes: prepared.reason === "FORBIDDEN"
          ? "הייבוא נחסם כי validation דטרמיניסטי סימן את הליד כ-FORBIDDEN."
          : "הייבוא נחסם כי המקור לא אומת כמשרה יחידה בביטחון בינוני/גבוה."
      }
    });
    revalidatePath("/discovery");
    redirect(prepared.reason === "FORBIDDEN" ? "/discovery?blocked=1" : "/discovery?notImportable=1");
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
          notes: `יובא ידנית מליד גילוי ${lead.id}.`
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

export async function skipNonImportedLeadsFromRun(formData: FormData) {
  const runId = requiredString(formData.get("runId"));
  // Keep this bulk update aligned with isSkippableNonImportedDiscoveryLead.
  const result = await db.jobDiscoveryLead.updateMany({
    where: {
      discoveryRunId: runId,
      importedJobId: null,
      status: { not: "IMPORTED" }
    },
    data: {
      status: "SKIPPED",
      notes: "Skipped non-imported leads from this discovery run."
    }
  });
  await db.jobDiscoveryRun.update({
    where: { id: runId },
    data: { skippedCount: { increment: result.count } }
  });
  revalidatePath("/");
  revalidatePath("/discovery");
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
