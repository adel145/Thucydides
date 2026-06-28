import { GlassCard } from "@/components/ui/GlassCard";

export default function SettingsPage() {
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Settings</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Local configuration will be managed here</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Later phases will cover local database paths, AI configuration, job-source preferences, safety filters, and export defaults. No secrets are stored or requested here yet.
      </p>
    </GlassCard>
  );
}
