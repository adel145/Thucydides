import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { Prisma, PrismaClient } from "../generated/prisma/client";
import { validateJob } from "../lib/rules/validateJob";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db"
});

const prisma = new PrismaClient({ adapter });

const jsonEmpty: string[] = [];

const seedJobs = [
  {
    title: "Help Desk Technician",
    company: "Local IT Services",
    source: "seed",
    location: "Beersheba",
    language: "English",
    roleCategory: "Help Desk",
    rawDescription: "Help desk technical support for internal users in Beersheba. Troubleshooting, PC setup, and ticket handling.",
    salaryText: "8,000-10,000 NIS gross"
  },
  {
    title: "NOC Operator",
    company: "Infrastructure Operations",
    source: "seed",
    location: "Israel",
    language: "English",
    roleCategory: "NOC",
    rawDescription: "NOC monitoring role for network operations center alerts, escalation, and infrastructure technical support.",
    salaryText: "Shift-based salary"
  },
  {
    title: "Junior QA Manual",
    company: "South Hybrid QA",
    source: "seed",
    location: "South / Hybrid",
    language: "English",
    roleCategory: "QA",
    rawDescription: "QA manual junior role for test cases, bug reports, and product validation. Junior candidates welcome.",
    salaryText: "Entry level"
  },
  {
    title: "Implementation Engineer",
    company: "SaaS Implementation",
    source: "seed",
    location: "Israel",
    language: "English",
    roleCategory: "Implementation",
    rawDescription: "Implementation engineer role involving technical onboarding, integrations, and customer-facing technical setup.",
    salaryText: "Negotiable"
  },
  {
    title: "Technical Integration Junior",
    company: "Integration Lab",
    source: "seed",
    location: "Israel",
    language: "English",
    roleCategory: "Integration",
    rawDescription: "Junior technical integration role working with APIs, logs, implementation, and support engineering.",
    salaryText: "Junior range"
  },
  {
    title: "Sales Representative",
    company: "Sales Team",
    source: "seed",
    location: "Israel",
    language: "Hebrew",
    roleCategory: "Sales",
    rawDescription: "Sales representative role focused on targets, leads, and closing deals.",
    salaryText: "Commission"
  },
  {
    title: "Customer Service מוקד שירות",
    company: "General Service Center",
    source: "seed",
    location: "Israel",
    language: "Hebrew",
    roleCategory: "Customer Service",
    rawDescription: "Regular customer service מוקד שירות role for general callers. Not a technical support position.",
    salaryText: "Hourly"
  },
  {
    title: "Security Clearance Mandatory Support Role",
    company: "Restricted Systems",
    source: "seed",
    location: "Israel",
    language: "Hebrew",
    roleCategory: "Support",
    rawDescription: "Technical support role. Security clearance mandatory. סיווג ביטחוני חובה.",
    salaryText: "Confidential"
  },
  {
    title: "Army Experience Mandatory IT Role",
    company: "Defense Vendor",
    source: "seed",
    location: "Israel",
    language: "Hebrew",
    roleCategory: "IT",
    rawDescription: "IT support role. Army experience mandatory and שירות צבאי חובה.",
    salaryText: "Confidential"
  },
  {
    title: "Junior Developer requiring completed degree immediately",
    company: "Graduate Gate",
    source: "seed",
    location: "Israel",
    language: "English",
    roleCategory: "Junior Developer",
    rawDescription: "Junior developer role. Completed degree mandatory and degree completed required immediately before hiring.",
    salaryText: "Junior range"
  }
];

async function main() {
  await prisma.applicationEvent.deleteMany();
  await prisma.profileSourceLink.deleteMany();
  await prisma.job.deleteMany();
  await prisma.sourceFile.deleteMany();
  await prisma.candidateProfile.deleteMany();

  await prisma.candidateProfile.create({
    data: {
      fullName: "Adel Mohsen",
      preferredName: "Adel",
      location: "Beersheba",
      targetSalaryGrossNis: 10000,
      minimumSalaryGrossNis: 8000,
      availability: "To be completed by user",
      degreeStatus: "Computer Science student nearing completion",
      expectedCompletion: "September",
      mobility: "Prefers South of Israel; open anywhere in Israel for strong opportunities",
      languages: ["Arabic", "Hebrew", "English"] as Prisma.InputJsonValue,
      technicalSkills: jsonEmpty as Prisma.InputJsonValue,
      softSkills: jsonEmpty as Prisma.InputJsonValue,
      fieldExperience: jsonEmpty as Prisma.InputJsonValue,
      education: ["Computer Science student nearing completion"] as Prisma.InputJsonValue,
      certificates: jsonEmpty as Prisma.InputJsonValue,
      githubProjects: jsonEmpty as Prisma.InputJsonValue,
      portfolioLinks: jsonEmpty as Prisma.InputJsonValue,
      sourceNotes: "Profile source data will be completed by user later."
    }
  });

  for (const seedJob of seedJobs) {
    const validation = validateJob(seedJob);
    await prisma.job.create({
      data: {
        ...seedJob,
        validationStatus: validation.validationStatus,
        forbiddenFlags: validation.forbiddenFlags as Prisma.InputJsonValue,
        allowedSignals: validation.allowedSignals as Prisma.InputJsonValue,
        riskNotes: validation.riskNotes.join("\n")
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
