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
    <div className="grid min-w-0 gap-6 overflow-hidden">
      <GlassCard className="min-w-0 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Agent Council</p>
        <h2 className="mt-3 break-words text-3xl font-semibold text-white">חוזי Agents מוגדרים, אבל Agents עדיין לא רצים</h2>
        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
          העמוד הזה מציג חוזי TypeScript וכללי בטיחות לשימוש עתידי. אין כאן model calls, אין ציונים מזויפים, אין שליחת הגשות ואין שליחת אימיילים.
        </p>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">מומחים מתוכננים</h3>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {AGENT_IDS.map((agentId) => (
            <div key={agentId} dir="ltr" className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left text-sm font-semibold text-white">
              {agentLabels[agentId]}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="min-w-0 overflow-hidden">
        <h3 className="text-xl font-semibold text-white">כללי בטיחות</h3>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {[
            "קודם כל נתונים מקומיים",
            "דרושה ראיה לפני ניסוח רציני",
            "חובה להציג אי-ודאות",
            "אין הגשות שקטות",
            "אין אימיילים שקטים",
            "Adel חייב לבדוק ולאשר"
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
