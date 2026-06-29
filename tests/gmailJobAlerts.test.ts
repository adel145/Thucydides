import { describe, expect, it } from "vitest";
import { classifyGmailAlertProvider, GMAIL_ALERT_PROVIDERS } from "../lib/gmail/gmailAlertProviders";
import { countGmailAlertLeadsAwaitingReview } from "../lib/gmail/gmailLeadCounts";
import { parseGmailJobAlertText } from "../lib/gmail/gmailJobAlertParser";
import { findDuplicateJobForLead, prepareJobCreateFromLead } from "../lib/gmail/jobLeadImport";
import { validateJob } from "../lib/rules/validateJob";

describe("Gmail job alert provider classification", () => {
  it("classifies common job-alert providers", () => {
    expect(classifyGmailAlertProvider({ sender: "jobs-noreply@linkedin.com", subject: "LinkedIn job alert" })).toBe(GMAIL_ALERT_PROVIDERS.LINKEDIN);
    expect(classifyGmailAlertProvider({ sender: "alert@indeed.com", subject: "Indeed jobs for you" })).toBe(GMAIL_ALERT_PROVIDERS.INDEED);
    expect(classifyGmailAlertProvider({ subject: "משרות חדשות בדרושים", rawText: "דרושים Junior QA" })).toBe(GMAIL_ALERT_PROVIDERS.DRUSHIM);
    expect(classifyGmailAlertProvider({ subject: "AllJobs alert", rawText: "אולג'ובס משרות" })).toBe(GMAIL_ALERT_PROVIDERS.ALLJOBS);
    expect(classifyGmailAlertProvider({ sender: "unknown@example.com", subject: "Random newsletter" })).toBe(GMAIL_ALERT_PROVIDERS.OTHER);
  });
});

describe("parseGmailJobAlertText", () => {
  it("extracts a conservative technical lead and URL from a LinkedIn-style pasted alert", () => {
    const leads = parseGmailJobAlertText({
      sender: "jobs-noreply@linkedin.com",
      subject: "New software jobs",
      rawText: [
        "Junior Software Engineer",
        "Acme Labs · Tel Aviv",
        "https://www.linkedin.com/jobs/view/123",
        "View job"
      ].join("\n")
    });

    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      provider: "LINKEDIN",
      title: "Junior Software Engineer",
      company: "Acme Labs",
      location: "Tel Aviv",
      sourceUrl: "https://www.linkedin.com/jobs/view/123"
    });
    expect(leads[0].rawSnippet).toContain("Junior Software Engineer");
  });

  it("extracts an Indeed-style labeled technical lead", () => {
    const leads = parseGmailJobAlertText({
      sender: "alert@indeed.com",
      subject: "Indeed job alert",
      rawText: [
        "Title: QA Automation Junior",
        "Company: TestWorks",
        "Location: Beer Sheva",
        "https://example.com/qa"
      ].join("\n")
    });

    expect(leads[0]).toMatchObject({
      provider: "INDEED",
      title: "QA Automation Junior",
      company: "TestWorks",
      location: "Beer Sheva",
      sourceUrl: "https://example.com/qa"
    });
  });

  it("does not fabricate leads from empty or noisy text", () => {
    expect(parseGmailJobAlertText("")).toEqual([]);
    expect(parseGmailJobAlertText("unsubscribe newsletter preferences click here")).toEqual([]);
  });
});

describe("Gmail lead role safety", () => {
  it("allows AI/ML research student leads without blockers", () => {
    const result = validateJob({
      title: "Deep Learning Research Student",
      rawDescription: "AI research student role for machine learning and computer vision."
    });

    expect(result.validationStatus).toBe("ALLOWED");
    expect(result.allowedSignals).toContain("AI/ML Research Student");
  });

  it("keeps hard blockers forbidden even with AI/ML words", () => {
    for (const input of [
      { title: "AI Sales Representative", rawDescription: "Sales targets for AI products." },
      { title: "AI Customer Service Representative", rawDescription: "Regular customer service call center." },
      { title: "Machine Learning Engineer", rawDescription: "Mandatory security clearance required." },
      { title: "AI Research Student", rawDescription: "IDF experience required and military experience mandatory." }
    ]) {
      expect(validateJob(input).validationStatus).toBe("FORBIDDEN");
    }
  });
});

describe("Gmail lead import helpers", () => {
  it("builds a normal Job create shape from a safe lead", () => {
    const prepared = prepareJobCreateFromLead({
      provider: "LINKEDIN",
      title: "Junior Software Engineer",
      company: "Acme Labs",
      location: "Tel Aviv",
      sourceUrl: "https://example.com/job",
      rawSnippet: "Junior Software Engineer at Acme Labs"
    });

    expect(prepared.ok).toBe(true);
    if (prepared.ok) {
      expect(prepared.data.source).toBe("Gmail job alert: LinkedIn");
      expect(prepared.data.status).toBe("FOUND");
      expect(prepared.data.validationStatus).not.toBe("FORBIDDEN");
      expect(prepared.data.rawDescription).toContain("Imported manually from Gmail job alert: LinkedIn");
    }
  });

  it("blocks normal import for forbidden leads", () => {
    const prepared = prepareJobCreateFromLead({
      provider: "INDEED",
      title: "Sales Representative",
      rawSnippet: "Sales representative with targets and commission."
    });

    expect(prepared.ok).toBe(false);
    if (!prepared.ok) expect(prepared.reason).toBe("FORBIDDEN");
  });

  it("detects obvious duplicates by URL or title and company", () => {
    const jobs = [
      { id: "job-1", title: "Junior Software Engineer", company: "Acme Labs", sourceUrl: "https://example.com/job" },
      { id: "job-2", title: "QA Automation Junior", company: "TestWorks", sourceUrl: null }
    ];

    expect(findDuplicateJobForLead({ title: "Other", sourceUrl: "https://example.com/job", rawSnippet: "x" }, jobs)?.id).toBe("job-1");
    expect(findDuplicateJobForLead({ title: "QA Automation Junior", company: "TestWorks", rawSnippet: "x" }, jobs)?.id).toBe("job-2");
    expect(findDuplicateJobForLead({ title: "Data Analyst Junior", company: "DataCo", rawSnippet: "x" }, jobs)).toBeNull();
  });
});

describe("Gmail alert dashboard counts", () => {
  it("counts only unimported and unskipped leads awaiting review", () => {
    expect(countGmailAlertLeadsAwaitingReview([
      { status: "NEW" },
      { status: "REVIEW" },
      { status: "IMPORTED", importedJobId: "job-1" },
      { status: "SKIPPED" },
      { status: "DUPLICATE" },
      { status: "NEW", importedJobId: "job-2" }
    ])).toBe(2);
  });
});
