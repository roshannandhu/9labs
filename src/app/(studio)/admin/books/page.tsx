"use client";

import { useState } from "react";
import type { Ebook } from "@/content/site";
import { buildEbookMail, deliverBookRequest, DELIVERY_OPTIONS } from "@/lib/ebooks/deliver";
import { addOutboxMail } from "@/lib/store";
import { checkpoint, setDraft } from "@/lib/store";
import type { Path } from "@/lib/path";
import { AreaField, CheckField, ImageField, ListField, NumField, PdfField, SelectField, TextField } from "@/studio/Field";
import { SortableList } from "@/studio/Sortable";
import { BookRequestDetail } from "@/studio/LeadDetail";
import { useBookRequests, useDraft, useSession } from "@/studio/state";
import { Box, Button, Drawer, Pill, Row, relativeTime, useNow, useToast } from "@/studio/ui";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

const TABS = [
  ["shelf", "Shelf"],
  ["requests", "Requests"],
  ["sending", "Sending rules"],
  ["email", "E-mail"],
  ["form", "Request form"],
] as const;
type Tab = (typeof TABS)[number][0];

function BookEditor({ b, index }: { b: Ebook; index: number }) {
  return (
    <div className="grid gap-3.5 border-t border-st-border pt-3.5">
      <Row>
        <TextField path={["site", "ebooks", index, "title"]} label="Title" />
        <TextField path={["site", "ebooks", index, "subtitle"]} label="Subtitle" />
      </Row>
      <TextField path={["site", "ebooks", index, "slug"]} label="Link name" help="Used in the book's address: /ebooks/…. Small letters, numbers and dashes." mono />
      {!b.slug.trim() && <p className="text-[12.5px] text-st-danger">Add a link name so this book has an address — it won&apos;t be reachable on its own page without one.</p>}
      <AreaField path={["site", "ebooks", index, "oneLiner"]} label="One-line description" rows={2} />
      <Row>
        <ListField path={["site", "ebooks", index, "chapters"]} label="Chapters" help="Type one and press Enter." />
        <NumField path={["site", "ebooks", index, "pages"]} label="Pages" min={1} />
        <TextField path={["site", "ebooks", index, "readTime"]} label="Reading time" placeholder="35 min read" />
      </Row>
      <Row>
        <SelectField path={["site", "ebooks", index, "tone"]} label="Cover colour" options={[{ value: "blue", label: "Blue" }, { value: "purple", label: "Purple" }, { value: "duo", label: "Blue to purple" }]} />
        <ImageField path={["site", "ebooks", index, "cover"]} label="Cover image" help="Optional — without one a designed cover is drawn." />
      </Row>
      <PdfField idPath={["site", "ebooks", index, "pdfFileId"]} namePath={["site", "ebooks", index, "pdfName"]} sizePath={["site", "ebooks", index, "pdfSize"]} label="The e-book (PDF)" help="Required before requests for this book can be sent." />
      <Row>
        <SelectField path={["site", "ebooks", index, "approvalMode"]} label="When is this book sent?" options={[{ value: "inherit", label: "Use the general setting" }, { value: "manual", label: "After I approve" }, { value: "auto", label: "Automatically" }]} />
        <SelectField path={["site", "ebooks", index, "deliveryMode"]} label="How is it sent?" options={[{ value: "inherit", label: "Use the general setting" }, ...DELIVERY_OPTIONS]} />
      </Row>
      <div className="flex gap-4 text-[12px] text-st-dim">
        <span>{b.requests} requests</span>
        <span>{b.sent} sent</span>
        <span>{b.downloads} downloads</span>
      </div>
    </div>
  );
}

