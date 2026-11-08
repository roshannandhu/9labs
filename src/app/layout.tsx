import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { DemoSettingsProvider } from "@/components/providers/DemoSettings";
import { QuizProvider } from "@/components/providers/QuizProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { BlueprintGrid } from "@/components/background/BlueprintGrid";
import { GrainOverlay } from "@/components/background/GrainOverlay";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ConceptLab } from "@/components/lab/ConceptLab";

const display = Sora({ subsets: ["latin"], variable: "--font-display-src", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans-src", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-src", display: "swap", weight: ["400", "500"] });

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
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only z-[200] rounded-full bg-white px-4 py-2 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {/* Liquid-glass lens: soft noise displacement used by .glass-lens on Chromium */}
        <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden="true" focusable="false">
          <filter id="lg-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="9" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2.2" result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <DemoSettingsProvider>
          <QuizProvider>
            <BlueprintGrid />
            <SmoothScroll />
            {children}
            <WhatsAppFab />
            <ConceptLab />
            <CustomCursor />
            <GrainOverlay />
          </QuizProvider>
        </DemoSettingsProvider>
      </body>
    </html>
  );
}
