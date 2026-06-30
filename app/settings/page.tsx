import { GlassCard } from "@/components/ui/GlassCard";

export default function SettingsPage() {
  return (
    <GlassCard className="min-w-0 overflow-hidden">
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Settings</p>
      <h2 className="mt-3 break-words text-3xl font-semibold text-white">הגדרות מקומיות ינוהלו כאן בהמשך</h2>
      <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-ink-200">
        בשלבים הבאים יתווספו הגדרות למסד נתונים מקומי, AI, העדפות מקורות משרה, מסנני בטיחות וברירות מחדל ליצוא. כרגע אין שמירת סודות ואין בקשת credentials בעמוד הזה.
      </p>
    </GlassCard>
  );
}
