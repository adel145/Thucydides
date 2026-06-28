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
    note: "Add Adel's current CV."
  },
  {
    label: "LinkedIn",
    types: ["LINKEDIN_TEXT"],
    note: "Add LinkedIn profile text."
  },
  {
    label: "GitHub / Projects",
    types: ["GITHUB_PROJECTS", "PORTFOLIO"],
    note: "Add GitHub, portfolio, or project evidence."
  },
  {
    label: "Certificates / Academic",
    types: ["CERTIFICATE", "ACADEMIC_DOCUMENT"],
    note: "Add certificates or academic documents."
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
