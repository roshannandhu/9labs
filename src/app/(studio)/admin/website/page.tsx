"use client";

import { useState } from "react";
import type { SectionKey } from "@/content/types";
import { AreaField, HighlightField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useField, useFieldArray } from "@/studio/state";
import { Box, Button, Row, Switch } from "@/studio/ui";
import { checkpoint, setDraft } from "@/lib/store";
import type { Path } from "@/lib/path";

const SECTION_NAMES: Record<SectionKey, string> = { services: "Services (the 9 cards)", about: "About and values", quiz: "The 9 Quiz", ebooks: "Free e-books", faq: "FAQ preview", contact: "Contact" };
const ALL_SECTIONS: SectionKey[] = ["services", "about", "quiz", "ebooks", "faq", "contact"];

const TABS = [
  ["sections", "Sections"],
  ["cover", "Cover"],
  ["about", "About text"],
  ["values", "Values"],
  ["company", "Company"],
  ["menu", "Menu & footer"],
] as const;
type Tab = (typeof TABS)[number][0];

function SectionsTab() {
  const [sections] = useField<SectionKey[]>(["site", "sections"]);
  const shown = sections ?? [];
  const toggle = (key: SectionKey, on: boolean) => {
    checkpoint();
    setDraft(["site", "sections"], on ? [...shown, key] : shown.filter((s) => s !== key));
  };
  return (
    <Box title="Sections on the homepage" help="The cover is always first. Switch a section on to add it to the bottom of the list, then drag it where you want.">
      <SortableList
        items={shown}
        keyOf={(s) => s}
        onReorder={(next) => setDraft(["site", "sections"], next)}
        onRemove={(i) => toggle(shown[i], false)}
        renderItem={(s) => <span className="text-[13.5px] font-medium text-st-ink">{SECTION_NAMES[s]}</span>}
      />
      {ALL_SECTIONS.some((s) => !shown.includes(s)) && (
        <div className="mt-2 grid gap-2 border-t border-st-border pt-3.5">
          <p className="st-label">Switched off</p>
          {ALL_SECTIONS.filter((s) => !shown.includes(s)).map((s) => (
            <label key={s} className="flex items-center justify-between">
              <span className="text-[13.5px] text-st-sub">{SECTION_NAMES[s]}</span>
              <Switch checked={false} onChange={(on) => toggle(s, on)} />
            </label>
          ))}
        </div>
      )}
    </Box>
  );
}

function CoverTab() {
  return (
    <>
      <Box title="Cover (hero)">
        <Row>
          <TextField path={["site", "hero", "eyebrow"]} label="Small line above the headline" />
          <TextField path={["site", "hero", "eyebrowExtra"]} label="…extra part (hidden on phones)" />
        </Row>
        <HighlightField headingPath={["site", "hero", "headline"]} accentPath={["site", "hero", "headlineAccent"]} label="Headline" />
        <AreaField path={["site", "hero", "sub"]} label="Text under the headline" rows={3} />
        <TextField path={["site", "hero", "caption"]} label="Small line under the big 9" />
        <Row>
          <TextField path={["site", "hero", "primary", "label"]} label="Main button text" />
          <TextField path={["site", "hero", "secondary", "label"]} label="Second button text" />
        </Row>
      </Box>
      <Box title="Services section text">
        <TextField path={["site", "servicesSection", "label"]} label="Section label" />
        <HighlightField headingPath={["site", "servicesSection", "heading"]} accentPath={["site", "servicesSection", "accent"]} label="Heading" />
        <AreaField path={["site", "servicesSection", "intro"]} label="Introduction" rows={2} />
        <TextField path={["site", "servicesSection", "cardCta"]} label="Button on every card" />
      </Box>
      <Box title="Contact section text">
        <TextField path={["site", "closing", "label"]} label="Section label" />
        <HighlightField headingPath={["site", "closing", "heading"]} accentPath={["site", "closing", "accent"]} label="Heading" />
        <AreaField path={["site", "closing", "text"]} label="Text" rows={2} />
        <TextField path={["site", "closing", "loop"]} label="Text flowing along the arc" help="Repeats — end it with a separator such as ✦." />
      </Box>
    </>
  );
}

function AboutTextTab() {
  return (
    <Box title="About">
      <TextField path={["site", "about", "label"]} label="Section label" />
      <AreaField path={["site", "about", "statement"]} label="Big statement" rows={2} />
      <AreaField path={["site", "about", "body"]} label="About text" rows={4} />
      <AreaField path={["site", "about", "philosophy"]} label="Quote" rows={2} />
      <Row>
        {[0, 1, 2].map((i) => (
          <TextField key={i} path={["site", "about", "stats", i, "label"]} label={`Number ${i + 1} label`} />
        ))}
      </Row>
      <TextField path={["site", "about", "more"]} label="Read more link" placeholder="Read more about us" help="Opens the full About page (Pages & FAQ). Empty = no link." />
    </Box>
  );
}

