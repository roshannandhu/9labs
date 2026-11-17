import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
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
import { getPublicContent } from "@/server/content";
import { BootScript } from "@/components/BootScript";

/**
 * Reads the published workspace on every request (no server at build time any more — see
 * `src/server/content.ts`, memoized 60s and de-duplicated per request via React `cache()`, so
 * this and `generateMetadata` below share one fetch).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await getPublicContent();
  return {
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
}

export const viewport: Viewport = {
  themeColor: "#e9ddeb",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site, pages, faqs } = await getPublicContent();
  return (
    // suppressHydrationWarning: the pre-paint scripts set data-theme / data-intro on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: the theme, and whether the logo landing animation plays (first visit this session). */}
        <BootScript code={themeBootScript(site.theme.default, site.theme.toggle) + (site.theme.intro ? INTRO_BOOT_SCRIPT : "")} />
      </head>
      <body>
        <a href="#main" className="sr-only z-[200] rounded-full bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <SiteProvider site={site} pages={pages} faqs={faqs}>
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