function ShelfTab() {
  const draft = useDraft();
  const books = draft.site.ebooks;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Box title="Books on the shelf" help="Drag to set the order on the site. Switch a book off to hide it without deleting it.">
      <SortableList
        items={books}
        keyOf={(b) => b.id}
        minItems={0}
        onReorder={(next) => setDraft(["site", "ebooks"] as Path, next)}
        renderItem={(b, i) => (
          <div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setOpen(open === b.id ? null : b.id)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[13.5px] font-semibold text-st-ink">{b.title || "Untitled book"}</span>
                <span className="block text-[11.5px] text-st-dim">{b.pdfFileId ? `PDF ✓ ${b.pdfName}` : "No PDF"}</span>
              </button>
              <CheckField path={["site", "ebooks", i, "enabled"]} label="Shown" />
            </div>
            {open === b.id && <BookEditor b={b} index={i} />}
          </div>
        )}
      />
      <Button
        onClick={() => {
          checkpoint();
          const id = `book_${Date.now().toString(36)}`;
          const title = `New book ${books.length + 1}`;
          setDraft(["site", "ebooks"] as Path, [
            ...books,
            { id, slug: slugify(title), n: String(books.length + 1).padStart(2, "0"), title, subtitle: "", oneLiner: "", tone: "blue", pages: 0, readTime: "", chapters: [], enabled: true, approvalMode: "inherit", deliveryMode: "inherit", requests: 0, sent: 0, downloads: 0 },
          ]);
          setOpen(id);
        }}
      >
        + Add a book
      </Button>
    </Box>
  );
}

function RequestsTab() {
  const requests = useBookRequests();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? requests.find((r) => r.id === openId) : undefined;
  const pending = requests.filter((r) => r.status === "pending");

  const approveAll = async () => {
    for (const r of pending) await deliverBookRequest(r.id);
  };

  return (
    <>
      {pending.length > 0 && (
        <Button variant="primary" onClick={approveAll} className="w-fit">
          Approve & send all waiting ({pending.length})
        </Button>
      )}
      <div className="grid gap-2">
        {requests.length === 0 && <p className="text-[13.5px] text-st-sub">No requests yet.</p>}
        {requests.map((r) => (
          <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-border bg-st-panel p-3.5 text-left hover:border-st-purple/40">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-st-ink">
                {r.name} — {r.bookSlug}
              </p>
              <p className="st-help">
                {r.email} · {relativeTime(r.createdAt)}
              </p>
            </div>
            <Pill tone={r.status === "pending" ? "brand" : r.status === "failed" ? "bad" : r.status === "sent" ? "good" : "default"}>{r.status}</Pill>
          </button>
        ))}
      </div>
      <Drawer open={!!open} onClose={() => setOpenId(null)} title="Book request">
        {open && <BookRequestDetail r={open} onClose={() => setOpenId(null)} />}
      </Drawer>
    </>
  );
}

function SendingTab() {
  return (
    <Box title="General sending rules" help="A book can override these on its own entry in the Shelf.">
      <Row>
        <SelectField path={["delivery", "approvalMode"]} label="When is a book sent?" options={[{ value: "manual", label: "After I approve the request" }, { value: "auto", label: "Automatically, straight away" }]} />
        <SelectField path={["delivery", "deliveryMode"]} label="How is it sent?" options={DELIVERY_OPTIONS} />
      </Row>
      <Row>
        <NumField path={["delivery", "attachmentMaxMb"]} label="Largest attachment (MB)" min={1} max={25} />
        <NumField path={["delivery", "linkDays"]} label="Link works for (days)" min={1} max={90} />
        <NumField path={["delivery", "maxDownloads"]} label="Downloads per link" min={1} max={50} />
      </Row>
      <Row>
        <TextField path={["delivery", "senderName"]} label="Sender name" help="What the visitor sees in their inbox." />
        <TextField path={["delivery", "replyTo"]} label="Replies go to" placeholder="Optional" />
      </Row>
      <Row>
        <CheckField path={["delivery", "adminAlert"]} label="E-mail me when someone requests a book" />
        <TextField path={["delivery", "adminAlertTo"]} label="Send alerts to" placeholder="Empty = the company e-mail" />
      </Row>
    </Box>
  );
}

