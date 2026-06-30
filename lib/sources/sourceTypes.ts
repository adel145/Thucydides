export const SOURCE_TYPES = [
  "CV",
  "LINKEDIN_TEXT",
  "GITHUB_PROJECTS",
  "PORTFOLIO",
  "CERTIFICATE",
  "ACADEMIC_DOCUMENT",
  "JOB_SEARCH_NOTES",
  "OTHER"
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const sourceTypeLabels: Record<SourceType, string> = {
  CV: "CV",
  LINKEDIN_TEXT: "טקסט LinkedIn",
  GITHUB_PROJECTS: "פרויקטי GitHub",
  PORTFOLIO: "Portfolio",
  CERTIFICATE: "תעודה",
  ACADEMIC_DOCUMENT: "מסמך אקדמי",
  JOB_SEARCH_NOTES: "הערות חיפוש עבודה",
  OTHER: "אחר"
};

export function isSourceType(value: string): value is SourceType {
  return SOURCE_TYPES.includes(value as SourceType);
}

export function normalizeSourceType(value: string | null | undefined): SourceType {
  return value && isSourceType(value) ? value : "OTHER";
}
