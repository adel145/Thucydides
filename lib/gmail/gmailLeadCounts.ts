export type GmailLeadCountItem = {
  status?: string | null;
  importedJobId?: string | null;
};

export function countGmailAlertLeadsAwaitingReview(leads: GmailLeadCountItem[]) {
  return leads.filter((lead) => {
    if (lead.importedJobId) return false;
    return lead.status === "NEW" || lead.status === "REVIEW";
  }).length;
}
