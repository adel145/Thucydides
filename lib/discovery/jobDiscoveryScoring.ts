export type DiscoveryScoringInput = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  validationStatus?: string | null;
  allowedSignals?: string[];
  forbiddenFlags?: string[];
  riskNotes?: string | null;
};

export type DiscoveryFitScore = {
  score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
};

const strongSignals = [
  "ai/ml research student",
  "deep learning",
  "computer vision",
  "software engineering student",
  "student software engineer",
  "junior software",
  "backend",
  "full stack",
  "fullstack",
  "python",
  "qa automation",
  "technical support engineer",
  "noc",
  "implementation",
  "integration"
];

const positiveSignals = ["israel", "remote from israel", "remote", "student welcome", "final-year", "final year", "near graduate", "english", "hebrew"];

export function scoreDiscoveryLead(input: DiscoveryScoringInput): DiscoveryFitScore {
  const text = [input.title, input.company, input.location, input.description, input.allowedSignals?.join(" "), input.riskNotes]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  const reasons: string[] = [];

  if (input.validationStatus === "FORBIDDEN" || (input.forbiddenFlags?.length ?? 0) > 0) {
    return { score: 0, confidence: "HIGH", reasons: ["Blocked by hard forbidden role rules."] };
  }

  let score = 35;
  for (const signal of strongSignals) {
    if (text.includes(signal)) {
      score += 12;
      reasons.push(`Strong technical signal: ${signal}.`);
    }
  }
  for (const signal of positiveSignals) {
    if (text.includes(signal)) {
      score += 5;
      reasons.push(`Positive fit signal: ${signal}.`);
    }
  }

  if (!input.description || input.description.trim().length < 80) {
    score -= 15;
    reasons.push("Missing or short description lowers confidence.");
  }
  if (text.includes("completed degree") || text.includes("degree required before september")) {
    score -= 10;
    reasons.push("Degree-completion wording needs manual review.");
  }
  if (input.riskNotes?.includes("Location is outside")) {
    score -= 8;
    reasons.push("Location risk needs review.");
  }
  if (!text.includes("salary")) {
    score -= 4;
    reasons.push("Salary is missing or unclear.");
  }
  if (!input.allowedSignals || input.allowedSignals.length === 0) {
    score -= 12;
    reasons.push("No deterministic allowed technical signal was detected.");
  }

  const clamped = Math.max(0, Math.min(100, score));
  const confidence = !input.description || input.description.length < 80 ? "LOW" : input.allowedSignals?.length ? "HIGH" : "MEDIUM";
  return {
    score: clamped,
    confidence,
    reasons: Array.from(new Set(reasons)).slice(0, 8)
  };
}
