import { describe, expect, it } from "vitest";
import { normalizeSourceType, SOURCE_TYPES } from "../lib/sources/sourceTypes";

describe("source types", () => {
  it("contains required source types", () => {
    expect(SOURCE_TYPES).toContain("CV");
    expect(SOURCE_TYPES).toContain("LINKEDIN_TEXT");
    expect(SOURCE_TYPES).toContain("ACADEMIC_DOCUMENT");
  });

  it("normalizes unknown source types", () => {
    expect(normalizeSourceType("CV")).toBe("CV");
    expect(normalizeSourceType("bad")).toBe("OTHER");
  });
});
