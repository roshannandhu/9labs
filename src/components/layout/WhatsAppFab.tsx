"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { whatsappHref } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { SocialIcon } from "@/components/icons/SocialIcon";

/**
 * Floating WhatsApp button — the admin will be able to switch it on/off (Concept Lab does now).
 * On phones it waits until the cover is half scrolled (so it never sits on the hero's full-width
 * buttons) and steps aside while the services stage is on screen (it would cover the 1–9 rail).
 */
export function WhatsAppFab() {
  const { settings } = useDemo();
  const [clear, setClear] = useState(false);
  useEffect(() => {
    const stage = document.getElementById("services");
    const update = () => {
      // phones (and phones held sideways): keep clear of the hero buttons and the stage rail
      if (window.innerWidth >= 640 && window.innerHeight > 520) return setClear(true);
      const r = stage?.getBoundingClientRect();
      const onStage = !!r && r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
      setClear(window.scrollY > window.innerHeight * 0.5 && !onStage);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <AnimatePresence>
      {settings.whatsapp && clear && (
        <motion.a
          key="wa"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Nine Labs on WhatsApp"
          data-cursor="Chat"
          className="group fixed bottom-5 right-5 z-[70] flex items-center gap-0 rounded-full border border-white/12 bg-paper/85 p-1.5 text-white shadow-[0_18px_50px_-18px_rgba(53,51,203,.35)] backdrop-blur-xl sm:bottom-6 sm:right-6"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-[#06210f]">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.6s]" />
            <SocialIcon name="whatsapp" size={22} />
          </span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width,padding] duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:max-w-[140px] group-hover:px-3 group-focus-visible:max-w-[140px] group-focus-visible:px-3">
            Chat with us
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
