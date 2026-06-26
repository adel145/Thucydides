export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="matrix-grid absolute inset-0 opacity-45" />
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-aqua-400/10 blur-3xl" />
      <div className="absolute bottom-[-220px] right-[-120px] h-[460px] w-[460px] rounded-full border border-aqua-400/20" />
      <div className="absolute bottom-[-180px] right-[-80px] h-[360px] w-[360px] rounded-full border border-white/10" />
    </div>
  );
}
