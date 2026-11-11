import type { Ebook, QuizQuestion, Service, Value } from "./site";

/**
 * The full shape of the website's content. `site.ts` holds the built-in defaults; the admin
 * (Payload) overrides any of it, and `getSite()` merges the two into one object of this type.
 */
export type SocialKey = "instagram" | "linkedin" | "x" | "facebook" | "tiktok" | "youtube";
export type SectionKey = "services" | "about" | "quiz" | "ebooks" | "contact";

/** What a button does: open the quiz, open WhatsApp, or go to a section / page / URL. */
export type Cta = { label: string; action: "quiz" | "whatsapp" | "link"; href?: string };

export type NavItem = { label: string; href: string; id: string };

export type ThemeColors = {
  /** light theme */
  blue: string;
  purple: string;
  indigo: string;
  bg: string;
  /** dark theme */
  darkBg: string;
  logoFrom: string;
  logoTo: string;
};

export type FaqItem = { id: string; question: string; answerHtml: string; answerText: string; category?: string };
export type FooterLink = { label: string; href: string };

export interface SiteData {
  name: string;
  shortName: string;
  location: string;
  type: string;
  url: string;
  tagline: string;
  mapUrl: string;
  /** uploaded logo / favicon (URLs); without them the built-in traced logo is used */
  logo?: string;
  favicon?: string;
  geo: { locality: string; region: string; country: string; latitude: number; longitude: number };

  contact: {
    email: string;
    phone: string;
    whatsappNumber: string;
    whatsappText: string;
    /** floating WhatsApp button */
    whatsappFab: boolean;
    fabLabel: string;
    chatLabel: string;
  };
  socials: { key: SocialKey; label: string; href: string }[];

  nav: NavItem[];
  navCta: Cta;
  /** homepage sections that are switched on, in order */
  sections: SectionKey[];

  hero: {
    eyebrow: string;
    eyebrowExtra: string;
    headline: string;
    headlineAccent: string;
    sub: string;
    primary: Cta;
    secondary: Cta;
    caption: string;
  };

  servicesSection: {
    label: string;
    heading: string;
    accent: string;
    intro: string;
    outro: string;
    outroAccent: string;
    cardCta: string;
  };
  services: Service[];

  about: {
    label: string;
    statement: string;
    body: string;
    philosophy: string;
    stats: { value: number; label: string }[];
    strip: string;
    story: {
      label: string;
      heading: string;
      accent: string;
      yourSideLabel: string;
      yourSideTitle: string;
      yourSideChips: string[];
      ourSideLabel: string;
      ourSideTitle: string;
      middleLabel: string;
      pillOut: string;
      pillIn: string;
      result: string;
    };
    steps: { n: string; title: string; text: string }[];
    valuesLabel: string;
    valuesHeading: string;
    valuesIntro: string;
  };
  values: Value[];

  quiz: {
    label: string;
    heading: string;
    accent: string;
    text: string;
    cta: string;
    meta: string;
    questions: QuizQuestion[];
    result: {
      label: string;
      heading: string;
      /** {who} {goal} {when} */
      summary: string;
      /** {answers} */
      why: string;
      steps: { title: string; text: string }[];
      matches: number;
      whatsappCta: string;
      whatsappIntro: string;
      whatsappOutro: string;
      emailEnabled: boolean;
      emailPlaceholder: string;
      emailCta: string;
      emailSent: string;
      retake: string;
      ebooksCta: string;
    };
  };

  enquiry: {
    title: string;
    intro: string;
    activityLabel: string;
    needsLabel: string;
    budgetLabel: string;
    timelineLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    nameError: string;
    companyLabel: string;
    companyPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    showBudget: boolean;
    showTimeline: boolean;
    showCompany: boolean;
    showMessage: boolean;
    budgets: string[];
    timelines: string[];
    whatsappCta: string;
    emailEnabled: boolean;
    emailCta: string;
    greeting: string;
    signature: string;
    thanksTitle: string;
    thanksText: string;
    again: string;
  };

  ebooksSection: {
    label: string;
    heading: string;
    accent: string;
    intro: string;
    cardLabel: string;
    cardCta: string;
    insideLabel: string;
  };
  ebookForm: {
    eyebrow: string;
    title: string;
    /** {title} */
    text: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    phoneRequired: boolean;
    companyLabel: string;
    companyPlaceholder: string;
    showCompany: boolean;
    consent: string;
    submit: string;
    sending: string;
    codes: { code: string; label: string }[];
    defaultCode: string;
    /** {name} */
    successTitle: string;
    /** {title} {email} — shown when a request waits for approval */
    successPending: string;
    /** {title} {email} — shown when the e-mail has been sent straight away */
    successSent: string;
    error: string;
    back: string;
  };
  ebooks: Ebook[];

  closing: {
    label: string;
    heading: string;
    accent: string;
    text: string;
    cta: string;
    loop: string;
    emailLabel: string;
    phoneLabel: string;
    visitLabel: string;
  };

  footer: {
    copyright: string;
    navTitle: string;
    activitiesTitle: string;
    contactTitle: string;
    pagesTitle: string;
    links: FooterLink[];
  };

  faqPreview: { enabled: boolean; label: string; heading: string; accent: string; cta: string; items: FaqItem[] };

  theme: {
    default: "light" | "dark";
    toggle: boolean;
    intro: boolean;
    grid: number;
    colors: Partial<ThemeColors>;
  };

  seo: {
    title: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    index: boolean;
    googleVerification?: string;
  };

  integrations: {
    ga4?: string;
    gtm?: string;
    metaPixel?: string;
    cookieText: string;
    cookieAccept: string;
    cookieDecline: string;
  };
}
