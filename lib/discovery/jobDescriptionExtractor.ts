export type ExtractedJobDescription = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  remotePolicy?: string | null;
  language?: string | null;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reason?: string | null;
};

const noiseLinePatterns = [
  /^skip to main content$/i,
  /^job search$/i,
  /^search jobs?$/i,
  /^find jobs similar to/i,
  /^search$/i,
  /^menu$/i,
  /^navigation$/i,
  /^similar jobs$/i,
  /^cookie/i,
  /^privacy policy$/i,
  /^footer$/i,
  /^terms of use$/i,
  /^sign in$/i,
  /^log in$/i,
  /^share this job$/i,
  /^apply now$/i,
  /^apply on employer site$/i,
  /^opens in new tab$/i,
  /^back to jobs$/i,
  /^see all jobs$/i
];

const pageChromePhrasePatterns = [
  /skip to main content/gi,
  /\bjob search\b/gi,
  /\bsearch jobs?\b/gi,
  /\bfind jobs similar to\b/gi,
  /\bsimilar jobs\b/gi,
  /\bapply on employer site\b/gi,
  /\bopens in new tab\b/gi,
  /\bcookie(?:s| settings| preferences)?\b/gi,
  /\bprivacy(?: policy)?\b/gi,
  /\bfooter\b/gi,
  /\bnavigation\b/gi,
  /\bmenu\b/gi,
  /\bmetaintro\b/gi
];

const requirementHeadingPattern =
  /(requirements|qualifications|minimum qualifications|preferred qualifications|what you(?:'|’)ll bring|skills|\u05d3\u05e8\u05d9\u05e9\u05d5\u05ea|\u05db\u05d9\u05e9\u05d5\u05e8\u05d9\u05dd)/i;

const sectionStopHeadingPattern =
  /(responsibilities|about the role|about you|benefits|what we offer|apply|location|company|equal opportunity|privacy|about us|\u05d0\u05d7\u05e8\u05d9\u05d5\u05ea|\u05d4\u05d8\u05d1\u05d5\u05ea|\u05e2\u05dc \u05d4\u05d7\u05d1\u05e8\u05d4)/i;

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u00a0/g, " ");
}

function stripHtml(value: string) {
  return cleanJobDescriptionText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|ul|ol|section|article|h1|h2|h3|h4|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
}

function textValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return stripHtml(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(" / ") || null;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(record.name) ?? textValue(record.addressLocality) ?? textValue(record.addressRegion);
  }
  return null;
}

function parseJsonLdBlocks(html: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const values: unknown[] = [];
  for (const block of blocks) {
    try {
      values.push(JSON.parse(block[1].trim()) as unknown);
    } catch {
      // Ignore invalid or unrelated JSON-LD.
    }
  }
  return values;
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const graph = Array.isArray(record["@graph"]) ? record["@graph"].flatMap(flattenJsonLd) : [];
  return [record, ...graph];
}

function metaContent(html: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"))?.[1] ?? null;
}

function firstMatchText(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (match) return stripHtml(match);
  }
  return null;
}

function visibleTextFromHtml(html: string) {
  const main =
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html.match(/<div[^>]+(?:id|class)=["'][^"']*(?:job|posting|description|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ??
    html;
  return stripHtml(main);
}

function stripInlinePageChrome(value: string) {
  return pageChromePhrasePatterns.reduce((text, pattern) => text.replace(pattern, " "), value);
}

export function cleanJobDescriptionText(value: string | null | undefined) {
  const decoded = decodeHtml(value ?? "");
  const lines = decoded
    .replace(/\r/g, "\n")
    .split(/\n|(?<=\.)\s{2,}/)
    .map((line) => stripInlinePageChrome(line).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => !noiseLinePatterns.some((pattern) => pattern.test(line)));

  const cleaned: string[] = [];
  for (const line of lines) {
    if (cleaned.at(-1)?.toLocaleLowerCase() === line.toLocaleLowerCase()) continue;
    cleaned.push(line);
  }
  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 8000);
}

export function extractRequirementsSection(text: string | null | undefined) {
  const cleaned = cleanJobDescriptionText(text);
  if (!cleaned) return null;
  const lines = cleaned.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => requirementHeadingPattern.test(line));
  if (start < 0) return null;
  const section: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (section.length > 0 && sectionStopHeadingPattern.test(line) && line.length < 80) break;
    section.push(line);
    if (section.join(" ").length > 1600) break;
  }
  const result = section.join("\n").trim();
  return result.length >= 20 ? result.slice(0, 1600) : null;
}

