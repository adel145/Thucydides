import { GlassCard } from "@/components/ui/GlassCard";

export default function ResumesPage() {
  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.18em] text-aqua-400">Resume Lab</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">Targeted CV variants will be prepared here</h2>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-200">
        Later phases will prepare English or Hebrew CV variants based on the job language and Adel&apos;s verified profile. This page does not create documents, PDFs, DOCX files, or AI drafts yet.
      </p>
    </GlassCard>
  );
}
