import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/content/site";
import { DemoSettingsProvider } from "@/components/providers/DemoSettings";
import { QuizProvider } from "@/components/providers/QuizProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ConceptLab } from "@/components/lab/ConceptLab";
import { LogoIntro } from "@/components/intro/LogoIntro";
import { INTRO_BOOT_SCRIPT } from "@/components/intro/introBus";
import { EnquiryProvider } from "@/components/enquiry/EnquiryProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

const title = "Nine Labs Solutions — Marketing, Events & Technology in Dubai";
const description = site.hero.sub;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: title, template: "%s · Nine Labs Solutions" },
  description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "business",
  keywords: [
    // Brand & Value Proposition
    "9labs",
    "9 labs",
    "9labs Dubai",
    "9labs solutions",
    "Nine Labs Solutions",
    "Nine Labs Dubai",
    "Nine Labs",
    "marketing agency Dubai",
    "events management company Dubai",
    "technology consultancy Dubai",

    // Digital & Social Media Marketing
    "digital marketing agency Dubai",
    "social media marketing Dubai",
    "social media agency UAE",
    "Instagram marketing Dubai",
    "TikTok marketing UAE",
    "B2B social media strategy Dubai",

    // Advertising & Paid Media
    "advertising agency Dubai",
    "Google Ads agency Dubai",
    "pay per click advertising UAE",
    "PPC agency Dubai",
    "social media ads Dubai",
    "paid search advertising UAE",
    "retargeting campaigns Dubai",

    // Content & Creative Production
    "creative agency Dubai",
    "corporate video production Dubai",
    "commercial filming UAE",
    "motion graphics Dubai",
    "brand identity design Dubai",
    "commercial photography Dubai",
    "event filming Dubai",
    "aftermovie production Dubai",

    // Events, Exhibitions & Trade Shows
    "events and trade shows Dubai",
    "corporate event planners UAE",
    "exhibition stand management Dubai",
    "trade show organizers Dubai",
    "business conference organizers Dubai",
    "product launch events UAE",

    // PR & Corporate Communications
    "PR agency Dubai",
    "public relations company UAE",
    "media relations Dubai",
    "press release distribution UAE",
    "corporate communications Dubai",

    // Strategy & Business Growth
    "marketing consultancy Dubai",
    "business strategy consultancy UAE",
    "brand positioning Dubai",
    "go to market strategy UAE",
    "fractional CMO Dubai",

    // AI Consultancy & Automation
    "AI consultancy Dubai",
    "AI business solutions UAE",
    "workflow automation Dubai",
    "enterprise AI consulting Dubai",
    "AI chatbot integration UAE",

    // IT Consultancy & Infrastructure
    "IT consultancy UAE",
    "IT consulting services Dubai",
    "cloud solutions Dubai",
    "cyber security consultancy UAE",
    "business IT support Dubai",

    // Geo & Local Market
    "Dubai South",
    "Dubai World Central DWC",
    "Dubai UAE",
    "Abu Dhabi",
    "GCC marketing company",
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
  other: {
    "geo.region": "AE-DU",
    "geo.placename": "Dubai South",
    "geo.position": "24.89;55.16",
    ICBM: "24.89, 55.16",
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
            <EnquiryProvider>
              <SmoothScroll />
              <LogoIntro />
              {children}
              <WhatsAppFab />
              <ConceptLab />
            </EnquiryProvider>
          </QuizProvider>
        </DemoSettingsProvider>
      </body>
    </html>
  );
}
