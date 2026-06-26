import { CircleAlert, DatabaseZap } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

export function TopBar() {
  return (
    <header className="border-b border-white/10 bg-navy-950/44 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Local-first command center</p>
          <h1 className="mt-1 text-xl font-semibold text-white">Strategic job-search operating system</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge tone="muted" icon={<DatabaseZap className="h-3.5 w-3.5" />}>
            No database yet
          </ScoreBadge>
          <ScoreBadge tone="warning" icon={<CircleAlert className="h-3.5 w-3.5" />}>
            Phase 0 placeholders
          </ScoreBadge>
        </div>
      </div>
    </header>
  );
}
