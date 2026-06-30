import { describe, expect, it } from "vitest";
import { detectGreenhouseBoardToken, detectGreenhouseJobId, filterGreenhouseBoardJobs, mapGreenhouseJobToLead } from "../lib/discovery/companyCareerDiscovery";
import { isSkippableNonImportedDiscoveryLead } from "../lib/discovery/discoveryRunSafety";
import { getDiscoveryProviderStatus } from "../lib/discovery/discoveryProviders";
import { buildCompanyCareerQueries, buildPlatformDiscoveryQueries } from "../lib/discovery/discoveryQueries";
import { countDiscoveryLeads } from "../lib/discovery/jobDiscoveryCounts";
import { prepareDiscoveryLeadForCreate } from "../lib/discovery/jobDiscoveryEngine";
import { prepareJobCreateFromDiscoveryLead } from "../lib/discovery/jobDiscoveryImport";
import { discoveryPostingActionState, isLegacyOrNoisyDiscoveryLead, isReadyToImportDiscoveryLead, isVerifiedImportableDiscoveryLead, shouldHideOldNonImportableLead } from "../lib/discovery/discoveryLeadViews";
import { scoreDiscoveryLead } from "../lib/discovery/jobDiscoveryScoring";
import { isSafePublicHttpUrl } from "../lib/discovery/jobPageFetcher";
import { extractJobDescriptionFromHtml, extractJsonLdJobPosting } from "../lib/discovery/jobDescriptionExtractor";
import { classifyDiscoverySource, SOURCE_CLASSIFICATIONS } from "../lib/discovery/pageClassifier";
import { dedupeProviderMessages, formatProviderDiagnosticError, providerStatusLabel } from "../lib/discovery/providerDiagnostics";
import { extractCareerJobLinks, isReadableLinkTitle } from "../lib/discovery/careerLinkExtractor";
import { dedupePreparedSourceCandidates, enumerateCandidateFromHtml } from "../lib/discovery/sourceCandidateEnumeration";
import { isWorkdayExactJobUrl, isWorkdaySearchUrl, prepareWorkdayLeadFromHtml } from "../lib/discovery/workdayDiscovery";
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

  it("maps SerpApi 401 to a clear diagnostic without exposing keys", () => {
    const message = formatProviderDiagnosticError("SERPAPI_GOOGLE_JOBS", new Error("SerpApi Google Jobs failed: 401"));
    expect(message).toBe("SerpApi authorization failed: check SERPAPI_API_KEY/account.");
    expect(message).not.toContain("secret-key");
  });

  it("dedupes repeated SerpApi 401 messages and separates key present from verified", () => {
    const authMessage = "SerpApi authorization failed: check SERPAPI_API_KEY/account.";
    expect(dedupeProviderMessages([authMessage, authMessage])).toEqual([authMessage]);
    expect(providerStatusLabel("SERPAPI_GOOGLE_JOBS", true)).toBe("SerpApi key present");
    expect(providerStatusLabel("SERPAPI_GOOGLE_JOBS", true, { ok: false, message: authMessage })).toBe("SerpApi auth failed");
    expect(providerStatusLabel("TAVILY", true, { ok: true })).toBe("Tavily verified");
  });
});

