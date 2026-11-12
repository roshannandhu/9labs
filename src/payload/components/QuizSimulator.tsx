"use client";

import { useEffect, useMemo, useState } from "react";
import { useAllFormFields } from "@payloadcms/ui";
import { reduceFieldsToValues } from "payload/shared";
import { site as defaults, type IconKey, type QuizQuestion, type Service } from "@/content/site";
import { scoreQuiz, type QuizAnswers } from "@/lib/quiz/score";

type Row = { id?: string; q?: string; label?: string; hint?: string; multi?: boolean; role?: string; options?: { id?: string; label?: string; only?: boolean; points?: Record<string, number | null> }[] };
type Form = { questions?: Row[]; result?: Partial<typeof defaults.quiz.result> };

/**
 * "Try it": answer the questions as they are on this screen right now (saved or not) and see
 * what the quiz would recommend. It runs the very same scoring as the website.
 */
export function QuizSimulator() {
  const [fields] = useAllFormFields();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [services, setServices] = useState<Service[]>(defaults.services);

  // the cards' current names (the icons and order are fixed)
  useEffect(() => {
    if (!open) return;
    fetch("/api/services?limit=20&sort=n&depth=0", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { docs?: { n: number; title: string; short: string; description: string }[] } | null) => {
        if (!d?.docs) return;
        setServices(defaults.services.map((s) => ({ ...s, ...(d.docs!.find((x) => x.n === s.n) ?? {}) })));
      })
      .catch(() => {});
  }, [open]);

  const form = useMemo(() => reduceFieldsToValues(fields, true) as Form, [fields]);
  const questions: QuizQuestion[] = useMemo(
    () =>
      (form.questions ?? []).map((q, i) => ({
        id: q.id || `q${i}`,
        label: q.label || `Question ${i + 1}`,
        q: q.q || "",
        multi: Boolean(q.multi),
        role: q.role === "who" || q.role === "goal" || q.role === "when" ? q.role : undefined,
        options: (q.options ?? []).map((o, j) => ({
          id: o.id || `q${i}o${j}`,
          label: o.label || `Answer ${j + 1}`,
          only: Boolean(o.only),
          weights: Object.fromEntries(Object.entries(o.points ?? {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])) as Partial<Record<IconKey, number>>,
        })),
      })),
    [form.questions],
  );

  const result = useMemo(() => {
    const r = { ...defaults.quiz.result };
    for (const [k, v] of Object.entries(form.result ?? {})) {
      if (k === "steps") {
        if (Array.isArray(v) && v.length) r.steps = v.map((s) => ({ title: String(s.title ?? ""), text: String(s.text ?? "") }));
      } else if (v !== null && v !== undefined && v !== "") {
        (r as Record<string, unknown>)[k] = v;
      }
    }
    return scoreQuiz({ services, quiz: { ...defaults.quiz, questions, result: r } }, answers);
  }, [answers, questions, services, form.result]);

  const answered = Object.values(answers).some((a) => a.length);
  const pick = (q: QuizQuestion, id: string) =>
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      if (!q.multi) return { ...a, [q.id]: cur[0] === id ? [] : [id] };
      const only = new Set(q.options.filter((o) => o.only).map((o) => o.id));
      if (cur.includes(id)) return { ...a, [q.id]: cur.filter((x) => x !== id) };
      return { ...a, [q.id]: only.has(id) ? [id] : [...cur.filter((x) => !only.has(x)), id] };
    });

  return (
    <div className="nl-sim">
      <button type="button" className="nl-sim__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <strong>Try the quiz</strong> — answer the questions below as a visitor would and see what is recommended {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="nl-sim__body">
          <div className="nl-sim__questions">
            {questions.map((q, i) => (
              <fieldset key={q.id}>
                <legend>
                  {i + 1}. {q.q || "(no question text yet)"} {q.multi && <em>— several allowed</em>}
                </legend>
                <div className="nl-sim__options">
                  {q.options.map((o) => {
                    const on = (answers[q.id] ?? []).includes(o.id);
                    return (
                      <button key={o.id} type="button" className={on ? "is-on" : ""} aria-pressed={on} onClick={() => pick(q, o.id)}>
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="nl-sim__result" aria-live="polite">
            <p className="nl-sim__title">What the visitor would see</p>
            {!answered ? (
              <p className="nl-note">Pick some answers to see the recommendation.</p>
            ) : (
              <>
                <p>{result.summary}</p>
                <ol>
                  {result.matches.map((m) => (
                    <li key={m.service.slug}>
                      <strong>
                        {m.service.title} — {m.score}%
                      </strong>
                      <span>{m.why}</span>
                    </li>
                  ))}
                </ol>
                <button type="button" className="nl-sim__reset" onClick={() => setAnswers({})}>
                  Clear answers
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
