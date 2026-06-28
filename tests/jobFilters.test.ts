import { describe, expect, it } from "vitest";
import { filterJobs, hasActiveJobFilters, normalizeJobSort } from "../lib/jobs/jobFilters";

const jobs = [
  { title: "Help Desk", company: "A", location: "Beersheba", rawDescription: "technical support", validationStatus: "ALLOWED", status: "FOUND", source: "manual", language: "English", roleCategory: "Help Desk", priority: "HIGH", nextActionAt: "2026-06-25T09:00:00.000Z" },
  { title: "Risky QA", company: "C", location: "Beersheba", rawDescription: "qa", validationStatus: "RISKY", status: "ANALYZED", source: "manual", language: "English", roleCategory: "QA", priority: "MEDIUM", nextActionAt: null },
  { title: "Sales", company: "B", location: "Tel Aviv", rawDescription: "sales targets", validationStatus: "FORBIDDEN", status: "ARCHIVED", source: "seed", language: "Hebrew", roleCategory: "Sales", priority: "LOW", nextActionAt: null }
];

describe("job filters", () => {
  it("filters by text and validation status", () => {
    expect(filterJobs(jobs, { q: "technical", validationStatus: "ALLOWED" })).toHaveLength(1);
    expect(filterJobs(jobs, { q: "technical", validationStatus: "FORBIDDEN" })).toHaveLength(0);
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
    expect(filterJobs(jobs, { view: "high-priority" }).map((job) => job.title)).toEqual(["Help Desk"]);
    expect(filterJobs(jobs, { view: "risky" }).map((job) => job.title)).toEqual(["Risky QA"]);
    expect(filterJobs(jobs, { view: "forbidden" }).map((job) => job.title)).toEqual(["Sales"]);
  });
});
