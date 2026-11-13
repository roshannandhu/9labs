"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { downloadCsv } from "@/lib/csv";
import { deliverBookRequest } from "@/lib/ebooks/deliver";
import { setFollowUp } from "@/lib/store";
import { BookRequestDetail, EnquiryDetail, QuizResultDetail } from "@/studio/LeadDetail";
import { KIND_LABEL, STATUS_LABEL, fromBookRequest, fromEnquiry, fromQuizResult, type LeadKind, type UnifiedLead } from "@/studio/leads";
import { useBookRequests, useEnquiries, useQuizResults, useSession } from "@/studio/state";
import { Button, Drawer, Pill, RoleNote, relativeTime } from "@/studio/ui";
import type { FollowUp } from "@/content/types";

type SourceFilter = "all" | LeadKind;
type ViewMode = "list" | "board";
const BOARD_COLUMNS: FollowUp[] = ["new", "contacted", "won", "lost"];

function InboxInner() {
  const session = useSession();
  const initialQ = useSearchParams().get("q") ?? "";
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();
  const [source, setSource] = useState<SourceFilter>("all");
  const [q, setQ] = useState(initialQ);
  const [view, setView] = useState<ViewMode>("list");
  const [openId, setOpenId] = useState<string | null>(null);

  const all: UnifiedLead[] = useMemo(() => [...enquiries.map(fromEnquiry), ...bookRequests.map(fromBookRequest), ...quizResults.map(fromQuizResult)], [enquiries, bookRequests, quizResults]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((l) => (source === "all" || l.kind === source) && (!query || l.search.includes(query) || l.title.toLowerCase().includes(query))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [all, source, q]);

  const open = openId ? all.find((l) => l.id === openId) : undefined;
  const openEnquiry = open?.kind === "enquiry" ? enquiries.find((e) => e.id === open.id) : undefined;
  const openBook = open?.kind === "book" ? bookRequests.find((r) => r.id === open.id) : undefined;
  const openQuiz = open?.kind === "quiz" ? quizResults.find((r) => r.id === open.id) : undefined;

  const exportCsv = () => {
    downloadCsv(
      "inbox",
      ["Type", "Name", "Detail", "Status", "Date"],
      filtered.map((l) => [KIND_LABEL[l.kind], l.title, l.sub, STATUS_LABEL[l.status], new Date(l.createdAt).toISOString()]),
    );
  };

  const approveAllPending = async () => {
    for (const r of bookRequests.filter((x) => x.status === "pending")) await deliverBookRequest(r.id);
  };

  if (session?.role === "editor") {
    return (
      <div className="grid gap-4">
        <h1 className="font-display text-[22px] font-semibold text-st-ink">Inbox</h1>
        <RoleNote what="Book requests, enquiries and quiz results are visible to Owners and Admins." />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-semibold text-st-ink">Inbox</h1>
        <div className="flex gap-2">
          {bookRequests.some((r) => r.status === "pending") && <Button onClick={approveAllPending}>Approve all waiting books</Button>}
          <Button onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "enquiry", "book", "quiz"] as SourceFilter[]).map((s) => (
          <button key={s} type="button" onClick={() => setSource(s)} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${source === s ? "border-transparent bg-st-indigo text-white" : "border-st-border-strong text-st-sub"}`}>
            {s === "all" ? "All" : KIND_LABEL[s]}
          </button>
        ))}
        <span className="flex-1" />
        <div className="flex rounded-full border border-st-border-strong p-0.5">
          {(["list", "board"] as ViewMode[]).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${view === v ? "bg-st-panel-2 text-st-ink" : "text-st-dim"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <input className="st-field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, e-mail, reference…" />

      {filtered.length === 0 && <p className="st-help py-8 text-center">No leads match yet.</p>}

      {view === "list" ? (
        <div className="grid gap-2">
          {filtered.map((l) => (
            <button key={`${l.kind}_${l.id}`} type="button" onClick={() => setOpenId(l.id)} className="flex flex-wrap items-center gap-3 rounded-xl border border-st-border bg-st-panel p-3.5 text-left hover:border-st-purple/40">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-st-ink">{l.title}</p>
                <p className="st-help truncate">
                  {KIND_LABEL[l.kind]} · {l.sub} · {relativeTime(l.createdAt)}
                </p>
              </div>
              <Pill tone={l.status === "new" ? "brand" : l.status === "won" ? "good" : l.status === "lost" ? "bad" : "default"}>{STATUS_LABEL[l.status]}</Pill>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOARD_COLUMNS.map((col) => (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                const lead = filtered.find((l) => l.id === id);
                if (lead) setFollowUp(lead.kind, lead.id, col);
              }}
              className="st-card min-h-[160px] bg-st-panel-2 p-2.5"
            >
              <p className="st-label mb-2 px-1">
                {STATUS_LABEL[col]} · {filtered.filter((l) => l.status === col).length}
              </p>
              <div className="grid gap-2">
                {filtered
                  .filter((l) => l.status === col)
                  .map((l) => (
                    <div key={`${l.kind}_${l.id}`} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)} onClick={() => setOpenId(l.id)} className="cursor-pointer rounded-lg border border-st-border bg-st-panel p-2.5 text-[12.5px] shadow-sm">
                    <p className="truncate font-medium text-st-ink">{l.title}</p>
                    <p className="st-help truncate">{l.sub}</p>
                    <div className="mt-1.5 flex gap-1">
                      {BOARD_COLUMNS.filter((c) => c !== col).map((c) => (
                        <button key={c} type="button" onClick={(e) => { e.stopPropagation(); setFollowUp(l.kind, l.id, c); }} className="rounded-full border border-st-border-strong px-1.5 py-0.5 text-[10px] text-st-dim hover:text-st-ink">
                          {STATUS_LABEL[c]}
                        </button>
                      ))}
                    </div>
                  </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? KIND_LABEL[open.kind] : ""}>
        {openEnquiry && <EnquiryDetail e={openEnquiry} onClose={() => setOpenId(null)} />}
        {openBook && <BookRequestDetail r={openBook} onClose={() => setOpenId(null)} />}
        {openQuiz && <QuizResultDetail r={openQuiz} />}
      </Drawer>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={null}>
      <InboxInner />
    </Suspense>
  );
}
