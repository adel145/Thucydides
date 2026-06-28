import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

const skills = ["IT", "QA", "NOC", "Python", "Support", "Frontend"];

export function SkillMatrixPreview() {
  return (
    <GlassCard className="relative min-h-80 overflow-hidden">
      <div className="absolute inset-0 matrix-grid opacity-30" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Future model</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Skill Matrix Preview</h2>
          </div>
          <ScoreBadge>3D later</ScoreBadge>
        </div>
        <div className="relative mt-10 grid flex-1 place-items-center">
          <div className="relative h-48 w-48 rounded-full border border-dashed border-aqua-400/40 shadow-glow">
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-aqua-400/60 bg-aqua-400/10 shadow-glow" />
            {skills.map((skill, index) => {
              const angle = (index / skills.length) * Math.PI * 2;
              const x = Math.cos(angle) * 92;
              const y = Math.sin(angle) * 92;
              return (
                <span
                  key={skill}
                  className="absolute rounded-full border border-white/10 bg-navy-950/85 px-2 py-1 text-xs text-ink-100"
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%, -50%)" }}
                >
                  {skill}
                </span>
              );
            })}
          </div>
        </div>
        <p className="relative z-10 mt-4 text-sm leading-6 text-ink-200">
          Lightweight placeholder for the later Three.js skills model. No production WebGL logic is included yet.
        </p>
      </div>
    </GlassCard>
  );
}
