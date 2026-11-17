"use client";

/**
 * A pre-paint inline script (theme, intro flag). It runs once, from the server HTML, before first
 * paint. In the browser React would render it again and warn that client-rendered scripts never
 * run, so there it is marked inert (`text/plain`); the hydration attribute difference is expected.
 */
export function BootScript({ code }: { code: string }) {
  return <script suppressHydrationWarning type={typeof window === "undefined" ? undefined : "text/plain"} dangerouslySetInnerHTML={{ __html: code }} />;
}
