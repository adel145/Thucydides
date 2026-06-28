export const AGENT_IDS = [
  "career-strategy",
  "israeli-job-market",
  "ats-optimization",
  "cv-tailoring",
  "hebrew-language",
  "english-language",
  "job-fit-scoring",
  "hidden-market-sourcing",
  "risk-compliance",
  "final-decision-chief"
] as const;

export type AgentId = (typeof AGENT_IDS)[number];
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";
export type HumanReviewState = "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
export type ActionSafetyStatus = "NO_ACTION" | "REQUIRES_CONFIRMATION" | "BLOCKED";

export type AgentEvidenceRef = {
  sourceId?: string;
  jobId?: string;
  profileField?: string;
  note?: string;
};

export type AgentInputSnapshot = {
  profileId?: string;
  jobId?: string;
  sourceIds: string[];
  createdAt: string;
};

export type AgentFinding = {
  title: string;
  detail: string;
  confidence: ConfidenceLevel;
  uncertainty: string;
  evidenceRefs: AgentEvidenceRef[];
};

export type AgentRecommendation = {
  action: string;
  reason: string;
  safetyStatus: ActionSafetyStatus;
  requiresHumanConfirmation: true;
  evidenceRefs: AgentEvidenceRef[];
};

export type AgentRunDraft = {
  agentId: AgentId;
  input: AgentInputSnapshot;
  findings: AgentFinding[];
  recommendations: AgentRecommendation[];
  reviewState: HumanReviewState;
};

export type FinalDecisionDraft = {
  agentId: "final-decision-chief";
  input: AgentInputSnapshot;
  summary: string;
  confidence: ConfidenceLevel;
  uncertainty: string;
  recommendedNextAction: AgentRecommendation;
  supportingRuns: AgentRunDraft[];
  reviewState: HumanReviewState;
};

export function isAgentId(value: string): value is AgentId {
  return AGENT_IDS.includes(value as AgentId);
}
