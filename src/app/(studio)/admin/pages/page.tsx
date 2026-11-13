"use client";

import { useState } from "react";
import type { Page } from "@/content/types";
import type { Path } from "@/lib/path";
import { checkpoint, setDraft } from "@/lib/store";
import { AreaField, CheckField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft } from "@/studio/state";
import { Box, Button, Row, confirmDestroy, useToast } from "@/studio/ui";

const RESERVED = ["admin", "ebooks", "download", "p"];
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

function PageEditor({ p, index, onDelete }: { p: Page; index: number; onDelete: () => void }) {
  const locked = ["about", "faq", "privacy"].includes(p.slug);
  return (
    <div className="grid gap-3.5">
      <Row>
        <TextField path={["pages", index, "title"]} label="Title" />
        <TextField path={["pages", index, "slug"]} label="Address" help="The page opens at /…. Small letters, numbers and dashes." mono />
      </Row>
      <TextField path={["pages", index, "eyebrow"]} label="Small label above the title" />
      <AreaField path={["pages", index, "intro"]} label="Introduction" rows={2} />
      <AreaField path={["pages", index, "body"]} label="Page content" rows={8} help="Blank line = new paragraph. **bold**, [text](https://…) links, lines starting with “- ” become a list." />
      {p.slug === "about" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <CheckField path={["pages", index, "showStats"]} label="Numbers" />
          <CheckField path={["pages", index, "showSteps"]} label="Three steps" />
          <CheckField path={["pages", index, "showValues"]} label="Value cards" />
          <CheckField path={["pages", index, "showServices"]} label="Nine cards" />
          <CheckField path={["pages", index, "showCta"]} label="Quiz/WhatsApp buttons" />
        </div>
      )}
      <Row>
        <TextField path={["pages", index, "seo", "title"]} label="Title in Google" placeholder="Empty = the page title" />
        <TextField path={["pages", index, "seo", "description"]} label="Description in Google" placeholder="Empty = the introduction" />
      </Row>
      {!locked && (
        <Button variant="danger" onClick={onDelete} className="w-fit">
          Delete this page
        </Button>
      )}
    </div>
  );
}

function PagesTab() {
  const draft = useDraft();
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  return (
    <Box title="Pages" help="About, FAQ (the introduction above the questions), Privacy, and any page you add. Link a new one from Menu & footer (Website).">
      <SortableList
        items={draft.pages}
        keyOf={(p) => p.id}
        minItems={1}
        onReorder={(next) => setDraft(["pages"] as Path, next)}
        renderItem={(p, i) => (
          <div>
            <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="flex w-full items-center justify-between text-left">
              <span className="text-[13.5px] font-medium text-st-ink">
                {p.title} <span className="font-normal text-st-dim">/{p.slug}</span>
              </span>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={`shrink-0 text-st-dim transition-transform ${open === p.id ? "rotate-180" : ""}`}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {open === p.id && (
              <div className="mt-3.5 border-t border-st-border pt-3.5">
                <PageEditor
                  p={p}
                  index={i}
                  onDelete={() => {
                    if (!confirmDestroy(`Delete "${p.title}"? This can't be undone.`)) return;
                    checkpoint();
                    setDraft(["pages"] as Path, draft.pages.filter((x) => x.id !== p.id));
                    setOpen(null);
                    toast("ok", "Deleted.");
                  }}
                />
              </div>
            )}
          </div>
        )}
      />
      <Button
        onClick={() => {
          checkpoint();
          const id = `page_${Date.now().toString(36)}`;
          const title = "New page";
          let slug = slugify(title);
          const taken = new Set([...draft.pages.map((p) => p.slug), ...RESERVED]);
          let n = 1;
          while (taken.has(slug)) slug = `${slugify(title)}-${++n}`;
          setDraft(["pages"] as Path, [...draft.pages, { id, slug, title, eyebrow: "", intro: "", body: "", showStats: false, showSteps: false, showValues: false, showServices: false, showCta: true, seo: { title: "", description: "" }, updatedAt: new Date().toISOString() }]);
          setOpen(id);
        }}
      >
        + Add a page
      </Button>
    </Box>
  );
}

function FaqRow({ index }: { index: number }) {
  return (
    <div className="grid gap-2.5">
      <TextField path={["faqs", index, "question"]} label="Question" />
      <AreaField path={["faqs", index, "answerText"]} label="Answer" rows={3} help="Blank line = new paragraph. **bold** and [links](https://…) work here too." />
      <Row>
        <TextField path={["faqs", index, "category"]} label="Group" placeholder="Optional — groups questions together" />
        <CheckField path={["faqs", index, "enabled"]} label="Show on the website" />
      </Row>
    </div>
  );
}

function FaqTab() {
  const draft = useDraft();
  return (
    <>
      <Box title="How many questions show on the homepage">
        <TextField path={["site", "faqPreview", "label"]} label="Label" />
      </Box>
      <Box title="Questions" help="Drag to reorder. Questions with the same group are shown together on the FAQ page.">
        <SortableList
          items={draft.faqs}
          keyOf={(f) => f.id}
          minItems={0}
          onReorder={(next) => setDraft(["faqs"] as Path, next)}
          onRemove={(i) => {
            checkpoint();
            setDraft(["faqs"] as Path, draft.faqs.filter((_, j) => j !== i));
          }}
          renderItem={(_f, i) => <FaqRow index={i} />}
        />
        <Button
          onClick={() => {
            checkpoint();
            setDraft(["faqs"] as Path, [...draft.faqs, { id: `faq_${Date.now().toString(36)}`, question: "New question", answerText: "Answer", category: "", enabled: true }]);
          }}
        >
          + Add a question
        </Button>
      </Box>
    </>
  );
}

export default function PagesFaqPage() {
  const [tab, setTab] = useState<"pages" | "faq">("pages");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Pages & FAQ</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        <button type="button" onClick={() => setTab("pages")} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === "pages" ? "bg-st-indigo text-white" : "text-st-sub"}`}>
          Pages
        </button>
        <button type="button" onClick={() => setTab("faq")} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === "faq" ? "bg-st-indigo text-white" : "text-st-sub"}`}>
          FAQ
        </button>
      </nav>
      {tab === "pages" && <PagesTab />}
      {tab === "faq" && <FaqTab />}
    </div>
  );
}
