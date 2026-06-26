/*
  Warnings:

  - Added the required column `updatedAt` to the `SourceFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN "lastContactedAt" DATETIME;
ALTER TABLE "Job" ADD COLUMN "nextActionAt" DATETIME;
ALTER TABLE "Job" ADD COLUMN "nextActionNote" TEXT;
ALTER TABLE "Job" ADD COLUMN "priority" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SourceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT,
    "url" TEXT,
    "extractedText" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SourceFile" ("createdAt", "extractedText", "filename", "id", "path", "type") SELECT "createdAt", "extractedText", "filename", "id", "path", "type" FROM "SourceFile";
DROP TABLE "SourceFile";
ALTER TABLE "new_SourceFile" RENAME TO "SourceFile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
