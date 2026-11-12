"use client";

import { useRowLabel } from "@payloadcms/ui";

/** Collapsed rows in the quiz builder show the question / answer itself instead of "Question 01". */
export function QuestionLabel() {
  const { data, rowNumber } = useRowLabel<{ q?: string; options?: unknown[] }>();
  return (
    <span>
      {String((rowNumber ?? 0) + 1).padStart(2, "0")} · {data?.q || "New question"}
      {data?.options?.length ? <span style={{ opacity: 0.55 }}> — {data.options.length} answers</span> : null}
    </span>
  );
}

export function OptionLabel() {
  const { data } = useRowLabel<{ label?: string; points?: Record<string, number | null> }>();
  const pts = Object.entries(data?.points ?? {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `${k} +${v}`)
    .join(", ");
  return (
    <span>
      {data?.label || "New answer"}
      <span style={{ opacity: 0.55 }}> — {pts || "no points"}</span>
    </span>
  );
}
