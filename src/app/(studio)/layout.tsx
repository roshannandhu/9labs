import type { Metadata, Viewport } from "next";
import "@/studio/studio.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/content/site";
import { themeBootScript } from "@/lib/theme";

export const metadata: Metadata = { title: "The Bridge · Nine Labs Admin", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#6f55e8" };

/** The admin's own root layout — none of the public site's intro, cursor, grid or WhatsApp button. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script sets data-theme on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: light/dark, shared with the public site's own remembered choice (same storage key) */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(site.theme.default) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
