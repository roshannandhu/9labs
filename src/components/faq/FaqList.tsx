"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/content/types";
import { textToHtml } from "@/lib/richtext";

/**
 * Questions that open and close. Answers are rich text written in the admin (Content → FAQ).
 * Uncontrolled by default (its own open question); pass `open`/`onToggle` to share one open
 * question across several lists, e.g. the FAQ page's groups (`PageView`).
 */
export function FaqList({ items, openFirst = false, open: openProp, onToggle }: { items: FaqItem[]; openFirst?: boolean; open?: string | null; onToggle?: (id: string | null) => void }) {
  const uid = useId();
  const [localOpen, setLocalOpen] = useState<string | null>(openFirst ? (items[0]?.id ?? null) : null);
  const open = onToggle ? openProp : localOpen;
  const setOpen = onToggle ?? setLocalOpen;
  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      {items.map((f) => {
        const on = open === f.id;
        return (
          <li key={f.id} id={f.id} className="relative scroll-mt-[calc(var(--nav-h)+16px)]">
            {on && <span aria-hidden="true" className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-nl-purple shadow-[0_0_12px_1px_var(--nl-purple)]" />}
            <h3>
              <button
                type="button"
                id={`${uid}-q-${f.id}`}
                aria-expanded={on}
                aria-controls={`${uid}-a-${f.id}`}
                onClick={() => setOpen(on ? null : f.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-[16.5px] font-semibold text-white transition-colors hover:text-nl-purple sm:px-6 sm:py-5 sm:text-[18px]"
              >
                <span>{f.question}</span>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-white/70 transition-transform duration-300 ${on ? "rotate-45" : ""}`} aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M6 1.5v9M1.5 6h9" />
                  </svg>
                </span>
              </button>
            </h3>
            <div id={`${uid}-a-${f.id}`} role="region" aria-labelledby={`${uid}-q-${f.id}`} hidden={!on} className="rich px-5 pb-5 text-[15px] leading-relaxed text-nl-ink sm:px-6 sm:pb-6">
              <div dangerouslySetInnerHTML={{ __html: textToHtml(f.answerText) }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
