import { describe, expect, it } from "vitest";
import { normalizeJobPriority, priorityRank } from "../lib/jobs/jobPriority";

describe("job priority", () => {
  it("normalizes priority values", () => {
    expect(normalizeJobPriority("CRITICAL")).toBe("CRITICAL");
    expect(normalizeJobPriority("bad")).toBe("MEDIUM");
  });

  it("ranks priority values", () => {
    expect(priorityRank("LOW")).toBeLessThan(priorityRank("CRITICAL"));
  });
});
