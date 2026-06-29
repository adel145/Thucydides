export const forbiddenRoleRules = [
  { id: "sales", label: "Sales role", patterns: ["sales", "sales representative", "account executive", "מכירות", "נציג מכירות"] },
  {
    id: "customer-service",
    label: "Regular customer service",
    patterns: ["customer service", "service center", "call center", "שירות לקוחות", "מוקד שירות", "נציג שירות"]
  },
  {
    id: "non-technical-service-center",
    label: "Non-technical service center",
    patterns: ["non-technical service center", "general service center", "מוקד שירות כללי"]
  },
  {
    id: "security-clearance-mandatory",
    label: "Security clearance mandatory",
    patterns: ["security clearance mandatory", "mandatory security clearance", "סיווג ביטחוני חובה", "סיווג בטחוני חובה", "נדרש סיווג"]
  },
  {
    id: "army-experience-mandatory",
    label: "Army experience mandatory",
    patterns: ["army experience mandatory", "military experience mandatory", "IDF experience required", "שירות צבאי חובה", "יוצא יחידה טכנולוגית חובה"]
  }
] as const;

export const allowedRoleRules = [
  { id: "help-desk", label: "Help Desk", patterns: ["help desk", "helpdesk"] },
  { id: "it-support", label: "IT Support", patterns: ["it support"] },
  { id: "technical-support", label: "Technical Support", patterns: ["technical support", "תמיכה טכנית"] },
  { id: "pc-technician", label: "PC Technician", patterns: ["pc technician", "טכנאי pc", "טכנאי מחשבים"] },
  { id: "noc", label: "NOC", patterns: ["noc", "network operations center"] },
  { id: "qa", label: "QA", patterns: ["qa", "quality assurance", "manual qa", "qa manual"] },
  {
    id: "junior-developer",
    label: "Junior Developer",
    patterns: [
      "junior developer",
      "junior software engineer",
      "junior software developer",
      "software developer junior",
      "junior frontend",
      "junior backend",
      "junior full-stack",
      "full stack developer junior",
      "frontend developer junior",
      "backend developer junior",
      "react developer junior",
      "node.js developer junior",
      "python developer junior",
      "junior python",
      "java developer junior"
    ]
  },
  {
    id: "qa-automation",
    label: "QA Automation Junior",
    patterns: ["qa automation junior", "automation developer junior", "software tester", "test engineer junior"]
  },
  {
    id: "data-analyst",
    label: "Data Analyst Junior",
    patterns: ["data analyst junior", "bi developer junior", "junior data engineer", "machine learning junior", "ai junior", "computer vision junior"]
  },
  {
    id: "ai-ml-research-student",
    label: "AI/ML Research Student",
    patterns: [
      "deep learning",
      "machine learning",
      "ai research",
      "research student",
      "student researcher",
      "computer vision",
      "data science student",
      "algorithm student",
      "algorithms student",
      "machine learning student",
      "ai student",
      "computer vision student",
      "final-year machine learning",
      "final year machine learning",
      "near graduate machine learning",
      "ai/ml intern",
      "ai ml intern",
      "research intern",
      "סטודנט למחקר",
      "למידת מכונה",
      "למידה עמוקה",
      "ראייה ממוחשבת",
      "מדען נתונים סטודנט",
      "אלגוריתמים"
    ]
  },
  {
    id: "support-engineering",
    label: "Support Engineering",
    patterns: ["application support engineer", "technical support engineer", "product support engineer", "api support engineer", "technical customer engineer"]
  },
  {
    id: "systems-devops",
    label: "Systems / DevOps Junior",
    patterns: ["system administrator junior", "junior devops", "soc tier 1"]
  },
  { id: "noc-engineer", label: "NOC Engineer", patterns: ["noc engineer"] },
  { id: "solutions-engineering", label: "Solutions Engineer Junior", patterns: ["solutions engineer junior", "technical integration engineer"] },
  { id: "implementation", label: "Implementation", patterns: ["implementation", "implementation engineer"] },
  { id: "integration", label: "Integration", patterns: ["integration", "technical integration"] },
  { id: "infrastructure", label: "Infrastructure Technical", patterns: ["infrastructure technical", "תשתיות"] },
  { id: "railway", label: "Railway Technical", patterns: ["railway", "רכבת"] },
  { id: "field-technical", label: "Field Technical", patterns: ["field technical", "field technician"] }
] as const;

export function normalizeRuleText(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function findRuleMatches(
  text: string,
  rules: readonly { id: string; label: string; patterns: readonly string[] }[]
) {
  const normalized = normalizeRuleText(text);
  return rules
    .filter((rule) => rule.patterns.some((pattern) => normalized.includes(normalizeRuleText(pattern))))
    .map((rule) => rule.label);
}
