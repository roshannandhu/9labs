"use client";

import { useState } from "react";
import { ENQUIRY_FIELDS, type EnquiryFieldKey } from "@/content/types";
import { buildEnquiryMessage, type EnquiryAnswers } from "@/lib/enquiry";
import { templateTokens } from "@/lib/text";
import { checkpoint, setDraft } from "@/lib/store";
import { AreaField, CheckField, ListField, NumField, SelectField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { useDraft, useField } from "@/studio/state";
import { Box, Row, Switch } from "@/studio/ui";
import type { Path } from "@/lib/path";

const FIELD_LABEL: Record<EnquiryFieldKey, string> = { needs: "What do you need? (chips)", budget: "Budget (chips)", timeline: "Timeline (chips)", company: "Company (text)", message: "Message (text)" };

const TABS = [
  ["window", "Window"],
  ["message", "Message"],
  ["whatsapp", "WhatsApp"],
] as const;
type Tab = (typeof TABS)[number][0];

function WindowTab() {
  const [fields] = useField<EnquiryFieldKey[]>(["site", "enquiry", "fields"]);
  const [required] = useField<EnquiryFieldKey[]>(["site", "enquiry", "required"]);
  const shown = fields ?? [];
  const req = required ?? [];

  const toggleShown = (key: EnquiryFieldKey, on: boolean) => {
    checkpoint();
    setDraft(["site", "enquiry", "fields"], on ? [...shown, key] : shown.filter((f) => f !== key));
    if (!on) setDraft(["site", "enquiry", "required"], req.filter((f) => f !== key));
  };
  const toggleRequired = (key: EnquiryFieldKey, on: boolean) => {
    checkpoint();
    setDraft(["site", "enquiry", "required"], on ? [...req, key] : req.filter((f) => f !== key));
  };

  return (
    <>
      <Box title="Which blocks are asked, and in what order" help="Name is always asked and always first. Drag to reorder; switch a block on to add it; tick Required to make it compulsory.">
        <SortableList
          items={shown}
          keyOf={(f) => f}
          onReorder={(next) => setDraft(["site", "enquiry", "fields"] as Path, next)}
          onRemove={(i) => toggleShown(shown[i], false)}
          renderItem={(f) => (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13.5px] font-medium text-st-ink">{FIELD_LABEL[f]}</span>
              <label className="flex items-center gap-1.5 text-[12px] text-st-sub">
                <input type="checkbox" checked={req.includes(f)} onChange={(e) => toggleRequired(f, e.target.checked)} className="h-3.5 w-3.5 accent-[var(--st-purple)]" />
                Required
              </label>
            </div>
          )}
        />
        {ENQUIRY_FIELDS.some((f) => !shown.includes(f)) && (
          <div className="mt-2 grid gap-2 border-t border-st-border pt-3.5">
            <p className="st-label">Switched off</p>
            {ENQUIRY_FIELDS.filter((f) => !shown.includes(f)).map((f) => (
              <label key={f} className="flex items-center justify-between">
                <span className="text-[13.5px] text-st-sub">{FIELD_LABEL[f]}</span>
                <Switch checked={false} onChange={(on) => toggleShown(f, on)} />
              </label>
            ))}
          </div>
        )}
      </Box>
      <Box title="Choices">
        <ListField path={["site", "enquiry", "budgets"]} label="Budget choices" />
        <ListField path={["site", "enquiry", "timelines"]} label="Timeline choices" />
      </Box>
      <Box title="Texts">
        <Row>
          <TextField path={["site", "enquiry", "title"]} label="Window title" />
          <TextField path={["site", "enquiry", "intro"]} label="Line under the title" />
        </Row>
        <Row>
          <TextField path={["site", "enquiry", "nameLabel"]} label="Name label" />
          <TextField path={["site", "enquiry", "nameError"]} label="Missing-name message" />
        </Row>
        <CheckField path={["site", "enquiry", "refCode"]} label="Add a reference code" help="A short code in the message and in the Inbox, e.g. NL-7K2Q." />
      </Box>
    </>
  );
}

