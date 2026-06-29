"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { isProfileSourceTargetField } from "@/lib/profile/profileSourceLinks";
import { normalizeSourceType } from "@/lib/sources/sourceTypes";
import { buildStoredUploadPath, isUsableUploadFile } from "@/lib/sources/sourceUploads";

export async function createSourceRecord(formData: FormData) {
  await db.sourceFile.create({
    data: {
      filename: requiredString(formData.get("filename"), "Untitled source"),
      type: normalizeSourceType(optionalString(formData.get("type"))),
      path: optionalString(formData.get("path")),
      url: optionalString(formData.get("url")),
      extractedText: optionalString(formData.get("extractedText")),
      notes: optionalString(formData.get("notes"))
    }
  });

  revalidatePath("/sources");
  revalidatePath("/profile");
  revalidatePath("/resumes");
  revalidatePath("/");
}

export async function createSourceLinkRecord(formData: FormData) {
  const url = optionalString(formData.get("url"));
  if (!url) {
    redirect("/sources?linkSourceError=1");
  }

  await db.sourceFile.create({
    data: {
      filename: requiredString(formData.get("filename"), url),
      type: normalizeSourceType(optionalString(formData.get("type"))),
      url,
      notes: optionalString(formData.get("notes"))
    }
  });

  revalidatePath("/");
  revalidatePath("/sources");
  revalidatePath("/profile");
  revalidatePath("/resumes");
  redirect("/sources?linkedSource=1");
}

export async function uploadSourceFile(formData: FormData) {
  const file = formData.get("file");
  if (!isUsableUploadFile(file)) {
    redirect("/sources?uploadError=1");
  }

  const uploadId = randomUUID();
  const storedPath = buildStoredUploadPath(uploadId, file.name);
  const absolutePath = path.join(process.cwd(), storedPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  await db.sourceFile.create({
    data: {
      filename: optionalString(formData.get("filename")) ?? file.name,
      type: normalizeSourceType(optionalString(formData.get("type"))),
      path: storedPath,
      uploadMimeType: file.type || null,
      uploadSizeBytes: file.size,
      uploadedAt: new Date(),
      notes: optionalString(formData.get("notes"))
    }
  });

  revalidatePath("/");
  revalidatePath("/sources");
  revalidatePath("/profile");
  revalidatePath("/resumes");
  redirect("/sources?uploaded=1");
}

export async function updateSourceRecord(formData: FormData) {
  const id = requiredString(formData.get("id"));
  await db.sourceFile.update({
    where: { id },
    data: {
      filename: requiredString(formData.get("filename"), "Untitled source"),
      type: normalizeSourceType(optionalString(formData.get("type"))),
      path: optionalString(formData.get("path")),
      url: optionalString(formData.get("url")),
      extractedText: optionalString(formData.get("extractedText")),
      notes: optionalString(formData.get("notes"))
    }
  });

  revalidatePath("/");
  revalidatePath("/sources");
  revalidatePath(`/sources/${id}`);
  revalidatePath("/profile");
  redirect(`/sources/${id}?saved=1`);
}

export async function deleteSourceRecord(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const confirmText = requiredString(formData.get("confirmText"));
  if (confirmText !== "DELETE") {
    redirect(`/sources/${id}?deleteError=1`);
  }

  await db.sourceFile.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/sources");
  revalidatePath("/profile");
  redirect("/sources?deleted=1");
}

export async function createProfileSourceLink(formData: FormData) {
  const profileId = requiredString(formData.get("profileId"));
  const sourceId = requiredString(formData.get("sourceId"));
  const targetField = requiredString(formData.get("targetField"));
  if (!isProfileSourceTargetField(targetField)) {
    redirect(`/sources/${sourceId}?linkError=1`);
  }

  await db.profileSourceLink.upsert({
    where: {
      profileId_sourceId_targetField: {
        profileId,
        sourceId,
        targetField
      }
    },
    update: {
      note: optionalString(formData.get("note"))
    },
    create: {
      profileId,
      sourceId,
      targetField,
      note: optionalString(formData.get("note"))
    }
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/sources");
  revalidatePath(`/sources/${sourceId}`);
  redirect(`/sources/${sourceId}?linked=1`);
}

export async function deleteProfileSourceLink(formData: FormData) {
  const id = requiredString(formData.get("id"));
  const sourceId = requiredString(formData.get("sourceId"));
  await db.profileSourceLink.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/sources");
  revalidatePath(`/sources/${sourceId}`);
  redirect(`/sources/${sourceId}?unlinked=1`);
}
