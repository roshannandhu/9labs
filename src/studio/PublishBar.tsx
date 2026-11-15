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
  if (path[0] === "site" && path[1] === "quiz") return "/admin/quiz";
  if (path[0] === "site" && path[1] === "contact") return "/admin/settings?section=company";
  if (path[0] === "site" && path[1] === "ebooks") return "/admin/books";
  return "/admin/settings";
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
      await publish(summary.slice(0, 40));
      toast("ok", "Published — the website is up to date.");
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
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-3 sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:px-0">
      <div className="st-panel relative flex w-full max-w-[560px] items-center gap-3 rounded-2xl px-4 py-3 sm:w-auto sm:rounded-full sm:px-3.5 sm:py-2">
        <LiveDot tone={errors.length ? "danger" : "warn"} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-st-ink">
            {pending} unpublished change{pending === 1 ? "" : "s"}
          </p>
          {errors.length ? (
            <button type="button" onClick={() => setIssuesOpen((v) => !v)} className="truncate text-left text-[12px] text-st-danger hover:underline">
              {errors[0].message} {errors.length > 1 && `+${errors.length - 1} more`}
            </button>
          ) : (
            <p className="truncate text-[12px] text-st-dim">Visitors still see the previous version.</p>
          )}
        </div>
        <Button onClick={() => void doDiscard()} disabled={busy}>
          Discard
        </Button>
        <Button variant="primary" onClick={() => void doPublish()} disabled={errors.length > 0 || busy} title={errors.length ? errors[0].message : undefined}>
          {busy ? "Publishing…" : "Publish"}
        </Button>

        {issuesOpen && errors.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIssuesOpen(false)} />
            <div className="absolute bottom-full left-0 z-20 mb-2 w-[320px] rounded-xl border border-st-border bg-st-panel p-2 shadow-[var(--st-shadow)]">
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
