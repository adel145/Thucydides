export type ProfileValidationInput = {
  fullName: string;
  location: string;
  targetSalaryGrossNis: number | null;
  minimumSalaryGrossNis: number | null;
  expectedCompletion?: string | null;
  degreeStatus?: string | null;
};

export type ProfileValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateProfileInput(input: ProfileValidationInput): ProfileValidationResult {
  const errors: string[] = [];

  if (!input.fullName.trim()) {
    errors.push("Full name is required.");
  }

  if (!input.location.trim()) {
    errors.push("Location is required.");
  }

  if (input.targetSalaryGrossNis !== null && !Number.isFinite(input.targetSalaryGrossNis)) {
    errors.push("Target salary must be numeric if provided.");
  }

  if (input.minimumSalaryGrossNis !== null && !Number.isFinite(input.minimumSalaryGrossNis)) {
    errors.push("Temporary minimum salary must be numeric if provided.");
  }

  if (
    input.targetSalaryGrossNis !== null &&
    input.minimumSalaryGrossNis !== null &&
    input.targetSalaryGrossNis < input.minimumSalaryGrossNis
  ) {
    errors.push("Target salary should not be lower than the temporary minimum salary.");
  }

  const degreeText = `${input.degreeStatus ?? ""} ${input.expectedCompletion ?? ""}`.toLowerCase();
  if (degreeText.includes("completed") && !degreeText.includes("nearing") && !degreeText.includes("expected")) {
    errors.push("Degree status says completed. Keep this honest unless the degree is actually complete.");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
