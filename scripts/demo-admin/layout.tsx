import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./editor.css";

// The editor has its own page frame: none of the public site's animation, menu or WhatsApp button.
export const metadata: Metadata = { title: "Website editor · Nine Labs", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#6f55e8" };

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
