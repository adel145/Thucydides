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
};

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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
      const parsed = JSON.parse(block[1].trim()) as unknown;
      values.push(parsed);
    } catch {
      // Ignore invalid JSON-LD blocks; many pages have unrelated malformed snippets.
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

export function extractJsonLdJobPosting(html: string): ExtractedJobDescription | null {
  const postings = parseJsonLdBlocks(html)
    .flatMap(flattenJsonLd)
    .filter((record) => {
      const type = record["@type"];
      return type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
    });
  const posting = postings[0];
  if (!posting) return null;

  return {
    title: textValue(posting.title),
    company: textValue((posting.hiringOrganization as Record<string, unknown> | undefined)?.name ?? posting.hiringOrganization),
    location: textValue(posting.jobLocation),
    description: textValue(posting.description),
    requirements: textValue(posting.qualifications ?? posting.skills ?? posting.experienceRequirements),
    responsibilities: textValue(posting.responsibilities),
    remotePolicy: textValue(posting.jobLocationType),
    language: textValue(posting.inLanguage),
    confidence: "HIGH"
  };
}

export function extractJobDescriptionFromHtml(html: string): ExtractedJobDescription {
  const jsonLd = extractJsonLdJobPosting(html);
  if (jsonLd) return jsonLd;

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const visibleText = stripHtml(html).slice(0, 5000);
  const requirementsMatch = visibleText.match(/(requirements|qualifications|דרישות)[:\s]+(.{20,1200})/i);
  return {
    title: title ? stripHtml(title) : null,
    description: visibleText || null,
    requirements: requirementsMatch?.[2]?.slice(0, 1200).trim() ?? null,
    remotePolicy: /remote|hybrid|work from home|מרחוק|היברידי/i.test(visibleText) ? "Remote/hybrid wording detected" : null,
    language: /[\u0590-\u05ff]/.test(visibleText) ? "Hebrew" : "English",
    confidence: visibleText ? "LOW" : "LOW"
  };
}
