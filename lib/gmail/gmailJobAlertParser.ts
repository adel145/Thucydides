import { classifyGmailAlertProvider, type GmailAlertProvider } from "./gmailAlertProviders";

export type GmailJobAlertParseInput = {
  provider?: string | null;
  sender?: string | null;
  subject?: string | null;
  rawText: string;
};

export type ParsedGmailJobLead = {
  provider: GmailAlertProvider;
  title: string;
  company?: string | null;
  location?: string | null;
  sourceUrl?: string | null;
  rawSnippet: string;
  rawText?: string | null;
};

const titleSignals = [
  "developer",
  "engineer",
  "software",
  "frontend",
  "backend",
  "full stack",
  "fullstack",
  "qa",
  "automation",
  "analyst",
  "data",
  "machine learning",
  "deep learning",
  "ai",
  "research student",
  "student researcher",
  "computer vision",
  "devops",
  "soc",
  "noc",
  "support engineer",
  "technical support",
  "מפתח",
  "מהנדס",
  "תוכנה",
  "בדיקות",
  "נתונים",
  "למידת מכונה",
  "למידה עמוקה",
  "ראייה ממוחשבת",
  "סטודנט למחקר"
];

const providerNoise = ["view job", "apply", "recommended", "job alert", "unsubscribe", "see more", "jobs for you"];
const urlPattern = /https?:\/\/[^\s<>"')]+/gi;

function cleanLine(value: string) {
  return value.replace(/^[-*•\s]+/, "").replace(/\s+/g, " ").trim();
}

function isLikelyTitle(value: string) {
  const text = value.toLocaleLowerCase();
  return value.length >= 4 && value.length <= 120 && titleSignals.some((signal) => text.includes(signal.toLocaleLowerCase()));
}

function isNoise(value: string) {
  const text = value.toLocaleLowerCase();
  return providerNoise.some((item) => text === item || text.includes(item));
}

function truncate(value: string, max = 700) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

function extractLabeledValue(lines: string[], labels: string[]) {
  for (const line of lines) {
    const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!match) continue;
    const label = match[1].trim().toLocaleLowerCase();
    if (labels.some((item) => label.includes(item))) return cleanLine(match[2]);
  }
  return null;
}

function splitCompanyLocation(line: string) {
  const parts = line
    .split(/\s+[·|]\s+|\s+-\s+|\s+–\s+/)
    .map(cleanLine)
    .filter(Boolean);
  return {
    company: parts[0] ?? null,
    location: parts.length > 1 ? parts.slice(1).join(" / ") : null
  };
}

function blockFromTitleLine(lines: string[], index: number) {
  const start = Math.max(0, index - 1);
  const end = Math.min(lines.length, index + 5);
  return lines.slice(start, end);
}

function buildLeadFromBlock(lines: string[], provider: GmailAlertProvider): ParsedGmailJobLead | null {
  const cleaned = lines.map(cleanLine).filter((line) => line && !isNoise(line));
  if (cleaned.length === 0) return null;

  const joined = cleaned.join("\n");
  const sourceUrl = joined.match(urlPattern)?.[0] ?? null;
  const labeledTitle = extractLabeledValue(cleaned, ["title", "job", "position", "משרה", "תפקיד"]);
  let title = labeledTitle ?? cleaned.find(isLikelyTitle) ?? null;
  if (!title) return null;

  let company = extractLabeledValue(cleaned, ["company", "חברה"]);
  let location = extractLabeledValue(cleaned, ["location", "מיקום", "אזור"]);

  const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    title = cleanLine(atMatch[1]);
    company = company ?? cleanLine(atMatch[2]);
  }

  const titleIndex = cleaned.findIndex((line) => line === title || line.includes(title));
  const metadataLine = cleaned.slice(titleIndex + 1).find((line) => !line.match(urlPattern) && !isLikelyTitle(line));
  if ((!company || !location) && metadataLine) {
    const metadata = splitCompanyLocation(metadataLine);
    company = company ?? metadata.company;
    location = location ?? metadata.location;
  }

  return {
    provider,
    title,
    company,
    location,
    sourceUrl,
    rawSnippet: truncate(joined),
    rawText: joined
  };
}

export function parseGmailJobAlertText(input: GmailJobAlertParseInput | string): ParsedGmailJobLead[] {
  const parsedInput = typeof input === "string" ? { rawText: input } : input;
  const rawText = parsedInput.rawText?.trim() ?? "";
  if (rawText.length < 12) return [];

  const provider = classifyGmailAlertProvider(parsedInput);
  const lines = rawText.split(/\r?\n/).map(cleanLine);
  const candidates: ParsedGmailJobLead[] = [];

  const paragraphBlocks = rawText
    .split(/\n\s*\n/g)
    .map((block) => block.split(/\r?\n/).map(cleanLine).filter(Boolean))
    .filter((block) => block.some((line) => isLikelyTitle(line)));

  for (const block of paragraphBlocks) {
    const lead = buildLeadFromBlock(block, provider);
    if (lead) candidates.push(lead);
  }

  if (candidates.length === 0) {
    lines.forEach((line, index) => {
      if (!isLikelyTitle(line)) return;
      const lead = buildLeadFromBlock(blockFromTitleLine(lines, index), provider);
      if (lead) candidates.push(lead);
    });
  }

  const seen = new Set<string>();
  return candidates
    .filter((lead) => {
      const key = [lead.title, lead.company, lead.sourceUrl].join("|").toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}
