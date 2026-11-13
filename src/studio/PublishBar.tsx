"use client";

import { useMemo, useState } from "react";
import { checkWorkspace } from "@/lib/checks";
import { autoLabel, diffDeep, humanizeDiff } from "@/lib/diff";
import { discardDraft, publish } from "@/lib/store";
import { useDraft, usePendingChanges, usePublished } from "./state";
import { Button, Drawer, Pill, confirmDestroy, useToast } from "./ui";

/** The bridge bar: crosses unpublished changes from Draft to Live. Shown whenever they differ. */
export function PublishBar() {
  const pending = usePendingChanges();
  const draft = useDraft();
  const published = usePublished();
  const toast = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);

  const issues = useMemo(() => checkWorkspace(draft), [draft]);
  const errors = issues.filter((i) => i.level === "error");
  const changes = useMemo(() => (reviewOpen ? humanizeDiff(diffDeep(published, draft), autoLabel) : []), [reviewOpen, published, draft]);

  if (!pending) return null;

  const doPublish = () => {
    if (errors.length) {
      toast("bad", `Can't publish yet: ${errors[0].message}`);
      return;
    }
    const summary = humanizeDiff(diffDeep(published, draft), autoLabel);
    publish(summary.slice(0, 40));
    toast("ok", "Published. The website is up to date.");
    setReviewOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-full border border-st-purple/35 bg-st-panel px-3.5 py-1.5 shadow-sm">
        <span className="hidden text-[12px] text-st-sub sm:inline">Draft</span>
        <span className="hidden h-px w-6 border-t border-dashed border-st-purple/50 sm:inline-block" aria-hidden="true" />
        <span className="hidden text-[12px] text-st-sub sm:inline">Live</span>
        <span className="text-[13px] font-semibold text-st-ink">
          {pending} change{pending === 1 ? "" : "s"}
        </span>
        <Button onClick={() => setReviewOpen(true)}>Review</Button>
        <Button variant="primary" onClick={doPublish} disabled={errors.length > 0} title={errors.length ? errors[0].message : undefined}>
          Publish
        </Button>
      </div>

      <Drawer open={reviewOpen} onClose={() => setReviewOpen(false)} title="Review changes">
        {errors.length > 0 && (
          <div className="mb-4 grid gap-2 rounded-xl border border-st-danger/30 bg-st-danger-bg p-3.5">
            <p className="text-[13px] font-semibold text-st-danger">Fix these before publishing:</p>
            {errors.map((e, i) => (
              <p key={i} className="text-[13px] text-st-danger">
                {e.message}
              </p>
            ))}
          </div>
        )}
        {issues.some((i) => i.level === "warning") && (
          <div className="mb-4 grid gap-1.5 rounded-xl border border-st-warn/30 bg-st-warn-bg p-3.5">
            <p className="text-[13px] font-semibold text-st-warn">Worth a look:</p>
            {issues
              .filter((i) => i.level === "warning")
              .map((e, i) => (
                <p key={i} className="text-[13px] text-st-warn">
                  {e.message}
                </p>
              ))}
          </div>
        )}
        <p className="st-label mb-2">{changes.length} change{changes.length === 1 ? "" : "s"}</p>
        <div className="grid gap-1.5">
          {changes.slice(0, 60).map((line, i) => (
            <p key={i} className="rounded-lg bg-st-panel-2 px-3 py-2 text-[12.5px] text-st-ink">
              {line}
            </p>
          ))}
          {changes.length > 60 && <p className="st-help">+{changes.length - 60} more</p>}
        </div>
        <div className="mt-5 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (!confirmDestroy("Discard every unpublished change? This can't be undone.")) return;
              discardDraft();
              setReviewOpen(false);
              toast("ok", "Discarded. The draft matches the live site again.");
            }}
          >
            Discard all
          </Button>
          <Button variant="primary" onClick={doPublish} disabled={errors.length > 0}>
            Publish now
          </Button>
        </div>
      </Drawer>
    </>
  );
}

export function IssuesBadge() {
  const draft = useDraft();
  const issues = useMemo(() => checkWorkspace(draft), [draft]);
  const errors = issues.filter((i) => i.level === "error").length;
  if (!errors) return null;
  return <Pill tone="bad">{errors} to fix</Pill>;
}
