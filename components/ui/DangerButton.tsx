import clsx from "clsx";

export function DangerButton({
  children,
  className,
  title
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-10 items-center justify-center rounded-lg border border-signal-red/60 bg-signal-red/10 px-4 py-2 text-sm font-semibold text-signal-red transition hover:bg-signal-red/20",
        className
      )}
      title={title}
    >
      {children}
    </button>
  );
}
