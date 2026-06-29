export type SourceReadinessSource = {
  type: string;
};

export type SourceReadinessItem = {
  label: string;
  ready: boolean;
  note: string;
};

const requiredSourceGroups = [
  {
    label: "CV",
    types: ["CV"],
    note: "Upload CV file or add CV text source."
  },
  {
    label: "LinkedIn",
    types: ["LINKEDIN_TEXT"],
    note: "Add LinkedIn URL or pasted LinkedIn text."
  },
  {
    label: "GitHub / Projects",
    types: ["GITHUB_PROJECTS", "PORTFOLIO"],
    note: "Add GitHub, portfolio, or project URL/note."
  },
  {
    label: "Certificates / Academic",
    types: ["CERTIFICATE", "ACADEMIC_DOCUMENT"],
    note: "Upload certificate/academic file or add URL/note."
  }
] as const;

export function calculateSourceReadiness(sources: SourceReadinessSource[]) {
  const sourceTypes = new Set(sources.map((source) => source.type));
  const items: SourceReadinessItem[] = requiredSourceGroups.map((group) => ({
    label: group.label,
    ready: group.types.some((type) => sourceTypes.has(type)),
    note: group.note
  }));

  return {
    items,
    readyCount: items.filter((item) => item.ready).length,
    totalCount: items.length,
    missing: items.filter((item) => !item.ready)
  };
}
