import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/content/site";
import { DemoSettingsProvider } from "@/components/providers/DemoSettings";
import { QuizProvider } from "@/components/providers/QuizProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { BlueprintGrid } from "@/components/background/BlueprintGrid";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ConceptLab } from "@/components/lab/ConceptLab";
import { LogoIntro } from "@/components/intro/LogoIntro";
import { INTRO_BOOT_SCRIPT } from "@/components/intro/introBus";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

const title = "Nine Labs Solutions — Marketing, Events & Technology in Dubai";
const description = site.hero.sub;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: "%s · Nine Labs Solutions" },
  description,
  applicationName: site.name,
  keywords: [
    "marketing agency Dubai",
    "digital marketing Dubai",
    "social media marketing UAE",
    "events and trade shows Dubai",
    "AI consultancy Dubai",
    "IT consultancy UAE",
    "video production Dubai",
    "PR agency Dubai",
    "Dubai South",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title,
    description,
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image", title, description },
  // demo builds (GitHub Pages) stay out of search engines so they never compete with the real domain
  robots: process.env.NEXT_PUBLIC_NOINDEX === "1" ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#e9ddeb",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the pre-paint intro script sets data-intro on <html> before React loads
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Pre-paint: decide whether the logo landing animation plays (first visit this session). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT + INTRO_BOOT_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-[200] rounded-full bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <DemoSettingsProvider>
          <QuizProvider>
            <BlueprintGrid />
            <SmoothScroll />
            <LogoIntro />
            {children}
            <WhatsAppFab />
            <ConceptLab />
            <CustomCursor />
          </QuizProvider>
        </DemoSettingsProvider>
      </body>
    </html>
  );
}
