"use client";

import { useCallback, useState } from "react";
import { toast } from "@payloadcms/ui";

/** Run one of the admin's own actions (POST /api/nl/…), show the answer as a toast, then refresh. */
export function useAction() {
  const [busy, setBusy] = useState("");
  const run = useCallback(async (path: string, opts: { reload?: boolean; confirm?: string } = {}) => {
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    setBusy(path);
    try {
      const res = await fetch(`/api/nl/${path}`, { method: "POST", credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (res.ok) toast.success(data.message ?? "Done.");
      else toast.error(data.error ?? "That did not work. Please try again.");
      if (res.ok && opts.reload !== false) window.setTimeout(() => window.location.reload(), 900);
    } catch {
      toast.error("Could not reach the server. Please check your connection.");
    } finally {
      setBusy("");
    }
  }, []);
  return { busy, run };
}
