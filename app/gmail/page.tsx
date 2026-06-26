import { GlassCard } from "@/components/ui/GlassCard";

export default function GmailPage() {
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Gmail</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Recruiter email intelligence will live here</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Gmail OAuth, inbox reading, reply detection, and follow-up drafting are planned for later phases. Phase 0 intentionally contains no email integration.
      </p>
    </GlassCard>
  );
}
