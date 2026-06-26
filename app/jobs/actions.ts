"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { archiveStatus, normalizeJobStatus } from "@/lib/jobs/jobStatus";
import { buildValidatedJobUpdate, buildValidationRerunUpdate } from "@/lib/jobs/jobLifecycle";
import { normalizeJobPriority } from "@/lib/jobs/jobPriority";

function editableJobInputFromForm(formData: FormData) {
  return {
    title: requiredString(formData.get("title"), "Untitled job"),
    company: optionalString(formData.get("company")),
    source: requiredString(formData.get("source"), "manual"),
    sourceUrl: optionalString(formData.get("sourceUrl")),
    location: optionalString(formData.get("location")),
    language: optionalString(formData.get("language")),
    roleCategory: optionalString(formData.get("roleCategory")),
    rawDescription: requiredString(formData.get("rawDescription"), "No description provided."),
    salaryText: optionalString(formData.get("salaryText"))
  };
}

export async function createJob(formData: FormData) {
  const input = editableJobInputFromForm(formData);
  const data = buildValidatedJobUpdate(input);

  const job = await db.job.create({
    data: {
      ...data,
      events: {
        create: {
          type: "JOB_CREATED",
          notes: `Job created manually from source: ${input.source}.`
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/pipeline");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const input = editableJobInputFromForm(formData);
  const data = buildValidatedJobUpdate(input);

  await db.job.update({
    where: { id },
    data: {
      ...data,
      events: {
        create: {
          type: "JOB_UPDATED",
          notes: "Job fields were edited manually; deterministic validation was rerun."
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
  redirect(`/jobs/${id}?saved=1`);
}

export async function rerunValidation(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const job = await db.job.findUnique({ where: { id } });
  if (!job) {
    redirect("/jobs");
  }

  const update = buildValidationRerunUpdate(job);
  await db.job.update({
    where: { id },
    data: {
      ...update,
      events: {
        create: {
          type: "VALIDATION_RERUN",
          notes: "Deterministic validation was rerun against the stored job."
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
  redirect(`/jobs/${id}?validated=1`);
}

export async function archiveJob(formData: FormData) {
  const id = requiredString(formData.get("id"));

  await db.job.update({
    where: { id },
    data: {
      status: archiveStatus(),
      events: {
        create: {
          type: "JOB_ARCHIVED",
          notes: "Job was manually archived."
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
  redirect(`/jobs/${id}?archived=1`);
}

export async function deleteJob(formData: FormData) {
  const id = requiredString(formData.get("id"));
  await db.job.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/pipeline");
  redirect("/jobs?deleted=1");
}

export async function updateJobPriority(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const priority = normalizeJobPriority(requiredString(formData.get("priority"), "MEDIUM"));
  await db.job.update({
    where: { id },
    data: {
      priority,
      events: {
        create: {
          type: "PRIORITY_CHANGED",
          notes: `Priority changed to ${priority}.`
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
}

export async function setNextAction(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const nextActionValue = optionalString(formData.get("nextActionAt"));
  const nextActionAt = nextActionValue ? new Date(`${nextActionValue}T09:00:00`) : null;
  const nextActionNote = optionalString(formData.get("nextActionNote"));

  await db.job.update({
    where: { id },
    data: {
      nextActionAt,
      nextActionNote,
      events: {
        create: {
          type: "NEXT_ACTION_SET",
          notes: nextActionAt ? `Next action set for ${nextActionAt.toLocaleDateString()}: ${nextActionNote ?? ""}` : "Next action cleared."
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
}

export async function markLastContactedToday(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const now = new Date();
  await db.job.update({
    where: { id },
    data: {
      lastContactedAt: now,
      events: {
        create: {
          type: "LAST_CONTACTED_UPDATED",
          notes: `Last contacted marked as ${now.toLocaleDateString()}.`
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
}

export async function changeJobStatus(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const nextStatus = normalizeJobStatus(requiredString(formData.get("status"), "FOUND"));
  const notes = optionalString(formData.get("notes"));
  const job = await db.job.findUnique({ where: { id }, select: { status: true } });
  if (!job) {
    redirect("/jobs");
  }

  const previousStatus = normalizeJobStatus(job.status);
  await db.job.update({
    where: { id },
    data: {
      status: nextStatus,
      events: {
        create: {
          type: "STATUS_CHANGED",
          notes: notes ?? `Status changed from ${previousStatus} to ${nextStatus}.`
        }
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/pipeline");
}
