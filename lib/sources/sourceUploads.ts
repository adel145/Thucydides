import path from "node:path";

export const SOURCE_UPLOAD_ROOT = "local_uploads/sources";

export function sanitizeUploadFilename(filename: string) {
  const baseName = path.basename(filename).replace(/[^\w.\- ]+/g, "_").trim();
  return baseName || "uploaded-source";
}

export function buildStoredUploadPath(sourceId: string, originalFilename: string) {
  return path.posix.join(SOURCE_UPLOAD_ROOT, sourceId, sanitizeUploadFilename(originalFilename));
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isUsableUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}
