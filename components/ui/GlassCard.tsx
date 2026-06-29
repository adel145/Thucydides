import clsx from "clsx";

export function GlassCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("glass rounded-lg p-6 shadow-glow", className)}>
      {children}
    </section>
  );
}