function EmailTab() {
  const draft = useDraft();
  const toast = useToast();
  const session = useSession();
  const now = useNow();
  const preview = buildEbookMail(draft.site, draft.email, { name: "Alex Sample", bookTitle: draft.site.ebooks[0]?.title ?? "Sample e-book", link: "/download/?t=sample", expires: new Date(now + 7 * 86_400_000) });

  const sendTest = () => {
    if (!session) return;
    addOutboxMail({ kind: "ebook", to: session.email, subject: `[Test] ${preview.subject}`, html: preview.html, text: preview.text });
    toast("ok", `Test e-mail added to the Outbox for ${session.email}.`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Box title="E-mail to the visitor" help="You can use {{name}}, {{bookTitle}}, {{downloadLink}}, {{expiryDate}} and {{company}}.">
        <TextField path={["email", "subject"]} label="Subject" />
        <AreaField path={["email", "body"]} label="Message" rows={8} />
        <TextField path={["email", "buttonLabel"]} label="Download button text" />
        <AreaField path={["email", "footer"]} label="Small print at the bottom" rows={2} />
        <Button onClick={sendTest} className="w-fit">
          Send me a test e-mail
        </Button>
      </Box>
      <Box title="Preview">
        <iframe title="E-mail preview" srcDoc={preview.html} className="h-[420px] w-full rounded-xl border border-st-border bg-white" />
      </Box>
    </div>
  );
}

function FormTab() {
  return (
    <>
      <Box title="Request form">
        <Row>
          <TextField path={["site", "ebookForm", "title"]} label="Title" />
          <TextField path={["site", "ebookForm", "eyebrow"]} label="Small line" help="{n} = book number." />
        </Row>
        <TextField path={["site", "ebookForm", "text"]} label="Line under the title" help="{title} = the book's title." />
        <Row>
          <TextField path={["site", "ebookForm", "nameLabel"]} label="Name label" />
          <TextField path={["site", "ebookForm", "emailLabel"]} label="E-mail label" />
        </Row>
        <Row>
          <TextField path={["site", "ebookForm", "phoneLabel"]} label="Phone label" />
          <CheckField path={["site", "ebookForm", "phoneRequired"]} label="Phone is required" />
        </Row>
        <Row>
          <CheckField path={["site", "ebookForm", "showCompany"]} label="Ask for a company" />
          <TextField path={["site", "ebookForm", "companyLabel"]} label="Company label" />
        </Row>
        <AreaField path={["site", "ebookForm", "consent"]} label="Consent sentence" rows={2} />
        <Row>
          <TextField path={["site", "ebookForm", "submit"]} label="Button" />
          <TextField path={["site", "ebookForm", "sending"]} label="Button while sending" />
        </Row>
      </Box>
      <Box title="After sending">
        <TextField path={["site", "ebookForm", "successTitle"]} label="Title" help="{name} = “, first name”." />
        <AreaField path={["site", "ebookForm", "successPending"]} label="Waiting for approval" rows={2} help="{title} and {email} are replaced." />
        <AreaField path={["site", "ebookForm", "successSent"]} label="Sent straight away" rows={2} />
        <TextField path={["site", "ebookForm", "error"]} label="If something goes wrong" />
      </Box>
    </>
  );
}

export default function BooksPage() {
  const [tab, setTab] = useState<Tab>("shelf");
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-[22px] font-semibold text-st-ink">Books</h1>
      <nav className="flex flex-wrap gap-1.5 border-b border-st-border pb-3">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${tab === id ? "bg-st-indigo text-white" : "text-st-sub hover:text-st-ink"}`}>
            {label}
          </button>
        ))}
      </nav>
      {tab === "shelf" && <ShelfTab />}
      {tab === "requests" && <RequestsTab />}
      {tab === "sending" && <SendingTab />}
      {tab === "email" && <EmailTab />}
      {tab === "form" && <FormTab />}
    </div>
  );
}
