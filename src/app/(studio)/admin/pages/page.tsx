"use client";

import { useState } from "react";
import type { Page } from "@/content/types";
import type { Path } from "@/lib/path";
import { siteHref } from "@/lib/site-href";
import { checkpoint, setDraft } from "@/lib/store";
import { AreaField, CheckField, HighlightField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useFieldArray } from "@/studio/state";
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

/** The /about page's own content — a block switch above its fields, same pattern repeated. */
function AboutPageFields() {
  const { items: steps, remove: removeStep } = useFieldArray<{ title: string; text: string }>(["site", "aboutPage", "steps"]);
  const { items: commitments, remove: removeCommitment } = useFieldArray<{ text: string; enabled: boolean }>(["site", "aboutPage", "commitments"]);

  return (
    <div className="grid gap-3.5 border-t border-st-border pt-3.5">
      <p className="st-label">Mission & vision</p>
      <Row>
        <AreaField path={["site", "aboutPage", "mission"]} label="Our mission" rows={2} />
        <AreaField path={["site", "aboutPage", "vision"]} label="Our vision" rows={2} />
      </Row>

      <p className="st-label mt-1">What we do</p>
      <TextField path={["site", "aboutPage", "servicesLink"]} label="Link text under the nine tiles" placeholder="See all services" help="The nine cards themselves are edited in The 9 cards." />

      <p className="st-label mt-1">How we work — the steps</p>
      <TextField path={["site", "aboutPage", "stepsLabel"]} label="Small label above the heading" />
      <HighlightField headingPath={["site", "aboutPage", "stepsHeading"]} accentPath={["site", "aboutPage", "stepsAccent"]} label="Heading" />
      <AreaField path={["site", "aboutPage", "stepsIntro"]} label="Intro line" rows={2} />
      <SortableList
        items={steps}
        keyOf={(s, i) => `${s.title}-${i}`}
        minItems={1}
        onReorder={(next) => setDraft(["site", "aboutPage", "steps"] as Path, next)}
        onRemove={(i) => removeStep(i)}
        renderItem={(_s, i) => (
          <div className="grid gap-2">
            <TextField path={["site", "aboutPage", "steps", i, "title"]} label={`Step ${i + 1}`} />
            <AreaField path={["site", "aboutPage", "steps", i, "text"]} label="Text" rows={2} />
          </div>
        )}
      />
      <Button
        onClick={() => {
          checkpoint();
          setDraft(["site", "aboutPage", "steps"] as Path, [...steps, { title: "New step", text: "" }]);
        }}
        className="w-fit"
      >
        + Add a step
      </Button>

      <p className="st-label mt-1">Our commitments</p>
      <SortableList
        items={commitments}
        keyOf={(_c, i) => `commitment-${i}`}
        minItems={0}
        onReorder={(next) => setDraft(["site", "aboutPage", "commitments"] as Path, next)}
        onRemove={(i) => removeCommitment(i)}
        renderItem={(_c, i) => (
          <div className="grid gap-2">
            <AreaField path={["site", "aboutPage", "commitments", i, "text"]} label={`Commitment ${i + 1}`} rows={2} />
            <CheckField path={["site", "aboutPage", "commitments", i, "enabled"]} label="Show on the website" />
          </div>
        )}
      />
      <Button
        onClick={() => {
          checkpoint();
          setDraft(["site", "aboutPage", "commitments"] as Path, [...commitments, { text: "New commitment", enabled: true }]);
        }}
        className="w-fit"
      >
        + Add a commitment
      </Button>

      <p className="st-label mt-1">Where to find us</p>
      <TextField path={["site", "aboutPage", "findUsHeading"]} label="Heading" />
      <p className="st-help">Location, e-mail, phone/WhatsApp and social links come from Website → Company. Value cards are shared with the homepage: Website → Values.</p>
    </div>
  );
}

