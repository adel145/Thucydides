export type DiscoveryLeadCountItem = {
  status?: string | null;
  importedJobId?: string | null;
  validationStatus?: string | null;
  extractedDescription?: string | null;
  rawText?: string | null;
  discoverySource?: string | null;
};

export function countDiscoveryLeads(leads: DiscoveryLeadCountItem[]) {
  const reviewable = leads.filter((lead) => !lead.importedJobId && (lead.status === "NEW" || lead.status === "REVIEW"));
  return {
    newLeads: reviewable.filter((lead) => lead.status === "NEW").length,
    enrichedLeads: leads.filter((lead) => Boolean(lead.extractedDescription || lead.rawText)).length,
    needsReview: reviewable.length,
    blocked: leads.filter((lead) => lead.validationStatus === "FORBIDDEN").length,
    imported: leads.filter((lead) => Boolean(lead.importedJobId) || lead.status === "IMPORTED").length
  };
}
