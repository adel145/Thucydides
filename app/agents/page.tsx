import { GlassCard } from "@/components/ui/GlassCard";
import { AGENT_IDS } from "@/lib/agents/agentContracts";

const agentLabels: Record<(typeof AGENT_IDS)[number], string> = {
  "career-strategy": "Career Strategy Agent",
  "israeli-job-market": "Israeli Job Market Agent",
  "ats-optimization": "ATS Optimization Agent",
  "cv-tailoring": "CV Tailoring Agent",
  "hebrew-language": "Hebrew Language Agent",
  "english-language": "English Language Agent",
  "job-fit-scoring": "Job Fit Scoring Agent",
  "hidden-market-sourcing": "Hidden Market / Sourcing Agent",
  "risk-compliance": "Risk & Compliance Agent",
  "final-decision-chief": "Final Decision Chief Agent"
};

export default function AgentsPage() {
  return (
    <div className="grid gap-6">
      <GlassCard>
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Agent Council</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Agent contracts are defined, but agents are not running</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
          Phase 4.1 only defines local TypeScript contracts and safety rules for future agent output. No model calls, fake scores, applications, or emails happen here.
        </p>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Planned specialists</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {AGENT_IDS.map((agentId) => (
            <div key={agentId} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm font-semibold text-white">
              {agentLabels[agentId]}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-semibold text-white">Safety rules</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Local data first",
            "Evidence required",
            "Uncertainty required",
            "No silent applications",
            "No silent emails",
            "Adel must review and confirm"
          ].map((rule) => (
            <div key={rule} className="rounded-lg border border-aqua-400/30 bg-aqua-400/10 p-3 text-sm text-ink-100">
              {rule}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
