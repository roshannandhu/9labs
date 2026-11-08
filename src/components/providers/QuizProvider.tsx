"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const QuizOverlay = dynamic(() => import("@/components/quiz/QuizOverlay"), { ssr: false });

type QuizCtx = { open: (prefill?: string) => void; close: () => void; isOpen: boolean };
const Ctx = createContext<QuizCtx | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [prefill, setPrefill] = useState("");
  const [mounted, setMounted] = useState(false);

  const open = useCallback((text?: string) => {
    setPrefill(text ?? "");
    setMounted(true);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && <QuizOverlay open={isOpen} prefill={prefill} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuiz must be used inside <QuizProvider>");
  return ctx;
}
