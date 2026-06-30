import { CircleAlert, DatabaseZap, Mail, Sparkles } from "lucide-react";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { getOpenAiDraftingConfig } from "@/lib/ai/openaiClient";

export function TopBar() {
  const aiConfig = getOpenAiDraftingConfig();

  return (
    <header className="border-b border-white/10 bg-navy-950/44 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">מרכז פיקוד מקומי</p>
          <h1 className="mt-1 break-words text-xl font-semibold text-white">מערכת אסטרטגית לניהול חיפוש עבודה</h1>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <ScoreBadge tone="muted" icon={<DatabaseZap className="h-3.5 w-3.5" />}>
            SQLite מקומי פעיל
          </ScoreBadge>
          <ScoreBadge tone={aiConfig.enabled ? "aqua" : "warning"} icon={aiConfig.enabled ? <Sparkles className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}>
            {aiConfig.enabled ? "ניסוח AI מוגדר" : "ניסוח AI לא מוגדר"}
          </ScoreBadge>
          <ScoreBadge tone="warning" icon={<Mail className="h-3.5 w-3.5" />}>
            Gmail לא מחובר
          </ScoreBadge>
        </div>
      </div>
    </header>
  );
}
