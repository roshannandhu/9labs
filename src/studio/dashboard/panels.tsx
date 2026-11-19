"use client";

import Link from "next/link";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { BookCover } from "@/components/ebooks/BookCover";
import { Icon } from "../Icon";
import { KIND_LABEL } from "../leads";
import { Badge, Panel, StatusRow, relativeTime } from "../ui";
import { BarList, type BarItem, Heatmap, LineChart, MeterList, SegmentedBar, StatTile } from "../charts";
import type { DashboardData, Range } from "./data";
import { AiHealthView } from "../AiHealth";
import { useDraft } from "../state";

const compareLabel = (range: Range) => `vs previous ${range} days`;

/** KPI strip — no panel chrome of its own, five stat tiles in their own small grid. */
export function KpiStrip({ data, range }: { data: DashboardData; range: Range }) {
  const compare = compareLabel(range);
  const tiles = [
    { key: "total", label: "Total leads", href: "/admin/inbox", color: "var(--st-purple)", ...data.kpis.total },
    { key: "enquiries", label: "Enquiries", href: "/admin/inbox?tab=enquiries", color: "var(--st-series-enquiry)", ...data.kpis.enquiries },
    { key: "ebooks", label: "E-book requests", href: "/admin/inbox?tab=books", color: "var(--st-series-ebook)", ...data.kpis.ebooks },
    { key: "quiz", label: "Quiz results", href: "/admin/inbox?tab=quiz", color: "var(--st-series-quiz)", ...data.kpis.quiz },
    { key: "whatsapp", label: "WhatsApp taps", href: "/admin/inbox", color: "var(--st-good)", ...data.kpis.whatsapp },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.key} className={t.key === "total" ? "col-span-2 sm:col-span-1" : ""}>
          <StatTile label={t.label} value={t.value} delta={t.delta} compareLabel={compare} spark={t.spark} color={t.color} href={t.href} />
        </div>
      ))}
    </div>
  );
}

export function LeadsOverTimePanel({ data }: { data: DashboardData }) {
  return (
    <Panel label="Leads over time">
      <LineChart series={[data.overTime.enquiries, data.overTime.ebooks, data.overTime.quiz]} />
      {[data.overTime.enquiries, data.overTime.ebooks, data.overTime.quiz].every((s) => s.points.every((p) => p.count === 0)) && <p className="text-[12px] text-st-dim">No leads in this period yet — the lines rise as people get in touch.</p>}
    </Panel>
  );
}

export function LeadMixPanel({ data }: { data: DashboardData }) {
  const parts = [
    { key: "enquiries", label: "Enquiries", value: data.mix.enquiries, color: "var(--st-series-enquiry)" },
    { key: "ebooks", label: "E-books", value: data.mix.ebooks, color: "var(--st-series-ebook)" },
    { key: "quiz", label: "Quiz", value: data.mix.quiz, color: "var(--st-series-quiz)" },
  ];
  const channelParts = [
    { key: "whatsapp", label: "WhatsApp", value: data.channel.whatsapp, color: "var(--st-good)" },
    { key: "email", label: "E-mail", value: data.channel.email, color: "var(--st-cyan)" },
  ];
  return (
    <Panel label="Lead mix">
      <SegmentedBar parts={parts} tall />
      <div>
        <p className="st-help mb-1.5">Enquiry channel</p>
        <SegmentedBar parts={channelParts} />
      </div>
      <div>
        <p className="st-help mb-1.5">Quiz follow-through</p>
        <MeterList items={[{ key: "ft", label: "Opened WhatsApp or asked by e-mail", value: data.outcomes.whatsapp + data.outcomes.email, total: data.outcomes.total }]} color="var(--st-series-quiz)" />
      </div>
    </Panel>
  );
}

export function InterestByServicePanel({ data }: { data: DashboardData }) {
  const items: BarItem[] = data.services.map((s) => ({
    key: s.slug,
    label: s.short,
    icon: <ActivityIcon icon={s.icon} size={16} play={false} />,
    value: s.enquiries + s.quiz,
    segments:
      s.enquiries + s.quiz > 0
        ? [
            { label: "Enquiries", value: s.enquiries, color: "var(--st-series-enquiry)" },
            { label: "Quiz top match", value: s.quiz, color: "var(--st-series-quiz)" },
          ]
        : undefined,
  }));
  return (
    <Panel label="Interest by service">
      <BarList items={items} color="var(--st-series-enquiry)" />
    </Panel>
  );
}

const DELIVERY_BADGE: Record<"pending" | "sent" | "failed", { tone: "warn" | "good" | "danger"; icon: "clock" | "check" | "alert"; label: string }> = {
  pending: { tone: "warn", icon: "clock", label: "Waiting" },
  sent: { tone: "good", icon: "check", label: "Sent" },
  failed: { tone: "danger", icon: "alert", label: "Failed" },
};

