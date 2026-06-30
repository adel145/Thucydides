import type { SourceType } from "../sources/sourceTypes";

export const PROFILE_SOURCE_TARGET_FIELDS = [
  {
    key: "languages",
    label: "שפות",
    description: "ראיות שפה מתוך CV, LinkedIn או הערות.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  },
  {
    key: "technicalSkills",
    label: "כישורים טכניים",
    description: "טכנולוגיות, כלים וכישורים מעשיים.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "softSkills",
    label: "כישורים רכים",
    description: "עבודת צוות, תקשורת, אחריות וסימני support.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  },
  {
    key: "fieldExperience",
    label: "ניסיון מעשי",
    description: "עבודה, פרויקטים, support, implementation או ניסיון מעשי.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT"]
  },
  {
    key: "education",
    label: "השכלה",
    description: "תואר, סטטוס אקדמי וראיות לקורסים.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "CERTIFICATE", "ACADEMIC_DOCUMENT"]
  },
  {
    key: "certificates",
    label: "תעודות",
    description: "תעודות, קורסים וראיות השלמה רשמיות.",
    likelySourceTypes: ["CV", "CERTIFICATE", "ACADEMIC_DOCUMENT"]
  },
  {
    key: "githubProjects",
    label: "פרויקטי GitHub",
    description: "Repositories ב-GitHub וראיות לפרויקטים.",
    likelySourceTypes: ["GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "portfolioLinks",
    label: "קישורי Portfolio",
    description: "Portfolio, עמודי פרויקט וקישורי הוכחה ציבוריים.",
    likelySourceTypes: ["GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "sourceNotes",
    label: "הערות מקור",
    description: "הערות כלליות שתומכות בעבודת פרופיל ו-CV בהמשך.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  }
] as const;

export type ProfileSourceTargetField = (typeof PROFILE_SOURCE_TARGET_FIELDS)[number]["key"];

export type ProfileSourceLinkLike = {
  targetField: string;
};

export type PreparedProfileSourceLinkTargets = {
  targetFields: ProfileSourceTargetField[];
  duplicateTargetFields: ProfileSourceTargetField[];
  invalidTargetFields: string[];
};

export const sourceTypeRecommendedFields: Record<SourceType, ProfileSourceTargetField[]> = {
  CV: ["fieldExperience", "education", "technicalSkills", "softSkills", "certificates", "sourceNotes"],
  LINKEDIN_TEXT: ["fieldExperience", "technicalSkills", "education", "sourceNotes"],
  GITHUB_PROJECTS: ["githubProjects", "technicalSkills", "portfolioLinks"],
  PORTFOLIO: ["portfolioLinks", "githubProjects"],
  CERTIFICATE: ["certificates", "education"],
  ACADEMIC_DOCUMENT: ["education", "certificates"],
  JOB_SEARCH_NOTES: ["sourceNotes"],
  OTHER: ["sourceNotes"]
};

export function isProfileSourceTargetField(value: string | null | undefined): value is ProfileSourceTargetField {
  return PROFILE_SOURCE_TARGET_FIELDS.some((field) => field.key === value);
}

export function getProfileSourceTargetField(value: string | null | undefined) {
  return PROFILE_SOURCE_TARGET_FIELDS.find((field) => field.key === value) ?? null;
}

export function getRecommendedTargetFields(sourceType: string | null | undefined) {
  const fields = sourceTypeRecommendedFields[sourceType as SourceType] ?? sourceTypeRecommendedFields.OTHER;
  return PROFILE_SOURCE_TARGET_FIELDS.filter((field) => fields.includes(field.key));
}

export function prepareProfileSourceLinkTargets(
  requestedTargetFields: Array<string | null | undefined>,
  existingLinks: ProfileSourceLinkLike[] = []
): PreparedProfileSourceLinkTargets {
  const existing = new Set(existingLinks.map((link) => link.targetField));
  const seen = new Set<ProfileSourceTargetField>();
  const targetFields: ProfileSourceTargetField[] = [];
  const duplicateTargetFields: ProfileSourceTargetField[] = [];
  const invalidTargetFields: string[] = [];

  requestedTargetFields.forEach((targetField) => {
    const value = targetField?.trim() ?? "";
    if (!isProfileSourceTargetField(value)) {
      if (value) invalidTargetFields.push(value);
      return;
    }

    if (existing.has(value) || seen.has(value)) {
      if (!duplicateTargetFields.includes(value)) duplicateTargetFields.push(value);
      return;
    }

    seen.add(value);
    targetFields.push(value);
  });

  return {
    targetFields,
    duplicateTargetFields,
    invalidTargetFields
  };
}

export function groupSourceLinksByTargetField<T extends ProfileSourceLinkLike>(links: T[]) {
  return PROFILE_SOURCE_TARGET_FIELDS.reduce(
    (groups, field) => {
      groups[field.key] = links.filter((link) => link.targetField === field.key);
      return groups;
    },
    {} as Record<ProfileSourceTargetField, T[]>
  );
}

export function summarizeProfileEvidence<T extends ProfileSourceLinkLike>(links: T[]) {
  const grouped = groupSourceLinksByTargetField(links);
  const fieldsWithEvidence = PROFILE_SOURCE_TARGET_FIELDS.filter((field) => grouped[field.key].length > 0);
  const fieldsMissingEvidence = PROFILE_SOURCE_TARGET_FIELDS.filter((field) => grouped[field.key].length === 0);

  return {
    grouped,
    fieldsWithEvidence,
    fieldsMissingEvidence,
    readyCount: fieldsWithEvidence.length,
    totalCount: PROFILE_SOURCE_TARGET_FIELDS.length
  };
}