describe("discovery lead view semantics 6.1E", () => {
  const verifiedPosting = {
    sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
    confidence: "HIGH",
    extractedDescription: "Backend Developer role using Python, APIs, databases, testing, and distributed systems in Israel.",
    status: "NEW",
    validationStatus: "ALLOWED"
  };

  it("keeps low-confidence actual job postings in verified review instead of legacy/noisy", () => {
    const lowConfidence = {
      ...verifiedPosting,
      sourceClassification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "LOW"
    };
    expect(isVerifiedImportableDiscoveryLead(lowConfidence)).toBe(true);
    expect(isReadyToImportDiscoveryLead(lowConfidence)).toBe(false);
    expect(isLegacyOrNoisyDiscoveryLead(lowConfidence)).toBe(false);
    expect(discoveryPostingActionState(lowConfidence)).toMatchObject({
      label: "Needs review — not ready",
      reason: "Low confidence."
    });
  });

  it("keeps duplicate and imported verified postings in verified review states", () => {
    const duplicate = { ...verifiedPosting, status: "DUPLICATE" };
    const imported = { ...verifiedPosting, status: "IMPORTED", importedJobId: "job-1" };

    expect(isVerifiedImportableDiscoveryLead(duplicate)).toBe(true);
    expect(isLegacyOrNoisyDiscoveryLead(duplicate)).toBe(false);
    expect(discoveryPostingActionState(duplicate)).toMatchObject({ label: "Duplicate" });
    expect(isVerifiedImportableDiscoveryLead(imported)).toBe(true);
    expect(isLegacyOrNoisyDiscoveryLead(imported)).toBe(false);
    expect(discoveryPostingActionState(imported)).toMatchObject({
      label: "Imported",
      reason: "Already imported into Job Inbox."
    });
  });

  it("keeps old noisy cleanup away from imported and verified posting records", () => {
    expect(shouldHideOldNonImportableLead({ ...verifiedPosting, confidence: "LOW" })).toBe(false);
    expect(shouldHideOldNonImportableLead({
      sourceClassification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
      confidence: "LOW",
      status: "IMPORTED",
      importedJobId: "job-1"
    })).toBe(false);
    expect(shouldHideOldNonImportableLead({
      sourceClassification: SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE,
      confidence: "LOW",
      status: "NEW"
    })).toBe(true);
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

  it("detects exact Greenhouse job ids", () => {
    expect(detectGreenhouseJobId("https://boards.greenhouse.io/acme/jobs/1234567")).toBe("1234567");
    expect(detectGreenhouseJobId("https://boards.greenhouse.io/acme")).toBeNull();
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

  it("maps exact Greenhouse job URLs to one job only", () => {
    const leads = filterGreenhouseBoardJobs("acme", [
      {
        id: 111,
        title: "Customer Success Manager",
        absolute_url: "https://boards.greenhouse.io/acme/jobs/111",
        content: "<p>Sales and customer success role.</p>",
        location: { name: "New York" }
      },
      {
        id: 222,
        title: "Backend Developer",
        absolute_url: "https://boards.greenhouse.io/acme/jobs/222",
        content: "<p>Python backend developer role in Israel.</p>",
        location: { name: "Tel Aviv" }
      }
    ], { exactJobId: "222" });
    expect(leads).toHaveLength(1);
    expect(leads[0]?.title).toBe("Backend Developer");
  });

  it("filters Greenhouse boards for matching target jobs instead of taking the first listing", () => {
    const leads = filterGreenhouseBoardJobs("acme", [
      {
        id: 111,
        title: "Customer Service Representative",
        absolute_url: "https://boards.greenhouse.io/acme/jobs/111",
        content: "<p>Call center and regular customer service.</p>",
        location: { name: "New York" }
      },
      {
        id: 222,
        title: "QA Automation Junior",
        absolute_url: "https://boards.greenhouse.io/acme/jobs/222",
        content: "<p>QA automation junior role for Python tests in Israel.</p>",
        location: { name: "Israel" }
      }
    ]);
    expect(leads).toHaveLength(1);
    expect(leads[0]?.title).toBe("QA Automation Junior");
  });
});

describe("source candidate classification and safety", () => {
  it("keeps broad search and generic company titles non-importable", () => {
    for (const title of ["Search Jobs", "Search for Jobs", "Open Positions", "Jobs & Careers", "Careers at Acme", "this page", "Glassdoor"]) {
      const result = classifyDiscoverySource({ title, snippet: "Browse many open roles." });
      expect(result.importable).toBe(false);
      expect(result.classification).not.toBe(SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING);
    }

    const company = classifyDiscoverySource({ title: "Applied Materials", url: "https://www.appliedmaterials.com" });
    expect(company.classification).toBe(SOURCE_CLASSIFICATIONS.GENERIC_COMPANY_PAGE);
    expect(company.importable).toBe(false);
  });

  it("classifies JSON-LD job postings as importable actual jobs", () => {
    const result = classifyDiscoverySource({
      title: "Backend Developer",
      hasJsonLdJobPosting: true,
      rawText: "JobPosting JSON-LD includes a backend software role."
    });
    expect(result).toMatchObject({
      classification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "HIGH",
      importable: true
    });
  });

  it("classifies Workday search pages as ATS boards and non-importable", () => {
    const result = classifyDiscoverySource({
      title: "Search Jobs",
      url: "https://acme.wd5.myworkdayjobs.com/acme_external/search",
      snippet: "Search all open roles."
    });
    expect(isWorkdaySearchUrl("https://acme.wd5.myworkdayjobs.com/acme_external/search")).toBe(true);
    expect(result).toMatchObject({
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
      importable: false
    });
  });

  it("keeps listing-page customer service text as a source candidate, not a forbidden lead", () => {
    const result = classifyDiscoverySource({
      title: "Open Positions",
      url: "https://example.com/careers",
      rawText: "Customer service representative, sales associate, and call center jobs."
    });
    expect(result.importable).toBe(false);
    expect(result.classification).toBe(SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE);
  });

  it("keeps Glassdoor listings unsupported and non-importable", () => {
    const result = enumerateCandidateFromHtml({
      url: "https://www.glassdoor.com/Jobs/Mobileye-Jobs.htm",
      title: "Mobileye Jobs & Careers - Glassdoor",
      snippet: "Browse open jobs."
    }, "<html><title>Mobileye Jobs & Careers - Glassdoor</title><a href='/job/backend'>Backend Engineer</a></html>");
    expect(result.leads).toHaveLength(0);
    expect(result.candidateUpdate.classification).not.toBe(SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING);
  });

  it("rejects unsafe or unsupported URLs before fetching", () => {
    for (const url of [
      "file:///C:/secret.html",
      "data:text/html,hello",
      "ftp://example.com/job",
      "http://localhost:3000/job",
      "http://127.0.0.1/job",
      "http://10.0.0.5/job",
      "http://192.168.1.5/job",
      "http://172.16.0.2/job",
      "http://169.254.1.1/job",
      "javascript:alert(1)"
    ]) {
      expect(isSafePublicHttpUrl(url)).toBe(false);
    }
    expect(isSafePublicHttpUrl("https://boards.greenhouse.io/acme/jobs/123")).toBe(true);
  });
});

describe("career listing and Workday enumeration", () => {
  it("extracts generic career job-like links as source candidates", () => {
    const links = extractCareerJobLinks(`
      <a href="/careers/backend-engineer-israel">Backend Engineer - Israel</a>
      <a href="/careers/sales-manager">Sales Manager</a>
      <a href="/careers/qa-automation-remote">QA Automation Junior Remote</a>
    `, "https://example.com/jobs");
    expect(links.map((link) => link.title)).toEqual(["Backend Engineer - Israel", "QA Automation Junior Remote"]);

    const result = enumerateCandidateFromHtml({
      url: "https://example.com/careers",
      title: "Open Positions",
      provider: "TAVILY",
      source: "WEB_SEARCH"
    }, `
      <a href="/careers/backend-engineer-israel">Backend Engineer - Israel</a>
      <a href="/careers/qa-automation-remote">QA Automation Junior Remote</a>
    `);
    expect(result.leads).toHaveLength(0);
    expect(result.newCandidates).toHaveLength(2);
    expect(result.candidateUpdate.classification).toBe(SOURCE_CLASSIFICATIONS.CAREERS_LISTING);
  });

  it("extracts Markdown job links and dedupes the same URL", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/Software-Engineer_JR123";
    const links = extractCareerJobLinks(`
      [Software Engineer - Israel](${url})
      [Software Engineer - Israel duplicate](${url})
    `, "https://nvidia.com/careers");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      title: "Software Engineer - Israel",
      url
    });
  });

  it("uses surrounding text instead of raw Workday ids for plain URL titles", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/8f7a6e5d4c3b2a10";
    const links = extractCareerJobLinks(`Software Engineer Intern Israel ${url}`, "https://nvidia.com/careers");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      title: "Software Engineer Intern Israel",
      url
    });
    expect(isReadableLinkTitle("8f7a6e5d4c3b2a10")).toBe(false);
  });

  it("uses a readable Workday fallback title when no better title exists", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/8f7a6e5d4c3b2a10";
    const links = extractCareerJobLinks(url, "https://nvidia.com/careers");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      title: "Untitled job link from Workday",
      url
    });
  });

  it("extracts plain Workday job URLs", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/Senior-Backend-Engineer_JR999";
    const links = extractCareerJobLinks(`See ${url} for details`, "https://nvidia.com/careers");
    expect(links).toHaveLength(1);
    expect(links[0]?.url).toBe(url);
  });

  it("turns NVIDIA Workday Markdown text into source candidates", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/Deep-Learning-Software-Engineer_JR456";
    const result = enumerateCandidateFromHtml({
      url: "https://nvidia.com/en-us/about-nvidia/careers/",
      title: "Careers at NVIDIA",
      rawText: `[Deep Learning Software Engineer - Israel](${url})`,
      provider: "TAVILY",
      source: "WEB_SEARCH"
    }, "<main>NVIDIA careers</main>");
    expect(result.leads).toHaveLength(0);
    expect(result.newCandidates).toHaveLength(1);
    expect(result.newCandidates[0]).toMatchObject({
      title: "Deep Learning Software Engineer - Israel",
      url,
      classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING
    });
  });

  it("keeps Workday search URLs as ATS board source candidates from extracted links", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/search";
    const result = enumerateCandidateFromHtml({
      url: "https://nvidia.com/en-us/about-nvidia/careers/",
      title: "Careers at NVIDIA",
      rawText: `Software Engineer roles ${url}`,
      provider: "TAVILY",
      source: "WEB_SEARCH"
    }, "<main>NVIDIA careers</main>");
    expect(result.leads).toHaveLength(0);
    expect(result.newCandidates).toHaveLength(1);
    expect(result.newCandidates[0]).toMatchObject({
      title: "Software Engineer roles",
      url,
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD
    });
  });

  it("preserves readable titles for source candidates created from extracted links", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/Computer-Vision-Engineer_JR789";
    const result = enumerateCandidateFromHtml({
      url: "https://nvidia.com/careers",
      title: "NVIDIA Careers",
      rawText: `Open role: Computer Vision Engineer Israel ${url}`,
      provider: "TAVILY",
      source: "WEB_SEARCH"
    }, "<main>Careers listing</main>");
    expect(result.newCandidates).toHaveLength(1);
    expect(result.newCandidates[0]).toMatchObject({
      title: "Computer Vision Engineer Israel",
      url,
      source: "CAREER_LINK_EXTRACTION"
    });
  });

  it("dedupes prepared source candidates against existing URLs", () => {
    const candidate = {
      provider: "TAVILY",
      source: "CAREER_LINK_EXTRACTION",
      query: "nvidia",
      url: "https://example.com/job/software-engineer",
      title: "Software Engineer",
      snippet: "Software Engineer",
      rawText: "Software Engineer",
      classification: SOURCE_CLASSIFICATIONS.UNKNOWN,
      confidence: "MEDIUM",
      reason: "Specific link.",
      extractedJobCount: 0,
      status: "REVIEW",
      createdLeadCount: 0,
      leads: []
    };
    expect(dedupePreparedSourceCandidates([candidate, candidate], [candidate.url])).toHaveLength(0);
    expect(dedupePreparedSourceCandidates([candidate, candidate], [])).toHaveLength(1);
  });

  it("turns exact public Workday job-like pages into ATS job posting leads", () => {
    const url = "https://acme.wd5.myworkdayjobs.com/acme_external/job/Tel-Aviv/Backend-Developer_JR123";
    const html = "<title>Backend Developer</title><main><h1>Backend Developer</h1><p>Job description: Backend Developer role using Python, APIs, databases, and distributed systems for a product engineering team in Israel.</p><p>Requirements: Python, SQL, APIs, teamwork.</p></main>";
    expect(isWorkdayExactJobUrl(url)).toBe(true);
    expect(prepareWorkdayLeadFromHtml({ url, html })?.title).toContain("Backend Developer");

    const result = enumerateCandidateFromHtml({ url, title: "Backend Developer", createdLeadCount: 2 }, html);
    expect(result.leads).toHaveLength(1);
    expect(result.candidateUpdate.classification).toBe(SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING);
    expect(result.candidateUpdate.createdLeadCount).toBe(3);
  });

  it("keeps Workday JS-only pages as candidates with an error and no lead", () => {
    const result = enumerateCandidateFromHtml({
      url: "https://acme.wd5.myworkdayjobs.com/acme_external/search",
      title: "Search Jobs"
    }, "<html><head><script src='/wday/app.js'></script></head><body><div id='root'></div></body></html>");
    expect(result.leads).toHaveLength(0);
    expect(result.newCandidates).toHaveLength(0);
    expect(result.candidateUpdate.status).toBe("UNSUPPORTED");
    expect(result.candidateUpdate.error).toContain("JS-only");
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
      extractedDescription: "Backend Developer role using Python, APIs, and databases for production software systems in Israel.",
      discoveryProvider: "GREENHOUSE",
      discoverySource: "COMPANY_CAREERS",
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH"
    });
    expect(prepared.ok).toBe(true);
    if (prepared.ok) {
      expect(prepared.data.source).toBe("Company careers: Acme");
      expect(prepared.data.rawDescription).toContain("Backend Developer role using Python");
      expect(prepared.data.rawDescription).not.toContain("Click here and unsubscribe footer");
    }
  });

  it("refuses low-confidence or non-actual discovery sources during import", () => {
    const low = prepareJobCreateFromDiscoveryLead({
      title: "Backend Developer",
      company: "Acme",
      rawSnippet: "Backend role",
      extractedDescription: "Backend Developer role using Python, APIs, and databases for production software systems in Israel.",
      sourceClassification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "LOW"
    });
    expect(low).toMatchObject({ ok: false, reason: "NOT_IMPORTABLE" });

    const listing = prepareJobCreateFromDiscoveryLead({
      title: "Open Positions",
      company: "Acme",
      rawSnippet: "Browse jobs",
      extractedDescription: "Backend Developer role using Python, APIs, and databases for production software systems in Israel.",
      sourceClassification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
      confidence: "HIGH"
    });
    expect(listing).toMatchObject({ ok: false, reason: "NOT_IMPORTABLE" });
  });

  it("still blocks verified technical postings with hard forbidden requirements", () => {
    const prepared = prepareJobCreateFromDiscoveryLead({
      title: "Backend Developer",
      company: "Defense Acme",
      location: "Israel",
      sourceUrl: "https://example.com/backend",
      rawSnippet: "Backend developer",
      extractedDescription: "Backend Developer role using Python, APIs, and distributed systems. Mandatory security clearance is required before starting this role.",
      sourceClassification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "HIGH"
    });
    expect(prepared).toMatchObject({ ok: false, reason: "FORBIDDEN" });
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

describe("discovery run bulk safety", () => {
  it("skips only non-imported leads from a run", () => {
    expect(isSkippableNonImportedDiscoveryLead({ status: "NEW", importedJobId: null })).toBe(true);
    expect(isSkippableNonImportedDiscoveryLead({ status: "SKIPPED", importedJobId: null })).toBe(true);
    expect(isSkippableNonImportedDiscoveryLead({ status: "IMPORTED", importedJobId: "job-1" })).toBe(false);
    expect(isSkippableNonImportedDiscoveryLead({ status: "NEW", importedJobId: "job-1" })).toBe(false);
  });

  it("separates verified job leads from legacy/noisy leads and hides only non-imported old leads", () => {
    const verified = {
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH",
      extractedDescription: "Backend Developer role using Python, APIs, databases, testing, and distributed systems in Israel.",
      status: "NEW"
    };
    const noisy = {
      sourceClassification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
      confidence: "LOW",
      rawText: "Open jobs",
      status: "NEW"
    };
    const importedNoisy = {
      ...noisy,
      status: "IMPORTED",
      importedJobId: "job-1"
    };

    expect(isVerifiedImportableDiscoveryLead(verified)).toBe(true);
    expect(isLegacyOrNoisyDiscoveryLead(noisy)).toBe(true);
    expect(shouldHideOldNonImportableLead(noisy)).toBe(true);
    expect(shouldHideOldNonImportableLead(importedNoisy)).toBe(false);
  });

  it("keeps verified posting action labels explicit for blocked, duplicate, review, and ready states", () => {
    const baseLead = {
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH",
      extractedDescription: "Backend Developer role using Python, APIs, databases, testing, and distributed systems in Israel.",
      status: "NEW"
    };

    expect(discoveryPostingActionState({ ...baseLead, validationStatus: "FORBIDDEN" })).toMatchObject({
      label: "Blocked — cannot import",
      reason: "Blocked by deterministic role rules."
    });
    expect(discoveryPostingActionState({ ...baseLead, validationStatus: "ALLOWED" }, { duplicate: true })).toMatchObject({
      label: "Duplicate",
      reason: "Looks like an existing local job."
    });
    expect(discoveryPostingActionState({ ...baseLead, validationStatus: "ALLOWED" })).toMatchObject({
      label: "Ready to import",
      reason: null
    });
    expect(discoveryPostingActionState({ ...baseLead, confidence: "LOW", validationStatus: "ALLOWED" })).toMatchObject({
      label: "Needs review — not ready",
      reason: "Low confidence."
    });
  });
});
