"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSite } from "@/components/providers/SiteProvider";
import { siteHref } from "@/lib/site-href";
import { CtaButton } from "./CtaButton";
import Magnet from "@/components/reactbits/Magnet";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

/** On inner pages (/about, /faq…) a section link points back to the homepage: "#services" → "/#services". */
export const navHref = (href: string, home: boolean) => siteHref(href.startsWith("#") && !home ? `/${href}` : href);

export function Nav() {
  const site = useSite();
  const pathname = usePathname();
  const home = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!home) return;
    const ids = site.nav.map((n) => n.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActiveId(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [home, site.nav]);

  // the current link: the section in view on the homepage, the page itself elsewhere
  // (a nav item's id only matches a real page's own address once slashes are stripped, e.g. "/about/" -> "about")
  const current = home ? activeId : pathname.replace(/\//g, "");

  return (
    // Always visible: the logo lives here permanently (the landing animation lands on it).
    <header className="fixed inset-x-0 top-0 z-[80]">
      {/* Flush, no card: a thin blur + hairline border fades in on scroll, nothing floats or insets. */}
      <div
        className={`nav-surface pointer-events-none absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          scrolled || menuOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <nav className="container-x relative flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Main">
        <a href={home ? "#home" : siteHref("/")} aria-label={`${site.name} — ${home ? "back to top" : "home"}`} className="-my-2 rounded-xl py-2" data-cursor="Home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-6 lg:flex">
          {site.nav.map((item) => (
            <li key={item.id}>
              <a
                href={navHref(item.href, home)}
                className="link-glow text-[13px] font-medium text-white/70 transition-colors hover:text-white data-[active=true]:text-white"
                data-active={current === item.id}
                aria-current={current === item.id ? "true" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:block">
            <Magnet padding={40} magnetStrength={3} maxOffset={10}>
              {site.navCta.label && <CtaButton cta={site.navCta} className="btn btn-primary btn-nav" data-cursor="Start" />}
            </Magnet>
          </span>
          {site.theme.toggle && <ThemeToggle />}
          <button
            type="button"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/[0.03] text-white lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-[1.5px] w-5 rounded bg-current transition-all duration-500 ${menuOpen ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 h-[1.5px] rounded bg-current transition-all duration-500 ${menuOpen ? "top-1.5 w-5 -rotate-45" : "top-3 w-3.5"}`}
              />
            </span>
          </button>
        </div>
      </nav>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} activeId={current} home={home} />
    </header>
  );
}
