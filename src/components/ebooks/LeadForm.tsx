"use client";

import { useId, useState } from "react";
import type { Ebook } from "@/content/site";

const CODES = [
  { code: "+971", label: "UAE +971" },
  { code: "+966", label: "KSA +966" },
  { code: "+974", label: "QA +974" },
  { code: "+965", label: "KW +965" },
  { code: "+973", label: "BH +973" },
  { code: "+968", label: "OM +968" },
  { code: "+91", label: "IN +91" },
  { code: "+44", label: "UK +44" },
  { code: "+1", label: "US +1" },
];

export type LeadValues = { name: string; email: string; code: string; phone: string; company: string; consent: boolean };
type Errors = Partial<Record<keyof LeadValues, string>>;

function validate(v: LeadValues): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Please enter a valid email.";
  const digits = v.phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 14) e.phone = "Please enter a valid phone number.";
  if (!v.consent) e.consent = "Please agree so we can send the e-book.";
  return e;
}

/**
 * E-book request form (demo: validates and fakes a submit).
 * Production: POST /api/ebook-requests → lead saved in D1 → admin approval → email with a
 * signed download link (see docs/PROJECT_PLAN.md).
 */
export function LeadForm({ book, onDone, compact = false }: { book: Ebook; onDone: (v: LeadValues) => void; compact?: boolean }) {
  const uid = useId();
  const [v, setV] = useState<LeadValues>({ name: "", email: "", code: "+971", phone: "", company: "", consent: false });
  const [touched, setTouched] = useState<Partial<Record<keyof LeadValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const errors = validate(v);
  const show = (k: keyof LeadValues) => (touched[k] ? errors[k] : undefined);
  const set = <K extends keyof LeadValues>(k: K, val: LeadValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const fieldBase = "rounded-xl border bg-black/30 px-3.5 text-[14.5px] text-white placeholder:text-white/30 transition-colors focus:outline-none focus:border-nl-purple/80 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--nl-purple)_18%,transparent)]";
  const field = `w-full min-w-0 ${fieldBase}`;
  const h = compact ? "h-11" : "h-[42px]";
  const border = (k: keyof LeadValues) => (show(k) ? "border-red-400/70" : "border-white/12");

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true, consent: true });
        if (Object.keys(errors).length) {
          const first = (e.currentTarget.querySelector("[aria-invalid='true']") as HTMLElement | null) ?? null;
          first?.focus();
          return;
        }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 1200));
        setSubmitting(false);
        onDone(v);
      }}
    >
      <p className="label-mono !text-[11px] !text-nl-purple">Free e-book · {book.n}</p>
      <h3 className="mt-1 text-[19px] font-semibold leading-tight">Where should we send it?</h3>
      <p className="mt-1 text-[12.5px] leading-snug text-nl-ink">We’ll email you a private download link for “{book.title}”.</p>

      <div className={`mb-5 mt-4 flex flex-col ${compact ? "gap-3.5" : "gap-2.5"}`}>
        <div>
          <label htmlFor={`${uid}-name`} className="mb-1 block text-[12px] font-medium text-white/70">
            Full name
          </label>
          <input
            id={`${uid}-name`}
            className={`${field} ${h} ${border("name")}`}
            value={v.name}
            autoComplete="name"
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={!!show("name")}
            aria-describedby={show("name") ? `${uid}-name-err` : undefined}
            placeholder="Your name"
          />
          {show("name") && (
            <p id={`${uid}-name-err`} className="mt-1 text-[11.5px] text-red-300">
              {show("name")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1 block text-[12px] font-medium text-white/70">
            Email
          </label>
          <input
            id={`${uid}-email`}
            type="email"
            className={`${field} ${h} ${border("email")}`}
            value={v.email}
            autoComplete="email"
            inputMode="email"
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!show("email")}
            aria-describedby={show("email") ? `${uid}-email-err` : undefined}
            placeholder="you@company.com"
          />
          {show("email") && (
            <p id={`${uid}-email-err`} className="mt-1 text-[11.5px] text-red-300">
              {show("email")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="mb-1 block text-[12px] font-medium text-white/70">
            Phone / WhatsApp
          </label>
          <div className="flex gap-2">
            <label htmlFor={`${uid}-code`} className="sr-only">
              Country code
            </label>
            <select
              id={`${uid}-code`}
              className={`${fieldBase} ${h} w-[122px] shrink-0 border-white/12 px-2.5`}
              value={v.code}
              onChange={(e) => set("code", e.target.value)}
            >
              {CODES.map((c) => (
                <option key={c.code} value={c.code} className="bg-paper text-[#0e0c20]">
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id={`${uid}-phone`}
              type="tel"
              className={`${field} ${h} ${border("phone")}`}
              value={v.phone}
              autoComplete="tel-national"
              inputMode="tel"
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              aria-invalid={!!show("phone")}
              aria-describedby={show("phone") ? `${uid}-phone-err` : undefined}
              placeholder="50 123 4567"
            />
          </div>
          {show("phone") && (
            <p id={`${uid}-phone-err`} className="mt-1 text-[11.5px] text-red-300">
              {show("phone")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-company`} className="mb-1 block text-[12px] font-medium text-white/70">
            Company <span className="text-white/35">(optional)</span>
          </label>
          <input
            id={`${uid}-company`}
            className={`${field} ${h} border-white/12`}
            value={v.company}
            autoComplete="organization"
            onChange={(e) => set("company", e.target.value)}
            placeholder="Company name"
          />
        </div>
        <div>
          <label className={`flex cursor-pointer items-start gap-2.5 text-[11.5px] leading-snug text-white/60 ${compact ? "py-1.5" : ""}`}>
            <input
              type="checkbox"
              checked={v.consent}
              onChange={(e) => {
                set("consent", e.target.checked);
                setTouched((t) => ({ ...t, consent: true }));
              }}
              aria-invalid={!!show("consent")}
              className={`mt-0.5 shrink-0 accent-[var(--nl-purple)] ${compact ? "h-5 w-5" : "h-4 w-4"}`}
            />
            <span>I agree to receive this e-book and occasional updates from Nine Labs Solutions. Unsubscribe anytime.</span>
          </label>
          {show("consent") && <p className="mt-1 text-[11.5px] text-red-300">{show("consent")}</p>}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm mt-auto w-full !min-h-[46px] disabled:opacity-80" data-cursor="Send">
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>Send me the e-book</>
        )}
      </button>
    </form>
  );
}