export function isMeaningfulJobDescription(value: string | null | undefined) {
  const text = cleanJobDescriptionText(value);
  if (text.length < 100) return false;
  const roleSignals = /(responsibilities|requirements|qualifications|experience|skills|developer|engineer|software|data|qa|automation|python|java|react|node|api|apis|backend|frontend|full stack|machine learning|computer vision|\u05d3\u05e8\u05d9\u05e9\u05d5\u05ea|\u05e0\u05d9\u05e1\u05d9\u05d5\u05df|\u05e4\u05d9\u05ea\u05d5\u05d7)/i;
  const noiseSignals = /(search jobs|cookie|privacy policy|menu|sign in)/gi;
  const noiseCount = text.match(noiseSignals)?.length ?? 0;
  return roleSignals.test(text) && noiseCount < 4;
}

export function hasExcessivePageChrome(value: string | null | undefined) {
  const raw = decodeHtml(value ?? "").replace(/\s+/g, " ").trim();
  if (!raw) return false;
  const matches = pageChromePhrasePatterns.flatMap((pattern) => raw.match(pattern) ?? []);
  const uniqueMatches = new Set(matches.map((match) => match.toLocaleLowerCase()));
  const startsWithChrome = /^(?:[^a-z0-9\u0590-\u05ff]{0,10})?(skip to main content|job search|menu|search jobs?|metaintro)\b/i.test(raw);
  if (matches.length >= 6) return true;
  if (uniqueMatches.size >= 4) return true;
  return startsWithChrome && matches.length >= 3;
}

export function hasStrongJobBodySignals(value: string | null | undefined) {
  const text = cleanJobDescriptionText(value);
  if (text.length < 140) return false;
  if (/(responsibilities|requirements|qualifications|what you(?:'|â€™)ll do|what you(?:'|â€™)ll bring|\u05d0\u05d7\u05e8\u05d9\u05d5\u05ea|\u05d3\u05e8\u05d9\u05e9\u05d5\u05ea)/i.test(text)) {
    return true;
  }
  const signals = [
    /\b(?:experience|years?|background)\b/i,
    /\b(?:skill|skills|python|java|javascript|typescript|react|node|sql|api|apis|cloud|linux|automation|qa|backend|frontend|full stack|machine learning|computer vision|data)\b/i,
    /\b(?:team|product|platform|customer|production)\b/i,
    /\b(?:develop|build|design|implement|support|maintain|test|integrate|troubleshoot)\b/i,
    /\b(?:software|engineer|developer|technical|systems|services)\b/i,
    /[\u0590-\u05ff]*(?:\u05e0\u05d9\u05e1\u05d9\u05d5\u05df|\u05e4\u05d9\u05ea\u05d5\u05d7|\u05ea\u05d5\u05db\u05e0\u05d4|\u05e6\u05d5\u05d5\u05ea|\u05de\u05d5\u05e6\u05e8)[\u0590-\u05ff]*/i
  ];
  return signals.filter((pattern) => pattern.test(text)).length >= 4;
}

export function isImportQualityJobDescription(value: string | null | undefined) {
  return isMeaningfulJobDescription(value) && !hasExcessivePageChrome(value) && hasStrongJobBodySignals(value);
}

function confidenceFor(input: {
  title?: string | null;
  description?: string | null;
  company?: string | null;
  location?: string | null;
  strongEvidence?: boolean;
}) {
  if (!input.title || !isMeaningfulJobDescription(input.description)) return "LOW" as const;
  if (input.strongEvidence && (input.company || input.location)) return "HIGH" as const;
  if (input.company || input.location) return "HIGH" as const;
  return "MEDIUM" as const;
}

export function extractJsonLdJobPosting(html: string): ExtractedJobDescription | null {
  const postings = parseJsonLdBlocks(html)
    .flatMap(flattenJsonLd)
    .filter((record) => {
      const type = record["@type"];
      return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
    });
  const posting = postings[0];
  if (!posting) return null;

  const description = textValue(posting.description);
  const requirements = textValue(posting.qualifications ?? posting.skills ?? posting.experienceRequirements) ?? extractRequirementsSection(description);
  const extracted = {
    title: textValue(posting.title),
    company: textValue((posting.hiringOrganization as Record<string, unknown> | undefined)?.name ?? posting.hiringOrganization),
    location: textValue(posting.jobLocation),
    description,
    requirements,
    responsibilities: textValue(posting.responsibilities),
    remotePolicy: textValue(posting.jobLocationType),
    language: textValue(posting.inLanguage) ?? (description && /[\u0590-\u05ff]/.test(description) ? "Hebrew" : "English"),
    confidence: "HIGH" as const,
    reason: "JSON_LD_JOB_POSTING"
  };
  return {
    ...extracted,
    confidence: confidenceFor({ ...extracted, strongEvidence: true })
  };
}

