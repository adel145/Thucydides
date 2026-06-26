import clsx from "clsx";

const tones = {
  aqua: "border-aqua-400/40 bg-aqua-400/10 text-aqua-400",
  muted: "border-white/10 bg-white/[0.05] text-ink-200",
  warning: "border-signal-red/40 bg-signal-red/10 text-signal-red"
};

export function ScoreBadge({
  children,
  icon,
  tone = "aqua"
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={clsx("inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold", tones[tone])}>
      {icon}
      {children}
    </span>
  );
}
