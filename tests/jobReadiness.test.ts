import { describe, expect, it } from "vitest";
import { getReadyToApplyJobs, isReadyToApplyJob } from "../lib/jobs/jobReadiness";

describe("job readiness", () => {
  it("keeps allowed and risky active jobs ready without treating it as a fit score", () => {
    expect(isReadyToApplyJob({ status: "FOUND", validationStatus: "ALLOWED" })).toBe(true);
    expect(isReadyToApplyJob({ status: "ANALYZED", validationStatus: "RISKY" })).toBe(true);
    expect(isReadyToApplyJob({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(false);
    expect(isReadyToApplyJob({ status: "APPLIED", validationStatus: "ALLOWED" })).toBe(false);
    expect(isReadyToApplyJob({ status: "ARCHIVED", validationStatus: "RISKY" })).toBe(false);
  });

  it("sorts critical and high priority jobs before lower priority jobs", () => {
    const jobs = getReadyToApplyJobs([
      { title: "Low", status: "FOUND", validationStatus: "ALLOWED", priority: "LOW" },
      { title: "Critical", status: "FOUND", validationStatus: "RISKY", priority: "CRITICAL", nextActionAt: "2026-06-29T09:00:00.000Z" },
      { title: "High", status: "FOUND", validationStatus: "ALLOWED", priority: "HIGH", nextActionAt: "2026-06-28T09:00:00.000Z" }
    ]);

    expect(jobs.map((job) => job.title)).toEqual(["Critical", "High", "Low"]);
  });
});