export function EbooksPanel({ data }: { data: DashboardData }) {
  const maxRequests = Math.max(1, ...data.books.map((b) => b.requests));
  return (
    <Panel label="E-books" footer={<Link href="/admin/books" className="text-[12.5px] font-medium text-st-purple hover:underline">Manage books →</Link>}>
      <div className="grid gap-3">
        {data.books.map((row) => (
          <div key={row.book.id} className="flex items-center gap-3">
            <span className="h-10 w-7 shrink-0 overflow-hidden rounded-[3px] shadow-sm">
              <BookCover book={row.book} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[12.5px] font-medium text-st-ink">{row.book.title}</p>
                <Badge tone={row.book.enabled ? "good" : "default"}>{row.book.enabled ? "Live" : "Hidden"}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-st-panel-2">
                  <span className="block h-full rounded-full" style={{ width: `${(row.requests / maxRequests) * 100}%`, background: "var(--st-series-ebook)" }} />
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] text-st-dim">
                  {row.requests} req · {row.downloads} dl
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {(["sent", "pending", "failed"] as const)
                .filter((k) => row[k] > 0)
                .slice(0, 1)
                .map((k) => {
                  const b = DELIVERY_BADGE[k];
                  return (
                    <Badge key={k} tone={b.tone} icon={<Icon name={b.icon} size={11} />}>
                      {row[k]} {b.label}
                    </Badge>
                  );
                })}
            </div>
          </div>
        ))}
        {data.books.length === 0 && <p className="text-[13px] text-st-sub">No books yet.</p>}
      </div>
    </Panel>
  );
}

export function AfterQuizPanel({ data }: { data: DashboardData }) {
  const items = [
    { key: "whatsapp", label: "Opened WhatsApp", value: data.outcomes.whatsapp, total: data.outcomes.total },
    { key: "email", label: "Asked for the plan by e-mail", value: data.outcomes.email, total: data.outcomes.total },
    { key: "none", label: "Only looked", value: data.outcomes.none, total: data.outcomes.total },
  ];
  return (
    <Panel label="After the quiz">
      <MeterList items={items} color="var(--st-series-quiz)" />
    </Panel>
  );
}

export function BudgetsPanel({ data }: { data: DashboardData }) {
  const items: BarItem[] = data.budgets.map((b) => ({ key: b.key, label: b.label, value: b.value }));
  return (
    <Panel label="Budgets">
      <BarList items={items} color="var(--st-series-enquiry)" ranked={false} />
    </Panel>
  );
}

export function TimelinesPanel({ data }: { data: DashboardData }) {
  const items: BarItem[] = data.timelines.map((t) => ({ key: t.key, label: t.label, value: t.value }));
  return (
    <Panel label="When they want to start">
      <BarList items={items} color="var(--st-series-enquiry)" ranked={false} />
    </Panel>
  );
}

/** `wide` picks the column count: 24 hourly columns at ≥1024px, six 4-hour blocks below it (`Heatmap` buckets `data.heat`'s 24 raw hours down to however many `columns` it's given). */
export function BusiestTimesPanel({ data, wide }: { data: DashboardData; wide: boolean }) {
  const hourColumns = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const blockColumns = ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];
  return (
    <Panel label="Busiest times" help="Weekday and hour, across every lead type.">
      <Heatmap grid={data.heat} columns={wide ? hourColumns : blockColumns} />
    </Panel>
  );
}

const FEED_ICON = { enquiry: "mail", book: "books", quiz: "quiz" } as const;
const FEED_TONE = { enquiry: "enquiry", book: "ebook", quiz: "quiz" } as const;

export function LatestActivityPanel({ data }: { data: DashboardData }) {
  return (
    <Panel label="Latest activity">
      <div className="grid min-w-0 gap-1">
        {data.feed.length === 0 && <p className="text-[13px] text-st-sub">Nothing yet — it&apos;ll show up here the moment someone uses the site.</p>}
        {data.feed.map((f) => (
          <Link
            key={`${f.kind}_${f.id}`}
            href={f.href}
            className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-2 transition-colors hover:bg-st-panel-2 sm:gap-3"
          >
            <span className="st-num hidden w-12 shrink-0 text-[11px] text-st-dim sm:inline-block">
              {new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="shrink-0">
              <Badge tone={FEED_TONE[f.kind]} icon={<Icon name={FEED_ICON[f.kind]} size={11} />}>
                {KIND_LABEL[f.kind]}
              </Badge>
            </span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-st-ink">{f.title}</span>
            <span className="shrink-0 text-[11px] text-st-dim">{relativeTime(f.createdAt)}</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function SystemStatusPanel({ data }: { data: DashboardData }) {
  return (
    <Panel label="System status">
      <div className="divide-y divide-st-border">
        {data.status.map((s, i) => (
          <StatusRow key={i} icon={s.icon} tone={s.tone} label={s.label} detail={s.detail} action={s.action} />
        ))}
      </div>
    </Panel>
  );
}

/** The quiz AI, live from the ai_calls log (refreshes every minute). */
export function AiHealthPanel() {
  const ai = useDraft().site.quiz.ai;
  return (
    <Panel label="Quiz AI" right={<Link href="/admin/quiz" className="text-[12px] text-st-purple hover:underline">Quiz → AI settings</Link>}>
      <AiHealthView enabled={ai.enabled} geminiLimit={ai.geminiDailyLimitEstimate} />
    </Panel>
  );
}
