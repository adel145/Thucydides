import { describe, expect, it } from "vitest";
import { buildStoredUploadPath, formatFileSize, sanitizeUploadFilename } from "../lib/sources/sourceUploads";

describe("source uploads", () => {
  it("sanitizes uploaded filenames without preserving directory input", () => {
    expect(sanitizeUploadFilename("../Adel CV final.pdf")).toBe("Adel CV final.pdf");
    expect(sanitizeUploadFilename("cv<>draft?.pdf")).toBe("cv_draft_.pdf");
    expect(sanitizeUploadFilename("///")).toBe("uploaded-source");
  });

  it("builds a local relative upload path", () => {
    expect(buildStoredUploadPath("upload-1", "../cv.pdf")).toBe("local_uploads/sources/upload-1/cv.pdf");
  });

  it("formats upload sizes", () => {
    expect(formatFileSize(null)).toBe("Unknown size");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
