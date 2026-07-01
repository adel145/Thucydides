import { describe, expect, it } from "vitest";
import { detectGreenhouseBoardToken, detectGreenhouseJobId, filterGreenhouseBoardJobs, mapGreenhouseJobToLead } from "../lib/discovery/companyCareerDiscovery";
import { isSkippableNonImportedDiscoveryLead } from "../lib/discovery/discoveryRunSafety";
import { getDiscoveryProviderStatus } from "../lib/discovery/discoveryProviders";
import { buildCompanyCareerQueries, buildPlatformDiscoveryQueries } from "../lib/discovery/discoveryQueries";
import { countDiscoveryLeads } from "../lib/discovery/jobDiscoveryCounts";
import { prepareDiscoveryLeadForCreate } from "../lib/discovery/jobDiscoveryEngine";
import { prepareJobCreateFromDiscoveryLead } from "../lib/discovery/jobDiscoveryImport";
import { discoveryPostingActionState, groupDiscoveryPostingLeadsForDisplay, isLegacyOrNoisyDiscoveryLead, isReadyToImportDiscoveryLead, isVerifiedImportableDiscoveryLead, rankDiscoveryPostingLeads, shouldHideOldNonImportableLead } from "../lib/discovery/discoveryLeadViews";
import { scoreDiscoveryLead } from "../lib/discovery/jobDiscoveryScoring";
import { isSafePublicHttpUrl } from "../lib/discovery/jobPageFetcher";
import { cleanJobDescriptionText, extractJobDescriptionFromHtml, extractJsonLdJobPosting, extractRequirementsSection, hasExcessivePageChrome, isImportQualityJobDescription, isMeaningfulJobDescription } from "../lib/discovery/jobDescriptionExtractor";
import { classifyDiscoverySource, SOURCE_CLASSIFICATIONS } from "../lib/discovery/pageClassifier";
import { dedupeProviderMessages, formatProviderDiagnosticError, providerStatusLabel } from "../lib/discovery/providerDiagnostics";
import { providerStatusKind, shouldDisableProviderForRunAfterError } from "../lib/discovery/providerDiagnostics";
import { discoveryUsefulWorkCounts, groupDiscoveryProviderIssues, isLowPriorityStaleSourceCandidate } from "../lib/discovery/discoveryReviewHygiene";
import { getEffectiveProviderTestState, parseProviderTestStatusCookie, providerStatusFromDiagnostic, serializeProviderTestStatusCookie, updateProviderTestStatuses } from "../lib/discovery/providerTestStatusCookie";
import { extractCareerJobLinks, isReadableLinkTitle } from "../lib/discovery/careerLinkExtractor";
import { dedupePreparedSourceCandidates, enumerateCandidateFromHtml } from "../lib/discovery/sourceCandidateEnumeration";
import { collapseSourceCandidateGroups, groupSourceCandidatesForDiscoveryReview, hasClearNonTargetLocationSignal, scoreSourceCandidateQuality } from "../lib/discovery/sourceCandidateQuality";
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
    expect(providerStatusKind("SERPAPI_GOOGLE_JOBS", true, { ok: false, message: authMessage })).toBe("AUTH_FAILED");
    expect(providerStatusKind("SERPAPI_GOOGLE_JOBS", true, undefined, { disabledForRun: true })).toBe("DISABLED_FOR_RUN");
    expect(shouldDisableProviderForRunAfterError("SERPAPI_GOOGLE_JOBS", authMessage)).toBe(true);
    expect(shouldDisableProviderForRunAfterError("TAVILY", "Tavily authorization failed: check TAVILY_API_KEY/account.")).toBe(false);
  });

  it("persists provider test status per provider without Tavily erasing SerpApi", () => {
    const serpVerified = updateProviderTestStatuses({}, {
      ok: true,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi test succeeded."
    }, "2026-07-01T10:00:00.000Z");
    const withTavily = updateProviderTestStatuses(serpVerified, {
      ok: true,
      provider: "TAVILY",
      message: "Tavily test succeeded."
    }, "2026-07-01T10:05:00.000Z");
    const parsed = parseProviderTestStatusCookie(serializeProviderTestStatusCookie(withTavily));

    expect(parsed.SERPAPI_GOOGLE_JOBS?.status).toBe("verified");
    expect(parsed.TAVILY?.status).toBe("verified");
    expect(getEffectiveProviderTestState("SERPAPI_GOOGLE_JOBS", {
      queryProvider: "TAVILY",
      queryState: { ok: true, message: "Tavily test succeeded." },
      persistedStatuses: parsed
    })).toMatchObject({ ok: true, message: "SerpApi test succeeded." });
  });

  it("lets newer SerpApi auth failure override persisted verified status", () => {
    const verified = updateProviderTestStatuses({}, {
      ok: true,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi test succeeded."
    }, "2026-07-01T10:00:00.000Z");
    const failed = updateProviderTestStatuses(verified, {
      ok: false,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi authorization failed: check SERPAPI_API_KEY/account."
    }, "2026-07-01T10:10:00.000Z");

    expect(providerStatusFromDiagnostic({
      ok: false,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi authorization failed: check SERPAPI_API_KEY/account."
    })).toBe("auth_failed");
    expect(getEffectiveProviderTestState("SERPAPI_GOOGLE_JOBS", {
      persistedStatuses: failed
    })).toMatchObject({ ok: false, message: "SerpApi authorization failed: check SERPAPI_API_KEY/account." });
  });
});

