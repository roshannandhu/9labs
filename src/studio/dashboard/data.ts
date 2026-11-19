"use client";

import { useMemo } from "react";
import type { Ebook, Service } from "@/content/site";
import type { BookRequest, Enquiry, QuizResult } from "@/content/types";
import { checkWorkspace, type Issue } from "@/lib/checks";
import { bucketCounts, byWeekdayHour, pctChange, periodTotal, previousPeriodTotal } from "@/lib/metrics";
import { isSample, toFeed } from "../leads";
import { useBookRequests, useDraft, useEnquiries, usePendingChanges, useQuizResults, useSession } from "../state";
import { useNow } from "../ui";

export type Range = 7 | 30 | 90;

const DAY = 86_400_000;

/** Same "last N days, today included" window as `src/lib/metrics.ts`'s `withinDays`, over full objects rather than bare date strings. */
function inRange<T extends { createdAt: string }>(items: T[], days: number, now: number): T[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const since = start.getTime() - (days - 1) * DAY;
  return items.filter((i) => new Date(i.createdAt).getTime() >= since);
}

export type Kpi = { value: number; prev: number; delta: number | null; spark: number[] };
export type StatusItem = { icon: "check" | "alert"; tone: "good" | "warn" | "danger"; label: string; detail?: string; action?: { label: string; href: string } };

/** Where a `checkWorkspace` error (or a related setting) can actually be fixed, in the new 5-room admin. */
function fixHref(path: Issue["path"]): string {
  if (path[0] === "site" && path[1] === "quiz") return "/quiz";
  if (path[0] === "site" && path[1] === "contact") return "/settings?section=company";
  if (path[0] === "site" && path[1] === "ebooks") return "/books";
  return "/settings";
}

const budgetKey = (v: string) => (v.trim() ? v : "Not given");

