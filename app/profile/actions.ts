"use server";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { optionalInt, optionalString, parseTextareaJson, requiredString } from "@/lib/formParsing";
import { validateProfileInput } from "@/lib/profile/validateProfile";

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  errors: string[];
  values?: Record<string, string>;
};

const fieldNames = [
  "id",
  "fullName",
  "preferredName",
  "location",
  "targetSalaryGrossNis",
  "minimumSalaryGrossNis",
  "availability",
  "degreeStatus",
  "expectedCompletion",
  "mobility",
  "languages",
  "technicalSkills",
  "softSkills",
  "fieldExperience",
  "education",
  "certificates",
  "githubProjects",
  "portfolioLinks",
  "sourceNotes"
] as const;

function valuesFromForm(formData: FormData) {
  return Object.fromEntries(
    fieldNames.map((name) => [name, typeof formData.get(name) === "string" ? String(formData.get(name)) : ""])
  );
}

export async function saveProfile(_previousState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const values = valuesFromForm(formData);
  const id = requiredString(formData.get("id"));
  const fullName = requiredString(formData.get("fullName"));
  const location = requiredString(formData.get("location"));
  const targetSalaryGrossNis = optionalInt(formData.get("targetSalaryGrossNis"));
  const minimumSalaryGrossNis = optionalInt(formData.get("minimumSalaryGrossNis"));

  const validation = validateProfileInput({
    fullName,
    location,
    targetSalaryGrossNis,
    minimumSalaryGrossNis,
    degreeStatus: optionalString(formData.get("degreeStatus")),
    expectedCompletion: optionalString(formData.get("expectedCompletion"))
  });

  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      values
    };
  }

  const data = {
    fullName,
    preferredName: optionalString(formData.get("preferredName")),
    location,
    targetSalaryGrossNis,
    minimumSalaryGrossNis,
    availability: optionalString(formData.get("availability")),
    degreeStatus: optionalString(formData.get("degreeStatus")),
    expectedCompletion: optionalString(formData.get("expectedCompletion")),
    mobility: optionalString(formData.get("mobility")),
    languages: parseTextareaJson(formData.get("languages")) as Prisma.InputJsonValue,
    technicalSkills: parseTextareaJson(formData.get("technicalSkills")) as Prisma.InputJsonValue,
    softSkills: parseTextareaJson(formData.get("softSkills")) as Prisma.InputJsonValue,
    fieldExperience: parseTextareaJson(formData.get("fieldExperience")) as Prisma.InputJsonValue,
    education: parseTextareaJson(formData.get("education")) as Prisma.InputJsonValue,
    certificates: parseTextareaJson(formData.get("certificates")) as Prisma.InputJsonValue,
    githubProjects: parseTextareaJson(formData.get("githubProjects")) as Prisma.InputJsonValue,
    portfolioLinks: parseTextareaJson(formData.get("portfolioLinks")) as Prisma.InputJsonValue,
    sourceNotes: optionalString(formData.get("sourceNotes"))
  };

  if (id) {
    await db.candidateProfile.update({ where: { id }, data });
  } else {
    await db.candidateProfile.create({ data });
  }

  return {
    ok: true,
    message: "Profile saved locally.",
    errors: []
  };
}