function extractGreenhouseHtml(html: string): ExtractedJobDescription | null {
  if (!/greenhouse/i.test(html)) return null;
  const title = firstMatchText(html, [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ]);
  const location = firstMatchText(html, [
    /<div[^>]+class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<span[^>]+class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
  ]);
  const company = metaContent(html, "og:site_name") ?? null;
  const sectionBody = firstMatchText(html, [
    /<div[^>]+id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ]);
  const visibleBody = visibleTextFromHtml(html);
  const body = sectionBody && isMeaningfulJobDescription(sectionBody)
    ? sectionBody
    : isMeaningfulJobDescription(visibleBody)
      ? visibleBody
      : stripHtml(html);
  const description = isMeaningfulJobDescription(body) ? body : null;
  if (!title || !description) return null;
  return {
    title,
    company,
    location,
    description,
    requirements: extractRequirementsSection(description),
    remotePolicy: /remote|hybrid|work from home/i.test(description) ? "Remote/hybrid wording detected" : null,
    language: /[\u0590-\u05ff]/.test(description) ? "Hebrew" : "English",
    confidence: confidenceFor({ title, company, location, description, strongEvidence: true }),
    reason: "GREENHOUSE_STATIC_HTML"
  };
}

function extractLeverHtml(html: string): ExtractedJobDescription | null {
  if (!/lever\.co|posting-headline|posting-page/i.test(html)) return null;
  const title = firstMatchText(html, [
    /<h2[^>]+class=["'][^"']*posting-headline[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ]);
  const location = firstMatchText(html, [
    /<div[^>]+class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<span[^>]+class=["'][^"']*location[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
  ]);
  const company = metaContent(html, "og:site_name");
  const sectionBody = firstMatchText(html, [
    /<div[^>]+class=["'][^"']*section-wrapper[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class=["'][^"']*posting-page[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ]);
  const visibleBody = visibleTextFromHtml(html);
  const body = sectionBody && isMeaningfulJobDescription(sectionBody)
    ? sectionBody
    : isMeaningfulJobDescription(visibleBody)
      ? visibleBody
      : stripHtml(html);
  const description = isMeaningfulJobDescription(body) ? body : null;
  if (!title || !description) return null;
  return {
    title,
    company,
    location,
    description,
    requirements: extractRequirementsSection(description),
    remotePolicy: /remote|hybrid|work from home/i.test(description) ? "Remote/hybrid wording detected" : null,
    language: /[\u0590-\u05ff]/.test(description) ? "Hebrew" : "English",
    confidence: confidenceFor({ title, company, location, description, strongEvidence: true }),
    reason: "LEVER_STATIC_HTML"
  };
}

export function extractJobDescriptionFromHtml(html: string): ExtractedJobDescription {
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd) return jsonLd;

  const greenhouse = extractGreenhouseHtml(html);
  if (greenhouse) return greenhouse;

  const lever = extractLeverHtml(html);
  if (lever) return lever;

  const title = firstMatchText(html, [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ]);
  const company = metaContent(html, "og:site_name");
  const visibleText = visibleTextFromHtml(html);
  const description = isMeaningfulJobDescription(visibleText) ? visibleText : null;
  const requirements = extractRequirementsSection(description ?? visibleText);
  return {
    title,
    company,
    description,
    requirements,
    remotePolicy: /remote|hybrid|work from home|\u05de\u05e8\u05d7\u05d5\u05e7|\u05d4\u05d9\u05d1\u05e8\u05d9\u05d3\u05d9/i.test(visibleText) ? "Remote/hybrid wording detected" : null,
    language: /[\u0590-\u05ff]/.test(visibleText) ? "Hebrew" : "English",
    confidence: confidenceFor({ title, company, description }),
    reason: description ? "VISIBLE_HTML_FALLBACK" : "NO_MEANINGFUL_JOB_DESCRIPTION"
  };
}
