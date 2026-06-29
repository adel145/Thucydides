import type { JobValidationStatus } from "../../lib/rules/validateJob";

export type IsraeliJobFixture = {
  name: string;
  title: string;
  location?: string;
  salaryText?: string;
  rawDescription: string;
  expectedStatus: JobValidationStatus;
  expectedSignal?: string;
  expectedFlag?: string;
};

export const israeliJobFixtures: IsraeliJobFixture[] = [
  {
    name: "allowed technical support job in Beersheba",
    title: "Help Desk תומך טכני",
    location: "Beersheba",
    rawDescription: "תמיכה טכנית לעובדי חברה, טיפול בתקלות מחשוב, טכנאי PC.",
    expectedStatus: "ALLOWED",
    expectedSignal: "Help Desk"
  },
  {
    name: "allowed NOC role",
    title: "NOC Operator",
    rawDescription: "Network operations center monitoring, escalation and infrastructure alerts.",
    expectedStatus: "ALLOWED",
    expectedSignal: "NOC"
  },
  {
    name: "allowed QA Manual role",
    title: "Junior QA Manual",
    rawDescription: "Manual QA, test cases, bug reports, junior candidates welcome.",
    expectedStatus: "ALLOWED",
    expectedSignal: "QA"
  },
  {
    name: "allowed implementation integration role",
    title: "Implementation Engineer",
    rawDescription: "Technical integration, implementation, logs, API troubleshooting.",
    expectedStatus: "ALLOWED",
    expectedSignal: "Implementation"
  },
  {
    name: "allowed Junior Software Engineer role",
    title: "Junior Software Engineer",
    rawDescription: "Entry-level software engineering role for CS graduates or near-graduates.",
    expectedStatus: "ALLOWED",
    expectedSignal: "Junior Developer"
  },
  {
    name: "allowed QA Automation Junior role",
    title: "QA Automation Junior",
    rawDescription: "Automation tests, regression suites, TypeScript and Playwright advantage.",
    expectedStatus: "ALLOWED",
    expectedSignal: "QA Automation Junior"
  },
  {
    name: "allowed Data Analyst Junior role",
    title: "Data Analyst Junior",
    rawDescription: "SQL dashboards, BI reports, junior data analysis for operations team.",
    expectedStatus: "ALLOWED",
    expectedSignal: "Data Analyst Junior"
  },
  {
    name: "allowed Application Support Engineer role",
    title: "Application Support Engineer",
    rawDescription: "Troubleshoot production application issues, logs, APIs and customer technical cases.",
    expectedStatus: "ALLOWED",
    expectedSignal: "Support Engineering"
  },
  {
    name: "allowed Deep Learning Research Student role",
    title: "Deep Learning Research Student",
    rawDescription: "Research student role for deep learning, machine learning, and computer vision. Final-year student welcome.",
    expectedStatus: "ALLOWED",
    expectedSignal: "AI/ML Research Student"
  },
  {
    name: "allowed AI ML research internship",
    title: "Research Intern",
    rawDescription: "AI research internship for a student researcher working on machine learning experiments and algorithms.",
    expectedStatus: "ALLOWED",
    expectedSignal: "AI/ML Research Student"
  },
  {
    name: "risky junior developer degree advantage",
    title: "Junior Developer",
    location: "Tel Aviv",
    rawDescription: "Junior developer. Degree is an advantage, not mandatory. Bachelor must be completed is not written.",
    expectedStatus: "RISKY",
    expectedSignal: "Junior Developer"
  },
  {
    name: "risky completed degree hard requirement",
    title: "Junior Developer",
    rawDescription: "Completed degree required before start. זכאות לתואר חובה.",
    expectedStatus: "RISKY",
    expectedSignal: "Junior Developer"
  },
  {
    name: "forbidden sales role",
    title: "נציג מכירות",
    rawDescription: "מכירות טלפוניות, יעדי מכירה ועמלות.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Sales role"
  },
  {
    name: "forbidden regular customer service",
    title: "Customer Service Representative",
    rawDescription: "Regular customer service call center for general customers.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Regular customer service"
  },
  {
    name: "forbidden מוקד שירות role",
    title: "מוקד שירות",
    rawDescription: "נציג שירות במוקד שירות כללי ללא תמיכה טכנית.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Regular customer service"
  },
  {
    name: "forbidden security clearance mandatory",
    title: "Support Engineer",
    rawDescription: "נדרש סיווג ביטחוני חובה כתנאי קבלה.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Security clearance mandatory"
  },
  {
    name: "forbidden army service mandatory",
    title: "IT Support",
    rawDescription: "שירות צבאי חובה ויוצא יחידה טכנולוגית חובה.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Army experience mandatory"
  },
  {
    name: "forbidden technical role with security clearance hard blocker",
    title: "NOC Engineer",
    rawDescription: "NOC Engineer for infrastructure monitoring. Security clearance mandatory.",
    expectedStatus: "FORBIDDEN",
    expectedSignal: "NOC",
    expectedFlag: "Security clearance mandatory"
  },
  {
    name: "forbidden AI research role with security clearance hard blocker",
    title: "AI Research Student",
    rawDescription: "Deep learning and computer vision role. Mandatory security clearance is required before start.",
    expectedStatus: "FORBIDDEN",
    expectedSignal: "AI/ML Research Student",
    expectedFlag: "Security clearance mandatory"
  },
  {
    name: "forbidden AI ML role with army hard blocker",
    title: "Machine Learning Junior",
    rawDescription: "Machine learning junior role. IDF experience required and military experience mandatory.",
    expectedStatus: "FORBIDDEN",
    expectedSignal: "Data Analyst Junior",
    expectedFlag: "Army experience mandatory"
  },
  {
    name: "forbidden AI product sales role",
    title: "AI Product Sales Representative",
    rawDescription: "Sales representative for AI products with targets and commissions.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Sales role"
  },
  {
    name: "forbidden AI customer service role",
    title: "AI Customer Service Representative",
    rawDescription: "Regular customer service call center for AI product customers.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Regular customer service"
  }
];
