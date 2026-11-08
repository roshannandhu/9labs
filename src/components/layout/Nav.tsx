"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { useQuiz } from "@/components/providers/QuizProvider";
import Magnet from "@/components/reactbits/Magnet";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  const quiz = useQuiz();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeId, setActiveId] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (y > lastY + 8 && y > 240) setHidden(true);
      else if (y < lastY - 8 || y < 120) setHidden(false);
      lastY = y;
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
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[80] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* Once scrolled, the bar condenses into a floating liquid-glass pill. */}
      <div
        className={`glass pointer-events-none absolute left-1/2 top-2 h-[calc(var(--nav-h)-16px)] w-[calc(100%-12px)] -translate-x-1/2 rounded-[22px] transition-[opacity,scale] duration-500 ease-[cubic-bezier(.16,1,.3,1)] [--glass-tint:rgb(8_9_14/0.6)] sm:w-[min(calc(100%-24px),1300px)] sm:rounded-full ${
          scrolled || menuOpen ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
        }`}
        aria-hidden="true"
      />
      <nav className="container-x relative flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Main">
        <a href="#home" aria-label="Nine Labs Solutions — back to top" className="rounded-xl" data-cursor="Home">
          <Logo />
        </a>

        <ul className="hidden items-center gap-7 lg:flex">
          {site.nav.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                className="link-glow text-[14px] font-medium text-white/70 transition-colors hover:text-white data-[active=true]:text-white"
                data-active={activeId === item.id}
                aria-current={activeId === item.id ? "true" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:block">
            <Magnet padding={40} magnetStrength={3} maxOffset={10}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => quiz.open()} data-cursor="Start">
                Start The 9 Quiz
              </button>
            </Magnet>
          </span>
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
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} activeId={activeId} />
    </header>
  );
}
