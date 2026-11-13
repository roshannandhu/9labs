import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/content/site";
import { SiteProvider } from "@/components/providers/SiteProvider";
import { ThemeColors } from "@/components/providers/ThemeColors";
import { DemoSettingsProvider } from "@/components/providers/DemoSettings";
import { QuizProvider } from "@/components/providers/QuizProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ConceptLab } from "@/components/lab/ConceptLab";
import { LogoIntro } from "@/components/intro/LogoIntro";
import { INTRO_BOOT_SCRIPT } from "@/components/intro/introBus";
import { EnquiryProvider } from "@/components/enquiry/EnquiryProvider";
import { Tracking } from "@/components/layout/Tracking";
import { themeBootScript } from "@/lib/theme";

/**
 * Fully static export: there is no server at request time to read the admin's saved content, so
 * SEO metadata and the pre-paint boot scripts use the built-in defaults (`src/content/site.ts`).
 * The page itself is admin-content-driven once it reaches the browser (`SiteProvider`).
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.seo.title, template: site.seo.titleTemplate.includes("%s") ? site.seo.titleTemplate : `%s · ${site.name}` },
  description: site.seo.description,
  applicationName: site.name,
  keywords: site.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: site.name, title: site.seo.title, description: site.seo.description, locale: "en_AE" },
  twitter: { card: "summary_large_image", title: site.seo.title, description: site.seo.description },
  robots: site.seo.index && process.env.NEXT_PUBLIC_NOINDEX !== "1" ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#e9ddeb",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the pre-paint scripts set data-theme / data-intro on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: the theme, and whether the logo landing animation plays (first visit this session). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(site.theme.default, site.theme.toggle) + (site.theme.intro ? INTRO_BOOT_SCRIPT : "") }} />
      </head>
      <body>
        <a href="#main" className="sr-only z-[200] rounded-full bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <SiteProvider>
          <ThemeColors />
          <DemoSettingsProvider>
            <QuizProvider>
              <EnquiryProvider>
                <SmoothScroll />
                <LogoIntro />
                {children}
                <WhatsAppFab />
                <ConceptLab />
                <Tracking />
              </EnquiryProvider>
            </QuizProvider>
          </DemoSettingsProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
