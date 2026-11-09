"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { site, waHref } from "@/content/site";
import { useModalLock } from "@/lib/useModalLock";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useDemo } from "@/components/providers/DemoSettings";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";

const ease = [0.16, 1, 0.3, 1] as const;
const e = site.enquiry;

function Chips({
  label,
  options,
  value,
  multi,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  multi?: boolean;
  onChange: (update: (v: string[]) => string[]) => void;
}) {
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
              // functional update: quick double taps never lose a choice
              onClick={() => onChange((v) => (multi ? (v.includes(o) ? v.filter((x) => x !== o) : [...v, o]) : v[0] === o ? [] : [o]))}
              className={`rounded-full border px-3.5 py-2 text-[14px] transition-colors ${
                on ? "border-transparent bg-[linear-gradient(120deg,#8c53fe,#5a7bf0)] text-paper" : "border-white/14 bg-[var(--chip-bg)] text-white/80 hover:border-[#8c53fe]/60"
              }`}
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

const field =
  "mt-1.5 block w-full rounded-2xl border border-white/14 bg-[var(--chip-bg)] px-4 py-3 text-[16px] text-white placeholder:text-white/35 transition-colors focus:border-[#8c53fe] focus:outline-none";

/**
 * "Talk to us about this": a quick enquiry window. Phone: a sheet that slides up from the bottom;
 * laptop: a centred card. The activity comes pre-selected; the visitor taps what they need, a
 * budget and a timeline, adds their name (and company / message if they like), and "Send on
 * WhatsApp" opens a chat with Nine Labs with all of it already written. Options are content
 * (site.enquiry + services[].needs), so the admin can add, edit or remove them later.
 */
export default function EnquirySheet({ open, slug, onClose }: { open: boolean; slug: string; onClose: () => void }) {
  const { reduced } = useDemo();
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
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset the form each time it opens */
    setService(slug || site.services[0].slug);
    setNeeds([]);
    setBudget([]);
    setWhen([]);
    setTried(false);
    setDone(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, slug]);

  useModalLock(open, panel, onClose);

  const svc = site.services.find((s) => s.slug === service) ?? site.services[0];
  const nameOk = name.trim().length >= 2;

  const text = [
    "Hi Nine Labs! 👋",
    `I'm ${name.trim() || "—"}${company.trim() ? ` from ${company.trim()}` : ""}.`,
    "",
    `Interested in: ${svc.title}`,
    needs.length ? `What we need: ${needs.join(", ")}` : null,
    budget.length ? `Budget: ${budget[0]}` : null,
    when.length ? `Timeline: ${when[0]}` : null,
    message.trim() ? `\n${message.trim()}` : null,
    "",
    "(Sent from the Nine Labs website)",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const send = (how: "wa" | "mail") => {
    setTried(true);
    if (!nameOk) {
      panel.current?.querySelector<HTMLInputElement>(`#${CSS.escape(id)}-name`)?.focus();
      return;
    }
    const url =
      how === "wa"
        ? waHref(text)
        : `mailto:${site.contact.email}?subject=${encodeURIComponent(`Enquiry: ${svc.title}`)}&body=${encodeURIComponent(text)}`;
    window.open(url, how === "wa" ? "_blank" : "_self", "noopener");
    setDone(true);
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
              {/* header */}
              <div className="relative shrink-0 border-b border-white/10 px-5 pb-4 pt-3 sm:px-7 sm:pt-6">
                <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden="true" />
                <div className="flex items-start gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#8c53fe]/35 bg-[#8c53fe]/10 text-white">
                    <ActivityIcon icon={svc.icon} size={26} play={false} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p id={`${id}-title`} className="font-display text-[20px] font-semibold leading-tight text-white">
                      {e.title}
                    </p>
                    <p className="mt-0.5 text-[14px] leading-snug text-nl-ink">{e.intro}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 text-white/70 hover:text-white"
                    aria-label="Close"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M2 2l10 10M12 2L2 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {done ? (
                <div className="flex flex-col items-center px-6 py-12 text-center" role="status">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,#8c53fe,#5ce0e6)] text-2xl text-paper">✓</span>
                  <p className="mt-5 font-display text-xl font-semibold text-white">Thanks, {name.trim().split(" ")[0]}!</p>
                  <p className="mt-2 max-w-[34ch] text-[15px] text-nl-ink">Your message is ready in WhatsApp — just press send. We usually reply within a working day.</p>
                  <div className="mt-6 flex gap-2">
                    <a href={waHref(text)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      Open WhatsApp again
                    </a>
                    <button type="button" onClick={onClose} className="btn btn-sm text-white/70 hover:text-white">
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* body (scrolls) */}
                  <form
                    className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7"
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      send("wa");
                    }}
                    noValidate
                  >
                    <label className="block">
                      <span className="label-mono">Activity</span>
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
                    <Chips label="What do you need?" options={svc.needs} value={needs} multi onChange={setNeeds} />
                    <Chips label="Budget" options={e.budgets} value={budget} onChange={setBudget} />
                    <Chips label="When" options={e.timelines} value={when} onChange={setWhen} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="label-mono">Your name *</span>
                        <input
                          id={`${id}-name`}
                          value={name}
                          onChange={(ev) => setName(ev.target.value)}
                          autoComplete="name"
                          aria-invalid={tried && !nameOk}
                          aria-describedby={tried && !nameOk ? `${id}-name-err` : undefined}
                          className={`${field} ${tried && !nameOk ? "!border-[#e5484d]" : ""}`}
                          placeholder="Your name"
                          onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
                        />
                        {tried && !nameOk && (
                          <span id={`${id}-name-err`} className="mt-1 block text-[13px] text-[#e5484d]">
                            Please add your name.
                          </span>
                        )}
                      </label>
                      <label className="block">
                        <span className="label-mono">Company</span>
                        <input
                          value={company}
                          onChange={(ev) => setCompany(ev.target.value)}
                          autoComplete="organization"
                          className={field}
                          placeholder="Optional"
                          onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="label-mono">Message</span>
                      <textarea
                        value={message}
                        onChange={(ev) => setMessage(ev.target.value)}
                        rows={3}
                        maxLength={800}
                        className={`${field} resize-none`}
                        placeholder="Anything else we should know? (optional)"
                        onFocus={(ev) => ev.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })}
                      />
                    </label>
                    <button type="submit" className="sr-only" tabIndex={-1}>
                      Send
                    </button>
                  </form>

                  {/* footer (always visible) */}
                  <div className="shrink-0 border-t border-white/10 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3.5 sm:px-7 sm:pb-6">
                    <button type="button" onClick={() => send("wa")} className="btn btn-primary w-full">
                      <SocialIcon name="whatsapp" size={18} /> Send on WhatsApp
                    </button>
                    <button type="button" onClick={() => send("mail")} className="mt-1.5 block w-full py-2 text-center text-[14px] text-white/60 hover:text-white">
                      E-mail instead
                    </button>
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
