import { describe, expect, it } from "vitest";
import { getReadyToApplyJobs, isActionableJob, isActiveJob, isCompletedOrClosedJob, isReadyToApplyJob } from "../lib/jobs/jobReadiness";

describe("job readiness", () => {
  it("keeps allowed and risky active jobs ready without treating it as a fit score", () => {
    expect(isReadyToApplyJob({ status: "FOUND", validationStatus: "ALLOWED" })).toBe(true);
    expect(isReadyToApplyJob({ status: "ANALYZED", validationStatus: "RISKY" })).toBe(true);
    expect(isReadyToApplyJob({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(false);
  });

  it("excludes completed, closed, and forbidden jobs from ready-to-apply", () => {
    for (const status of ["APPLIED", "REPLIED", "INTERVIEW", "OFFER", "ARCHIVED", "REJECTED"]) {
      expect(isReadyToApplyJob({ status, validationStatus: "ALLOWED" })).toBe(false);
    }
    expect(isReadyToApplyJob({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(false);
  });

  it("shares active, actionable, and completed-or-closed status logic", () => {
    expect(isActiveJob({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(true);
    expect(isActiveJob({ status: "ARCHIVED", validationStatus: "ALLOWED" })).toBe(false);
    expect(isActiveJob({ status: "REJECTED", validationStatus: "RISKY" })).toBe(false);
    expect(isActionableJob({ status: "FOUND", validationStatus: "ALLOWED" })).toBe(true);
    expect(isActionableJob({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(false);
    expect(isCompletedOrClosedJob({ status: "INTERVIEW", validationStatus: "ALLOWED" })).toBe(true);
    expect(isCompletedOrClosedJob({ status: "FOUND", validationStatus: "ALLOWED" })).toBe(false);
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
