"use client";

import { Button, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useAction } from "./useAction";

const HELP: Record<string, string> = {
  pending: "This request is waiting. Approve it to e-mail the book, or reject it.",
  sent: "The book was sent. You can send it again — the visitor then gets a fresh link.",
  failed: "The e-mail could not be sent (see “Problem” on the right). Fix it, then send again.",
  rejected: "This request was rejected. Nothing was sent. You can still approve it.",
};

/** The buttons at the top of a book request: Approve & send, Send again, Reject. */
export function LeadActions() {
  const { id } = useDocumentInfo();
  const status = useFormFields(([fields]) => String(fields.status?.value ?? "pending"));
  const { busy, run } = useAction();
  if (!id) return <p className="nl-note">Requests are created by the website’s e-book form.</p>;
  const sent = status === "sent";
  return (
    <div className="nl-actions">
      <p className="nl-actions__help">{HELP[status] ?? HELP.pending}</p>
      <div className="nl-actions__row">
        <Button buttonStyle="primary" size="medium" disabled={Boolean(busy)} onClick={() => run(`leads/${id}/send`)}>
          {busy.endsWith("/send") ? "Sending…" : sent ? "Send again" : "Approve & send"}
        </Button>
        {!sent && status !== "rejected" && (
          <Button buttonStyle="secondary" size="medium" disabled={Boolean(busy)} onClick={() => run(`leads/${id}/reject`, { confirm: "Reject this request? No e-mail will be sent." })}>
            Reject
          </Button>
        )}
      </div>
    </div>
  );
}
