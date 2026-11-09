"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const QuizOverlay = dynamic(() => import("@/components/quiz/QuizOverlay"), { ssr: false });

/** `open(first?)`: optionally with question 1 already answered (an option id), e.g. from the quiz section. */
type QuizCtx = { open: (first?: string) => void; close: () => void; isOpen: boolean };
const Ctx = createContext<QuizCtx | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [mounted, setMounted] = useState(false);

  const open = useCallback((answer?: string) => {
    setFirst(answer ?? "");
    setMounted(true);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {mounted && <QuizOverlay open={isOpen} first={first} onClose={close} />}
    </Ctx.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuiz must be used inside <QuizProvider>");
  return ctx;
}
