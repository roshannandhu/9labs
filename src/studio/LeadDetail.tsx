"use client";

import Link from "next/link";
import { useState } from "react";
import type { BookRequest, Enquiry, FollowUp, QuizResult } from "@/content/types";
import { buildEnquiryMessage } from "@/lib/enquiry";
import { deliverBookRequest } from "@/lib/ebooks/deliver";
import { removeLead, setFollowUp, updateBookRequest, updateEnquiry, updateQuizResult } from "@/lib/store";
import { relativeTime } from "@/studio/ui";
import { STATUS_LABEL } from "./leads";
import { useDraft, useOutbox } from "./state";
import { Button, Pill, confirmDestroy, useToast } from "./ui";

const STATUSES: FollowUp[] = ["new", "contacted", "won", "lost"];

function StatusPicker({ value, onChange }: { value: FollowUp; onChange: (v: FollowUp) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${value === s ? "border-transparent bg-st-indigo text-white" : "border-st-border-strong text-st-sub hover:text-st-ink"}`}>
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <label className="block">
      <span className="st-label">Private notes</span>
      <textarea className="st-field mt-1.5 resize-y" rows={3} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onChange(v)} placeholder="Only visible here…" />
    </label>
  );
}

export function EnquiryDetail({ e, onClose }: { e: Enquiry; onClose: () => void }) {
  const draft = useDraft();
  const svc = draft.site.services.find((s) => s.slug === e.service);
  const message = buildEnquiryMessage(draft.site, { title: e.serviceTitle }, { name: e.name, company: e.company, needs: e.needs, budget: e.budget, timeline: e.timeline, message: e.message }, e.ref);
  const number = svc?.whatsappNumber || draft.site.contact.whatsappNumber;
  const toast = useToast();
  return (
    <div className="grid gap-5">
      <div>
        <p className="font-display text-[18px] font-semibold text-st-ink">{e.name}</p>
        <p className="st-help">
          {e.company && `${e.company} · `}
          {e.serviceTitle} · {relativeTime(e.createdAt)}
        </p>
      </div>
      <StatusPicker value={e.status} onChange={(v) => setFollowUp("enquiry", e.id, v)} />
      <div className="grid gap-1.5 text-[13.5px]">
        {e.needs.length > 0 && (
          <p>
            <span className="text-st-sub">What they need: </span>
            {e.needs.join(", ")}
          </p>
        )}
        {e.budget && (
          <p>
            <span className="text-st-sub">Budget: </span>
            {e.budget}
          </p>
        )}
        {e.timeline && (
          <p>
            <span className="text-st-sub">Timeline: </span>
            {e.timeline}
          </p>
        )}
        {e.message && (
          <p>
            <span className="text-st-sub">Message: </span>
            {e.message}
          </p>
        )}
      </div>
      <div>
        <span className="st-label">The exact message sent</span>
        <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-st-panel-2 p-3 font-sans text-[13px] leading-relaxed text-st-ink">{message}</pre>
        <a href={`https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-primary mt-2">
          Open in WhatsApp
        </a>
      </div>
      <NotesField value={e.notes} onChange={(v) => updateEnquiry(e.id, { notes: v })} />
      <Button
        variant="danger"
        onClick={() => {
          if (!confirmDestroy("Delete this enquiry? This can't be undone.")) return;
          removeLead("enquiry", e.id);
          toast("ok", "Deleted.");
          onClose();
        }}
      >
        Delete
      </Button>
    </div>
  );
}

