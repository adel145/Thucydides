import type { Prisma } from "../../generated/prisma/client";
import { validateJob } from "../rules/validateJob";

export type EditableJobInput = {
  title: string;
  company?: string | null;
  source: string;
  sourceUrl?: string | null;
  location?: string | null;
  language?: string | null;
  roleCategory?: string | null;
  rawDescription: string;
  salaryText?: string | null;
};

export function buildValidatedJobUpdate(input: EditableJobInput) {
  const validation = validateJob(input);

  return {
    ...input,
    validationStatus: validation.validationStatus,
    forbiddenFlags: validation.forbiddenFlags as Prisma.InputJsonValue,
    allowedSignals: validation.allowedSignals as Prisma.InputJsonValue,
    riskNotes: validation.riskNotes.join("\n")
  };
}

export function buildValidationRerunUpdate(input: EditableJobInput) {
  const validation = validateJob(input);

  return {
    validationStatus: validation.validationStatus,
    forbiddenFlags: validation.forbiddenFlags as Prisma.InputJsonValue,
    allowedSignals: validation.allowedSignals as Prisma.InputJsonValue,
    riskNotes: validation.riskNotes.join("\n")
  };
}
