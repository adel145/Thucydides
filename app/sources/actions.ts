"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
import { isProfileSourceTargetField } from "@/lib/profile/profileSourceLinks";
import { normalizeSourceType } from "@/lib/sources/sourceTypes";

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
  revalidatePath("/");
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
