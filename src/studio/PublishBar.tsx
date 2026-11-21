"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { checkWorkspace, type Issue } from "@/lib/checks";
import { autoLabel, diffDeep, humanizeDiff } from "@/lib/diff";
import { discardDraft, publish } from "@/studio/store";
import { ApiError } from "./api";
import { Icon } from "./Icon";
import { useDraft, usePendingChanges, usePublished } from "./state";
import { Button, LiveDot, useConfirm, useToast } from "./ui";

/** Where a `checkWorkspace` error can actually be fixed, in the new 5-room admin. */
function fixHref(path: Issue["path"]): string {
  if (path[0] === "site" && path[1] === "quiz") return "/quiz";
  if (path[0] === "site" && path[1] === "contact") return "/settings?section=company";
  if (path[0] === "site" && path[1] === "ebooks") return "/books";
  return "/settings";
}

/** The bridge bar: crosses unpublished changes from Draft to Live. A floating pill on laptop, a full-width bar above the bottom tabs on phone. Shown only when there's something to cross. */
export function PublishBar() {
  const pending = usePendingChanges();
  const draft = useDraft();
  const published = usePublished();
  const toast = useToast();
  const confirm = useConfirm();
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const issues = useMemo(() => checkWorkspace(draft), [draft]);
  const errors = issues.filter((i) => i.level === "error");

  if (!pending) return null;

  const doPublish = async () => {
    if (errors.length) {
      toast("bad", `Can't publish yet: ${errors[0].message}`);
      return;
    }
    setBusy(true);
    try {
      const summary = humanizeDiff(diffDeep(published, draft), autoLabel);
      toast("ok", await publish(summary.slice(0, 40)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) toast("bad", "Someone else changed the draft — reload.");
      else if (err instanceof ApiError && err.status === 422) toast("bad", `Can't publish yet: ${((err.details?.issues as Issue[] | undefined) ?? [])[0]?.message ?? err.message}`);
      else toast("bad", err instanceof Error ? err.message : "Could not publish.");
    } finally {
      setBusy(false);
    }
  };

  const doDiscard = async () => {
    const ok = await confirm({ title: "Discard every unpublished change?", body: "This can't be undone — the draft goes back to matching the live site.", confirmLabel: "Discard", danger: true });
    if (!ok) return;
    discardDraft();
    toast("ok", "Discarded. The draft matches the live site again.");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-3 sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:px-0">
      <div className="st-panel pointer-events-auto relative flex w-full max-w-[560px] flex-col gap-2 rounded-2xl p-3 shadow-lg sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:px-3.5 sm:py-2">
        {/* Mobile top row / Desktop main row */}
        <div className="flex min-w-0 items-center justify-between gap-3 sm:contents">
          <div className="flex min-w-0 items-center gap-2.5 sm:contents">
            <LiveDot tone={errors.length ? "danger" : "warn"} />
            <div className="min-w-0 flex-1 sm:max-w-[260px]">
              <p className="truncate text-[13px] font-semibold text-st-ink">
                {pending} unpublished change{pending === 1 ? "" : "s"}
              </p>
              {/* Desktop subtitle */}
              <div className="hidden sm:block">
                {errors.length ? (
                  <button type="button" onClick={() => setIssuesOpen((v) => !v)} className="block w-full truncate text-left text-[12px] text-st-danger hover:underline">
                    {errors[0].message} {errors.length > 1 && `+${errors.length - 1} more`}
                  </button>
                ) : (
                  <p className="truncate text-[12px] text-st-dim">Visitors still see the previous version.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button onClick={() => void doDiscard()} disabled={busy} className="h-8 px-2.5 text-[12px] sm:h-9 sm:px-3.5 sm:text-[13px]">
              Discard
            </Button>
            <Button variant="primary" onClick={() => void doPublish()} disabled={errors.length > 0 || busy} title={errors.length ? errors[0].message : undefined} className="h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:text-[13px]">
              {busy ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Mobile-only secondary row: error notice or hint */}
        <div className="min-w-0 sm:hidden">
          {errors.length ? (
            <button
              type="button"
              onClick={() => setIssuesOpen((v) => !v)}
              className="flex w-full min-w-0 items-center gap-1.5 border-t border-st-border/60 pt-1.5 text-left text-[11.5px] text-st-danger hover:underline"
            >
              <span className="shrink-0 text-st-danger"><Icon name="alert" size={12} /></span>
              <span className="min-w-0 flex-1 truncate">{errors[0].message}</span>
              {errors.length > 1 && (
                <span className="shrink-0 rounded bg-st-danger/10 px-1 py-0.5 font-mono text-[10px] font-semibold">
                  +{errors.length - 1}
                </span>
              )}
            </button>
          ) : (
            <p className="truncate border-t border-st-border/40 pt-1 text-[11px] text-st-dim">
              Visitors still see the previous version.
            </p>
          )}
        </div>

        {/* Issues popover */}
        {issuesOpen && errors.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIssuesOpen(false)} />
            <div className="absolute bottom-full left-1/2 z-20 mb-2 w-[calc(100vw-32px)] max-w-[340px] -translate-x-1/2 rounded-xl border border-st-border bg-st-panel p-2 shadow-[var(--st-shadow)] sm:left-0 sm:w-[320px] sm:translate-x-0">
              <p className="st-micro px-2 py-1.5">Fix before publishing</p>
              {errors.map((e, i) => (
                <Link key={i} href={fixHref(e.path)} onClick={() => setIssuesOpen(false)} className="flex items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-st-panel-2">
                  <span className="mt-0.5 shrink-0 text-st-danger">
                    <Icon name="alert" size={13} />
                  </span>
                  <span className="text-[12.5px] leading-snug text-st-ink">{e.message}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
