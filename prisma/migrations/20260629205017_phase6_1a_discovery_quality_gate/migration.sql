-- CreateTable
CREATE TABLE "DiscoverySourceCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discoveryRunId" TEXT,
    "provider" TEXT,
    "source" TEXT,
    "query" TEXT,
    "url" TEXT,
    "title" TEXT,
    "snippet" TEXT,
    "rawText" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'UNCLASSIFIED',
    "confidence" TEXT,
    "reason" TEXT,
    "extractedCompany" TEXT,
    "extractedJobCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'REVIEW',
    "createdLeadCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiscoverySourceCandidate_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "JobDiscoveryRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "sourceCandidateId" TEXT,
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
    "sourceClassification" TEXT,
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
    CONSTRAINT "JobDiscoveryLead_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "JobDiscoveryRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JobDiscoveryLead_sourceCandidateId_fkey" FOREIGN KEY ("sourceCandidateId") REFERENCES "DiscoverySourceCandidate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobDiscoveryLead" ("allowedSignals", "canonicalUrl", "company", "confidence", "createdAt", "discoveredUrl", "discoveryProvider", "discoveryQuery", "discoveryRunId", "discoverySource", "duplicateOfJobId", "extractedCompany", "extractedDescription", "extractedLanguage", "extractedLocation", "extractedRemotePolicy", "extractedRequirements", "extractedTitle", "fitReasons", "fitScore", "forbiddenFlags", "gmailAlertId", "id", "importedJobId", "lastEnrichedAt", "location", "notes", "provider", "rawSnippet", "rawText", "riskNotes", "sourceType", "sourceUrl", "status", "title", "updatedAt", "validationStatus") SELECT "allowedSignals", "canonicalUrl", "company", "confidence", "createdAt", "discoveredUrl", "discoveryProvider", "discoveryQuery", "discoveryRunId", "discoverySource", "duplicateOfJobId", "extractedCompany", "extractedDescription", "extractedLanguage", "extractedLocation", "extractedRemotePolicy", "extractedRequirements", "extractedTitle", "fitReasons", "fitScore", "forbiddenFlags", "gmailAlertId", "id", "importedJobId", "lastEnrichedAt", "location", "notes", "provider", "rawSnippet", "rawText", "riskNotes", "sourceType", "sourceUrl", "status", "title", "updatedAt", "validationStatus" FROM "JobDiscoveryLead";
DROP TABLE "JobDiscoveryLead";
ALTER TABLE "new_JobDiscoveryLead" RENAME TO "JobDiscoveryLead";
CREATE INDEX "JobDiscoveryLead_gmailAlertId_idx" ON "JobDiscoveryLead"("gmailAlertId");
CREATE INDEX "JobDiscoveryLead_discoveryRunId_idx" ON "JobDiscoveryLead"("discoveryRunId");
CREATE INDEX "JobDiscoveryLead_sourceCandidateId_idx" ON "JobDiscoveryLead"("sourceCandidateId");
CREATE INDEX "JobDiscoveryLead_status_idx" ON "JobDiscoveryLead"("status");
CREATE INDEX "JobDiscoveryLead_validationStatus_idx" ON "JobDiscoveryLead"("validationStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DiscoverySourceCandidate_discoveryRunId_idx" ON "DiscoverySourceCandidate"("discoveryRunId");

-- CreateIndex
CREATE INDEX "DiscoverySourceCandidate_classification_idx" ON "DiscoverySourceCandidate"("classification");

-- CreateIndex
CREATE INDEX "DiscoverySourceCandidate_status_idx" ON "DiscoverySourceCandidate"("status");
