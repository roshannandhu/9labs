"use client";

import type { SiteData } from "@/content/types";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";
import { siteHref } from "@/lib/site-href";

const CARD = "rounded-3xl border border-white/10 bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] p-6";

/** "Our mission" / "Our vision", side by side — doc §2.3. */
export function MissionVision({ a }: { a: SiteData["aboutPage"] }) {
  if (!a.mission && !a.vision) return null;
  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-2">
      {a.mission && (
        <div className={CARD}>
          <p className="label-mono text-nl-purple">{a.missionLabel}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-nl-ink">{a.mission}</p>
        </div>
      )}
      {a.vision && (
        <div className={CARD}>
          <p className="label-mono text-nl-purple">{a.visionLabel}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-nl-ink">{a.vision}</p>
        </div>
      )}
    </div>
  );
}

/** The nine activities as tiles, same look as the homepage's finale grid — doc §2.4. */
export function WhatWeDo({ a, services }: { a: SiteData["aboutPage"]; services: SiteData["services"] }) {
  if (!services.length) return null;
  return (
    <>
      <ul className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
        {services.map((s) => (
          <li key={s.slug}>
            <a
              href={siteHref(`/#service-${s.slug}`)}
              className="finale-tile flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-2 py-4 text-nl-blue-soft transition-colors hover:border-nl-purple/50 hover:bg-nl-purple/[0.06] sm:gap-3 sm:rounded-3xl sm:py-6"
            >
              <ActivityIcon icon={s.icon} size={30} play={false} />
              <span className="text-center text-[11.5px] font-medium leading-tight text-white/80 sm:text-sm">{s.short}</span>
            </a>
          </li>
        ))}
      </ul>
      {a.servicesLink && (
        <a href={siteHref("/#services")} className="link-glow mt-6 inline-flex items-center gap-2 py-1 text-sm font-medium text-white">
          {a.servicesLink}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </>
  );
}

/** What we promise every client, cards — only the ones switched on (doc §2.7). */
export function Commitments({ items }: { items: SiteData["aboutPage"]["commitments"] }) {
  const shown = items.filter((c) => c.enabled && c.text.trim());
  if (!shown.length) return null;
  return (
    <ul className="mt-7 grid gap-4 sm:grid-cols-2">
      {shown.map((c, i) => (
        <li key={i} className={CARD}>
          <p className="text-[14.5px] leading-relaxed text-nl-ink">{c.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** Location, e-mail, phone/WhatsApp and socials — doc §2.8 ("Where to find us"). */
export function FindUs() {
  const site = useSite();
  const wa = useWhatsApp();
  return (
    <div className={`mt-7 ${CARD}`}>
      <ul className="grid gap-3 text-[15px] sm:grid-cols-3">
        <li>
          <span className="flex items-center gap-2.5 text-nl-ink">
            <SocialIcon name="pin" size={17} /> {site.location}
          </span>
        </li>
        <li>
          <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 text-nl-ink transition-colors hover:text-white">
            <SocialIcon name="mail" size={17} /> {site.contact.email}
          </a>
        </li>
        <li>
          <a href={wa()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-nl-ink transition-colors hover:text-white">
            <SocialIcon name="whatsapp" size={17} /> {site.contact.phone}
          </a>
        </li>
      </ul>
      {site.socials.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {site.socials.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/65 transition-all hover:-translate-y-0.5 hover:border-nl-purple hover:text-white hover:shadow-[0_0_20px_-4px_var(--nl-purple)]"
            >
              <SocialIcon name={s.key} size={17} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
