"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { optionalString, requiredString } from "@/lib/formParsing";
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
