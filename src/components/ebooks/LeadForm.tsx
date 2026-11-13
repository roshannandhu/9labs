"use client";

import { useId, useRef, useState } from "react";
import { fill, type Ebook } from "@/content/site";
import type { SiteData } from "@/content/types";
import { useSite } from "@/components/providers/SiteProvider";
import { submitEbookRequest } from "@/lib/local/backend";

export type LeadValues = {
  name: string;
  email: string;
  code: string;
  phone: string;
  company: string;
  consent: boolean;
  /** true when the e-mail went out straight away; false when the request waits for approval */
  sent?: boolean;
};
type Errors = Partial<Record<keyof LeadValues, string>>;

function validate(v: LeadValues, f: SiteData["ebookForm"]): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Please enter a valid email.";
  const digits = v.phone.replace(/\D/g, "");
  if (f.phoneRequired || digits.length) {
    if (digits.length < 7 || digits.length > 14) e.phone = "Please enter a valid phone number.";
  }
  if (!v.consent) e.consent = "Please agree so we can send the e-book.";
  return e;
}

/**
 * E-book request form. Sends the request to the site (POST /api/public/ebook-requests): it is
 * saved for the admin, who approves it — or it is e-mailed straight away when automatic sending
 * is on. Every label comes from the admin (Books → Book settings → Request form).
 */
