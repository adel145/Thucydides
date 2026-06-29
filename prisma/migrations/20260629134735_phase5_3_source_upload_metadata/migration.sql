-- AlterTable
ALTER TABLE "SourceFile" ADD COLUMN "uploadMimeType" TEXT;
ALTER TABLE "SourceFile" ADD COLUMN "uploadSizeBytes" INTEGER;
ALTER TABLE "SourceFile" ADD COLUMN "uploadedAt" DATETIME;
