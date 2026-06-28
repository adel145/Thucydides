-- CreateTable
CREATE TABLE "ApplicationPacket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "cvLanguage" TEXT,
    "applicationDecision" TEXT,
    "checklist" JSONB,
    "missingItems" JSONB,
    "profileEvidenceSummary" JSONB,
    "cvTailoringNotes" TEXT,
    "skillsToHighlight" TEXT,
    "experienceBulletsDraft" TEXT,
    "coverLetterDraft" TEXT,
    "recruiterMessageDraft" TEXT,
    "followUpPlan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApplicationPacket_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPacket_jobId_key" ON "ApplicationPacket"("jobId");

-- CreateIndex
CREATE INDEX "ApplicationPacket_jobId_idx" ON "ApplicationPacket"("jobId");
