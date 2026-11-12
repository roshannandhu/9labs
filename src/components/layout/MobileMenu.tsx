"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { siteHref } from "@/lib/site-href";
import { CtaButton } from "./CtaButton";
import { getLenis, scrollToId } from "@/lib/scroll";
import { SocialIcon } from "@/components/icons/SocialIcon";

export function MobileMenu({ open, onClose, activeId, home }: { open: boolean; onClose: () => void; activeId: string; home: boolean }) {
  const site = useSite();
  const wa = useWhatsApp();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only on the client
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  // Portal: the header is transformed (hide-on-scroll), which would trap a fixed child.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[var(--nav-h)] z-[79] overflow-y-auto lg:hidden"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          data-lenis-prevent
        >
          {/* layered panels */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-nl-purple-deep/40 to-nl-blue/20"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
          />
          <div className="absolute inset-0 bg-nl-bg/95 backdrop-blur-2xl" />
          <div className="container-x relative flex min-h-full flex-col pb-10 pt-6">
            <p className="label-mono mb-4">Menu</p>
            <ul className="flex flex-col">
              {site.nav.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-white/[0.07]"
                >
                  <a
                    href={siteHref(item.href.startsWith("#") && !home ? `/${item.href}` : item.href)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      // a section of the page we are on: smooth-scroll to it; anything else is a normal link
                      if (!home || !item.href.startsWith("#")) return;
                      e.preventDefault();
                      window.setTimeout(() => scrollToId(item.id), 80);
                    }}
                    className={`group flex items-baseline justify-between py-3.5 font-display text-[34px] font-semibold tracking-[-0.03em] transition-colors ${
                      activeId === item.id ? "text-white" : "text-white/70"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-xs tracking-[0.2em] text-nl-purple">{String(i + 1).padStart(2, "0")}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="mt-8 flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              {site.navCta.label && <CtaButton cta={site.navCta} className="btn btn-primary w-full" onBefore={onClose} />}
              <a href={wa()} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                {site.contact.chatLabel}
              </a>
            </motion.div>
            <div className="mt-auto flex items-center gap-2 pt-10">
              {site.socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 text-white/70 hover:border-nl-purple hover:text-white"
                >
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