/** Every number, graph and status row the Dashboard draws — one hook, pure derivation from the store. */
export function useDashboardData(range: Range) {
  const now = useNow();
  const session = useSession();
  const draft = useDraft();
  const enquiries = useEnquiries();
  const bookRequests = useBookRequests();
  const quizResults = useQuizResults();
  const pending = usePendingChanges();

  return useMemo(() => {
    const bucket = range === 90 ? 7 : 1;
    const E = enquiries.map((e) => e.createdAt);
    const B = bookRequests.map((r) => r.createdAt);
    const Q = quizResults.map((r) => r.createdAt);
    const ALL = [...E, ...B, ...Q];
    const WA = [...enquiries.filter((e) => e.channel === "whatsapp").map((e) => e.createdAt), ...quizResults.filter((r) => r.action === "whatsapp").map((r) => r.createdAt)];

    const kpi = (dates: string[]): Kpi => {
      const value = periodTotal(dates, range, now);
      const prev = previousPeriodTotal(dates, range, now);
      return { value, prev, delta: pctChange(value, prev), spark: bucketCounts(dates, range, bucket, now).map((b) => b.count) };
    };

    const eR = inRange(enquiries, range, now);
    const bR = inRange(bookRequests, range, now);
    const qR = inRange(quizResults, range, now);

    const services = draft.site.services
      .map((s: Service) => ({ slug: s.slug, short: s.short, icon: s.icon, enquiries: eR.filter((e) => e.service === s.slug).length, quiz: qR.filter((q) => q.top === s.title).length }))
      .sort((a, b) => b.enquiries + b.quiz - (a.enquiries + a.quiz));

    const books = draft.site.ebooks.map((b: Ebook) => {
      const rows = bR.filter((r) => r.bookSlug === b.slug);
      return {
        book: b,
        requests: rows.length,
        downloads: rows.reduce((sum, r) => sum + r.downloads, 0),
        pending: rows.filter((r) => r.status === "pending").length,
        sent: rows.filter((r) => r.status === "sent").length,
        failed: rows.filter((r) => r.status === "failed").length,
      };
    });

    const outcomes = { whatsapp: qR.filter((q) => q.action === "whatsapp").length, email: qR.filter((q) => q.action === "email").length, none: qR.filter((q) => q.action === "none").length, total: qR.length };

    const budgetOrder = [...draft.site.enquiry.budgets, "Not given"];
    const budgets = budgetOrder.map((label) => ({ key: label, label, value: eR.filter((e) => budgetKey(e.budget) === label).length })).filter((b, i) => b.value > 0 || i < draft.site.enquiry.budgets.length);

    const timelineOrder = [...draft.site.enquiry.timelines, "Not given"];
    const timelines = timelineOrder.map((label) => ({ key: label, label, value: eR.filter((e) => budgetKey(e.timeline) === label).length })).filter((t, i) => t.value > 0 || i < draft.site.enquiry.timelines.length);

    const issues = checkWorkspace(draft);
    const errors = issues.filter((i) => i.level === "error");
    const liveNoPdf = draft.site.ebooks.filter((b: Ebook) => b.enabled && !b.pdfFileId);
    const whatsappOk = /^\d{8,15}$/.test(draft.site.contact.whatsappNumber);
    const analyticsOn = !!(draft.site.integrations.ga4 || draft.site.integrations.gtm);
    const hasSampleData = [...enquiries, ...bookRequests, ...quizResults].some((l) => isSample(l.id));

    const status: StatusItem[] = [
      pending > 0
        ? { icon: "alert", tone: "warn", label: `${pending} unpublished change${pending === 1 ? "" : "s"}`, action: { label: "Review", href: "/" } }
        : { icon: "check", tone: "good", label: "Website is up to date" },
      errors.length > 0
        ? { icon: "alert", tone: "danger", label: `${errors.length} to fix before publishing`, detail: errors[0].message, action: { label: "Fix it", href: fixHref(errors[0].path) } }
        : { icon: "check", tone: "good", label: "No blocking problems" },
      liveNoPdf.length > 0
        ? { icon: "alert", tone: "warn", label: `${liveNoPdf.length} book${liveNoPdf.length === 1 ? "" : "s"} without a PDF`, action: { label: "Open Books", href: "/books" } }
        : { icon: "check", tone: "good", label: "Every live book has a PDF" },
      whatsappOk ? { icon: "check", tone: "good", label: "WhatsApp number is set" } : { icon: "alert", tone: "danger", label: "No WhatsApp number set", action: { label: "Add it", href: "/settings?section=company" } },
      analyticsOn ? { icon: "check", tone: "good", label: "Analytics connected" } : { icon: "alert", tone: "warn", label: "Analytics not set", action: { label: "Open Settings", href: "/settings?section=google" } },
      hasSampleData
        ? { icon: "alert", tone: "warn", label: "Demo data is showing", action: { label: "Remove it", href: "/settings?section=backup" } }
        : { icon: "check", tone: "good", label: "Real data only" },
    ];

    return {
      session,
      kpis: { total: kpi(ALL), enquiries: kpi(E), ebooks: kpi(B), quiz: kpi(Q), whatsapp: kpi(WA) },
      overTime: {
        enquiries: { id: "enquiries", label: "Enquiries", color: "var(--st-series-enquiry)", points: bucketCounts(E, range, bucket, now) },
        ebooks: { id: "ebooks", label: "E-books", color: "var(--st-series-ebook)", points: bucketCounts(B, range, bucket, now) },
        quiz: { id: "quiz", label: "Quiz", color: "var(--st-series-quiz)", points: bucketCounts(Q, range, bucket, now) },
      },
      mix: { enquiries: eR.length, ebooks: bR.length, quiz: qR.length },
      channel: { whatsapp: eR.filter((e) => e.channel === "whatsapp").length, email: eR.filter((e) => e.channel === "email").length },
      followThrough: qR.length ? Math.round(((outcomes.whatsapp + outcomes.email) / qR.length) * 100) : 0,
      services,
      books,
      outcomes,
      budgets,
      timelines,
      heat: byWeekdayHour(ALL, range, now),
      feed: toFeed(enquiries, bookRequests, quizResults, draft.site.ebooks).slice(0, 12),
      status,
    };
  }, [range, now, draft, enquiries, bookRequests, quizResults, pending, session]);
}

export type DashboardData = ReturnType<typeof useDashboardData>;
export type { BookRequest, Enquiry, QuizResult };
