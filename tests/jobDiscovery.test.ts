import { describe, expect, it } from "vitest";
import { detectGreenhouseBoardToken, mapGreenhouseJobToLead } from "../lib/discovery/companyCareerDiscovery";
import { getDiscoveryProviderStatus } from "../lib/discovery/discoveryProviders";
import { buildCompanyCareerQueries, buildPlatformDiscoveryQueries } from "../lib/discovery/discoveryQueries";
import { countDiscoveryLeads } from "../lib/discovery/jobDiscoveryCounts";
import { prepareDiscoveryLeadForCreate } from "../lib/discovery/jobDiscoveryEngine";
import { prepareJobCreateFromDiscoveryLead } from "../lib/discovery/jobDiscoveryImport";
import { scoreDiscoveryLead } from "../lib/discovery/jobDiscoveryScoring";
import { extractJobDescriptionFromHtml, extractJsonLdJobPosting } from "../lib/discovery/jobDescriptionExtractor";
import { validateJob } from "../lib/rules/validateJob";

describe("discovery provider config", () => {
  it("detects configured and missing provider env without throwing", () => {
    expect(getDiscoveryProviderStatus({}).tavilyConfigured).toBe(false);
    expect(getDiscoveryProviderStatus({}).serpApiConfigured).toBe(false);
    const configured = getDiscoveryProviderStatus({
      TAVILY_API_KEY: "tavily-key",
      SERPAPI_API_KEY: "serp-key",
      JOB_DISCOVERY_MAX_RESULTS: "12",
      JOB_DISCOVERY_COUNTRY: "israel"
    });
    expect(configured.tavilyConfigured).toBe(true);
    expect(configured.serpApiConfigured).toBe(true);
    expect(configured.maxResults).toBe(12);
  });
});

describe("discovery query generation", () => {
  it("generates company-careers-first and platform queries", () => {
    expect(buildCompanyCareerQueries(["Applied Materials"])[0]).toContain("Applied Materials Israel careers jobs");
    const platformQueries = buildPlatformDiscoveryQueries(["AI/ML research student"], "Israel");
    expect(platformQueries[0]).toContain("AI/ML research student Israel");
    expect(platformQueries[1]).toContain("site:linkedin.com/jobs");
  });
});

describe("company career discovery", () => {
  it("detects Greenhouse board tokens from public URLs", () => {
    expect(detectGreenhouseBoardToken("https://boards.greenhouse.io/acme/jobs/123")).toBe("acme");
    expect(detectGreenhouseBoardToken("https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true")).toBe("acme");
    expect(detectGreenhouseBoardToken("https://example.com/careers")).toBeNull();
  });

  it("maps Greenhouse jobs with content into review leads", () => {
    const lead = mapGreenhouseJobToLead("acme", {
      title: "Backend Developer",
      absolute_url: "https://boards.greenhouse.io/acme/jobs/123",
      content: "<p>Python backend developer role in Israel.</p>",
      location: { name: "Israel" }
    });
    expect(lead).toMatchObject({
      title: "Backend Developer",
      company: "acme",
      location: "Israel",
      discoveryProvider: "GREENHOUSE"
    });
    expect(lead?.rawSnippet).toContain("Python backend developer");
  });
});

