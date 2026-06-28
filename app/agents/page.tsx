import { GlassCard } from "@/components/ui/GlassCard";

export default function AgentsPage() {
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Agent Council</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Specialized job-search agents will coordinate here</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Planned agents include career strategy, Israeli job-market search, ATS checks, CV tailoring, Hebrew and English language support, fit scoring, sourcing, risk review, and a Final Decision Chief. No real agents run yet.
      </p>
    </GlassCard>
  );
}
