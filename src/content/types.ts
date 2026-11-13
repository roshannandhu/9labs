import type { Ebook, QuizQuestion, Service, Value } from "./site";

/**
 * The full shape of the website's content. `site.ts` holds the built-in defaults; the admin
 * (The Bridge, `src/studio`) overrides any of it in the browser's own storage
 * (`src/lib/store.ts`), and `getSite()` merges the two into one object of this type.
 */
export type SocialKey = "instagram" | "linkedin" | "x" | "facebook" | "tiktok" | "youtube";
export type SectionKey = "services" | "about" | "quiz" | "ebooks" | "faq" | "contact";

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

export type FaqItem = { id: string; question: string; answerText: string; category?: string; enabled: boolean };
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
    /** Which blocks are asked, and in what order: a subset/order of EnquiryFieldKey. */
    fields: EnquiryFieldKey[];
    /** Which of `fields` must be filled before the visitor can send. */
    required: EnquiryFieldKey[];
    /**
     * The WhatsApp message, one template. `{token}` is replaced; `[... {token} ...]` (a whole
     * line or bracketed run) disappears if every token inside it is empty. See `src/lib/enquiry.ts`.
     */
    template: string;
    /** Adds a short reference code to the message and to the saved enquiry, e.g. "Ref: NL-7K2Q". */
    refCode: boolean;
    /** Subject used if "e-mail instead" is chosen. */
    emailSubject: string;
    /** What happens right after Send. */
    redirect: { mode: "direct" | "thanks"; seconds: number; newTab: boolean };
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

  faqPreview: { enabled: boolean; label: string; heading: string; accent: string; cta: string; count: number; items: FaqItem[] };

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

/** The "Talk to us" blocks, in the order they can be arranged (name is always asked and always first). */
export const ENQUIRY_FIELDS = ["needs", "budget", "timeline", "company", "message"] as const;
export type EnquiryFieldKey = (typeof ENQUIRY_FIELDS)[number];

/* ------------------------------------------------------------------ */
/*  Pages written in the admin (About, FAQ intro, Privacy, custom…)    */
/* ------------------------------------------------------------------ */

export type Page = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  /** Plain text: blank line = new paragraph. `**bold**`, `[text](url)`, lines starting "- " for a list. */
  body: string;
  showStats: boolean;
  showSteps: boolean;
  showValues: boolean;
  showServices: boolean;
  showCta: boolean;
  seo: { title: string; description: string };
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/*  Book delivery (global rules + the e-mail visitors receive)         */
/* ------------------------------------------------------------------ */

export type ApprovalMode = "manual" | "auto";
export type DeliveryMode = "link" | "attachment" | "both";

export type DeliverySettings = {
  approvalMode: ApprovalMode;
  deliveryMode: DeliveryMode;
  attachmentMaxMb: number;
  linkDays: number;
  maxDownloads: number;
  senderName: string;
  replyTo: string;
  adminAlert: boolean;
  adminAlertTo: string;
};

export type EbookEmailSettings = {
  subject: string;
  body: string;
  buttonLabel: string;
  footer: string;
};

/* ------------------------------------------------------------------ */
/*  Leads — what visitors send, saved for the admin                    */
/* ------------------------------------------------------------------ */

export type FollowUp = "new" | "contacted" | "won" | "lost";
export const FOLLOW_UP_STATUSES: FollowUp[] = ["new", "contacted", "won", "lost"];

export type Enquiry = {
  id: string;
  ref: string;
  name: string;
  company: string;
  service: string;
  serviceTitle: string;
  needs: string[];
  budget: string;
  timeline: string;
  message: string;
  channel: "whatsapp" | "email";
  status: FollowUp;
  notes: string;
  createdAt: string;
};

export type BookRequestStatus = "pending" | "sent" | "failed" | "rejected";

export type BookRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  bookSlug: string;
  status: BookRequestStatus;
  deliveryUsed: string;
  sentAt: string | null;
  expiresAt: string | null;
  downloads: number;
  linkDownloads: number;
  tokenVersion: number;
  error: string;
  notes: string;
  consent: boolean;
  source: string;
  createdAt: string;
};

export type QuizAction = "none" | "whatsapp" | "email";

export type QuizResult = {
  id: string;
  ref: string;
  top: string;
  matches: string;
  summary: string;
  answers: Record<string, string[]>;
  action: QuizAction;
  email: string;
  status: FollowUp;
  notes: string;
  createdAt: string;
};

export type OutboxKind = "ebook" | "ebook-alert" | "quiz-plan";
export type OutboxMail = {
  id: string;
  kind: OutboxKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/*  Admin / The Bridge                                                 */
/* ------------------------------------------------------------------ */

export type AdminRole = "owner" | "admin" | "editor";
export type AdminUser = { id: string; email: string; name: string; role: AdminRole; active: boolean; lastLoginAt: string | null };

/** Everything an admin edits in one place: the published copy is what the public site shows. */
export type Workspace = {
  schema: number;
  site: SiteData;
  pages: Page[];
  faqs: FaqItem[];
  delivery: DeliverySettings;
  email: EbookEmailSettings;
};

export type Version = { id: string; at: string; summary: string[]; workspace: Workspace };
