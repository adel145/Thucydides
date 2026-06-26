import { describe, expect, it } from "vitest";
import { validateJob } from "../lib/rules/validateJob";
import { israeliJobFixtures } from "./fixtures/israeliJobs";

describe("validateJob", () => {
  it.each(israeliJobFixtures)("$name", (fixture) => {
    const result = validateJob({
      title: fixture.title,
      location: fixture.location,
      salaryText: fixture.salaryText,
      rawDescription: fixture.rawDescription
    });

    expect(result.validationStatus).toBe(fixture.expectedStatus);
    if (fixture.expectedSignal) {
      expect(result.allowedSignals).toContain(fixture.expectedSignal);
    }
    if (fixture.expectedFlag) {
      expect(result.forbiddenFlags).toContain(fixture.expectedFlag);
    }
  });

  it("keeps mixed technical and risky salary/location jobs risky", () => {
    const result = validateJob({
      title: "Junior QA Manual",
      location: "Tel Aviv",
      salaryText: "7,500 NIS gross",
      rawDescription: "QA manual junior position. Degree required before September is mentioned as a concern."
    });

    expect(result.validationStatus).toBe("RISKY");
    expect(result.allowedSignals).toContain("QA");
    expect(result.riskNotes.length).toBeGreaterThanOrEqual(2);
  });
});
