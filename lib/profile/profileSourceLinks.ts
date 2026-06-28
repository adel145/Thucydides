import type { SourceType } from "../sources/sourceTypes";

export const PROFILE_SOURCE_TARGET_FIELDS = [
  {
    key: "languages",
    label: "Languages",
    description: "Language evidence from CV, LinkedIn, or notes.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  },
  {
    key: "technicalSkills",
    label: "Technical skills",
    description: "Technical stack, tools, and practical skills.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "softSkills",
    label: "Soft skills",
    description: "Teamwork, communication, ownership, and support signals.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  },
  {
    key: "fieldExperience",
    label: "Field experience",
    description: "Work, project, support, implementation, or practical experience.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT"]
  },
  {
    key: "education",
    label: "Education",
    description: "Degree, academic status, and coursework evidence.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "CERTIFICATE", "ACADEMIC_DOCUMENT"]
  },
  {
    key: "certificates",
    label: "Certificates",
    description: "Certificates, courses, and formal completion evidence.",
    likelySourceTypes: ["CV", "CERTIFICATE", "ACADEMIC_DOCUMENT"]
  },
  {
    key: "githubProjects",
    label: "GitHub projects",
    description: "GitHub repositories and project evidence.",
    likelySourceTypes: ["GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "portfolioLinks",
    label: "Portfolio links",
    description: "Portfolio, project pages, and public proof links.",
    likelySourceTypes: ["GITHUB_PROJECTS", "PORTFOLIO"]
  },
  {
    key: "sourceNotes",
    label: "Source notes",
    description: "General notes that support future profile and CV work.",
    likelySourceTypes: ["CV", "LINKEDIN_TEXT", "JOB_SEARCH_NOTES"]
  }
] as const;

export type ProfileSourceTargetField = (typeof PROFILE_SOURCE_TARGET_FIELDS)[number]["key"];

export type ProfileSourceLinkLike = {
  targetField: string;
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
