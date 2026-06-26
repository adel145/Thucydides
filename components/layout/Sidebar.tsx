"use client";

import clsx from "clsx";
import {
  Bot,
  BriefcaseBusiness,
  Gauge,
  Inbox,
  KanbanSquare,
  Mail,
  Files,
  Settings,
  ShieldCheck,
  UserRoundSearch
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/profile", label: "Profile Intelligence", icon: UserRoundSearch },
  { href: "/jobs", label: "Job Inbox", icon: BriefcaseBusiness },
  { href: "/resumes", label: "Resume Lab", icon: ShieldCheck },
  { href: "/agents", label: "Agent Council", icon: Bot },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/sources", label: "Sources", icon: Files },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-navy-950/72 px-4 py-5 backdrop-blur-xl lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-aqua-400/50 bg-aqua-400/10 shadow-glow">
          <Inbox className="h-5 w-5 text-aqua-400" aria-hidden="true" />
        </div>
        <div>
          <div className="text-lg font-semibold text-aqua-400">Thucydides</div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Interview campaign</div>
        </div>
      </Link>

      <nav className="space-y-2" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "border-aqua-400/50 bg-aqua-400/10 text-aqua-400 shadow-glow"
                  : "border-transparent text-ink-200 hover:border-white/10 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-ink-400">Mission target</div>
        <div className="mt-2 text-2xl font-semibold text-white">10 interviews</div>
        <p className="mt-2 text-sm leading-6 text-ink-200">Live campaign progress is tracked on the local SQLite dashboard.</p>
      </div>
    </aside>
  );
}

