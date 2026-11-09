"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const EnquirySheet = dynamic(() => import("./EnquirySheet"), { ssr: false });

type EnquiryCtx = { open: (slug?: string) => void; close: () => void };
const Ctx = createContext<EnquiryCtx | null>(null);

/** "Talk to us about this": opens the enquiry window, optionally with an activity pre-selected. */
export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [mounted, setMounted] = useState(false);

  const open = useCallback((s?: string) => {
    setSlug(s ?? "");
    setMounted(true);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && <EnquirySheet open={isOpen} slug={slug} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useEnquiry() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEnquiry must be used inside <EnquiryProvider>");
  return ctx;
}
