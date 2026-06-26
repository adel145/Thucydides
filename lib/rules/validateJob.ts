import { allowedRoleRules, findRuleMatches, forbiddenRoleRules, normalizeRuleText } from "./roleRules";

export type JobValidationStatus = "ALLOWED" | "RISKY" | "FORBIDDEN";

export type JobValidationInput = {
  title: string;
  company?: string | null;
  location?: string | null;
  language?: string | null;
  rawDescription: string;
  salaryText?: string | null;
  roleCategory?: string | null;
};

export type JobValidationResult = {
  validationStatus: JobValidationStatus;
  forbiddenFlags: string[];
  allowedSignals: string[];
  riskNotes: string[];
};

const southernSignals = ["beersheba", "beer sheva", "באר שבע", "south", "southern", "דרום"];
const distantLocationSignals = ["tel aviv", "תל אביב", "center", "מרכז", "haifa", "חיפה", "jerusalem", "ירושלים"];

function joinedInput(input: JobValidationInput) {
  return [
    input.title,
    input.company,
    input.location,
    input.language,
    input.roleCategory,
    input.salaryText,
    input.rawDescription
  ]
    .filter(Boolean)
    .join(" ");
}

function collectRiskNotes(input: JobValidationInput) {
  const text = normalizeRuleText(joinedInput(input));
  const notes: string[] = [];

  if (text.includes("degree required before september") || text.includes("completed degree immediately")) {
    notes.push("Role appears to require completed degree before Adel's expected September completion.");
  }

  if (text.includes("bachelor") && text.includes("must") && text.includes("completed")) {
    notes.push("Degree wording may be a hard requirement and should be checked manually.");
  }

  const salaryText = normalizeRuleText(input.salaryText ?? "");
  const salaryMatches = salaryText.match(/\d[\d,.]*/g) ?? [];
  const salaryNumbers = salaryMatches
    .map((match) => Number(match.replace(/[,.]/g, "")))
    .filter((value) => Number.isFinite(value));
  if (salaryNumbers.some((value) => value > 0 && value < 8000)) {
    notes.push("Salary appears below Adel's temporary minimum of 8,000 NIS gross.");
  }

  const location = normalizeRuleText(input.location ?? "");
  if (distantLocationSignals.some((signal) => location.includes(normalizeRuleText(signal)))) {
    if (!southernSignals.some((signal) => location.includes(normalizeRuleText(signal)))) {
      notes.push("Location is outside the South/Beersheba preference and should be justified by opportunity quality.");
    }
  }

  return Array.from(new Set(notes));
}

export function validateJob(input: JobValidationInput): JobValidationResult {
  const text = joinedInput(input);
  const forbiddenFlags = findRuleMatches(text, forbiddenRoleRules);
  const allowedSignals = findRuleMatches(text, allowedRoleRules);
  const riskNotes = collectRiskNotes(input);

  let validationStatus: JobValidationStatus = "RISKY";
  if (forbiddenFlags.length > 0) {
    validationStatus = "FORBIDDEN";
  } else if (allowedSignals.length > 0 && riskNotes.length === 0) {
    validationStatus = "ALLOWED";
  }

  if (allowedSignals.length === 0 && forbiddenFlags.length === 0) {
    riskNotes.push("No explicit allowed technical role signal was detected.");
  }

  return {
    validationStatus,
    forbiddenFlags,
    allowedSignals,
    riskNotes: Array.from(new Set(riskNotes))
  };
}
