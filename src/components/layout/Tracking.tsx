"use client";

import { useEffect, useState } from "react";
import { useSite } from "@/components/providers/SiteProvider";

const KEY = "nl-cookies";
const ID = /^[A-Za-z0-9-]+$/;

function load(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void }; _fbq?: unknown };

/** Start the analytics tools whose IDs are set in the admin. Called only after the visitor accepts. */
function start({ ga4, gtm, metaPixel }: { ga4?: string; gtm?: string; metaPixel?: string }) {
  const w = window as W;
  w.dataLayer = w.dataLayer ?? [];
  const dataLayer = w.dataLayer;
  if (ga4 && ID.test(ga4)) {
    // gtag pushes its `arguments` object, exactly as Google's snippet does
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- read through `arguments`
    function gtag(..._args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    }
    w.gtag = gtag;
    gtag("js", new Date());
    gtag("config", ga4);
    load(`https://www.googletagmanager.com/gtag/js?id=${ga4}`);
  }
  if (gtm && ID.test(gtm)) {
    gtmOn = true;
    dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    load(`https://www.googletagmanager.com/gtm.js?id=${gtm}`);
  }
  if (metaPixel && /^\d+$/.test(metaPixel) && !w.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    } as NonNullable<W["fbq"]>;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    w.fbq = fbq;
    w._fbq = fbq;
    load("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", metaPixel);
    fbq("track", "PageView");
  }
}

let gtmOn = false; // a GTM container was started (it reads `{ event }` objects off the dataLayer)

/**
 * A lead came in (enquiry, quiz contact, e-book request): GA4 `generate_lead`, a `generate_lead`
 * dataLayer event for Tag Manager, and Meta's `Lead`. Does nothing unless the visitor accepted cookies.
 */
export function trackLead(source: "enquiry" | "quiz" | "ebook", params: Record<string, string> = {}) {
  const w = window as W;
  const p = { lead_source: source, ...params };
  w.gtag?.("event", "generate_lead", p);
  if (gtmOn) w.dataLayer?.push({ event: "generate_lead", ...p });
  w.fbq?.("track", "Lead", { content_name: source, ...params });
}

/** Opens the cookie notice again (footer "Cookie settings"), so a visitor can change their answer. */
export const openCookieSettings = () => window.dispatchEvent(new Event("nl-cookie-settings"));

/** Declined after accepting: drop the tools' own cookies and reload so their scripts are gone too. */
function withdraw() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (!/^(_ga|_gid|_gat|_gcl|_fbp|_fbc)/.test(name)) continue;
    const host = location.hostname;
    for (const domain of ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
  location.reload();
}

/**
 * Analytics + the cookie notice. Nothing is loaded and no notice is shown unless an ID is set in
 * the admin (Settings → Google & tracking); tracking starts only after "Accept".
 */
export function Tracking() {
  const { integrations: t } = useSite();
  const any = Boolean(t.ga4 || t.gtm || t.metaPixel);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!any) return;
    const reopen = () => setAsk(true);
    window.addEventListener("nl-cookie-settings", reopen);
    return () => window.removeEventListener("nl-cookie-settings", reopen);
  }, [any]);

  useEffect(() => {
    if (!any) return;
    let choice: string | null = null;
    try {
      choice = localStorage.getItem(KEY);
    } catch {
      /* private mode: ask every visit */
    }
    if (choice === "yes") start(t);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the stored choice is only known on the client
    else if (choice !== "no") setAsk(true);
  }, [any, t]);

  if (!any || !ask) return null;
  const decide = (yes: boolean) => {
    let before: string | null = null;
    try {
      before = localStorage.getItem(KEY);
      localStorage.setItem(KEY, yes ? "yes" : "no");
    } catch {
      /* not remembered */
    }
    setAsk(false);
    if (yes && before !== "yes") start(t);
    if (!yes && before === "yes") withdraw();
  };
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-[90] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-white/12 bg-[var(--chip-bg)] p-4 text-[14px] text-white shadow-[0_18px_50px_-18px_rgba(14,12,32,.45)] backdrop-blur-xl sm:flex-row sm:items-center">
      <p className="flex-1 leading-snug text-nl-ink">{t.cookieText}</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" className="btn btn-sm text-white/70 hover:text-white" onClick={() => decide(false)}>
          {t.cookieDecline}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(true)}>
          {t.cookieAccept}
        </button>
      </div>
    </div>
  );
}
