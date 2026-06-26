import { describe, expect, it } from "vitest";
import { archiveStatus, isJobStatus, JOB_STATUSES, normalizeJobStatus } from "../lib/jobs/jobStatus";

describe("job status model", () => {
  it("contains the complete allowed status list", () => {
    expect(JOB_STATUSES).toEqual([
      "FOUND",
      "ANALYZED",
      "READY_TO_APPLY",
      "APPLIED",
      "REPLIED",
      "INTERVIEW",
      "REJECTED",
      "OFFER",
      "ARCHIVED"
    ]);
  });

  it("normalizes invalid statuses to FOUND", () => {
    expect(normalizeJobStatus("APPLIED")).toBe("APPLIED");
    expect(normalizeJobStatus("NOPE")).toBe("FOUND");
    expect(normalizeJobStatus(null)).toBe("FOUND");
  });

  it("defines archive as a supported status", () => {
    expect(archiveStatus()).toBe("ARCHIVED");
    expect(isJobStatus(archiveStatus())).toBe(true);
  });
});
