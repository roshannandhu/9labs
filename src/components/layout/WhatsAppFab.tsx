"use client";

import { AnimatePresence, motion } from "motion/react";
import { whatsappHref } from "@/content/site";
import { useDemo } from "@/components/providers/DemoSettings";
import { SocialIcon } from "@/components/icons/SocialIcon";

/** Floating WhatsApp button — the admin will be able to switch it on/off (Concept Lab does now). */
export function WhatsAppFab() {
  const { settings } = useDemo();
  return (
    <AnimatePresence>
      {settings.whatsapp && (
        <motion.a
          key="wa"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Nine Labs on WhatsApp"
          data-cursor="Chat"
          className="group fixed bottom-5 right-5 z-[70] flex items-center gap-0 rounded-full border border-white/12 bg-[#0b0d12]/85 p-1.5 text-white shadow-[0_18px_50px_-18px_rgba(0,0,0,.9)] backdrop-blur-xl sm:bottom-6 sm:right-6"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ delay: 1.6, type: "spring", stiffness: 260, damping: 20 }}
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
