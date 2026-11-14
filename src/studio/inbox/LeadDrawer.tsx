"use client";

import { waLink } from "@/content/site";
import { removeLead } from "@/lib/store";
import { Icon } from "../Icon";
import type { LeadKind } from "../leads";
import { KIND_LABEL } from "../leads";
import { useBookRequests, useDraft, useEnquiries, useOutbox, useQuizResults } from "../state";
import { Badge, Button, Drawer, relativeTime, useConfirm, useToast } from "../ui";

const exactTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-")} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast("ok", `${label} copied.`);
        } catch {
          toast("bad", "Couldn't copy — your browser blocked it.");
        }
      }}
      className="shrink-0 text-st-dim hover:text-st-ink"
    >
      <Icon name="copy" size={13} />
    </button>
  );
}

function Field({ label, children }: { label: string; children?: React.ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div>
      <p className="st-micro">{label}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-st-ink">{children}</p>
    </div>
  );
}

function Header({ title, badge, time, ref: refCode }: { title: string; badge: React.ReactNode; time: string; ref?: string }) {
  const toast = useToast();
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate font-display text-[17px] font-semibold text-st-ink">{title}</h2>
        {badge}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[12px] text-st-dim">
        <span className="st-num">{time}</span>
        {refCode && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(refCode);
                toast("ok", "Reference copied.");
              } catch {
                toast("bad", "Couldn't copy.");
              }
            }}
            className="st-num flex items-center gap-1 rounded-full bg-st-panel-2 px-2 py-0.5 text-st-sub hover:text-st-ink"
          >
            {refCode} <Icon name="copy" size={10} />
          </button>
        )}
      </div>
    </div>
  );
}

function DeleteFooter({ onDelete }: { onDelete: () => void }) {
  const confirm = useConfirm();
  return (
    <Button
      variant="danger"
      onClick={async () => {
        const ok = await confirm({ title: "Delete this lead?", body: "This can't be undone.", confirmLabel: "Delete", danger: true });
        if (ok) onDelete();
      }}
    >
      <Icon name="trash" size={14} /> Delete
    </Button>
  );
}