export function LeadForm({ book, onDone, compact = false }: { book: Ebook; onDone: (v: LeadValues) => void; compact?: boolean }) {
  const uid = useId();
  const f = useSite().ebookForm;
  const codes = f.codes.length ? f.codes : [{ code: "+971", label: "UAE +971" }];
  const [v, setV] = useState<LeadValues>({ name: "", email: "", code: codes.some((c) => c.code === f.defaultCode) ? f.defaultCode : codes[0].code, phone: "", company: "", consent: false });
  const [touched, setTouched] = useState<Partial<Record<keyof LeadValues, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState("");
  // spam traps: a field people never see, and how long the form was open
  const [trap, setTrap] = useState("");
  const opened = useRef(0);
  const errors = validate(v, f);
  const show = (k: keyof LeadValues) => (touched[k] ? errors[k] : undefined);
  const set = <K extends keyof LeadValues>(k: K, val: LeadValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const fieldBase = "rounded-xl border bg-white/[0.04] px-3.5 text-[16px] text-white placeholder:text-white/35 transition-colors focus:outline-none focus:border-nl-purple/80 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--nl-purple)_18%,transparent)]";
  const field = `w-full min-w-0 ${fieldBase}`;
  const h = compact ? "h-11" : "h-[42px] md:h-[38px]";
  const border = (k: keyof LeadValues) => (show(k) ? "border-red-400/70" : "border-white/12");
  const errCls = "mt-1 text-[11px] leading-tight text-red-600 [[data-theme='dark']_&]:text-red-300 [.paper_&]:!text-red-600";

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      // phones: keep the field being typed in above the on-screen keyboard
      onFocusCapture={(e) => {
        if (!opened.current) opened.current = Date.now();
        if (window.matchMedia("(max-width: 767px)").matches && e.target instanceof HTMLElement) {
          const el = e.target;
          window.setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
        }
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true, consent: true });
        if (Object.keys(errors).length) {
          const first = (e.currentTarget.querySelector("[aria-invalid='true']") as HTMLElement | null) ?? null;
          first?.focus();
          return;
        }
        setSubmitting(true);
        setFailed("");
        const res = await submitEbookRequest({
          bookSlug: book.slug,
          name: v.name.trim(),
          email: v.email.trim(),
          code: v.code,
          phone: v.phone.trim(),
          company: v.company.trim(),
          consent: v.consent,
          trap,
          elapsedMs: opened.current ? Date.now() - opened.current : 0,
          source: window.location.pathname,
        });
        setSubmitting(false);
        if (res.status === "error") {
          setFailed(res.error || f.error);
          return;
        }
        onDone({ ...v, sent: res.status === "sent" });
      }}
    >
      <p className="label-mono !text-[11px] !text-nl-purple">{fill(f.eyebrow, { n: book.n })}</p>
      <h3 className="mt-1 text-[19px] font-semibold leading-tight">{f.title}</h3>
      <p className="mt-1 text-[12.5px] leading-snug text-nl-ink">{fill(f.text, { title: book.title })}</p>

      <div className={`mb-5 mt-4 md:mb-3.5 md:mt-3 flex flex-col ${compact ? "gap-3.5" : "gap-2.5 md:gap-2"}`}>
        <div>
          <label htmlFor={`${uid}-name`} className="mb-1 block text-[12px] font-medium text-white/70">
            {f.nameLabel}
          </label>
          <input
            id={`${uid}-name`}
            className={`${field} ${h} ${border("name")}`}
            value={v.name}
            autoComplete="name"
            maxLength={120}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={!!show("name")}
            aria-describedby={show("name") ? `${uid}-name-err` : undefined}
            placeholder={f.namePlaceholder}
          />
          {show("name") && (
            <p id={`${uid}-name-err`} className={errCls}>
              {show("name")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-email`} className="mb-1 block text-[12px] font-medium text-white/70">
            {f.emailLabel}
          </label>
          <input
            id={`${uid}-email`}
            type="email"
            className={`${field} ${h} ${border("email")}`}
            value={v.email}
            autoComplete="email"
            inputMode="email"
            maxLength={200}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!show("email")}
            aria-describedby={show("email") ? `${uid}-email-err` : undefined}
            placeholder={f.emailPlaceholder}
          />
          {show("email") && (
            <p id={`${uid}-email-err`} className={errCls}>
              {show("email")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="mb-1 block text-[12px] font-medium text-white/70">
            {f.phoneLabel} {!f.phoneRequired && <span className="text-white/35">(optional)</span>}
          </label>
          <div className="flex gap-2">
            <label htmlFor={`${uid}-code`} className="sr-only">
              Country code
            </label>
            <select
              id={`${uid}-code`}
              className={`${fieldBase} ${h} w-[138px] shrink-0 border-white/12 !px-2.5`}
              value={v.code}
              onChange={(e) => set("code", e.target.value)}
            >
              {codes.map((c) => (
                <option key={c.code + c.label} value={c.code} className="bg-paper text-[#0e0c20]">
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
              maxLength={24}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              aria-invalid={!!show("phone")}
              aria-describedby={show("phone") ? `${uid}-phone-err` : undefined}
              placeholder={f.phonePlaceholder}
            />
          </div>
          {show("phone") && (
            <p id={`${uid}-phone-err`} className={errCls}>
              {show("phone")}
            </p>
          )}
        </div>
        {f.showCompany && (
          <div>
            <label htmlFor={`${uid}-company`} className="mb-1 block text-[12px] font-medium text-white/70">
              {f.companyLabel} <span className="text-white/35">(optional)</span>
            </label>
            <input
              id={`${uid}-company`}
              className={`${field} ${h} border-white/12`}
              value={v.company}
              autoComplete="organization"
              maxLength={160}
              onChange={(e) => set("company", e.target.value)}
              placeholder={f.companyPlaceholder}
            />
          </div>
        )}
        {/* not for people: left empty by a real visitor */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
          </label>
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
            <span>{f.consent}</span>
          </label>
          {show("consent") && <p className={errCls}>{show("consent")}</p>}
        </div>
      </div>

      {failed && (
        <p className={`${errCls} mb-2 !text-[12.5px]`} role="alert">
          {failed}
        </p>
      )}
      <button type="submit" disabled={submitting} className="btn btn-primary btn-sm mt-auto w-full !min-h-[46px] disabled:opacity-80" data-cursor="Send">
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" aria-hidden="true" />
            {f.sending}
          </>
        ) : (
          <>{f.submit}</>
        )}
      </button>
    </form>
  );
}
