"use client";

import { Button } from "@payloadcms/ui";
import { useAction } from "./useAction";

/** "Send me a test": e-mails the saved e-book message to the signed-in admin. */
export function TestEmail() {
  const { busy, run } = useAction();
  return (
    <div className="nl-actions">
      <p className="nl-actions__help">See the e-mail exactly as a visitor gets it. It uses the saved texts, so press Save first if you changed something.</p>
      <Button buttonStyle="secondary" size="medium" disabled={Boolean(busy)} onClick={() => run("test-email", { reload: false })}>
        {busy ? "Sending…" : "Send me a test e-mail"}
      </Button>
    </div>
  );
}
