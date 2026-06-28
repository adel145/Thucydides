import { describe, expect, it } from "vitest";
import { calculateSourceReadiness } from "../lib/sources/sourceReadiness";

describe("source readiness", () => {
  it("tracks required source groups without parsing files", () => {
    const readiness = calculateSourceReadiness([
      { type: "CV" },
      { type: "GITHUB_PROJECTS" },
      { type: "ACADEMIC_DOCUMENT" }
    ]);

    expect(readiness.readyCount).toBe(3);
    expect(readiness.missing.map((item) => item.label)).toEqual(["LinkedIn"]);
  });
});
