-- CreateTable
CREATE TABLE "ProfileSourceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetField" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileSourceLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileSourceLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfileSourceLink_profileId_idx" ON "ProfileSourceLink"("profileId");

-- CreateIndex
CREATE INDEX "ProfileSourceLink_sourceId_idx" ON "ProfileSourceLink"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSourceLink_profileId_sourceId_targetField_key" ON "ProfileSourceLink"("profileId", "sourceId", "targetField");
