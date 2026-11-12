"use client";

import { usePathname } from "next/navigation";
import { useSite, useWhatsApp } from "@/components/providers/SiteProvider";
import { siteHref } from "@/lib/site-href";
import { ActivityIcon } from "@/components/icons/ActivityIcon";
import { SocialIcon } from "@/components/icons/SocialIcon";
import LogoLoop from "@/components/reactbits/LogoLoop";
import { Logo } from "./Logo";

export function Footer() {
  const site = useSite();
  const wa = useWhatsApp();
  const home = usePathname() === "/";
  // on inner pages a section link goes back to the homepage
  const at = (href: string) => siteHref(href.startsWith("#") && !home ? `/${href}` : href);
  const f = site.footer;

  const logos = site.services.map((s) => ({
    node: (
      <span className="flex items-center gap-3 whitespace-nowrap font-display text-[17px] font-medium text-white/55">
        <span className="text-nl-blue-soft">
          <ActivityIcon icon={s.icon} size={22} />
        </span>
        {s.title}
        <span className="ml-5 text-nl-purple/60">✦</span>
      </span>
    ),
    title: s.title,
    href: at(`#service-${s.slug}`),
  }));

  return (
    <footer className="relative z-10 border-t border-white/[0.07] bg-nl-bg/80 backdrop-blur-sm">
      <div className="border-b border-white/[0.06] py-6">
        <LogoLoop logos={logos} speed={42} gap={44} logoHeight={26} fadeOut fadeOutColor="var(--nl-bg)" pauseOnHover scaleOnHover={false} ariaLabel={f.activitiesTitle} />
      </div>

      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo withTagline />
          {site.tagline && <p className="mt-5 max-w-[34ch] text-[14.5px] leading-relaxed text-nl-ink">{site.tagline}</p>}
          <p className="mt-5 flex items-center gap-2 text-[14px] text-white/70">
            <SocialIcon name="pin" size={16} /> {site.location}
          </p>
          {site.socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
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

        <nav className="md:col-span-2" aria-label="Footer">
          <p className="label-mono mb-4">{f.navTitle}</p>
          <ul className="space-y-1">
            {site.nav.map((n) => (
              <li key={n.id}>
                <a href={at(n.href)} className="inline-block py-1 text-[14.5px] text-white/70 transition-colors hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          {f.links.length > 0 && (
            <>
              <p className="label-mono mb-4 mt-8">{f.pagesTitle}</p>
              <ul className="space-y-1">
                {f.links.map((l) => (
                  <li key={l.href + l.label}>
                    <a href={at(l.href)} className="inline-block py-1 text-[14.5px] text-white/70 transition-colors hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        <div className="md:col-span-3">
          <p className="label-mono mb-4">{f.activitiesTitle}</p>
          <ul className="space-y-1">
            {site.services.map((s) => (
              <li key={s.slug}>
                <a href={at(`#service-${s.slug}`)} className="inline-block py-1 text-[14px] text-white/70 transition-colors hover:text-white">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="label-mono mb-4">{f.contactTitle}</p>
          <ul className="space-y-3 text-[14.5px]">
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2.5 text-white/70 hover:text-white">
                <SocialIcon name="mail" size={16} /> {site.contact.email}
              </a>
            </li>
            <li>
              <a href={wa()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/70 hover:text-white">
                <SocialIcon name="whatsapp" size={16} /> {site.contact.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-x flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pb-24 pt-6 text-[12.5px] text-white/45 sm:flex-row sm:pb-24">
        <p>{f.copyright}</p>
        <p>{site.location}</p>
      </div>
    </footer>
  );
}