describe("discovery lead view semantics 6.1E", () => {
  const strongDescription = "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.";
  const verifiedPosting = {
    sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
    confidence: "HIGH",
    extractedDescription: strongDescription,
    status: "NEW",
    validationStatus: "ALLOWED",
    fitScore: 78,
    allowedSignals: ["Junior Developer"]
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

  it("keeps medium-confidence risky low-score leads out of ready-to-import", () => {
    const risky = {
      ...verifiedPosting,
      confidence: "MEDIUM",
      validationStatus: "RISKY",
      fitScore: 33,
      allowedSignals: [],
      riskNotes: "No explicit allowed technical role signal was detected."
    };

    expect(isReadyToImportDiscoveryLead(risky)).toBe(false);
    expect(discoveryPostingActionState(risky)).toMatchObject({
      label: "Needs review — not ready",
      reason: "Risky validation."
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

  it("does not keep clear non-target Workday links as extracted candidates", () => {
    const url = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Senior-Software-Engineer_JR111";
    const links = extractCareerJobLinks(`Senior Software Engineer Santa Clara ${url}`, "https://nvidia.com/careers");
    expect(links).toHaveLength(0);
    expect(hasClearNonTargetLocationSignal(`Senior Software Engineer Santa Clara ${url}`)).toBe(true);
  });

  it("keeps Israel and remote Workday links while preserving unknown-location technical links at lower priority", () => {
    const israelUrl = "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/Israel/Python-Developer_JR222";
    const unknownUrl = "https://acme.wd5.myworkdayjobs.com/acme_external/job/RD/Backend-Developer_JR333";
    const links = extractCareerJobLinks(`
      [Python Developer - Israel](${israelUrl})
      [Backend Developer](${unknownUrl})
    `, "https://nvidia.com/careers");
    expect(links.map((link) => link.url)).toEqual([israelUrl, unknownUrl]);
    expect(links[0].preferredLocationSignal).toBe(true);
    expect(links[1].preferredLocationSignal).toBe(false);
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
    const html = "<title>Backend Developer</title><main><h1>Backend Developer</h1><p>Job description: Backend Developer role using Python, APIs, databases, and distributed systems for a product engineering team in Israel.</p><h2>Requirements</h2><p>Python, SQL, APIs, teamwork, ownership, and production backend engineering experience.</p></main>";
    expect(isWorkdayExactJobUrl(url)).toBe(true);
    expect(prepareWorkdayLeadFromHtml({ url, html })?.title).toContain("Backend Developer");

    const result = enumerateCandidateFromHtml({ url, title: "Backend Developer", createdLeadCount: 2 }, html);
    expect(result.leads).toHaveLength(1);
    expect(result.candidateUpdate.classification).toBe(SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING);
    expect(result.candidateUpdate.createdLeadCount).toBe(3);
    expect(result.leads[0]?.extractedDescription).toContain("distributed systems");
    expect(result.leads[0]?.extractedRequirements).toContain("Python");
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
    expect(prepareWorkdayLeadFromHtml({
      url: "https://acme.wd5.myworkdayjobs.com/acme_external/job/Tel-Aviv/Backend-Developer_JR123",
      html: "<html><head><script src='/wday/app.js'></script></head><body><div id='root'></div></body></html>"
    })).toBeNull();
  });
});

describe("source candidate quality ranking", () => {
  it("does not score generic Workday search boards as HIGH 100 without Israel or remote evidence", () => {
    const quality = scoreSourceCandidateQuality({
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
      provider: "COMPANY_CAREERS",
      source: "WEB_SEARCH",
      title: "Search for Jobs - Myworkdayjobs.com Software Engineer",
      url: "https://amat.wd1.myworkdayjobs.com/External/search",
      confidence: "HIGH",
      status: "REVIEW",
      createdLeadCount: 0,
      extractedJobCount: 0
    });

    expect(quality.score).toBeLessThan(72);
    expect(quality.tier).not.toBe("HIGH");
    expect(quality.reasons).toContain("generic Workday board");
  });

  it("still lets exact Workday Israel job URLs score high", () => {
    const quality = scoreSourceCandidateQuality({
      classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      provider: "COMPANY_CAREERS",
      source: "CAREER_LINK_EXTRACTION",
      title: "Python Developer - Israel",
      url: "https://amat.wd1.myworkdayjobs.com/External/job/Israel/Python-Developer_JR222",
      confidence: "MEDIUM",
      status: "REVIEW",
      createdLeadCount: 0
    });

    expect(quality.tier).toBe("HIGH");
    expect(quality.score).toBeGreaterThanOrEqual(72);
  });

  it("prioritizes real Israel/remote technical sources over noisy or non-target sources", () => {
    const high = scoreSourceCandidateQuality({
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
      provider: "COMPANY_CAREERS",
      source: "CAREER_LINK_EXTRACTION",
      title: "Backend Developer Israel",
      url: "https://example.com/jobs/backend-developer-israel",
      confidence: "MEDIUM",
      status: "REVIEW"
    });
    const nonTarget = scoreSourceCandidateQuality({
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
      title: "Software Engineer Santa Clara",
      url: "https://example.com/jobs/software-engineer-santa-clara",
      confidence: "HIGH",
      status: "REVIEW"
    });
    const noisy = scoreSourceCandidateQuality({
      classification: SOURCE_CLASSIFICATIONS.THIRD_PARTY_AGGREGATOR_LIST,
      title: "Glassdoor software jobs",
      url: "https://glassdoor.com/jobs/software-engineer",
      status: "UNSUPPORTED",
      error: "Unsupported aggregator/listing page."
    });

    expect(high.tier).toBe("HIGH");
    expect(nonTarget.tier).toBe("VERY_LOW");
    expect(noisy.tier).toBe("VERY_LOW");
    expect(high.score).toBeGreaterThan(nonTarget.score);
  });

  it("groups repeated Workday ATS board candidates into one display group", () => {
    const groups = collapseSourceCandidateGroups([
      {
        id: "workday-1",
        classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
        title: "Search for Jobs - Myworkdayjobs.com",
        url: "https://amat.wd1.myworkdayjobs.com/External/search",
        confidence: "HIGH",
        status: "REVIEW",
        createdLeadCount: 0
      },
      {
        id: "workday-2",
        classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
        title: "Search for Jobs - Myworkdayjobs.com",
        url: "https://amat.wd1.myworkdayjobs.com/External/jobs",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 0
      }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].duplicateCount).toBe(1);
    expect(groups[0].primary.id).toBe("workday-1");
  });

  it("separates source candidates that need action from processed and unsupported sources", () => {
    const groups = groupSourceCandidatesForDiscoveryReview([
      {
        id: "ready-source",
        classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
        title: "QA Automation Junior Israel",
        url: "https://example.com/jobs",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 0
      },
      {
        id: "exact-job-source",
        classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
        title: "Python Developer Israel",
        url: "https://example.com/job/python-developer-israel",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 0
      },
      {
        id: "processed-source",
        classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
        title: "Backend Developer Israel",
        url: "https://example.com/job/backend-developer-israel",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 3
      },
      {
        id: "unsupported-source",
        classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
        title: "Blocked Workday",
        url: "https://example.com/search",
        status: "UNSUPPORTED",
        error: "No public links."
      }
    ]);

    expect(groups.primary.map((candidate) => candidate.id)).toEqual(["exact-job-source", "ready-source"]);
    expect(groups.processed.map((candidate) => candidate.id)).toEqual(["processed-source"]);
    expect(groups.skippedOrUnsupported.map((candidate) => candidate.id)).toEqual(["unsupported-source"]);
  });

  it("collapses repeated primary and processed source groups", () => {
    const groups = groupSourceCandidatesForDiscoveryReview([
      {
        id: "workday-board-1",
        classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
        title: "Search for Jobs - Myworkdayjobs.com",
        url: "https://amat.wd1.myworkdayjobs.com/External/search",
        confidence: "HIGH",
        status: "REVIEW",
        createdLeadCount: 0
      },
      {
        id: "workday-board-2",
        classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
        title: "Search for Jobs - Myworkdayjobs.com",
        url: "https://amat.wd1.myworkdayjobs.com/External/jobs",
        confidence: "HIGH",
        status: "REVIEW",
        createdLeadCount: 0
      },
      {
        id: "processed-1",
        classification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
        title: "Applied Materials Careers",
        url: "https://www.appliedmaterials.com/careers",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 2
      },
      {
        id: "processed-2",
        classification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
        title: "Applied Materials Careers",
        url: "https://www.appliedmaterials.com/jobs",
        confidence: "MEDIUM",
        status: "REVIEW",
        createdLeadCount: 1
      }
    ]);

    expect(groups.primaryGroups).toHaveLength(1);
    expect(groups.primaryGroups[0].duplicateCount).toBe(1);
    expect(groups.processedGroups).toHaveLength(1);
    expect(groups.processedGroups[0].duplicateCount).toBe(1);
  });
});

describe("discovery review hygiene 6.4", () => {
  const strongReadyDescription = "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.";

  it("groups repeated SerpApi 401 provider failures into one display issue", () => {
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 },
      { id: "run-2", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 },
      { id: "run-3", provider: "TAVILY_SERPAPI_OPTIONAL", error: null, resultCount: 2 }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "SERPAPI_AUTH_FAILED",
      freshness: "ACTIVE",
      count: 2,
      title: "SerpApi נכשל בגלל הרשאה"
    });
  });

  it("moves old SerpApi 401 failures to stale history after current SerpApi success", () => {
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 },
      { id: "run-2", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 }
    ], { serpApiCurrentlyVerified: true });

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "STALE_SERPAPI_AUTH_FAILED",
      freshness: "STALE",
      count: 2
    });
    expect(groups[0].message).toContain("SerpApi אומת");
  });

  it("uses persisted SerpApi success to stale old 401 failures after refresh without query params", () => {
    const persisted = updateProviderTestStatuses({}, {
      ok: true,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi test succeeded."
    }, "2026-07-01T10:00:00.000Z");
    const serpApiState = getEffectiveProviderTestState("SERPAPI_GOOGLE_JOBS", {
      persistedStatuses: parseProviderTestStatusCookie(serializeProviderTestStatusCookie(persisted))
    });
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 }
    ], { serpApiCurrentlyVerified: serpApiState?.ok === true });

    expect(groups[0]).toMatchObject({
      key: "STALE_SERPAPI_AUTH_FAILED",
      freshness: "STALE"
    });
  });

  it("keeps SerpApi auth runs newer than the persisted success active", () => {
    const groups = groupDiscoveryProviderIssues([
      {
        id: "old-run",
        provider: "TAVILY_SERPAPI_OPTIONAL",
        error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.",
        createdAt: "2026-07-01T09:55:00.000Z",
        resultCount: 0
      },
      {
        id: "new-run",
        provider: "TAVILY_SERPAPI_OPTIONAL",
        error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.",
        createdAt: "2026-07-01T10:20:00.000Z",
        resultCount: 0
      }
    ], {
      serpApiCurrentlyVerified: true,
      serpApiVerifiedAt: "2026-07-01T10:00:00.000Z"
    });

    expect(groups.map((group) => group.key)).toEqual(["SERPAPI_AUTH_FAILED", "STALE_SERPAPI_AUTH_FAILED"]);
    expect(groups[0].runs.map((run) => run.id)).toEqual(["new-run"]);
    expect(groups[1].runs.map((run) => run.id)).toEqual(["old-run"]);
  });

  it("keeps old SerpApi 401 failures active when the persisted latest SerpApi test failed auth", () => {
    const persistedVerified = updateProviderTestStatuses({}, {
      ok: true,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi test succeeded."
    }, "2026-07-01T10:00:00.000Z");
    const persistedAuthFailed = updateProviderTestStatuses(persistedVerified, {
      ok: false,
      provider: "SERPAPI_GOOGLE_JOBS",
      message: "SerpApi authorization failed: check SERPAPI_API_KEY/account."
    }, "2026-07-01T10:15:00.000Z");
    const serpApiState = getEffectiveProviderTestState("SERPAPI_GOOGLE_JOBS", {
      persistedStatuses: persistedAuthFailed
    });
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 }
    ], { serpApiCurrentlyVerified: serpApiState?.ok === true });

    expect(providerStatusKind("SERPAPI_GOOGLE_JOBS", true, serpApiState)).toBe("AUTH_FAILED");
    expect(groups[0]).toMatchObject({
      key: "SERPAPI_AUTH_FAILED",
      freshness: "ACTIVE"
    });
  });

  it("keeps current SerpApi failures active when there is no newer success", () => {
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "SerpApi authorization failed: check SERPAPI_API_KEY/account.", resultCount: 0 }
    ], { serpApiCurrentlyVerified: false });

    expect(groups[0]).toMatchObject({
      key: "SERPAPI_AUTH_FAILED",
      freshness: "ACTIVE"
    });
  });

  it("does not stale non-SerpApi provider issues after SerpApi success", () => {
    const groups = groupDiscoveryProviderIssues([
      { id: "run-1", provider: "TAVILY_SERPAPI_OPTIONAL", error: "Tavily platform search failed.", resultCount: 0 }
    ], { serpApiCurrentlyVerified: true });

    expect(groups[0]).toMatchObject({
      key: "OTHER_PROVIDER_ISSUES",
      freshness: "ACTIVE"
    });
  });

  it("marks only low-priority stale source candidates as cleanup-eligible", () => {
    expect(isLowPriorityStaleSourceCandidate({
      classification: SOURCE_CLASSIFICATIONS.GENERIC_COMPANY_PAGE,
      title: "Acme",
      status: "REVIEW",
      createdLeadCount: 0
    })).toBe(true);

    expect(isLowPriorityStaleSourceCandidate({
      classification: SOURCE_CLASSIFICATIONS.BLOCKED_OR_UNFETCHABLE,
      title: "Blocked Workday",
      status: "REVIEW",
      error: "Fetch failed",
      createdLeadCount: 0
    })).toBe(true);

    expect(isLowPriorityStaleSourceCandidate({
      classification: SOURCE_CLASSIFICATIONS.ATS_BOARD,
      title: "Backend Engineer Israel jobs",
      url: "https://example.com/jobs",
      status: "REVIEW",
      confidence: "HIGH",
      createdLeadCount: 0
    })).toBe(false);

    expect(isLowPriorityStaleSourceCandidate({
      classification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      title: "Backend Engineer Israel",
      status: "REVIEW",
      createdLeadCount: 0
    })).toBe(false);
  });

  it("keeps useful counts focused on actionable work", () => {
    const counts = discoveryUsefulWorkCounts({
      leads: [
        {
          sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
          confidence: "HIGH",
          extractedDescription: strongReadyDescription,
          status: "NEW",
          validationStatus: "ALLOWED",
          fitScore: 78,
          allowedSignals: ["Junior Developer"]
        },
        {
          sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
          confidence: "MEDIUM",
          extractedDescription: strongReadyDescription,
          status: "NEW",
          validationStatus: "RISKY",
          fitScore: 33,
          allowedSignals: []
        },
        {
          sourceClassification: SOURCE_CLASSIFICATIONS.SEARCH_RESULTS_PAGE,
          confidence: "LOW",
          status: "SKIPPED",
          validationStatus: "RISKY"
        }
      ],
      candidates: [
        { classification: SOURCE_CLASSIFICATIONS.ATS_BOARD, title: "QA Automation Israel", status: "REVIEW", confidence: "HIGH" },
        { classification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING, title: "Processed careers", status: "REVIEW", createdLeadCount: 2 },
        { classification: SOURCE_CLASSIFICATIONS.NOISY_PAGE, title: "Noise", status: "SKIPPED" }
      ],
      providerIssueCount: 1
    });

    expect(counts).toMatchObject({
      readyToImport: 1,
      needsReview: 1,
      actionableSources: 1,
      processedSources: 1,
      providerIssues: 1,
      hiddenNoise: 2
    });
  });
});

