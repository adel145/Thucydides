import { describe, expect, it } from "vitest";
import { buildApplicationDraftRequest, canRequestApplicationAiDraft, validateApplicationDraftOutput } from "../lib/ai/applicationDrafting";
import { extractResponseText, getOpenAiDraftingConfig } from "../lib/ai/openaiClient";

const profile = {
  fullName: "Adel Mohsen",
  location: "Beersheba",
  degreeStatus: "Computer Science student nearing completion",
  technicalSkills: ["TypeScript", "SQL"],
  education: ["Computer Science"]
};

describe("controlled AI application drafting", () => {
  it("is disabled unless both OpenAI env values are configured", () => {
    expect(getOpenAiDraftingConfig({}).enabled).toBe(false);
    expect(getOpenAiDraftingConfig({ OPENAI_API_KEY: "key" }).enabled).toBe(false);
    expect(getOpenAiDraftingConfig({ OPENAI_API_KEY: "key", OPENAI_MODEL: "model" }).enabled).toBe(true);
  });

  it("blocks forbidden, archived, and rejected jobs from AI drafting", () => {
    expect(canRequestApplicationAiDraft({ status: "FOUND", validationStatus: "FORBIDDEN" })).toBe(false);
    expect(canRequestApplicationAiDraft({ status: "ARCHIVED", validationStatus: "ALLOWED" })).toBe(false);
    expect(canRequestApplicationAiDraft({ status: "REJECTED", validationStatus: "RISKY" })).toBe(false);
    expect(canRequestApplicationAiDraft({ status: "FOUND", validationStatus: "RISKY" })).toBe(true);
  });

  it("builds a review-only prompt with no autonomous application behavior", () => {
    const request = buildApplicationDraftRequest(
      {
        title: "Junior Software Engineer",
        company: "Example",
        status: "FOUND",
        validationStatus: "ALLOWED",
        language: "English",
        rawDescription: "Junior TypeScript role."
      },
      profile,
      [{ type: "CV", filename: "cv.md", extractedText: "TypeScript project evidence." }],
      [{ targetField: "technicalSkills" }],
      { cvTailoringNotes: "Emphasize projects." }
    );

    expect(request.instructions).toContain("Do not apply to jobs");
    expect(request.instructions).toContain("do not send emails");
    expect(request.instructions).toContain("Do not invent");
    expect(request.input).toContain("Junior Software Engineer");
  });

  it("validates generated draft JSON before it can be copied into packet fields", () => {
    expect(validateApplicationDraftOutput({})).toBeNull();
    expect(validateApplicationDraftOutput({
      cvTailoringNotes: "",
      skillsToHighlight: [],
      experienceBulletsDraft: [],
      coverLetterDraft: "",
      recruiterMessageDraft: "",
      followUpPlan: "",
      missingEvidence: [],
      warnings: [],
      confidence: "LOW",
      evidenceNotes: []
    })).toBeNull();

    expect(validateApplicationDraftOutput({
      cvTailoringNotes: "Tailor the CV to the TypeScript project evidence.",
      skillsToHighlight: ["TypeScript"],
      experienceBulletsDraft: ["Built a small project."],
      coverLetterDraft: "Cover note",
      recruiterMessageDraft: "Recruiter note",
      followUpPlan: "Follow up in five business days.",
      missingEvidence: [],
      warnings: ["Review before use."],
      confidence: "MEDIUM",
      evidenceNotes: ["Used supplied source text."]
    })?.confidence).toBe("MEDIUM");
  });

  it("extracts output text from Responses API-style response bodies", () => {
    expect(extractResponseText({ output_text: "{\"ok\":true}" })).toBe("{\"ok\":true}");
    expect(extractResponseText({ output: [{ content: [{ text: "hello" }, { text: "world" }] }] })).toBe("hello\nworld");
  });
});
