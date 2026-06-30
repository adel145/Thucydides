import { AnimatedBackground } from "@/components/effects/AnimatedBackground";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-radial-scan text-right text-ink-100">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen min-w-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
