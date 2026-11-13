"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { fill } from "@/content/site";
import type { EnquiryFieldKey } from "@/content/types";
import { useSite } from "@/components/providers/SiteProvider";
import { submitEnquiry } from "@/lib/local/backend";
import { useModalLock } from "@/lib/useModalLock";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useDemo } from "@/components/providers/DemoSettings";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";

const ease = [0.16, 1, 0.3, 1] as const;

function Chips({ label, options, value, multi, onChange }: { label: string; options: string[]; value: string[]; multi?: boolean; onChange: (update: (v: string[]) => string[]) => void }) {
  return (
    <fieldset>
      <legend className="label-mono">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onChange((v) => (multi ? (v.includes(o) ? v.filter((x) => x !== o) : [...v, o]) : v[0] === o ? [] : [o]))}
              className={`rounded-full border px-3.5 py-2 text-[14px] transition-colors ${on ? "border-transparent bg-[linear-gradient(120deg,var(--brand-a),#5a7bf0)] text-paper" : "border-white/14 bg-[var(--chip-bg)] text-white/80 hover:border-[color:var(--brand-a)]/60"}`}
            >
              {on && multi ? "✓ " : ""}
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const field = "mt-1.5 block w-full rounded-2xl border border-white/14 bg-[var(--chip-bg)] px-4 py-3 text-[16px] text-white placeholder:text-white/35 transition-colors focus:border-[color:var(--brand-a)] focus:outline-none";

/**
 * "Talk to us about this": a quick enquiry window. The blocks shown, their order, which are
 * required, the WhatsApp message and what happens right after sending are all set in the admin
 * (The 9 cards → Talk-to-us window). The message itself comes from `buildEnquiryMessage` via
 * `submitEnquiry` (`src/lib/local/backend.ts`), which also saves the enquiry for the admin.
 */
export default function EnquirySheet({ open, slug, onClose }: { open: boolean; slug: string; onClose: () => void }) {
  const { reduced } = useDemo();
  const site = useSite();
  const e = site.enquiry;
  const wide = useMediaQuery("(min-width: 640px)", true);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const [service, setService] = useState(slug);
  const [needs, setNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [when, setWhen] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [missing, setMissing] = useState<("name" | EnquiryFieldKey)[]>([]);
  const [done, setDone] = useState<{ chat: string; ref: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset the form each time it opens */
    setService(slug || site.services[0].slug);
    setNeeds([]);
    setBudget([]);
    setWhen([]);
    setTried(false);
    setMissing([]);
    setDone(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when it opens
  }, [open, slug]);

  useModalLock(open, panel, onClose);

  const svc = site.services.find((s) => s.slug === service) ?? site.services[0];

  const send = (how: "wa" | "mail") => {
    setTried(true);
    const res = submitEnquiry(svc.slug, { needs, budget: budget[0] ?? "", timeline: when[0] ?? "", name, company, message }, how === "wa" ? "whatsapp" : "email");
    if (!res.ok) {
      setMissing(res.missing);
      if (res.missing.includes("name")) panel.current?.querySelector<HTMLInputElement>(`#${CSS.escape(id)}-name`)?.focus();
      return;
    }
    const chat = `https://wa.me/${res.number.replace(/\D/g, "")}?text=${encodeURIComponent(res.message)}`;
    if (how === "mail") {
      window.open(`mailto:${site.contact.email}?subject=${encodeURIComponent(fill(e.emailSubject, { service: svc.title }))}&body=${encodeURIComponent(res.message)}`, "_self", "noopener");
      setDone({ chat, ref: res.ref });
      return;
    }
    if (e.redirect.mode === "direct") window.open(chat, e.redirect.newTab ? "_blank" : "_self", "noopener");
    setDone({ chat, ref: res.ref });
    if (e.redirect.mode === "thanks") setCountdown(Math.max(1, e.redirect.seconds));
  };

  useEffect(() => {
    if (!done || e.redirect.mode !== "thanks" || countdown <= 0) return;
    const t = window.setTimeout(() => {
      if (countdown === 1) window.open(done.chat, e.redirect.newTab ? "_blank" : "_self", "noopener");
      setCountdown((c) => c - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [done, countdown, e.redirect.mode, e.redirect.newTab]);

  const blockOk = (key: "name" | EnquiryFieldKey) => !tried || !missing.includes(key);
  const BLOCKS: Record<EnquiryFieldKey, React.ReactNode> = {
    needs: svc.needs.length > 0 ? <Chips label={e.needsLabel} options={svc.needs} value={needs} multi onChange={setNeeds} /> : null,
    budget: e.budgets.length > 0 ? <Chips label={e.budgetLabel} options={e.budgets} value={budget} onChange={setBudget} /> : null,
    timeline: e.timelines.length > 0 ? <Chips label={e.timelineLabel} options={e.timelines} value={when} onChange={setWhen} /> : null,
    company: (
      <label className="block">
        <span className="label-mono">{e.companyLabel}</span>
        <input value={company} onChange={(ev) => setCompany(ev.target.value)} autoComplete="organization" className={field} placeholder={e.companyPlaceholder} onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })} />
      </label>
    ),
    message: (
      <label className="block">
        <span className="label-mono">{e.messageLabel}</span>
        <textarea value={message} onChange={(ev) => setMessage(ev.target.value)} rows={3} maxLength={800} className={`${field} resize-none`} placeholder={e.messagePlaceholder} onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })} />
      </label>
    ),
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[110]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <div className="absolute inset-0 bg-[rgb(14_12_32/0.45)] backdrop-blur-md" onClick={onClose} aria-hidden="true" />
          <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-6" onClick={onClose}>
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${id}-title`}
              tabIndex={-1}
              onClick={(ev) => ev.stopPropagation()}
              data-lenis-prevent
              className="enquiry-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-nl-bg shadow-[0_-20px_60px_-20px_rgb(14_12_32/0.5)] outline-none sm:max-h-[min(88dvh,760px)] sm:max-w-[560px] sm:rounded-[28px]"
              initial={wide ? { opacity: 0, y: 24, scale: 0.98 } : { y: "100%" }}
              animate={wide ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
              exit={wide ? { opacity: 0, y: 16, scale: 0.98 } : { y: "100%" }}
              transition={{ duration: reduced ? 0.01 : 0.45, ease }}
            >
              <div className="relative shrink-0 border-b border-white/10 px-5 pb-4 pt-3 sm:px-7 sm:pt-6">
                <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[color:var(--brand-a)]/35 bg-[color:var(--brand-a)]/10 text-white">
                    <ActivityIcon icon={svc.icon} size={26} play={false} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p id={`${id}-title`} className="font-display text-[20px] font-semibold leading-tight text-white">
                      {e.title}
                    </p>
                    <p className="mt-0.5 text-[14px] leading-snug text-nl-ink">{e.intro}</p>
                  </div>
                  <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 text-white/70 hover:text-white" aria-label="Close">
                    <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M2 2l10 10M12 2L2 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {done ? (
                <div className="flex flex-col items-center px-6 py-12 text-center" role="status">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-a),var(--brand-b))] text-2xl text-paper">✓</span>
                  <p className="mt-5 font-display text-xl font-semibold text-white">{fill(e.thanksTitle, { name: name.trim().split(" ")[0] })}</p>
                  <p className="mt-2 max-w-[34ch] text-[15px] text-nl-ink">{e.thanksText}</p>
                  {e.redirect.mode === "thanks" && countdown > 0 && <p className="mt-3 text-[13px] text-white/50">Opening WhatsApp in {countdown}…</p>}
                  <div className="mt-6 flex gap-2">
                    <a href={done.chat} target={e.redirect.newTab ? "_blank" : "_self"} rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      {e.again}
                    </a>
                    <button type="button" onClick={onClose} className="btn btn-sm text-white/70 hover:text-white">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form
                    className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      send("wa");
                    }}
                    noValidate
                  >
                    <label className="block">
                      <span className="label-mono">{e.activityLabel}</span>
                      <select
                        value={service}
                        onChange={(ev) => {
                          setService(ev.target.value);
                          setNeeds([]);
                        }}
                        className={`${field} appearance-none`}
                      >
                        {site.services.map((s) => (
                          <option key={s.slug} value={s.slug} className="bg-paper text-[#0e0c20]">
                            {s.n}. {s.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    {e.fields.map((key) => <div key={key}>{BLOCKS[key]}</div>)}
                    <div className="grid gap-4">
                      <label className="block">
                        <span className="label-mono">{e.nameLabel}</span>
                        <input
                          id={`${id}-name`}
                          value={name}
                          onChange={(ev) => setName(ev.target.value)}
                          autoComplete="name"
                          aria-invalid={!blockOk("name")}
                          aria-describedby={!blockOk("name") ? `${id}-name-err` : undefined}
                          className={`${field} ${!blockOk("name") ? "!border-[#e5484d]" : ""}`}
                          placeholder={e.namePlaceholder}
                          onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
                        />
                        {!blockOk("name") && (
                          <span id={`${id}-name-err`} className="mt-1 block text-[13px] text-[#e5484d]">
                            {e.nameError}
                          </span>
                        )}
                      </label>
                    </div>
                    {tried && missing.length > 0 && !missing.includes("name") && (
                      <p className="text-[13px] text-[#e5484d]" role="alert">
                        Please fill in everything marked as required before sending.
                      </p>
                    )}
                    <button type="submit" className="sr-only" tabIndex={-1}>
                      Send
                    </button>
                  </form>

                  <div className="shrink-0 border-t border-white/10 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3.5 sm:px-7 sm:pb-6">
                    <button type="button" onClick={() => send("wa")} className="btn btn-primary w-full">
                      <SocialIcon name="whatsapp" size={18} /> {e.whatsappCta}
                    </button>
                    {e.emailEnabled && (
                      <button type="button" onClick={() => send("mail")} className="mt-1.5 block w-full py-2 text-center text-[14px] text-white/60 hover:text-white">
                        {e.emailCta}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
