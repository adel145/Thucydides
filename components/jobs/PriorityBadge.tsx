import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { jobPriorityLabels, normalizeJobPriority } from "@/lib/jobs/jobPriority";

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const normalized = normalizeJobPriority(priority);
  const tone = normalized === "HIGH" || normalized === "CRITICAL" ? "warning" : normalized === "MEDIUM" ? "muted" : "aqua";
  return <ScoreBadge tone={tone}>{jobPriorityLabels[normalized]}</ScoreBadge>;
}
