import { describe, expect, it } from "vitest";
import { filterJobs, hasActiveJobFilters, normalizeJobSort } from "../lib/jobs/jobFilters";

const jobs = [
  { title: "Help Desk", company: "A", location: "Beersheba", rawDescription: "technical support", validationStatus: "ALLOWED", status: "FOUND", source: "manual", language: "English", roleCategory: "Help Desk", priority: "HIGH", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Risky QA", company: "C", location: "Beersheba", rawDescription: "qa", validationStatus: "RISKY", status: "ANALYZED", source: "manual", language: "English", roleCategory: "QA", priority: "MEDIUM", nextActionAt: null },
  { title: "Applied High", company: "D", location: "Remote", rawDescription: "applied technical", validationStatus: "ALLOWED", status: "APPLIED", source: "manual", language: "English", roleCategory: "Support", priority: "HIGH", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Rejected Risky", company: "E", location: "Remote", rawDescription: "risky rejected", validationStatus: "RISKY", status: "REJECTED", source: "manual", language: "English", roleCategory: "QA", priority: "CRITICAL", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Forbidden Active", company: "F", location: "Tel Aviv", rawDescription: "security clearance", validationStatus: "FORBIDDEN", status: "FOUND", source: "seed", language: "Hebrew", roleCategory: "Security", priority: "CRITICAL", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Archived Allowed", company: "G", location: "Remote", rawDescription: "archived technical", validationStatus: "ALLOWED", status: "ARCHIVED", source: "manual", language: "English", roleCategory: "Support", priority: "CRITICAL", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Sales", company: "B", location: "Tel Aviv", rawDescription: "sales targets", validationStatus: "FORBIDDEN", status: "ARCHIVED", source: "seed", language: "Hebrew", roleCategory: "Sales", priority: "LOW", nextActionAt: null }
];

describe("job filters", () => {
  it("filters by text and validation status", () => {
    expect(filterJobs(jobs, { q: "Help Desk", validationStatus: "ALLOWED" })).toHaveLength(1);
    expect(filterJobs(jobs, { q: "Help Desk", validationStatus: "FORBIDDEN" })).toHaveLength(0);
  });

  it("filters by status and facets", () => {
    expect(filterJobs(jobs, { status: "ARCHIVED", source: "seed", language: "Hebrew", location: "Tel Aviv", roleCategory: "Sales" })).toHaveLength(1);
  });

  it("normalizes sort and detects active filters", () => {
    expect(normalizeJobSort("company")).toBe("company");
    expect(normalizeJobSort("bad")).toBe("updated");
    expect(hasActiveJobFilters({ q: "help" })).toBe(true);
    expect(hasActiveJobFilters({ sort: "updated" })).toBe(false);
  });

  it("applies quick review views", () => {
    expect(filterJobs(jobs, { view: "ready" }).map((job) => job.title)).toEqual(["Help Desk", "Risky QA"]);
    expect(filterJobs(jobs, { view: "high-priority" }).map((job) => job.title)).toEqual(["Help Desk", "Applied High"]);
    expect(filterJobs(jobs, { view: "risky" }).map((job) => job.title)).toEqual(["Risky QA"]);
  });

  it("keeps closed and forbidden jobs out of actionable quick views", () => {
    expect(filterJobs(jobs, { view: "ready" }).map((job) => job.title)).not.toContain("Applied High");
    expect(filterJobs(jobs, { view: "ready" }).map((job) => job.title)).not.toContain("Rejected Risky");
    expect(filterJobs(jobs, { view: "ready" }).map((job) => job.title)).not.toContain("Archived Allowed");
    expect(filterJobs(jobs, { view: "high-priority" }).map((job) => job.title)).not.toContain("Rejected Risky");
    expect(filterJobs(jobs, { view: "high-priority" }).map((job) => job.title)).not.toContain("Archived Allowed");
    expect(filterJobs(jobs, { view: "high-priority" }).map((job) => job.title)).not.toContain("Forbidden Active");
    expect(filterJobs(jobs, { view: "follow-up-due" }).map((job) => job.title)).not.toContain("Rejected Risky");
    expect(filterJobs(jobs, { view: "follow-up-due" }).map((job) => job.title)).not.toContain("Archived Allowed");
    expect(filterJobs(jobs, { view: "follow-up-due" }).map((job) => job.title)).not.toContain("Forbidden Active");
  });

  it("shows only active forbidden jobs in forbidden/archive review", () => {
    expect(filterJobs(jobs, { view: "forbidden" }).map((job) => job.title)).toEqual(["Forbidden Active"]);
  });
});
