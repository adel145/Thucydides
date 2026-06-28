import { describe, expect, it } from "vitest";
import { calculateDashboardMission } from "../lib/dashboard/dashboardMission";

describe("calculateDashboardMission", () => {
  it("groups today's mission jobs and readiness warnings", () => {
    const mission = calculateDashboardMission(
      [
        { id: "1", title: "Ready", status: "FOUND", validationStatus: "ALLOWED", priority: "HIGH", nextActionAt: "2026-06-28T09:00:00.000Z", updatedAt: "2026-06-28T10:00:00.000Z" },
        { id: "2", title: "Overdue", status: "ANALYZED", validationStatus: "RISKY", priority: "MEDIUM", nextActionAt: "2026-06-27T09:00:00.000Z", updatedAt: "2026-06-27T10:00:00.000Z" },
        { id: "3", title: "Forbidden", status: "FOUND", validationStatus: "FORBIDDEN", priority: "CRITICAL", updatedAt: "2026-06-26T10:00:00.000Z" },
        { id: "4", title: "Applied", status: "APPLIED", validationStatus: "ALLOWED", priority: "HIGH", updatedAt: "2026-06-25T10:00:00.000Z" }
      ],
      [{ type: "CV" }, { type: "LINKEDIN_TEXT" }],
      { fullName: "Adel", location: "Beersheba", degreeStatus: "Near completion", technicalSkills: [], education: ["CS"] },
      new Date("2026-06-28T12:00:00.000Z")
    );

    expect(mission.readyToApplyJobs.map((job) => job.title)).toEqual(["Ready", "Overdue"]);
    expect(mission.dueFollowUps.map((job) => job.title)).toEqual(["Ready"]);
    expect(mission.overdueFollowUps.map((job) => job.title)).toEqual(["Overdue"]);
    expect(mission.highPriorityJobs.map((job) => job.title)).toEqual(["Ready", "Applied"]);
    expect(mission.sourceReadiness.readyCount).toBe(2);
    expect(mission.profileWarnings).toContain("Add technical skills.");
  });
});