function ValuesTab() {
  const { items, remove } = useFieldArray<{ key: string; title: string; line: string }>(["site", "values"]);
  return (
    <Box title="Values" help="The value cards in the About section.">
      <SortableList
        items={items}
        keyOf={(v, i) => `${v.key}-${i}`}
        onReorder={(next) => setDraft(["site", "values"] as Path, next)}
        onRemove={(i) => remove(i)}
        minItems={1}
        renderItem={(_v, i) => (
          <div className="grid gap-2.5">
            <TextField path={["site", "values", i, "title"]} label="Title" />
            <AreaField path={["site", "values", i, "line"]} label="Text" rows={2} />
          </div>
        )}
      />
      <Button onClick={() => { checkpoint(); setDraft(["site", "values"] as Path, [...items, { key: "partnership", title: "New value", line: "" }]); }}>+ Add a value</Button>
    </Box>
  );
}

function CompanyTab() {
  const { items: socials } = useFieldArray<{ key: string; label: string; href: string }>(["site", "socials"]);
  return (
    <>
      <Box title="Company details">
        <Row>
          <TextField path={["site", "name"]} label="Company name" />
          <TextField path={["site", "shortName"]} label="Short name" />
        </Row>
        <TextField path={["site", "tagline"]} label="One-line description (footer)" />
        <Row>
          <TextField path={["site", "location"]} label="Location" />
          <TextField path={["site", "mapUrl"]} label="Map link" />
        </Row>
        <Row>
          <TextField path={["site", "contact", "email"]} label="E-mail" />
          <TextField path={["site", "contact", "phone"]} label="Phone (as shown)" />
        </Row>
      </Box>
      <Box title="WhatsApp">
        <TextField path={["site", "contact", "whatsappNumber"]} label="WhatsApp number" help="Digits only, with the country code, e.g. 971501234567. Every WhatsApp button uses this." />
        <AreaField path={["site", "contact", "whatsappText"]} label="Message already typed for the visitor" rows={2} />
        <Row>
          <TextField path={["site", "contact", "fabLabel"]} label="Floating button text" />
          <TextField path={["site", "contact", "chatLabel"]} label="“Chat on WhatsApp” text" />
        </Row>
      </Box>
      <Box title="Social links" help="A link shows on the site only when it's switched on and has an address starting with https://.">
        {socials.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="w-[90px] shrink-0 text-[12.5px] font-medium capitalize text-st-sub">{s.label}</span>
            <div className="flex-1">
              <TextField path={["site", "socials", i, "href"]} label="" placeholder="https://…" />
            </div>
            <SwitchField path={["site", "socials", i, "enabled"]} />
          </div>
        ))}
      </Box>
    </>
  );
}

function SwitchField({ path }: { path: Path }) {
  const [v, setV] = useField<boolean>(path);
  return <Switch checked={!!v} onChange={(x) => { checkpoint(); setV(x); }} />;
}

function MenuFooterTab() {
  const { items: nav } = useFieldArray<{ label: string; href: string }>(["site", "nav"]);
  const { items: links, add, remove } = useFieldArray<{ label: string; href: string }>(["site", "footer", "links"]);
  return (
    <>
      <Box title="Menu links">
        {nav.map((n, i) => (
          <Row key={i}>
            <TextField path={["site", "nav", i, "label"]} label="Text" />
            <TextField path={["site", "nav", i, "href"]} label="Goes to (#section or /page)" />
          </Row>
        ))}
      </Box>
      <Box title="Highlighted menu button">
        <TextField path={["site", "navCta", "label"]} label="Text" />
      </Box>
      <Box title="Footer">
        <TextField path={["site", "footer", "copyright"]} label="Copyright line" />
        <Row>
          <TextField path={["site", "footer", "navTitle"]} label="Menu column title" />
          <TextField path={["site", "footer", "activitiesTitle"]} label="Activities column title" />
          <TextField path={["site", "footer", "contactTitle"]} label="Contact column title" />
          <TextField path={["site", "footer", "pagesTitle"]} label="Pages column title" />
        </Row>
        <p className="st-label">Page links</p>
        <SortableList
          items={links}
          keyOf={(l, i) => `${l.href}-${i}`}
          onReorder={(next) => setDraft(["site", "footer", "links"] as Path, next)}
          onRemove={(i) => remove(i)}
          renderItem={(_l, i) => (
            <Row>
              <TextField path={["site", "footer", "links", i, "label"]} label="Text" />
              <TextField path={["site", "footer", "links", i, "href"]} label="Page or address" />
            </Row>
          )}
        />
        <Button onClick={() => add({ label: "New link", href: "/" })}>+ Add a link</Button>
      </Box>
    </>
  );
}

export default function WebsitePage() {
  const [tab, setTab] = useState<Tab>("sections");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Website</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === id ? "bg-st-indigo text-white" : "text-st-sub hover:text-st-ink"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "sections" && <SectionsTab />}
      {tab === "cover" && <CoverTab />}
      {tab === "about" && <AboutTextTab />}
      {tab === "values" && <ValuesTab />}
      {tab === "company" && <CompanyTab />}
      {tab === "menu" && <MenuFooterTab />}
    </div>
  );
}
