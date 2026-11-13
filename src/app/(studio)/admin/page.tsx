"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { checkWorkspace } from "@/lib/checks";
import { deliverBookRequest } from "@/lib/ebooks/deliver";
import { NinePad, type PadStatus } from "@/studio/NinePad";
import { NineRing } from "@/studio/NineRing";
import { useBookRequests, useDraft, useEnquiries, useQuizResults, useSession } from "@/studio/state";
import { Box, Button, Pill, relativeTime, useNow } from "@/studio/ui";

const DAY = 86_400_000;

export default function TodayPage() {
  const session = useSession();
  const draft = useDraft();
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();
  const [busy, setBusy] = useState<string | null>(null);

  const pendingBooks = bookRequests.filter((r) => r.status === "pending");
  const failedBooks = bookRequests.filter((r) => r.status === "failed");
  const newEnquiries = enquiries.filter((e) => e.status === "new");
  const noPdf = draft.site.ebooks.filter((b) => b.enabled && !b.pdfFileId);
  const issues = useMemo(() => checkWorkspace(draft), [draft]);

  const now = useNow();
  const weekAgo = now - 7 * DAY;
  const since = (iso: string) => new Date(iso).getTime() > weekAgo;
  const pulse = [
    { label: "Enquiries", value: enquiries.filter((e) => since(e.createdAt)).length },
    { label: "Book requests", value: bookRequests.filter((r) => since(r.createdAt)).length },
    { label: "Quizzes finished", value: quizResults.filter((r) => since(r.createdAt)).length },
    { label: "WhatsApp taps", value: enquiries.filter((e) => since(e.createdAt) && e.channel === "whatsapp").length + quizResults.filter((r) => since(r.createdAt) && r.action === "whatsapp").length },
  ];

  const demand = draft.site.services.map((s) => ({
    key: s.slug,
    label: s.short,
    value: enquiries.filter((e) => e.service === s.slug).length + quizResults.filter((r) => r.top === s.title).length,
  }));
  const topDemand = demand.reduce((a, b) => (b.value > a.value ? b : a), demand[0]);

  const statuses: Partial<Record<string, PadStatus>> = {
    today: issues.length ? { text: `${issues.length} to look at`, tone: "warn" } : { text: "All clear", tone: "default" },
    inbox: newEnquiries.length + pendingBooks.length > 0 ? { text: `${newEnquiries.length + pendingBooks.length} new`, tone: "brand" } : { text: "Nothing waiting" },
    website: { text: `${draft.site.sections.length} sections shown` },
    cards: { text: "Drag to reorder" },
    talk: { text: `${draft.site.enquiry.fields.length} blocks asked` },
    quiz: { text: `${draft.site.quiz.questions.length} questions` },
    books: noPdf.length ? { text: `${noPdf.length} without a PDF`, tone: "warn" } : { text: `${draft.site.ebooks.filter((b) => b.enabled).length} on the shelf` },
    pages: { text: `${draft.pages.length} pages` },
    settings: { text: "Look, team, history" },
  };

  const send = async (id: string) => {
    setBusy(id);
    await deliverBookRequest(id);
    setBusy(null);
  };

  const canSeeLeads = session?.role !== "editor";

  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] font-semibold text-st-ink">Welcome{session ? `, ${session.email.split("@")[0]}` : ""}</h1>
        <p className="mt-1 text-[14px] text-st-sub">Everything on the website is edited here. Nothing reaches visitors until you Publish.</p>
      </div>

      {canSeeLeads && (
      <>
      <div className="grid gap-2.5 sm:grid-cols-4">
        {pulse.map((p) => (
          <div key={p.label} className="st-card p-4">
            <p className="font-digits text-[28px] font-black text-st-ink">{p.value}</p>
            <p className="st-help mt-0.5">{p.label} · 7 days</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Box title="Needs you">
          {pendingBooks.length === 0 && newEnquiries.length === 0 && noPdf.length === 0 && failedBooks.length === 0 && issues.length === 0 && <p className="text-[13.5px] text-st-sub">Nothing needs your attention right now.</p>}

          {pendingBooks.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-st-ink">
                  {r.name} wants “{draft.site.ebooks.find((b) => b.slug === r.bookSlug)?.title ?? r.bookSlug}”
                </p>
                <p className="st-help">Waiting for approval · {relativeTime(r.createdAt)}</p>
              </div>
              <Button variant="primary" disabled={busy === r.id} onClick={() => send(r.id)}>
                {busy === r.id ? "Sending…" : "Approve & send"}
              </Button>
            </div>
          ))}

          {failedBooks.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-danger/30 bg-st-danger-bg p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-st-ink">
                  {r.name} — {r.error || "Could not be sent"}
                </p>
                <p className="st-help">Failed · {relativeTime(r.createdAt)}</p>
              </div>
              <Button disabled={busy === r.id} onClick={() => send(r.id)}>
                Retry
              </Button>
            </div>
          ))}

          {newEnquiries.slice(0, 4).map((e) => (
            <Link key={e.id} href={`/admin/inbox?q=${encodeURIComponent(e.name)}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-border p-3 hover:border-st-purple/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-st-ink">
                  {e.name} — {e.serviceTitle}
                </p>
                <p className="st-help">
                  New enquiry {e.ref && `· ${e.ref}`} · {relativeTime(e.createdAt)}
                </p>
              </div>
              <Pill tone="brand">Open</Pill>
            </Link>
          ))}

          {noPdf.map((b) => (
            <Link key={b.id} href="/admin/books" className="flex flex-wrap items-center gap-3 rounded-xl border border-st-warn/30 bg-st-warn-bg p-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-st-ink">“{b.title}” has no PDF yet</p>
                <p className="st-help">Requests will wait</p>
              </div>
              <Pill tone="warn">Upload</Pill>
            </Link>
          ))}

          {issues
            .filter((i) => i.level === "warning")
            .slice(0, 3)
            .map((i, idx) => (
              <div key={idx} className="rounded-xl border border-st-warn/30 bg-st-warn-bg p-3 text-[13px] text-st-warn">
                {i.message}
              </div>
            ))}
        </Box>

        <Box title="The Nine Ring" help="Demand across the last 7 days — enquiries plus quiz recommendations.">
          <div className="flex items-center justify-center">
            <NineRing segments={demand} />
          </div>
          {topDemand?.value > 0 && <p className="text-center text-[12.5px] text-st-sub">Leading right now: {topDemand.label}</p>}
        </Box>
      </div>
      </>
      )}

      <div>
        <h2 className="mb-2.5 font-display text-[15px] font-semibold text-st-ink">Jump to a room</h2>
        <NinePad statuses={statuses} />
      </div>
    </div>
  );
}
