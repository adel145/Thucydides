-- CreateTable
CREATE TABLE "JobDiscoveryRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "sourcePriority" TEXT,
    "query" TEXT,
    "provider" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobDiscoveryLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL DEFAULT 'GMAIL_ALERT',
    "provider" TEXT,
    "gmailAlertId" TEXT,
    "discoveryRunId" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "sourceUrl" TEXT,
    "rawSnippet" TEXT NOT NULL,
    "rawText" TEXT,
    "discoverySource" TEXT,
    "discoveryProvider" TEXT,
    "discoveryQuery" TEXT,
    "discoveredUrl" TEXT,
    "canonicalUrl" TEXT,
    "extractedTitle" TEXT,
    "extractedCompany" TEXT,
    "extractedLocation" TEXT,
    "extractedDescription" TEXT,
    "extractedRequirements" TEXT,
    "extractedRemotePolicy" TEXT,
    "extractedLanguage" TEXT,
    "confidence" TEXT,
    "fitScore" INTEGER,
    "fitReasons" JSONB,
    "lastEnrichedAt" DATETIME,
    "validationStatus" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "forbiddenFlags" JSONB,
    "allowedSignals" JSONB,
    "riskNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "importedJobId" TEXT,
    "duplicateOfJobId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobDiscoveryLead_gmailAlertId_fkey" FOREIGN KEY ("gmailAlertId") REFERENCES "GmailJobAlert" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobDiscoveryLead_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "JobDiscoveryRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobDiscoveryLead" ("allowedSignals", "company", "createdAt", "duplicateOfJobId", "forbiddenFlags", "gmailAlertId", "id", "importedJobId", "location", "notes", "provider", "rawSnippet", "rawText", "riskNotes", "sourceType", "sourceUrl", "status", "title", "updatedAt", "validationStatus") SELECT "allowedSignals", "company", "createdAt", "duplicateOfJobId", "forbiddenFlags", "gmailAlertId", "id", "importedJobId", "location", "notes", "provider", "rawSnippet", "rawText", "riskNotes", "sourceType", "sourceUrl", "status", "title", "updatedAt", "validationStatus" FROM "JobDiscoveryLead";
DROP TABLE "JobDiscoveryLead";
ALTER TABLE "new_JobDiscoveryLead" RENAME TO "JobDiscoveryLead";
CREATE INDEX "JobDiscoveryLead_gmailAlertId_idx" ON "JobDiscoveryLead"("gmailAlertId");
CREATE INDEX "JobDiscoveryLead_discoveryRunId_idx" ON "JobDiscoveryLead"("discoveryRunId");
CREATE INDEX "JobDiscoveryLead_status_idx" ON "JobDiscoveryLead"("status");
CREATE INDEX "JobDiscoveryLead_validationStatus_idx" ON "JobDiscoveryLead"("validationStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
