-- CreateTable
CREATE TABLE "GmailJobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT,
    "sender" TEXT,
    "subject" TEXT,
    "receivedAt" DATETIME,
    "rawText" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REVIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobDiscoveryLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL DEFAULT 'GMAIL_ALERT',
    "provider" TEXT,
    "gmailAlertId" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "sourceUrl" TEXT,
    "rawSnippet" TEXT NOT NULL,
    "rawText" TEXT,
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
    CONSTRAINT "JobDiscoveryLead_gmailAlertId_fkey" FOREIGN KEY ("gmailAlertId") REFERENCES "GmailJobAlert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JobDiscoveryLead_gmailAlertId_idx" ON "JobDiscoveryLead"("gmailAlertId");

-- CreateIndex
CREATE INDEX "JobDiscoveryLead_status_idx" ON "JobDiscoveryLead"("status");

-- CreateIndex
CREATE INDEX "JobDiscoveryLead_validationStatus_idx" ON "JobDiscoveryLead"("validationStatus");