function PageEditor({ p, index, onDelete }: { p: Page; index: number; onDelete: () => void }) {
  const locked = ["about", "faq", "privacy"].includes(p.slug);
  return (
    <div className="grid gap-3.5">
      <Row>
        <TextField path={["pages", index, "title"]} label="Title" />
        <TextField path={["pages", index, "slug"]} label="Address" help={locked ? "Fixed — the menu, footer and links depend on it." : "The page opens at /…. Small letters, numbers and dashes."} mono disabled={locked} />
      </Row>
      <TextField path={["pages", index, "eyebrow"]} label="Small label above the title" />
      <AreaField path={["pages", index, "intro"]} label="Introduction" rows={2} />
      <AreaField path={["pages", index, "body"]} label="Page content" rows={p.slug === "about" ? 3 : 8} help="Blank line = new paragraph. **bold**, [text](https://…) links, lines starting with “- ” become a list. Shown right under the introduction." />
      {p.slug === "about" ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CheckField path={["pages", index, "showStats"]} label="Numbers" />
            <CheckField path={["pages", index, "showMission"]} label="Mission & vision" />
            <CheckField path={["pages", index, "showServices"]} label="What we do" />
            <CheckField path={["pages", index, "showSteps"]} label="Five steps" />
            <CheckField path={["pages", index, "showValues"]} label="Value cards" />
            <CheckField path={["pages", index, "showCommitments"]} label="Commitments" />
            <CheckField path={["pages", index, "showContact"]} label="Where to find us" />
            <CheckField path={["pages", index, "showCta"]} label="Quiz/WhatsApp buttons" />
          </div>
          <AboutPageFields />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <CheckField path={["pages", index, "showStats"]} label="Numbers" />
          <CheckField path={["pages", index, "showSteps"]} label="Steps (how we work)" help="The same steps as the About page." />
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

function FaqRow({ index, id }: { index: number; id: string }) {
  const toast = useToast();
  return (
    <div className="grid gap-2.5">
      <TextField path={["faqs", index, "question"]} label="Question" />
      <AreaField path={["faqs", index, "answerText"]} label="Answer" rows={3} help="Blank line = new paragraph. **bold** and [links](https://…) work here too." />
      <TextField path={["faqs", index, "category"]} label="Group" placeholder="Optional — groups questions together" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <CheckField path={["faqs", index, "enabled"]} label="Show on the website" />
        <CheckField path={["faqs", index, "home"]} label="Show on the homepage" />
        <Button
          className="ml-auto"
          onClick={async () => {
            const url = `${window.location.origin}${siteHref("/faq/")}#${id}`;
            try {
              await navigator.clipboard.writeText(url);
              toast("ok", "Link copied.");
            } catch {
              toast("bad", "Couldn't copy — your browser blocked it.");
            }
          }}
        >
          Copy link
        </Button>
      </div>
    </div>
  );
}

function FaqTab() {
  const draft = useDraft();
  return (
    <>
      <Box title="Homepage preview" help="The questions marked “Show on the homepage” below appear here, in that order.">
        <Row>
          <TextField path={["site", "faqPreview", "label"]} label="Small label" />
          <TextField path={["site", "faqPreview", "cta"]} label="Link text" placeholder="See all FAQs" />
        </Row>
        <HighlightField headingPath={["site", "faqPreview", "heading"]} accentPath={["site", "faqPreview", "accent"]} label="Heading" />
      </Box>
      <Box title="Questions" help="Drag to reorder. Questions with the same group are shown together on the FAQ page, with a menu to jump between groups.">
        <SortableList
          items={draft.faqs}
          keyOf={(f) => f.id}
          minItems={0}
          onReorder={(next) => setDraft(["faqs"] as Path, next)}
          onRemove={(i) => {
            checkpoint();
            setDraft(["faqs"] as Path, draft.faqs.filter((_, j) => j !== i));
          }}
          renderItem={(f, i) => <FaqRow index={i} id={f.id} />}
        />
        <Button
          onClick={() => {
            checkpoint();
            setDraft(["faqs"] as Path, [...draft.faqs, { id: `faq_${Date.now().toString(36)}`, question: "New question", answerText: "Answer", category: "", enabled: true, home: false }]);
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
