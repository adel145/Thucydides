-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "preferredName" TEXT,
    "location" TEXT NOT NULL,
    "targetSalaryGrossNis" INTEGER,
    "minimumSalaryGrossNis" INTEGER,
    "availability" TEXT,
    "degreeStatus" TEXT,
    "expectedCompletion" TEXT,
    "mobility" TEXT,
    "languages" JSONB NOT NULL,
    "technicalSkills" JSONB NOT NULL,
    "softSkills" JSONB NOT NULL,
    "fieldExperience" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "certificates" JSONB NOT NULL,
    "githubProjects" JSONB NOT NULL,
    "portfolioLinks" JSONB NOT NULL,
    "sourceNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "location" TEXT,
    "language" TEXT,
    "roleCategory" TEXT,
    "rawDescription" TEXT NOT NULL,
    "salaryText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FOUND',
    "validationStatus" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "forbiddenFlags" JSONB,
    "allowedSignals" JSONB,
    "riskNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "extractedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
