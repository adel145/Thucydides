import { isImportableSourceClassification } from "./pageClassifier";

export type DiscoveryLeadViewItem = {
  sourceClassification?: string | null;
  confidence?: string | null;
  extractedDescription?: string | null;
  rawText?: string | null;
  status?: string | null;
  importedJobId?: string | null;
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
