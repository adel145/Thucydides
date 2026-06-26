"use server";

import { revalidatePath } from "next/cache";
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
}

export async function deleteSourceRecord(formData: FormData) {
  const id = requiredString(formData.get("id"));
  await db.sourceFile.delete({ where: { id } });
  revalidatePath("/sources");
  revalidatePath("/profile");
}
