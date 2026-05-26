"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { TimelineEventItem } from "./TimelineEventItem";
import { formatDateTime } from "@/lib/utils";
import type { TimelineEvent, TimelineEventType } from "@/lib/types";

// ── Batching logic ────────────────────────────────────────────────────────────

type SingleItem = { kind: "single"; event: TimelineEvent };
type BatchItem  = { kind: "batch";  events: TimelineEvent[]; label: string };
type TimelineItem = SingleItem | BatchItem;

const BATCH_WINDOW_MS = 60 * 60 * 1000; // 60 minutes

function getBatchLabel(events: TimelineEvent[]): string {
  const types = new Set<TimelineEventType>(events.map((e) => e.eventType));
  const count = events.length;
  // Use the oldest event's time as the batch timestamp
  const time = new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(events[0].timestamp));

  if (types.has("reply_received") || types.has("automation_paused")) {
    return `Reply handling activity · ${count} actions · ${time}`;
  }
  if (types.has("email_sent") || types.has("sms_sent") || types.has("call_scheduled")) {
    return `Collection workflow activity · ${count} actions · ${time}`;
  }
  if ([...types].every((t) => t === "lookup_performed")) {
    return `Lookup checks · ${count} checks · ${time}`;
  }
  return `Workflow activity · ${count} actions · ${time}`;
}

function buildTimelineItems(events: TimelineEvent[]): TimelineItem[] {
  if (events.length === 0) return [];

  // Sort chronologically oldest→newest for grouping
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group events within BATCH_WINDOW_MS of the previous event in the group
  const groups: TimelineEvent[][] = [];
  let current: TimelineEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(current[current.length - 1].timestamp).getTime();
    const curr = new Date(sorted[i].timestamp).getTime();
    if (curr - prev <= BATCH_WINDOW_MS) {
      current.push(sorted[i]);
    } else {
      groups.push(current);
      current = [sorted[i]];
    }
  }
  groups.push(current);

  // Convert to TimelineItems, reverse so newest is at top
  const items: TimelineItem[] = [];
  for (const group of [...groups].reverse()) {
    if (group.length < 2) {
      items.push({ kind: "single", event: group[0] });
    } else {
      items.push({ kind: "batch", events: group, label: getBatchLabel(group) });
    }
  }
  return items;
}

// ── Components ────────────────────────────────────────────────────────────────

function BatchGroup({ batch, isLast }: { batch: BatchItem; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Left rail */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
          aria-expanded={open}
          aria-label={open ? "Collapse batch" : "Expand batch"}
        >
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />}
        </button>
        {(!isLast || open) && (
          <div className="mt-1 w-px flex-1 bg-gray-200 min-h-4" />
        )}
      </div>

      {/* Content */}
      <div className={`pb-4 flex-1 min-w-0 ${open ? "" : ""}`}>
        {/* Collapsed header */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left"
        >
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors">
            <span className="text-xs font-semibold text-gray-700 flex-1">{batch.label}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {open ? "Hide" : "Show all"}
            </span>
          </div>
        </button>

        {/* Expanded events */}
        {open && (
          <div className="mt-3 pl-2 border-l-2 border-gray-200 space-y-0">
            {batch.events.map((event, idx) => (
              <TimelineEventItem
                key={event.id}
                eventType={event.eventType}
                timestamp={event.timestamp}
                message={event.message}
                isLast={idx === batch.events.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function BatchedTimeline({ events }: { events: TimelineEvent[] }) {
  const items = buildTimelineItems(events);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No activity yet for this invoice.
      </p>
    );
  }

  return (
    <div>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        if (item.kind === "single") {
          return (
            <TimelineEventItem
              key={item.event.id}
              eventType={item.event.eventType}
              timestamp={item.event.timestamp}
              message={item.event.message}
              isLast={isLast}
            />
          );
        }
        return <BatchGroup key={item.events[0].id} batch={item} isLast={isLast} />;
      })}
    </div>
  );
}
