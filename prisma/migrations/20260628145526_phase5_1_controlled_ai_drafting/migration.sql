-- CreateTable
CREATE TABLE "AiDraftRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationPacketId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "model" TEXT,
    "promptVersion" TEXT NOT NULL,
    "inputSummary" JSONB,
    "output" JSONB,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AiDraftRun_applicationPacketId_fkey" FOREIGN KEY ("applicationPacketId") REFERENCES "ApplicationPacket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AiDraftRun_applicationPacketId_idx" ON "AiDraftRun"("applicationPacketId");
