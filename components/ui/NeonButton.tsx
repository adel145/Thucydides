import clsx from "clsx";
import Link from "next/link";

type NeonButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function NeonButton({ href, children, className, ...buttonProps }: NeonButtonProps) {
  const classes = clsx(
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-aqua-400/70 bg-aqua-400/10 px-4 py-2 text-sm font-semibold text-aqua-400 transition hover:bg-aqua-400/20 hover:shadow-glow-strong disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-aqua-400/10 disabled:hover:shadow-none",
    className
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={classes} {...buttonProps}>{children}</button>;
}
