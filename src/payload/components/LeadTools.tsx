"use client";

import { Button } from "@payloadcms/ui";
import { useAction } from "./useAction";

/** Above the list of book requests: approve everything that is waiting, and download the list. */
export function LeadTools() {
  const { busy, run } = useAction();
  return (
    <div className="nl-tools">
      <Button buttonStyle="primary" size="small" disabled={Boolean(busy)} onClick={() => run("leads-send-pending", { confirm: "Send the book to everyone who is waiting for approval?" })}>
        {busy ? "Sending…" : "Approve & send all waiting"}
      </Button>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
      <a className="nl-tools__link" href="/api/nl/export/leads">
        Download as spreadsheet (CSV)
      </a>
    </div>
  );
}