function MessageTab() {
  const draft = useDraft();
  const e = draft.site.enquiry;
  const [sample, setSample] = useState<EnquiryAnswers>({ name: "Jordan Lee", company: "Lee Studio", needs: [e.budgets[0] ? "Social media strategy" : ""].filter(Boolean), budget: e.budgets[0] ?? "", timeline: e.timelines[0] ?? "", message: "Can we talk this week?" });
  const svc = draft.site.services[0];
  const preview = buildEnquiryMessage(draft.site, svc, sample, "NL-7K2Q");
  const tokens = templateTokens(e.template);

  const insertToken = (t: string) => {
    checkpoint();
    setDraft(["site", "enquiry", "template"], `${e.template}\n{${t}}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <Box title="The WhatsApp message" help="[Text in brackets] disappears automatically when the token inside it is empty.">
        <AreaField path={["site", "enquiry", "template"]} label="Template" rows={11} />
        <div className="flex flex-wrap gap-1.5">
          {(["name", "company", "service", "needs", "budget", "timeline", "message", "ref"] as const).map((t) => (
            <button key={t} type="button" onClick={() => insertToken(t)} className="rounded-full border border-st-border-strong px-2.5 py-1 text-[11.5px] text-st-sub hover:text-st-ink">
              + {`{${t}}`}
            </button>
          ))}
        </div>
        {tokens.some((t) => !["name", "company", "service", "needs", "budget", "timeline", "message", "ref"].includes(t)) && <p className="st-help">Unknown tokens are left blank: {tokens.filter((t) => !["name", "company", "service", "needs", "budget", "timeline", "message", "ref"].includes(t)).join(", ")}</p>}
      </Box>
      <Box title="Preview" help="Try it with sample answers.">
        <div className="grid gap-2">
          <input className="st-field" value={sample.name} onChange={(ev) => setSample((s) => ({ ...s, name: ev.target.value }))} placeholder="Name" />
          <input className="st-field" value={sample.company} onChange={(ev) => setSample((s) => ({ ...s, company: ev.target.value }))} placeholder="Company" />
          <input className="st-field" value={sample.message} onChange={(ev) => setSample((s) => ({ ...s, message: ev.target.value }))} placeholder="Message" />
        </div>
        <div className="rounded-2xl p-3" style={{ background: "#dcf3d6" }}>
          <pre className="whitespace-pre-wrap rounded-xl bg-white p-3 font-sans text-[13px] leading-relaxed text-[#111b21] shadow-sm">{preview}</pre>
        </div>
      </Box>
    </div>
  );
}

function WhatsAppTab() {
  const draft = useDraft();
  return (
    <>
      <Box title="Sending">
        <TextField path={["site", "enquiry", "whatsappCta"]} label="WhatsApp button text" />
        <Row>
          <CheckField path={["site", "enquiry", "emailEnabled"]} label="Offer “e-mail instead”" />
          <TextField path={["site", "enquiry", "emailCta"]} label="E-mail link text" />
        </Row>
        <TextField path={["site", "enquiry", "emailSubject"]} label="E-mail subject" help="{service} is replaced." />
      </Box>
      <Box title="After sending">
        <SelectField path={["site", "enquiry", "redirect", "mode"]} label="What happens" options={[{ value: "direct", label: "Straight to WhatsApp" }, { value: "thanks", label: "Thank-you screen first" }]} />
        {draft.site.enquiry.redirect.mode === "thanks" && <NumField path={["site", "enquiry", "redirect", "seconds"]} label="Seconds before it opens" min={1} max={10} />}
        <CheckField path={["site", "enquiry", "redirect", "newTab"]} label="Open in a new tab" />
        <Row>
          <TextField path={["site", "enquiry", "thanksTitle"]} label="Thank-you title" help="{name} becomes their first name." />
          <TextField path={["site", "enquiry", "again"]} label="“Open WhatsApp again” button" />
        </Row>
        <AreaField path={["site", "enquiry", "thanksText"]} label="Thank-you text" rows={2} />
      </Box>
      <Box title="Numbers" help="Each card can send its enquiries to its own number instead — edit that on the card itself (The 9 cards).">
        <TextField path={["site", "contact", "whatsappNumber"]} label="Main WhatsApp number" help="Digits only with the country code." />
        <div className="grid gap-1.5">
          {draft.site.services.map((s) => (
            <div key={s.slug} className="flex items-center justify-between rounded-lg bg-st-panel-2 px-3 py-2 text-[12.5px]">
              <span className="text-st-ink">{s.title}</span>
              <span className="text-st-dim">{s.whatsappNumber || "Uses the main number"}</span>
            </div>
          ))}
        </div>
      </Box>
    </>
  );
}

export default function TalkPage() {
  const [tab, setTab] = useState<Tab>("window");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Talk to us</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === id ? "bg-st-indigo text-white" : "text-st-sub hover:text-st-ink"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "window" && <WindowTab />}
      {tab === "message" && <MessageTab />}
      {tab === "whatsapp" && <WhatsAppTab />}
    </div>
  );
}
