import { describe, expect, it } from "vitest";
import {
  getRecommendedTargetFields,
  groupSourceLinksByTargetField,
  isProfileSourceTargetField,
  summarizeProfileEvidence
} from "../lib/profile/profileSourceLinks";

describe("profile source links", () => {
  it("validates target field whitelist", () => {
    expect(isProfileSourceTargetField("technicalSkills")).toBe(true);
    expect(isProfileSourceTargetField("generatedResume")).toBe(false);
  });

  it("maps source types to recommended profile fields", () => {
    expect(getRecommendedTargetFields("CV").map((field) => field.key)).toEqual([
      "technicalSkills",
      "softSkills",
      "fieldExperience",
      "education",
      "certificates",
      "sourceNotes"
    ]);
    expect(getRecommendedTargetFields("GITHUB_PROJECTS").map((field) => field.key)).toContain("githubProjects");
  });

  it("groups links and summarizes evidence readiness", () => {
    const links = [
      { targetField: "technicalSkills", sourceId: "s1" },
      { targetField: "education", sourceId: "s2" },
      { targetField: "education", sourceId: "s3" }
    ];
    const grouped = groupSourceLinksByTargetField(links);
    const summary = summarizeProfileEvidence(links);

    expect(grouped.technicalSkills).toHaveLength(1);
    expect(grouped.education).toHaveLength(2);
    expect(summary.readyCount).toBe(2);
    expect(summary.fieldsMissingEvidence.map((field) => field.key)).toContain("githubProjects");
  });
});
