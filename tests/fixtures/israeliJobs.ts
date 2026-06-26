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
    name: "risky junior developer degree advantage",
    title: "Junior Developer",
    location: "Tel Aviv",
    rawDescription: "Junior developer. Degree is an advantage, not mandatory. Bachelor must be completed is not written.",
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
    name: "forbidden completed degree hard requirement",
    title: "Junior Developer",
    rawDescription: "Completed degree required before start. זכאות לתואר חובה.",
    expectedStatus: "FORBIDDEN",
    expectedFlag: "Completed degree mandatory"
  }
];
