import { describe, expect, it } from "vitest";
import {
  buildApplicationPacketSummary,
  canMarkApplicationPacketReady,
  getApplicationDecision,
  recommendCvLanguage,
  sanitizeApplicationDecisionForJob,
  sanitizeApplicationPacketStatusForJob
} from "../lib/applications/applicationPacket";

const profile = {
  fullName: "Adel Mohsen",
  location: "Beersheba",
  degreeStatus: "Near completion",
  technicalSkills: ["TypeScript"],
  education: ["Computer Science"]
};

const sources = [{ type: "CV" }, { type: "GITHUB_PROJECTS" }];
const links = [
  { targetField: "technicalSkills" },
  { targetField: "education" },
  { targetField: "githubProjects" },
  { targetField: "certificates" }
];

describe("application packet helper", () => {
  it("recommends CV language deterministically", () => {
    expect(recommendCvLanguage({ language: "Hebrew", rawDescription: "Support role" })).toBe("Hebrew");
    expect(recommendCvLanguage({ language: "English", rawDescription: "Software support role" })).toBe("English");
    expect(recommendCvLanguage({ language: null, rawDescription: "דרוש מפתח תוכנה" })).toBe("Hebrew");
    expect(recommendCvLanguage({ language: null, rawDescription: "Technical support role" })).toBe("English");
  });

  it("keeps forbidden jobs out of preparation", () => {
    expect(getApplicationDecision({ status: "FOUND", validationStatus: "FORBIDDEN" }, profile, sources, links)).toBe("DO_NOT_APPLY");
  });

  it("marks archived and rejected jobs closed", () => {
    expect(getApplicationDecision({ status: "ARCHIVED", validationStatus: "ALLOWED" }, profile, sources, links)).toBe("CLOSED");
    expect(getApplicationDecision({ status: "REJECTED", validationStatus: "RISKY" }, profile, sources, links)).toBe("CLOSED");
  });

  it("returns actionable decisions for allowed and risky active jobs", () => {
    expect(getApplicationDecision({ status: "FOUND", validationStatus: "ALLOWED" }, profile, sources, links)).toBe("READY_TO_PREPARE");
    expect(getApplicationDecision({ status: "FOUND", validationStatus: "RISKY" }, profile, sources, links)).toBe("NEEDS_MANUAL_REVIEW");
  });

  it("reports missing profile and evidence inputs", () => {
    const summary = buildApplicationPacketSummary(
      { status: "FOUND", validationStatus: "ALLOWED", language: "English", rawDescription: "QA role" },
      { fullName: "Adel", location: "", degreeStatus: "", technicalSkills: [], education: [] },
      [],
      [],
      {}
    );

    expect(summary.applicationDecision).toBe("NEEDS_PROFILE_EVIDENCE");
    expect(summary.missingItems).toContain("Complete required profile fields.");
    expect(summary.missingItems).toContain("Add CV, LinkedIn, GitHub/projects, certificates, or academic sources.");
    expect(summary.missingItems).toContain("Write manual CV tailoring notes.");
  });

  it("allows ready only when critical checklist items are complete", () => {
    const summary = buildApplicationPacketSummary(
      { status: "FOUND", validationStatus: "ALLOWED", language: "English", rawDescription: "Junior software role" },
      profile,
      sources,
      [],
      {
        cvTailoringNotes: "Highlight TypeScript projects.",
        recruiterMessageDraft: "Short recruiter note.",
        followUpPlan: "Follow up after five business days."
      }
    );

    expect(summary.applicationDecision).toBe("READY_TO_PREPARE");
    expect(summary.missingItems).toContain("Link source evidence for certificates.");
    expect(canMarkApplicationPacketReady(summary)).toBe(true);
  });

  it("keeps risky jobs in manual review even when marked ready", () => {
    const job = { status: "FOUND", validationStatus: "RISKY", language: "English", rawDescription: "Final-year student welcome" };
    const summary = buildApplicationPacketSummary(job, profile, sources, links, {
      cvTailoringNotes: "Manual review notes.",
      coverLetterDraft: "Cover note.",
      followUpPlan: "Follow-up plan."
    });
    const decision = sanitizeApplicationDecisionForJob(job, "READY_TO_PREPARE", summary.applicationDecision);

    expect(decision).toBe("NEEDS_MANUAL_REVIEW");
    expect(sanitizeApplicationPacketStatusForJob(job, "READY", decision, summary)).toBe("READY");
  });

  it("blocks forbidden jobs from unsafe decisions and ready status", () => {
    const job = { status: "FOUND", validationStatus: "FORBIDDEN", language: "English", rawDescription: "Security clearance required" };
    const summary = buildApplicationPacketSummary(job, profile, sources, links, {
      cvTailoringNotes: "Notes.",
      recruiterMessageDraft: "Message.",
      followUpPlan: "Plan."
    });
    const decision = sanitizeApplicationDecisionForJob(job, "READY_TO_PREPARE", summary.applicationDecision);

    expect(decision).toBe("DO_NOT_APPLY");
    expect(sanitizeApplicationPacketStatusForJob(job, "READY", decision, summary)).toBe("DRAFT");
  });

  it("blocks archived and rejected jobs from ready status", () => {
    for (const status of ["ARCHIVED", "REJECTED"]) {
      const job = { status, validationStatus: "ALLOWED", language: "English", rawDescription: "Software role" };
      const summary = buildApplicationPacketSummary(job, profile, sources, links, {
        cvTailoringNotes: "Notes.",
        coverLetterDraft: "Cover.",
        followUpPlan: "Plan."
      });
      const decision = sanitizeApplicationDecisionForJob(job, "READY_TO_PREPARE", summary.applicationDecision);

      expect(decision).toBe("CLOSED");
      expect(sanitizeApplicationPacketStatusForJob(job, "READY", decision, summary)).toBe("DRAFT");
    }
  });
});
