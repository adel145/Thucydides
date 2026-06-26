import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { jobStatusLabels, normalizeJobStatus } from "@/lib/jobs/jobStatus";

export function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeJobStatus(status);
  const tone = normalized === "ARCHIVED" || normalized === "REJECTED" ? "muted" : normalized === "INTERVIEW" || normalized === "OFFER" ? "aqua" : "muted";

  return <ScoreBadge tone={tone}>{jobStatusLabels[normalized]}</ScoreBadge>;
}
