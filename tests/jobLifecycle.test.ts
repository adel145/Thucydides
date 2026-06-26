import { describe, expect, it } from "vitest";
import { buildValidatedJobUpdate, buildValidationRerunUpdate } from "../lib/jobs/jobLifecycle";

describe("job lifecycle validation helpers", () => {
  it("returns a full validated update shape for archive-safe lifecycle flows", () => {
    const update = buildValidatedJobUpdate({
      title: "Help Desk Technician",
      source: "manual",
      rawDescription: "Help desk technical support role in Beersheba."
    });

    expect(update.validationStatus).toBe("ALLOWED");
    expect(update.allowedSignals).toContain("Help Desk");
    expect(update.forbiddenFlags).toEqual([]);
  });

  it("reruns validation and catches forbidden changes", () => {
    const update = buildValidationRerunUpdate({
      title: "Sales Representative",
      source: "manual",
      rawDescription: "Sales role with targets."
    });

    expect(update.validationStatus).toBe("FORBIDDEN");
    expect(update.forbiddenFlags).toContain("Sales role");
  });
});