function EnquiryBody({ id, onClose }: { id: string; onClose: () => void }) {
  const enquiries = useEnquiries();
  const draft = useDraft();
  const toast = useToast();
  const e = enquiries.find((x) => x.id === id);
  if (!e) return null;
  const svc = draft.site.services.find((s) => s.slug === e.service);

  return (
    <div className="grid gap-5">
      <Header title={e.name} badge={<Badge tone="enquiry">Service enquiry</Badge>} time={exactTime(e.createdAt)} ref={e.ref || undefined} />

      {e.channel === "whatsapp" ? (
        <div className="rounded-xl border border-st-border bg-st-panel-2 p-3.5 text-[13px] text-st-sub">
          This person messaged you on WhatsApp.
          {e.ref ? (
            <>
              {" "}
              Search <strong className="st-num text-st-ink">{e.ref}</strong> in WhatsApp to find the chat.
            </>
          ) : (
            " Check your WhatsApp for their message."
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-st-border bg-st-panel-2 p-3.5 text-[13px] text-st-sub">
          This person e-mailed <strong className="text-st-ink">{draft.site.contact.email || "your inbox"}</strong>, subject “Enquiry: {e.serviceTitle}”.
        </div>
      )}

      <div className="grid gap-3.5">
        <Field label="Company">{e.company}</Field>
        <Field label="Service">
          <span className="flex items-center gap-1.5">
            {svc && <Icon name="building" size={13} />}
            {e.serviceTitle}
          </span>
        </Field>
        <Field label="What they need">{e.needs.length > 0 && e.needs.join(", ")}</Field>
        <Field label="Budget">{e.budget}</Field>
        <Field label="Timeline">{e.timeline}</Field>
        <Field label="Message">{e.message}</Field>
      </div>

      <DeleteFooter
        onDelete={() => {
          removeLead("enquiry", e.id);
          toast("ok", "Deleted.");
          onClose();
        }}
      />
    </div>
  );
}

function BookBody({ id, onClose }: { id: string; onClose: () => void }) {
  const bookRequests = useBookRequests();
  const draft = useDraft();
  const outbox = useOutbox();
  const toast = useToast();
  const r = bookRequests.find((x) => x.id === id);
  if (!r) return null;
  const book = draft.site.ebooks.find((b) => b.slug === r.bookSlug);
  const mail = outbox.filter((m) => m.kind === "ebook" && m.to.toLowerCase() === r.email.toLowerCase()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const digits = r.phone.replace(/\D/g, "");
  const firstName = r.name.trim().split(/\s+/)[0] || "there";
  const waMessage = `Hi ${firstName}, this is ${draft.site.shortName} about your request for "${book?.title ?? r.bookSlug}".`;

  const statusBadge = r.status === "sent" ? <Badge tone="good" icon={<Icon name="check" size={11} />}>Sent</Badge> : r.status === "failed" ? <Badge tone="danger" icon={<Icon name="alert" size={11} />}>Failed</Badge> : r.status === "rejected" ? <Badge tone="default">Rejected</Badge> : <Badge tone="warn" icon={<Icon name="clock" size={11} />}>Waiting</Badge>;

  return (
    <div className="grid gap-5">
      <Header title={r.name} badge={<Badge tone="ebook">E-book request</Badge>} time={exactTime(r.createdAt)} />

      <div className="grid gap-2 sm:grid-cols-2">
        {digits && (
          <a href={waLink(digits, waMessage)} target="_blank" rel="noopener noreferrer" className="st-btn st-btn-primary">
            <Icon name="whatsapp" size={14} /> WhatsApp
          </a>
        )}
        <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your e-book: ${book?.title ?? r.bookSlug}`)}`} className="st-btn">
          <Icon name="mail" size={14} /> E-mail
        </a>
      </div>

      <div className="grid gap-3.5">
        <Field label="E-mail">
          <span className="flex items-center gap-1.5">
            {r.email} <CopyButton value={r.email} label="E-mail" />
          </span>
        </Field>
        <Field label="Phone">
          {r.phone && (
            <span className="flex items-center gap-1.5">
              {r.phone} <CopyButton value={r.phone} label="Phone" />
            </span>
          )}
        </Field>
        <Field label="Company">{r.company}</Field>
        <Field label="Book">{book?.title ?? r.bookSlug}</Field>
        <Field label="Came from">{r.source}</Field>
      </div>

      <div className="st-card bg-st-panel-2 p-3.5">
        <p className="st-micro mb-2.5">Delivery</p>
        <ol className="grid gap-2 text-[13px]">
          <li className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-st-purple" /> Requested · {relativeTime(r.createdAt)}
          </li>
          <li className="flex items-center gap-2">
            {statusBadge}
            {r.sentAt && <span className="text-st-dim">{relativeTime(r.sentAt)}</span>}
          </li>
          <li className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${r.downloads ? "bg-st-purple" : "bg-st-border-strong"}`} /> {r.downloads} download{r.downloads === 1 ? "" : "s"}
          </li>
        </ol>
        {r.error && <p className="mt-2.5 text-[12.5px] text-st-danger">{r.error}</p>}
      </div>

      {mail && (
        <div>
          <p className="st-micro mb-1.5">The e-mail they received</p>
          <div className="overflow-hidden rounded-xl border border-st-border">
            <iframe title="E-mail preview" srcDoc={mail.html} className="h-[280px] w-full bg-white" />
          </div>
        </div>
      )}

      <DeleteFooter
        onDelete={() => {
          removeLead("book", r.id);
          toast("ok", "Deleted.");
          onClose();
        }}
      />
    </div>
  );
}

function QuizBody({ id, onClose }: { id: string; onClose: () => void }) {
  const quizResults = useQuizResults();
  const toast = useToast();
  const r = quizResults.find((x) => x.id === id);
  if (!r) return null;
  const matches = r.matches.split("·").map((m) => m.trim()).filter(Boolean);
  const actionLabel = r.action === "whatsapp" ? "Opened WhatsApp" : r.action === "email" ? `Asked for the plan by e-mail (${r.email})` : "Only looked at the result";

  return (
    <div className="grid gap-5">
      <Header title={r.top || "Quiz result"} badge={<Badge tone="quiz">Quiz result</Badge>} time={exactTime(r.createdAt)} ref={r.ref || undefined} />

      {r.email && (
        <a href={`mailto:${r.email}?subject=${encodeURIComponent("Your 9 Quiz plan")}`} className="st-btn st-btn-primary w-fit">
          <Icon name="mail" size={14} /> E-mail {r.email}
        </a>
      )}

      <div>
        <p className="st-micro mb-2">Matches</p>
        <div className="grid gap-2">
          {matches.map((m, i) => {
            const [label, pctStr] = m.split(/\s+(?=\d+%$)/);
            const pct = parseInt(pctStr ?? "0", 10) || 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-st-ink">{label}</span>
                  <span className="st-num text-st-dim">{pct}%</span>
                </div>
                <span className="mt-1 block h-[6px] overflow-hidden rounded-full bg-st-panel-2">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: "var(--st-series-quiz)" }} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Field label="What they did next">{actionLabel}</Field>

      <div>
        <p className="st-micro mb-1.5">Answers</p>
        <pre className="whitespace-pre-wrap rounded-xl bg-st-panel-2 p-3.5 font-sans text-[13px] leading-relaxed text-st-ink">{r.summary}</pre>
      </div>

      <DeleteFooter
        onDelete={() => {
          removeLead("quiz", r.id);
          toast("ok", "Deleted.");
          onClose();
        }}
      />
    </div>
  );
}

/** The right-hand (or bottom-sheet) detail panel for any lead kind — looked up live from the store by id. */
export function LeadDrawer({ kind, id, onClose }: { kind: LeadKind | null; id: string | null; onClose: () => void }) {
  const open = !!kind && !!id;
  return (
    <Drawer open={open} onClose={onClose} title={kind ? KIND_LABEL[kind] : ""}>
      {kind === "enquiry" && id && <EnquiryBody id={id} onClose={onClose} />}
      {kind === "book" && id && <BookBody id={id} onClose={onClose} />}
      {kind === "quiz" && id && <QuizBody id={id} onClose={onClose} />}
    </Drawer>
  );
}
