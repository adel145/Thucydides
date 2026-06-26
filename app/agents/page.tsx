import { GlassCard } from "@/components/ui/GlassCard";

export default function AgentsPage() {
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Agent Council</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Specialized job-search agents will coordinate here</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Planned agents include profile curator, job scout, role filter, fit scorer, resume tailor, application operator, follow-up monitor, and QA reviewer. This page is only a visual placeholder in Phase 0.
      </p>
    </GlassCard>
  );
}
