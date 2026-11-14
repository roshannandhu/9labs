"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { waLink } from "@/content/site";
import { downloadCsv } from "@/lib/csv";
import { Icon } from "@/studio/Icon";
import { LeadDrawer } from "@/studio/inbox/LeadDrawer";
import type { LeadKind } from "@/studio/leads";
import { useBookRequests, useDraft, useEnquiries, useQuizResults, useSession } from "@/studio/state";
import { Badge, Button, EmptyState, PageHeader, RoleNote, Segmented, Tabs } from "@/studio/ui";
import { relativeTime } from "@/studio/ui";

type Tab = "enquiries" | "books" | "quiz";
type Period = "all" | "7" | "30" | "90";
const PAGE_SIZE = 25;
const DAY = 86_400_000;
const TAB_KIND: Record<Tab, LeadKind> = { enquiries: "enquiry", books: "book", quiz: "quiz" };
const TAB_BLURB: Record<Tab, string> = {
  enquiries: "People who pressed “Talk to us about this” on a service.",
  books: "People who asked for a free e-book.",
  quiz: "People who finished The 9 Quiz.",
};

const inPeriod = (iso: string, period: Period) => period === "all" || Date.now() - new Date(iso).getTime() <= Number(period) * DAY;

function InboxInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const session = useSession();
  const draft = useDraft();
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();

  const initialTab = (sp.get("tab") as Tab) ?? "enquiries";
  const [tab, setTabState] = useState<Tab>(["enquiries", "books", "quiz"].includes(initialTab) ? initialTab : "enquiries");
  const [openId, setOpenId] = useState<string | null>(sp.get("id"));
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [service, setService] = useState("all");
  const [via, setVia] = useState<"all" | "whatsapp" | "email">("all");
  const [book, setBook] = useState("all");
  const [delivery, setDelivery] = useState<"all" | "pending" | "sent" | "failed">("all");
  const [outcome, setOutcome] = useState<"all" | "whatsapp" | "email" | "none">("all");
  const [topMatch, setTopMatch] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const switchTab = (t: Tab) => {
    setTabState(t);
    setLimit(PAGE_SIZE);
    router.replace(`/admin/inbox?tab=${t}`);
  };

  const filteredEnquiries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return enquiries.filter(
      (e) =>
        inPeriod(e.createdAt, period) &&
        (service === "all" || e.service === service) &&
        (via === "all" || e.channel === via) &&
        (!query || [e.name, e.company, e.serviceTitle, e.ref, e.message].join(" ").toLowerCase().includes(query)),
    );
  }, [enquiries, q, period, service, via]);

  const filteredBooks = useMemo(() => {
    const query = q.trim().toLowerCase();
    return bookRequests.filter(
      (r) =>
        inPeriod(r.createdAt, period) &&
        (book === "all" || r.bookSlug === book) &&
        (delivery === "all" || r.status === delivery) &&
        (!query || [r.name, r.email, r.company, r.bookSlug].join(" ").toLowerCase().includes(query)),
    );
  }, [bookRequests, q, period, book, delivery]);

  const filteredQuiz = useMemo(() => {
    const query = q.trim().toLowerCase();
    return quizResults.filter(
      (r) =>
        inPeriod(r.createdAt, period) &&
        (outcome === "all" || r.action === outcome) &&
        (topMatch === "all" || r.top === topMatch) &&
        (!query || [r.top, r.email, r.ref, r.matches].join(" ").toLowerCase().includes(query)),
    );
  }, [quizResults, q, period, outcome, topMatch]);

  const sortByNewest = <T extends { createdAt: string }>(items: T[]) => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = tab === "enquiries" ? sortByNewest(filteredEnquiries) : tab === "books" ? sortByNewest(filteredBooks) : sortByNewest(filteredQuiz);
  const visible = rows.slice(0, limit);

  const exportCsv = () => {
    if (tab === "enquiries") {
      downloadCsv("enquiries", ["Received", "Name", "Company", "Service", "Needs", "Budget", "Timeline", "Message", "Via", "Ref"], filteredEnquiries.map((e) => [e.createdAt, e.name, e.company, e.serviceTitle, e.needs, e.budget, e.timeline, e.message, e.channel, e.ref]));
    } else if (tab === "books") {
      downloadCsv("ebook-requests", ["Received", "Name", "E-mail", "Phone", "Company", "Book", "Delivery", "Downloads", "Source page"], filteredBooks.map((r) => [r.createdAt, r.name, r.email, r.phone, r.company, r.bookSlug, r.status, r.downloads, r.source]));
    } else {
      downloadCsv("quiz-results", ["Finished", "Top match", "Matches", "What they did", "E-mail", "Ref", "Summary"], filteredQuiz.map((r) => [r.createdAt, r.top, r.matches, r.action, r.email, r.ref, r.summary]));
    }
  };

  useEffect(() => {
    if (sp.get("export") !== "1") return;
    exportCsv();
    router.replace(`/admin/inbox?tab=${tab}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once for the one-shot `export=1` param only
  }, []);

  if (session?.role === "editor") {
    return (
      <div className="grid gap-5">
        <PageHeader title="Inbox" description="Everyone who contacted you through the website." />
        <RoleNote what="Leads are visible to Owners and Admins." />
      </div>
    );
  }

  const openKind: LeadKind | null = openId ? TAB_KIND[tab] : null;

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Inbox"
        description="Everyone who contacted you through the website."
        actions={
          <Button onClick={exportCsv}>
            <Icon name="download" size={14} /> Export CSV
          </Button>
        }
      />

      <Tabs
        layoutId="inbox-tabs"
        active={tab}
        onChange={switchTab}
        tabs={[
          { id: "enquiries", label: "Service enquiries", count: enquiries.length, dot: "var(--st-series-enquiry)" },
          { id: "books", label: "E-book requests", count: bookRequests.length, dot: "var(--st-series-ebook)" },
          { id: "quiz", label: "Quiz results", count: quizResults.length, dot: "var(--st-series-quiz)" },
        ]}
      />
      <p className="-mt-2 text-[12.5px] text-st-dim">{TAB_BLURB[tab]}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, e-mail, ref…" className="st-field max-w-[320px] flex-1" />
        <Segmented layoutId="inbox-period" size="sm" value={period} onChange={setPeriod} options={[{ value: "all", label: "All" }, { value: "7", label: "7D" }, { value: "30", label: "30D" }, { value: "90", label: "90D" }]} />
        {tab === "enquiries" && (
          <>
            <select value={service} onChange={(e) => setService(e.target.value)} className="st-field w-auto">
              <option value="all">All services</option>
              {draft.site.services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
            <Segmented layoutId="inbox-via" size="sm" value={via} onChange={setVia} options={[{ value: "all", label: "All" }, { value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "E-mail" }]} />
          </>
        )}
        {tab === "books" && (
          <>
            <select value={book} onChange={(e) => setBook(e.target.value)} className="st-field w-auto">
              <option value="all">All books</option>
              {draft.site.ebooks.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.title}
                </option>
              ))}
            </select>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value as typeof delivery)} className="st-field w-auto">
              <option value="all">All delivery</option>
              <option value="pending">Waiting</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </>
        )}
        {tab === "quiz" && (
          <>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)} className="st-field w-auto">
              <option value="all">What they did — all</option>
              <option value="whatsapp">Opened WhatsApp</option>
              <option value="email">Asked by e-mail</option>
              <option value="none">Only looked</option>
            </select>
            <select value={topMatch} onChange={(e) => setTopMatch(e.target.value)} className="st-field w-auto">
              <option value="all">All top matches</option>
              {draft.site.services.map((s) => (
                <option key={s.slug} value={s.title}>
                  {s.title}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={enquiries.length + bookRequests.length + quizResults.length === 0 ? "Nothing yet" : "Nothing matches"}
          text={rows.length === 0 && q === "" && period === "all" ? "It appears here the moment someone uses the site." : "Try clearing the search or filters."}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-st-border lg:block">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-st-panel-2">
                <tr className="text-left text-st-dim">
                  {tab === "enquiries" && (
                    <>
                      <th className="px-3 py-2.5 font-medium">Name</th>
                      <th className="px-3 py-2.5 font-medium">Service</th>
                      <th className="px-3 py-2.5 font-medium">Needs</th>
                      <th className="px-3 py-2.5 font-medium">Budget</th>
                      <th className="px-3 py-2.5 font-medium">Timeline</th>
                      <th className="px-3 py-2.5 font-medium">Via</th>
                      <th className="px-3 py-2.5 font-medium">Ref</th>
                      <th className="px-3 py-2.5 font-medium">Received</th>
                    </>
                  )}
                  {tab === "books" && (
                    <>
                      <th className="px-3 py-2.5 font-medium">Name</th>
                      <th className="px-3 py-2.5 font-medium">E-mail</th>
                      <th className="px-3 py-2.5 font-medium">Phone</th>
                      <th className="px-3 py-2.5 font-medium">Book</th>
                      <th className="px-3 py-2.5 font-medium">Delivery</th>
                      <th className="px-3 py-2.5 font-medium">Received</th>
                      <th className="px-3 py-2.5 font-medium" />
                    </>
                  )}
                  {tab === "quiz" && (
                    <>
                      <th className="px-3 py-2.5 font-medium">Top match</th>
                      <th className="px-3 py-2.5 font-medium">Other matches</th>
                      <th className="px-3 py-2.5 font-medium">What they did</th>
                      <th className="px-3 py-2.5 font-medium">E-mail</th>
                      <th className="px-3 py-2.5 font-medium">Ref</th>
                      <th className="px-3 py-2.5 font-medium">Finished</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-st-border">
                {tab === "enquiries" &&
                  (visible as typeof filteredEnquiries).map((e) => (
                    <tr key={e.id} onClick={() => setOpenId(e.id)} className="cursor-pointer hover:bg-st-panel-2">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-st-ink">{e.name}</p>
                        {e.company && <p className="text-[11.5px] text-st-dim">{e.company}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-st-sub">{e.serviceTitle}</td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 text-st-sub">{e.needs.slice(0, 2).join(", ")}{e.needs.length > 2 && ` +${e.needs.length - 2}`}</td>
                      <td className="px-3 py-2.5 text-st-sub">{e.budget}</td>
                      <td className="px-3 py-2.5 text-st-sub">{e.timeline}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-1 text-st-dim">
                          <Icon name={e.channel === "whatsapp" ? "whatsapp" : "mail"} size={13} />
                        </span>
                      </td>
                      <td className="st-num px-3 py-2.5 text-st-dim">{e.ref}</td>
                      <td className="px-3 py-2.5 text-st-dim">{relativeTime(e.createdAt)}</td>
                    </tr>
                  ))}
                {tab === "books" &&
                  (visible as typeof filteredBooks).map((r) => (
                    <tr key={r.id} onClick={() => setOpenId(r.id)} className="group cursor-pointer hover:bg-st-panel-2">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-st-ink">{r.name}</p>
                        {r.company && <p className="text-[11.5px] text-st-dim">{r.company}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-st-sub">{r.email}</td>
                      <td className="px-3 py-2.5 text-st-sub">{r.phone}</td>
                      <td className="max-w-[140px] truncate px-3 py-2.5 text-st-sub">{draft.site.ebooks.find((b) => b.slug === r.bookSlug)?.title ?? r.bookSlug}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={r.status === "sent" ? "good" : r.status === "failed" ? "danger" : r.status === "rejected" ? "default" : "warn"}>{r.status}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-st-dim">{relativeTime(r.createdAt)}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <a href={`mailto:${r.email}`} onClick={(ev) => ev.stopPropagation()} title="E-mail" className="grid h-7 w-7 place-items-center rounded-full text-st-dim hover:bg-st-panel-3 hover:text-st-ink">
                            <Icon name="mail" size={13} />
                          </a>
                          {r.phone && (
                            <a href={waLink(r.phone.replace(/\D/g, ""), "")} onClick={(ev) => ev.stopPropagation()} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="grid h-7 w-7 place-items-center rounded-full text-st-dim hover:bg-st-panel-3 hover:text-st-ink">
                              <Icon name="whatsapp" size={13} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {tab === "quiz" &&
                  (visible as typeof filteredQuiz).map((r) => (
                    <tr key={r.id} onClick={() => setOpenId(r.id)} className="cursor-pointer hover:bg-st-panel-2">
                      <td className="px-3 py-2.5 font-medium text-st-ink">{r.top}</td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 text-st-sub">{r.matches}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone={r.action === "none" ? "default" : "quiz"}>{r.action === "whatsapp" ? "WhatsApp" : r.action === "email" ? "E-mail" : "Only looked"}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-st-sub">{r.email}</td>
                      <td className="st-num px-3 py-2.5 text-st-dim">{r.ref}</td>
                      <td className="px-3 py-2.5 text-st-dim">{relativeTime(r.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2 lg:hidden">
            {tab === "enquiries" &&
              (visible as typeof filteredEnquiries).map((e) => (
                <button key={e.id} type="button" onClick={() => setOpenId(e.id)} className="st-panel flex flex-col gap-1.5 p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-st-ink">{e.name}</p>
                    <Icon name={e.channel === "whatsapp" ? "whatsapp" : "mail"} size={13} />
                  </div>
                  <p className="truncate text-[12px] text-st-dim">
                    {e.serviceTitle} {e.company && `· ${e.company}`}
                  </p>
                  <p className="text-[11px] text-st-dim">{relativeTime(e.createdAt)}</p>
                </button>
              ))}
            {tab === "books" &&
              (visible as typeof filteredBooks).map((r) => (
                <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="st-panel flex flex-col gap-1.5 p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-st-ink">{r.name}</p>
                    <Badge tone={r.status === "sent" ? "good" : r.status === "failed" ? "danger" : r.status === "rejected" ? "default" : "warn"}>{r.status}</Badge>
                  </div>
                  <p className="truncate text-[12px] text-st-dim">{draft.site.ebooks.find((b) => b.slug === r.bookSlug)?.title ?? r.bookSlug}</p>
                  <p className="text-[11px] text-st-dim">{relativeTime(r.createdAt)}</p>
                </button>
              ))}
            {tab === "quiz" &&
              (visible as typeof filteredQuiz).map((r) => (
                <button key={r.id} type="button" onClick={() => setOpenId(r.id)} className="st-panel flex flex-col gap-1.5 p-3.5 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-st-ink">{r.top}</p>
                    <Badge tone={r.action === "none" ? "default" : "quiz"}>{r.action === "whatsapp" ? "WhatsApp" : r.action === "email" ? "E-mail" : "Only looked"}</Badge>
                  </div>
                  <p className="truncate text-[12px] text-st-dim">{r.matches}</p>
                  <p className="text-[11px] text-st-dim">{relativeTime(r.createdAt)}</p>
                </button>
              ))}
          </div>

          {visible.length < rows.length && (
            <Button onClick={() => setLimit((l) => l + PAGE_SIZE)} className="w-fit">
              Show {Math.min(PAGE_SIZE, rows.length - visible.length)} more
            </Button>
          )}
        </>
      )}

      <LeadDrawer kind={openKind} id={openId} onClose={() => setOpenId(null)} />
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