describe("job description extraction", () => {
  it("extracts JSON-LD JobPosting fields", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting",
      title: "Full Stack Software Engineer",
      hiringOrganization: { name: "Acme" },
      jobLocation: { address: { addressLocality: "Tel Aviv" } },
      description: "Full stack software engineering role.",
      qualifications: "React and Node.js"
    })}</script>`;
    const extracted = extractJsonLdJobPosting(html);
    expect(extracted).toMatchObject({
      title: "Full Stack Software Engineer",
      company: "Acme",
      description: "Full stack software engineering role.",
      requirements: "React and Node.js",
      confidence: "HIGH"
    });
  });

  it("falls back to visible HTML text", () => {
    const extracted = extractJobDescriptionFromHtml("<title>Python Developer</title><main>Requirements: Python, SQL, Israel hybrid role.</main>");
    expect(extracted.title).toBe("Python Developer");
    expect(extracted.description).toContain("Python");
    expect(extracted.remotePolicy).toContain("Remote");
  });
});

describe("discovery role rules and scoring", () => {
  it("allows expanded software role titles", () => {
    for (const title of ["Backend Developer", "Full Stack Software Engineer", "Python Developer", "Software Engineer AI Training"]) {
      const result = validateJob({ title, rawDescription: `${title} role for software engineering in Israel.` });
      expect(result.validationStatus).toBe("ALLOWED");
      expect(result.allowedSignals.length).toBeGreaterThan(0);
    }
  });

  it("keeps expanded titles forbidden with hard blockers", () => {
    for (const rawDescription of ["Sales targets for AI platform.", "Mandatory security clearance required.", "Military experience mandatory."]) {
      expect(validateJob({ title: "Backend Developer", rawDescription }).validationStatus).toBe("FORBIDDEN");
    }
  });

  it("scores AI/ML research student high and forbidden jobs as blocked", () => {
    const high = scoreDiscoveryLead({
      title: "AI/ML Research Student",
      description: "Deep learning computer vision research student role in Israel with Python and machine learning.",
      validationStatus: "ALLOWED",
      allowedSignals: ["AI/ML Research Student"]
    });
    expect(high.score).toBeGreaterThanOrEqual(70);

    const blocked = scoreDiscoveryLead({
      title: "AI Sales",
      description: "Sales role",
      validationStatus: "FORBIDDEN",
      forbiddenFlags: ["Sales role"]
    });
    expect(blocked.score).toBe(0);
  });

  it("lowers confidence when description is missing", () => {
    expect(scoreDiscoveryLead({ title: "Software Engineer", validationStatus: "ALLOWED", allowedSignals: ["Junior Developer"] }).confidence).toBe("LOW");
  });
});

describe("discovery lead preparation and import", () => {
  it("prepares discovery leads with validation and fit score", () => {
    const lead = prepareDiscoveryLeadForCreate({
      title: "Backend Developer",
      company: "Acme",
      location: "Israel",
      sourceUrl: "https://example.com/job",
      rawSnippet: "Backend Developer",
      rawText: "Backend Developer Python role in Israel.",
      discoverySource: "WEB_SEARCH",
      discoveryProvider: "TAVILY",
      discoveryQuery: "backend developer Israel",
      confidence: "MEDIUM"
    });
    expect(lead.validationStatus).toBe("ALLOWED");
    expect(lead.fitScore).toBeGreaterThan(40);
  });

  it("imports using enriched description over noisy snippet", () => {
    const prepared = prepareJobCreateFromDiscoveryLead({
      title: "Backend Developer",
      company: "Acme",
      location: "Israel",
      sourceUrl: "https://example.com/job",
      rawSnippet: "Click here and unsubscribe footer",
      extractedDescription: "Backend Developer role using Python, APIs, and databases.",
      discoveryProvider: "GREENHOUSE",
      discoverySource: "COMPANY_CAREERS"
    });
    expect(prepared.ok).toBe(true);
    if (prepared.ok) {
      expect(prepared.data.source).toBe("Company careers: Acme");
      expect(prepared.data.rawDescription).toContain("Backend Developer role using Python");
      expect(prepared.data.rawDescription).not.toContain("Click here and unsubscribe footer");
    }
  });
});

describe("discovery dashboard counts", () => {
  it("counts review, enriched, blocked, and imported discovery leads", () => {
    expect(countDiscoveryLeads([
      { status: "NEW", validationStatus: "ALLOWED", extractedDescription: "Full description" },
      { status: "REVIEW", validationStatus: "RISKY" },
      { status: "NEW", validationStatus: "FORBIDDEN" },
      { status: "IMPORTED", importedJobId: "job-1", validationStatus: "ALLOWED" },
      { status: "SKIPPED", validationStatus: "ALLOWED" }
    ])).toMatchObject({
      newLeads: 2,
      enrichedLeads: 1,
      needsReview: 3,
      blocked: 1,
      imported: 1
    });
  });
});
