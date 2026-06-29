export function isSkippableNonImportedDiscoveryLead(lead: { importedJobId?: string | null; status?: string | null }) {
  return !lead.importedJobId && lead.status !== "IMPORTED";
}
