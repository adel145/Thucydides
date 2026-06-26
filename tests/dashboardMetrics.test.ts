import { describe, expect, it } from "vitest";
import { calculateDashboardMetrics } from "../lib/dashboard/dashboardMetrics";

describe("calculateDashboardMetrics", () => {
  it("counts pipeline and validation metrics", () => {
    const metrics = calculateDashboardMetrics([
      { status: "FOUND", validationStatus: "ALLOWED", nextActionAt: "2026-06-25T09:00:00.000Z", priority: "HIGH" },
      { status: "READY_TO_APPLY", validationStatus: "RISKY", nextActionAt: "2026-06-26T09:00:00.000Z", priority: "CRITICAL" },
      { status: "APPLIED", validationStatus: "ALLOWED" },
      { status: "REPLIED", validationStatus: "ALLOWED" },
      { status: "INTERVIEW", validationStatus: "ALLOWED" },
      { status: "OFFER", validationStatus: "ALLOWED" },
      { status: "REJECTED", validationStatus: "FORBIDDEN" },
      { status: "ARCHIVED", validationStatus: "FORBIDDEN", nextActionAt: "2026-06-24T09:00:00.000Z", priority: "CRITICAL" }
    ], new Date("2026-06-26T12:00:00.000Z"));

    expect(metrics.jobsFound).toBe(8);
    expect(metrics.activeJobs).toBe(7);
    expect(metrics.applicationsReady).toBe(1);
    expect(metrics.applicationsSent).toBe(1);
    expect(metrics.replies).toBe(1);
    expect(metrics.interviews).toBe(1);
    expect(metrics.offers).toBe(1);
    expect(metrics.rejections).toBe(1);
    expect(metrics.archived).toBe(1);
    expect(metrics.allowedJobs).toBe(5);
    expect(metrics.riskyJobs).toBe(1);
    expect(metrics.forbiddenJobs).toBe(2);
    expect(metrics.interviewGoalCurrent).toBe(1);
    expect(metrics.dueFollowUps).toBe(2);
    expect(metrics.overdueFollowUps).toBe(1);
    expect(metrics.highPriorityJobs).toBe(2);
  });
});
