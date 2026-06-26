import { describe, expect, it } from "vitest";
import { filterJobs, hasActiveJobFilters, normalizeJobSort } from "../lib/jobs/jobFilters";

const jobs = [
  { title: "Help Desk", company: "A", location: "Beersheba", rawDescription: "technical support", validationStatus: "ALLOWED", status: "FOUND", source: "manual", language: "English", roleCategory: "Help Desk" },
  { title: "Sales", company: "B", location: "Tel Aviv", rawDescription: "sales targets", validationStatus: "FORBIDDEN", status: "ARCHIVED", source: "seed", language: "Hebrew", roleCategory: "Sales" }
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
});
