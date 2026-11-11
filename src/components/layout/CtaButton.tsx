"use client";

import type { Cta } from "@/content/types";
import { useQuiz } from "@/components/providers/QuizProvider";
import { useWhatsApp } from "@/components/providers/SiteProvider";

type Props = { cta: Cta; className?: string; style?: React.CSSProperties; children?: React.ReactNode; onBefore?: () => void; "data-cursor"?: string };

/** A button whose text and action come from the admin: opens the quiz, WhatsApp, or a link. */
export function CtaButton({ cta, className, style, children, onBefore, ...rest }: Props) {
  const quiz = useQuiz();
  const wa = useWhatsApp();
  const content = (
    <>
      {cta.label}
      {children}
    </>
  );
  if (cta.action === "quiz") {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => {
          onBefore?.();
          quiz.open();
        }}
        {...rest}
      >
        {content}
      </button>
    );
  }
  const href = cta.action === "whatsapp" ? wa() : cta.href || "#";
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={className} style={style} onClick={onBefore} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} {...rest}>
      {content}
    </a>
  );
}
