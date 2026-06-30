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

export function isVerifiedImportableDiscoveryLead(lead: DiscoveryLeadViewItem) {
  return (
    isImportableSourceClassification(lead.sourceClassification) &&
    (lead.confidence === "MEDIUM" || lead.confidence === "HIGH") &&
    hasMeaningfulDiscoveryDescription(lead) &&
    lead.status !== "SKIPPED" &&
    lead.status !== "DUPLICATE"
  );
}

export function isLegacyOrNoisyDiscoveryLead(lead: DiscoveryLeadViewItem) {
  return !isVerifiedImportableDiscoveryLead(lead) && lead.status !== "SKIPPED" && lead.status !== "IMPORTED";
}

export function shouldHideOldNonImportableLead(lead: DiscoveryLeadViewItem) {
  return (
    !lead.importedJobId &&
    lead.status !== "IMPORTED" &&
    lead.status !== "SKIPPED" &&
    (!isImportableSourceClassification(lead.sourceClassification) || lead.confidence === "LOW")
  );
}

export function discoveryPostingActionState(
  lead: DiscoveryLeadViewItem,
  options: { duplicate?: boolean } = {}
) {
  if (lead.validationStatus === "FORBIDDEN") {
    return {
      label: "Blocked — cannot import",
      tone: "warning" as const,
      reason: "Blocked by deterministic role rules."
    };
  }
  if (options.duplicate) {
    return {
      label: "Duplicate",
      tone: "warning" as const,
      reason: "Looks like an existing local job."
    };
  }
  if (!isVerifiedImportableDiscoveryLead(lead)) {
    return {
      label: "Needs review",
      tone: "muted" as const,
      reason: "Missing import confidence, verified posting classification, or meaningful description."
    };
  }
  return {
    label: "Ready to import",
    tone: "aqua" as const,
    reason: null
  };
}
