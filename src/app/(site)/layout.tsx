import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { getSite } from "@/lib/content/getSite";
import { SiteProvider } from "@/components/providers/SiteProvider";
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
import type { SiteData } from "@/content/types";

// Content comes from the database and changes whenever the admin saves, so pages are rendered
// per request; the content itself is cached (see getSite) and refreshed on every save.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const { seo } = site;
  return {
    metadataBase: new URL(site.url),
    title: { default: seo.title, template: seo.titleTemplate.includes("%s") ? seo.titleTemplate : `%s · ${site.name}` },
    description: seo.description,
    applicationName: site.name,
    keywords: seo.keywords,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: site.name,
      title: seo.title,
      description: seo.description,
      locale: "en_AE",
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, ...(seo.ogImage ? { images: [seo.ogImage] } : {}) },
    robots: seo.index && process.env.NEXT_PUBLIC_NOINDEX !== "1" ? { index: true, follow: true } : { index: false, follow: false },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    icons: site.favicon ? { icon: site.favicon } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#e9ddeb",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/** Brand colours set in the admin, written over the stylesheet's own (Website → Look, SEO & tracking). */
function themeCss({ colors: c }: SiteData["theme"]) {
  const light = [c.indigo && `--nl-indigo:${c.indigo}`, c.bg && `--nl-bg:${c.bg};--nl-lavender:${c.bg}`].filter(Boolean).join(";");
  const dark = [c.darkBg && `--nl-bg:${c.darkBg}`, c.logoFrom && `--logo-from:${c.logoFrom}`, c.logoTo && `--logo-to:${c.logoTo}`].filter(Boolean).join(";");
  // the highlight pair (quiz, enquiry window, bridge) follows the same two colours in both themes
  const pair = [c.logoFrom && `--brand-a:${c.logoFrom}`, c.logoTo && `--brand-b:${c.logoTo}`].filter(Boolean).join(";");
  return `${light || pair ? `:root{${[light, pair].filter(Boolean).join(";")}}` : ""}${dark ? `html[data-theme="dark"]{${dark}}` : ""}`;
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const { theme } = site;
  const css = themeCss(theme);
  const look = { grid: theme.grid, whatsapp: site.contact.whatsappFab, ...(theme.colors.blue ? { blue: theme.colors.blue } : {}), ...(theme.colors.purple ? { purple: theme.colors.purple } : {}) };

  return (
    // suppressHydrationWarning: the pre-paint scripts set data-theme / data-intro on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: the theme, and whether the logo landing animation plays (first visit this session). */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript(theme.default, theme.toggle) + (theme.intro ? INTRO_BOOT_SCRIPT : "") }} />
        {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      </head>
      <body>
        <a href="#main" className="sr-only z-[200] rounded-full bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <SiteProvider value={site}>
          <DemoSettingsProvider initial={look}>
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
