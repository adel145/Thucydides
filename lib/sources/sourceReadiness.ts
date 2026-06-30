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
    note: "העלה קובץ CV או הוסף מקור טקסט CV."
  },
  {
    label: "LinkedIn",
    types: ["LINKEDIN_TEXT"],
    note: "הוסף URL של LinkedIn או טקסט LinkedIn מודבק."
  },
  {
    label: "GitHub / פרויקטים",
    types: ["GITHUB_PROJECTS", "PORTFOLIO"],
    note: "הוסף GitHub, Portfolio או URL/הערה של פרויקט."
  },
  {
    label: "תעודות / אקדמי",
    types: ["CERTIFICATE", "ACADEMIC_DOCUMENT"],
    note: "העלה תעודה/מסמך אקדמי או הוסף URL/הערה."
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