export function BookRequestDetail({ r, onClose }: { r: BookRequest; onClose: () => void }) {
  const draft = useDraft();
  const outbox = useOutbox();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const book = draft.site.ebooks.find((b) => b.slug === r.bookSlug);
  const mail = outbox.filter((m) => m.kind === "ebook" && m.to.toLowerCase() === r.email.toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const act = async (action: "send" | "reject") => {
    setBusy(true);
    if (action === "reject") {
      updateBookRequest(r.id, { status: "rejected", error: "" });
      toast("ok", "Rejected. Nothing was sent.");
    } else {
      const res = await deliverBookRequest(r.id);
      toast(res.ok ? "ok" : "bad", res.ok ? `Sent. ${res.used}.` : res.error);
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-5">
      <div>
        <p className="font-display text-[18px] font-semibold text-st-ink">{r.name}</p>
        <p className="st-help">
          {r.email} {r.phone && `· ${r.phone}`} {r.company && `· ${r.company}`}
        </p>
      </div>

      <div>
        <span className="st-label">Book</span>
        <p className="mt-1 text-[14px] text-st-ink">{book?.title ?? r.bookSlug}</p>
      </div>

      <div className="st-card bg-st-panel-2 p-3.5">
        <ol className="grid gap-2 text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-st-indigo" /> Requested · {relativeTime(r.createdAt)}
          </li>
          <li className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${r.sentAt ? "bg-st-indigo" : "bg-st-border-strong"}`} /> {r.sentAt ? `Sent (${r.deliveryUsed}) · ${relativeTime(r.sentAt)}` : "Not sent yet"}
          </li>
          <li className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${r.downloads ? "bg-st-indigo" : "bg-st-border-strong"}`} /> {r.downloads} download{r.downloads === 1 ? "" : "s"}
          </li>
          {r.expiresAt && (
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-st-border-strong" /> Link expires {new Date(r.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </li>
          )}
        </ol>
      </div>

      {r.error && <p className="rounded-xl border border-st-danger/30 bg-st-danger-bg p-3 text-[13px] text-st-danger">{r.error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={busy} onClick={() => act("send")}>
          {busy ? "Working…" : r.status === "sent" ? "Send again" : "Approve & send"}
        </Button>
        {r.status !== "sent" && r.status !== "rejected" && (
          <Button disabled={busy} onClick={() => act("reject")}>
            Reject
          </Button>
        )}
        {mail && (
          <a href="#" onClick={(e) => e.preventDefault()} className="st-btn" title={mail.subject}>
            <Pill tone="default">E-mail sent</Pill>
          </a>
        )}
      </div>

      {mail && (
        <div>
          <span className="st-label">The e-mail they received</span>
          <div className="mt-1.5 overflow-hidden rounded-xl border border-st-border">
            <iframe title="E-mail preview" srcDoc={mail.html} className="h-[320px] w-full bg-white" />
          </div>
        </div>
      )}

      <NotesField value={r.notes} onChange={(v) => updateBookRequest(r.id, { notes: v })} />
      <Button
        variant="danger"
        onClick={() => {
          if (!confirmDestroy("Delete this request? This can't be undone.")) return;
          removeLead("book", r.id);
          toast("ok", "Deleted.");
          onClose();
        }}
      >
        Delete
      </Button>
    </div>
  );
}

export function QuizResultDetail({ r }: { r: QuizResult }) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="font-display text-[18px] font-semibold text-st-ink">{r.top}</p>
        <p className="st-help">
          {r.matches} · {relativeTime(r.createdAt)}
        </p>
      </div>
      <StatusPicker value={r.status} onChange={(v) => setFollowUp("quiz", r.id, v)} />
      <div>
        <span className="st-label">What they did next</span>
        <p className="mt-1 text-[13.5px] text-st-ink">{r.action === "whatsapp" ? "Opened WhatsApp" : r.action === "email" ? `Asked for the plan by e-mail (${r.email})` : "Only looked at the result"}</p>
      </div>
      <div>
        <span className="st-label">Answers</span>
        <pre className="mt-1.5 whitespace-pre-wrap rounded-xl bg-st-panel-2 p-3 font-sans text-[13px] leading-relaxed text-st-ink">{r.summary}</pre>
      </div>
      <Link href="/admin/quiz" className="st-btn w-fit">
        Open Quiz Lab
      </Link>
      <NotesField value={r.notes} onChange={(v) => updateQuizResult(r.id, { notes: v })} />
    </div>
  );
}
