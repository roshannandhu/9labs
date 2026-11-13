"use client";

import Link from "next/link";
import { ROOMS } from "./rooms";

export type PadStatus = { text: string; tone?: "default" | "warn" | "brand" };

/** A 3×3 keypad of the nine rooms, each with a live one-line status — the home screen's map of the admin. */
export function NinePad({ statuses }: { statuses: Partial<Record<string, PadStatus>> }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ROOMS.map((r) => {
        const s = statuses[r.id];
        const tone = s?.tone ?? "default";
        return (
          <Link
            key={r.id}
            href={r.path}
            className={`group flex flex-col gap-2 rounded-2xl border p-3.5 transition-colors sm:p-4 ${tone === "warn" ? "border-st-warn/35 bg-st-warn-bg" : tone === "brand" ? "border-st-purple/35 bg-st-panel" : "border-st-border bg-st-panel"} hover:border-st-purple/50`}
          >
            <span className="font-digits text-[20px] font-black text-st-purple">{r.n}</span>
            <span className="font-display text-[14px] font-semibold leading-tight text-st-ink">{r.title}</span>
            {s && <span className={`text-[11.5px] leading-snug ${tone === "warn" ? "text-st-warn" : "text-st-sub"}`}>{s.text}</span>}
          </Link>
        );
      })}
    </div>
  );
}
