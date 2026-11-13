"use client";

import { useState } from "react";
import type { Service } from "@/content/site";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { AreaField, ListField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useEnquiries, useQuizResults } from "@/studio/state";
import { checkpoint, setDraft } from "@/lib/store";
import { Pill } from "@/studio/ui";

export default function CardsPage() {
  const draft = useDraft();
  const enquiries = useEnquiries();
  const quizResults = useQuizResults();
  const [open, setOpen] = useState<string | null>(draft.site.services[0]?.slug ?? null);
  const services = draft.site.services;

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-st-ink">The 9 cards</h1>
        <p className="mt-1 text-[13.5px] text-st-sub">Drag to change the order on the site — each card keeps its own animation and travels with it. Click a card to edit its words.</p>
      </div>

      <SortableList
        items={services}
        keyOf={(s) => s.slug}
        minItems={1}
        onReorder={(next) => {
          checkpoint();
          setDraft(["site", "services"], next.map((s, i) => ({ ...s, n: i + 1 })));
        }}
        renderItem={(s, i) => <CardRow s={s} index={i} open={open === s.slug} onToggle={() => setOpen(open === s.slug ? null : s.slug)} enquiries={enquiries.filter((e) => e.service === s.slug).length} quizTop={quizResults.filter((q) => q.top === s.title).length} />}
      />
    </div>
  );
}

function CardRow({ s, index, open, onToggle, enquiries, quizTop }: { s: Service; index: number; open: boolean; onToggle: () => void; enquiries: number; quizTop: number }) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-3 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-st-panel-2 text-st-purple">
          <ActivityIcon icon={s.icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-st-ink">
            {index + 1}. {s.title}
          </span>
          <span className="block truncate text-[11.5px] text-st-dim">{s.short}</span>
        </span>
        {enquiries > 0 && <Pill>{enquiries} enquir{enquiries === 1 ? "y" : "ies"}</Pill>}
        {quizTop > 0 && <Pill tone="brand">{quizTop} quiz top</Pill>}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-st-dim transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="mt-3.5 grid gap-3.5 border-t border-st-border pt-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <TextField path={["site", "services", index, "title"]} label="Title" />
            <TextField path={["site", "services", index, "short"]} label="Short name" help="Used in small places: the wheel, the footer, the quiz plan." />
          </div>
          <AreaField path={["site", "services", index, "description"]} label="Description" rows={2} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <ListField path={["site", "services", index, "tags"]} label="Three keywords" />
            <ListField path={["site", "services", index, "needs"]} label="“What do you need?” choices" help="Shown in the Talk-to-us window for this card." />
          </div>
          <TextField path={["site", "services", index, "whatsappNumber"]} label="Send this card's enquiries to another WhatsApp number" placeholder="Optional — digits only" help="Empty = the company number." />
          <a href={`/#service-${s.slug}`} target="_blank" rel="noopener noreferrer" className="st-btn w-fit">
            See this card on the site ↗
          </a>
        </div>
      )}
    </div>
  );
}
