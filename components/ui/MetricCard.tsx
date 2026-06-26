import { GlassCard } from "@/components/ui/GlassCard";

export function MetricCard({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <GlassCard className="min-h-32">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-3 text-sm leading-6 text-ink-200">{note}</p>
    </GlassCard>
  );
}
