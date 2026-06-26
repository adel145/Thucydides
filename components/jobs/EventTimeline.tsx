import type { ApplicationEvent } from "@/generated/prisma/client";

export function EventTimeline({ events }: { events: ApplicationEvent[] }) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <p className="text-sm leading-6 text-ink-200">No lifecycle events have been recorded yet.</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">{event.type}</div>
              <time className="text-xs text-ink-400">{event.createdAt.toLocaleString()}</time>
            </div>
            {event.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-200">{event.notes}</p> : null}
          </div>
        ))
      )}
    </div>
  );
}
