import { isImportableSourceClassification } from "./pageClassifier";

export type DiscoveryLeadViewItem = {
  sourceClassification?: string | null;
  confidence?: string | null;
  extractedDescription?: string | null;
  rawText?: string | null;
  status?: string | null;
  importedJobId?: string | null;
  validationStatus?: string | null;
};

export function hasMeaningfulDiscoveryDescription(lead: DiscoveryLeadViewItem) {
  const description = lead.extractedDescription ?? lead.rawText;
  return Boolean(description && description.trim().length >= 80);
}

export function isVerifiedDiscoveryPostingLead(lead: DiscoveryLeadViewItem) {
  return isImportableSourceClassification(lead.sourceClassification) && lead.status !== "SKIPPED";
}

export function isDuplicateDiscoveryPostingLead(lead: DiscoveryLeadViewItem, duplicate = false) {
  return isVerifiedDiscoveryPostingLead(lead) && (duplicate || lead.status === "DUPLICATE");
}

export function isImportedDiscoveryPostingLead(lead: DiscoveryLeadViewItem) {
  return isVerifiedDiscoveryPostingLead(lead) && lead.status === "IMPORTED" && Boolean(lead.importedJobId);
}

export function isBlockedDiscoveryPostingLead(lead: DiscoveryLeadViewItem) {
  return isVerifiedDiscoveryPostingLead(lead) && lead.validationStatus === "FORBIDDEN";
}

export function isReadyToImportDiscoveryLead(lead: DiscoveryLeadViewItem, options: { duplicate?: boolean } = {}) {
  return (
    isVerifiedDiscoveryPostingLead(lead) &&
    !isBlockedDiscoveryPostingLead(lead) &&
    !isDuplicateDiscoveryPostingLead(lead, options.duplicate) &&
    !isImportedDiscoveryPostingLead(lead) &&
    (lead.confidence === "MEDIUM" || lead.confidence === "HIGH") &&
    hasMeaningfulDiscoveryDescription(lead)
  );
}

export function discoveryPostingReviewReason(lead: DiscoveryLeadViewItem) {
  if (!isVerifiedDiscoveryPostingLead(lead)) return "Not verified as a single job posting.";
  if (lead.confidence !== "MEDIUM" && lead.confidence !== "HIGH") return "Low confidence.";
  if (!hasMeaningfulDiscoveryDescription(lead)) return "Missing meaningful job description.";
  return "Needs manual review before import.";
}

// Backward-compatible name: this now means a verified single posting visible in the verified section.
export function isVerifiedImportableDiscoveryLead(lead: DiscoveryLeadViewItem) {
  return isVerifiedDiscoveryPostingLead(lead);
}

export function isLegacyOrNoisyDiscoveryLead(lead: DiscoveryLeadViewItem) {
  return !isVerifiedDiscoveryPostingLead(lead) && lead.status !== "SKIPPED" && lead.status !== "IMPORTED";
}

export function shouldHideOldNonImportableLead(lead: DiscoveryLeadViewItem) {
  return (
    !lead.importedJobId &&
    lead.status !== "IMPORTED" &&
    lead.status !== "SKIPPED" &&
    !isVerifiedDiscoveryPostingLead(lead)
  );
}

export function discoveryPostingActionState(
  lead: DiscoveryLeadViewItem,
  options: { duplicate?: boolean } = {}
) {
  if (isImportedDiscoveryPostingLead(lead)) {
    return {
      label: "Imported",
      tone: "aqua" as const,
      reason: "Already imported into Job Inbox."
    };
  }
  if (isBlockedDiscoveryPostingLead(lead)) {
    return {
      label: "Blocked — cannot import",
      tone: "warning" as const,
      reason: "Blocked by deterministic role rules."
    };
  }
  if (isDuplicateDiscoveryPostingLead(lead, options.duplicate)) {
    return {
      label: "Duplicate",
      tone: "warning" as const,
      reason: "Looks like an existing local job."
    };
  }
  if (isReadyToImportDiscoveryLead(lead, options)) {
    return {
      label: "Ready to import",
      tone: "aqua" as const,
      reason: null
    };
  }
  return {
    label: "Needs review — not ready",
    tone: "muted" as const,
    reason: discoveryPostingReviewReason(lead)
  };
}
