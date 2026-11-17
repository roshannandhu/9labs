import type { Metadata, Viewport } from "next";
import "@/studio/studio.css";
import { fontVariables } from "@/lib/fonts";
import { adminThemeBootScript } from "@/studio/theme";
import { BootScript } from "@/components/BootScript";

export const metadata: Metadata = { title: "Nine Labs — Admin", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07060d" };

/** The admin's own root layout — none of the public site's intro, cursor, grid or WhatsApp button. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint script sets data-theme on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: the admin's own light/dark choice — a separate key from the public site's, so switching one never changes the other */}
        <BootScript code={adminThemeBootScript()} />
      </head>
      <body>{children}</body>
    </html>
  );
}