describe("job description extraction", () => {
  it("extracts JSON-LD JobPosting fields", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting",
      title: "Full Stack Software Engineer",
      hiringOrganization: { name: "Acme" },
      jobLocation: { address: { addressLocality: "Tel Aviv" } },
      description: "Full stack software engineering role. You will build production APIs, React interfaces, backend services, and automated tests for customers in Israel.",
      qualifications: "React, Node.js, API design, SQL, and production software experience."
    })}</script>`;
    const extracted = extractJsonLdJobPosting(html);
    expect(extracted).toMatchObject({
      title: "Full Stack Software Engineer",
      company: "Acme",
      description: "Full stack software engineering role. You will build production APIs, React interfaces, backend services, and automated tests for customers in Israel.",
      requirements: "React, Node.js, API design, SQL, and production software experience.",
      confidence: "HIGH"
    });
  });

  it("falls back to visible HTML text and removes navigation noise", () => {
    const extracted = extractJobDescriptionFromHtml(`
      <title>Python Developer</title>
      <nav>Skip to main content Search jobs Menu Cookie preferences</nav>
      <main>
        <h1>Python Developer</h1>
        <p>Python Developer role building backend APIs, SQL services, automated tests, and production integrations for an Israel hybrid product team.</p>
        <h2>Requirements</h2>
        <ul><li>Python and SQL experience.</li><li>Backend API development.</li><li>Strong communication and ownership.</li></ul>
      </main>
    `);
    expect(extracted.title).toBe("Python Developer");
    expect(extracted.description).toContain("backend APIs");
    expect(extracted.description).not.toContain("Skip to main content");
    expect(extracted.remotePolicy).toContain("Remote");
    expect(extracted.requirements).toContain("Python and SQL");
    expect(isMeaningfulJobDescription(extracted.description)).toBe(true);
  });

  it("extracts requirements sections without duplicating the full description", () => {
    const requirements = extractRequirementsSection(`
      About the role
      Build backend systems for production customers.
      Requirements
      2+ years with Python.
      Experience with SQL and APIs.
      Benefits
      Lunch and learning budget.
    `);
    expect(requirements).toContain("2+ years with Python");
    expect(requirements).not.toContain("Build backend systems");
    expect(requirements).not.toContain("Lunch and learning budget");
  });

  it("does not treat weak page chrome as a meaningful job description", () => {
    const cleaned = cleanJobDescriptionText("Skip to main content\nSearch jobs\nMenu\nCookie settings\nApply now");
    expect(cleaned).not.toContain("Skip to main content");
    const extracted = extractJobDescriptionFromHtml("<title>Search Jobs</title><main>Search jobs Menu Cookie settings Apply now</main>");
    expect(extracted.description).toBeNull();
    expect(extracted.reason).toBe("NO_MEANINGFUL_JOB_DESCRIPTION");
  });

  it("rejects page-chrome-heavy Applied Materials Metaintro text for import quality", () => {
    const noisy = "Application Engineer at Applied Materials Israel | Metaintro Skip to main content metaintro Menu Job Search Search jobs Similar jobs Find jobs similar to Application Engineer Apply on employer site opens in new tab Applied Materials Israel Rehovot";
    const cleaned = cleanJobDescriptionText(noisy);
    expect(cleaned).not.toContain("Skip to main content");
    expect(cleaned).not.toContain("Job Search");
    expect(hasExcessivePageChrome(noisy)).toBe(true);
    expect(isMeaningfulJobDescription(noisy)).toBe(true);
    expect(isImportQualityJobDescription(noisy)).toBe(false);
  });

  it("allows strong JSON-LD-style job bodies through import-quality checks", () => {
    const description = "Full stack software engineering role. Responsibilities include building production APIs, React interfaces, backend services, and automated tests for customers in Israel. Requirements include React, Node.js, API design, SQL, and production software experience.";
    expect(isMeaningfulJobDescription(description)).toBe(true);
    expect(isImportQualityJobDescription(description)).toBe(true);
  });

  it("extracts Greenhouse static public job HTML", () => {
    const extracted = extractJobDescriptionFromHtml(`
      <html><head><title>Backend Engineer</title><meta property="og:site_name" content="Greenhouse Acme"></head>
      <body><div id="content"><h1>Backend Engineer</h1><div class="location">Tel Aviv</div>
      <p>Backend Engineer role building APIs, distributed systems, SQL-backed services, and automated tests for a production engineering team in Israel.</p>
      <h2>Qualifications</h2><p>Python, SQL, cloud systems, and API design experience.</p></div></body></html>
    `);
    expect(extracted.reason).toBe("GREENHOUSE_STATIC_HTML");
    expect(extracted.title).toBe("Backend Engineer");
    expect(extracted.location).toBe("Tel Aviv");
    expect(extracted.description).toContain("distributed systems");
  });

  it("extracts Lever static public job HTML", () => {
    const extracted = extractJobDescriptionFromHtml(`
      <html><head><title>QA Automation Engineer</title><meta property="og:site_name" content="Lever Acme"></head>
      <body><div class="posting-page"><h2 class="posting-headline">QA Automation Engineer</h2><div class="location">Israel Remote</div>
      <div class="section-wrapper"><p>QA Automation Engineer role writing test automation, API checks, CI workflows, and regression coverage for a software product team.</p>
      <h3>What you'll bring</h3><p>Automation experience, JavaScript or Python, API testing, and clear bug reporting.</p></div></div></body></html>
    `);
    expect(extracted.reason).toBe("LEVER_STATIC_HTML");
    expect(extracted.title).toBe("QA Automation Engineer");
    expect(extracted.location).toBe("Israel Remote");
    expect(extracted.requirements).toContain("Automation experience");
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
      extractedDescription: "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.",
      discoveryProvider: "GREENHOUSE",
      discoverySource: "COMPANY_CAREERS",
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH"
    });
    expect(prepared.ok).toBe(true);
    if (prepared.ok) {
      expect(prepared.data.source).toBe("Company careers: Acme");
      expect(prepared.data.rawDescription).toContain("Backend Developer role in Israel");
      expect(prepared.data.rawDescription).not.toContain("Click here and unsubscribe footer");
    }
  });

  it("refuses low-confidence or non-actual discovery sources during import", () => {
    const low = prepareJobCreateFromDiscoveryLead({
      title: "Backend Developer",
      company: "Acme",
      rawSnippet: "Backend role",
      extractedDescription: "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.",
      sourceClassification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "LOW"
    });
    expect(low).toMatchObject({ ok: false, reason: "NOT_IMPORTABLE" });

    const listing = prepareJobCreateFromDiscoveryLead({
      title: "Open Positions",
      company: "Acme",
      rawSnippet: "Browse jobs",
      extractedDescription: "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.",
      sourceClassification: SOURCE_CLASSIFICATIONS.CAREERS_LISTING,
      confidence: "HIGH"
    });
    expect(listing).toMatchObject({ ok: false, reason: "NOT_IMPORTABLE" });
  });

  it("refuses risky low-score discovery leads during import", () => {
    const prepared = prepareJobCreateFromDiscoveryLead({
      title: "Application Engineer",
      company: "Applied Materials",
      location: "Israel",
      rawSnippet: "Application Engineer",
      extractedDescription: "Application Engineer at Applied Materials Israel | Metaintro Skip to main content metaintro Menu Job Search Search jobs Similar jobs Find jobs similar to Application Engineer Apply on employer site opens in new tab Applied Materials Israel Rehovot",
      sourceClassification: SOURCE_CLASSIFICATIONS.ACTUAL_JOB_POSTING,
      confidence: "MEDIUM"
    });
    expect(prepared).toMatchObject({ ok: false, reason: "NOT_IMPORTABLE" });
  });

  it("still blocks verified technical postings with hard forbidden requirements", () => {
    const prepared = prepareJobCreateFromDiscoveryLead({
      title: "Backend Developer",
      company: "Defense Acme",
      location: "Israel",
      sourceUrl: "https://example.com/backend",
      rawSnippet: "Backend developer",
      extractedDescription: "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Mandatory security clearance is required before starting this role.",
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
  const importQualityBackendDescription = "Backend Developer role in Israel. Responsibilities include building Python APIs, SQL-backed services, production integrations, and automated tests for a software product team. Requirements include backend development experience, API design, databases, and ownership.";

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
      extractedDescription: importQualityBackendDescription,
      status: "NEW",
      validationStatus: "ALLOWED",
      fitScore: 78,
      allowedSignals: ["Junior Developer"]
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
      extractedDescription: importQualityBackendDescription,
      status: "NEW",
      fitScore: 78,
      allowedSignals: ["Junior Developer"]
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

  it("orders verified postings by review action state", () => {
    const ready = {
      id: "ready",
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH",
      extractedDescription: importQualityBackendDescription,
      status: "NEW",
      validationStatus: "ALLOWED",
      fitScore: 78,
      allowedSignals: ["Junior Developer"]
    };
    const review = { ...ready, id: "review", confidence: "LOW" };
    const duplicate = { ...ready, id: "duplicate", status: "DUPLICATE" };
    const imported = { ...ready, id: "imported", status: "IMPORTED", importedJobId: "job-1" };
    const blocked = { ...ready, id: "blocked", validationStatus: "FORBIDDEN" };

    expect(rankDiscoveryPostingLeads([blocked, imported, duplicate, review, ready]).map((lead) => lead.id)).toEqual([
      "ready",
      "review",
      "duplicate",
      "imported",
      "blocked"
    ]);
  });

  it("groups repeated blocked verified postings for display without hiding them from review", () => {
    const blockedOne = {
      id: "blocked-1",
      title: "Backend Developer",
      company: "Defense Acme",
      sourceUrl: "https://example.com/backend",
      sourceClassification: SOURCE_CLASSIFICATIONS.ATS_JOB_POSTING,
      confidence: "HIGH",
      extractedDescription: importQualityBackendDescription,
      status: "NEW",
      validationStatus: "FORBIDDEN"
    };
    const blockedTwo = {
      ...blockedOne,
      id: "blocked-2"
    };

    const groups = groupDiscoveryPostingLeadsForDisplay([blockedOne, blockedTwo]);
    expect(groups).toHaveLength(1);
    expect(groups[0].primary.id).toBe("blocked-1");
    expect(groups[0].duplicateCount).toBe(1);
    expect(groups[0].leads).toHaveLength(2);
  });
});
