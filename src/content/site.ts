/**
 * All homepage content for the frontend demo.
 *
 * Copy marked "working draft" in the client brief is used verbatim. Items the client
 * will supply later (logo, contact details, social links, e-book titles/covers) use
 * clearly fake placeholders. The shape of this file mirrors the future Payload CMS
 * collections/globals, so the admin can replace it without UI changes.
 */

export type IconKey =
  | "social"
  | "advertising"
  | "content"
  | "photo"
  | "events"
  | "pr"
  | "strategy"
  | "ai"
  | "it";

export type Service = {
  n: number;
  slug: string;
  icon: IconKey;
  title: string;
  short: string;
  description: string;
  tags: string[];
  /** Words the demo quiz uses to match a visitor's need to this activity. */
  keywords: string[];
};

export type Value = { key: string; title: string; line: string };

export type Ebook = {
  slug: string;
  n: string;
  title: string;
  subtitle: string;
  oneLiner: string;
  tone: "blue" | "purple" | "duo";
  pages: number;
  readTime: string;
  chapters: string[];
};

export const site = {
  name: "Nine Labs Solutions",
  shortName: "Nine Labs",
  location: "Dubai South, Dubai, UAE",
  type: "Marketing, events and technology company",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ninelabs.example",

  contact: {
    email: "hello@ninelabs.example",
    phone: "+971 5X XXX XXXX",
    whatsappNumber: "971500000000",
    whatsappText: "Hi Nine Labs, I'd like to talk about a project.",
  },

  socials: [
    { key: "instagram", label: "Instagram", href: "#" },
    { key: "linkedin", label: "LinkedIn", href: "#" },
    { key: "x", label: "X", href: "#" },
    { key: "facebook", label: "Facebook", href: "#" },
    { key: "tiktok", label: "TikTok", href: "#" },
    { key: "youtube", label: "YouTube", href: "#" },
  ] as const,

  nav: [
    { label: "Home", href: "#home", id: "home" },
    { label: "Services", href: "#services", id: "services" },
    { label: "About", href: "#about", id: "about" },
    { label: "Free E-books", href: "#ebooks", id: "ebooks" },
    { label: "The 9 Quiz", href: "#quiz", id: "quiz" },
    { label: "Contact", href: "#contact", id: "contact" },
  ],

  hero: {
    eyebrow: "Marketing · Events · Technology — Dubai South",
    headline: "Marketing, events and technology, built to deliver results.",
    sub: "From AI consultancy to video content and live events, Nine Labs Solutions helps brands in Dubai and beyond grow with a clear method and measurable outcomes.",
    primaryCta: "Start The 9 Quiz",
    secondaryCta: "Download our free e-books",
  },

  services: [
    {
      n: 1,
      slug: "digital-social-media-marketing",
      icon: "social",
      title: "Digital and social media marketing",
      short: "Social media",
      description:
        "Strategy, content and management that grow your brand across social platforms.",
      tags: ["Strategy", "Content calendars", "Community"],
      keywords: ["social", "social media", "know about", "awareness", "instagram", "tiktok", "followers", "community", "content", "brand awareness", "engagement", "linkedin", "influencer", "grow", "audience", "reels", "posts"],
    },
    {
      n: 2,
      slug: "advertising",
      icon: "advertising",
      title: "Advertising",
      short: "Advertising",
      description:
        "Digital and online advertising that puts your message in front of the right audience.",
      tags: ["Paid social", "Search ads", "Retargeting"],
      keywords: ["ads", "advertising", "campaign", "leads", "sales", "google", "meta", "paid", "conversion", "traffic", "customers", "roi", "launch"],
    },
    {
      n: 3,
      slug: "digital-content-creative-production",
      icon: "content",
      title: "Digital content and creative production",
      short: "Content & creative",
      description: "Videos, motion graphics and creative content that tell your story.",
      tags: ["Video", "Motion graphics", "Brand stories"],
      keywords: ["video", "motion", "creative", "animation", "story", "reel", "brand film", "design", "graphics", "content", "youtube"],
    },
    {
      n: 4,
      slug: "photography-events-filming",
      icon: "photo",
      title: "Photography and events filming",
      short: "Photo & filming",
      description:
        "Commercial photography and event filming that capture your brand at its best.",
      tags: ["Product shoots", "Event coverage", "Aftermovies"],
      keywords: ["photo", "photos", "photography", "photographer", "shoot", "shooting", "images", "camera", "filming", "film", "product", "event coverage", "pictures", "menu", "catalogue"],
    },
    {
      n: 5,
      slug: "events-trade-shows",
      icon: "events",
      title: "Events and trade shows",
      short: "Events",
      description:
        "We plan, promote and manage business events, conferences and exhibitions.",
      tags: ["Conferences", "Exhibitions", "Launch events"],
      keywords: ["event", "events", "launch event", "conference", "exhibition", "trade show", "stand", "booth", "launch event", "gala", "guests", "venue", "expo", "opening"],
    },
    {
      n: 6,
      slug: "pr-communications",
      icon: "pr",
      title: "PR and communications",
      short: "PR & comms",
      description:
        "Public relations and communications that build your reputation and your voice.",
      tags: ["Media relations", "Press releases", "Reputation"],
      keywords: ["pr", "press", "media", "reputation", "news", "journalist", "announcement", "communications", "crisis", "voice", "visibility"],
    },
    {
      n: 7,
      slug: "marketing-strategy-consultancy",
      icon: "strategy",
      title: "Marketing and strategy consultancy",
      short: "Strategy",
      description:
        "Research-led marketing and strategy advice, so every decision has a clear direction.",
      tags: ["Market research", "Go-to-market", "Brand positioning"],
      keywords: ["strategy", "plan", "research", "market", "positioning", "brand", "competitors", "go-to-market", "direction", "new business", "startup", "expand", "dubai", "uae"],
    },
    {
      n: 8,
      slug: "ai-consultancy",
      icon: "ai",
      title: "AI consultancy",
      short: "AI consultancy",
      description: "Practical advice on using AI to work smarter and grow faster.",
      tags: ["AI roadmaps", "Automation", "Team training"],
      keywords: ["ai", "artificial intelligence", "automation", "automate", "chatbot", "gpt", "machine learning", "efficiency", "smarter", "workflow", "agents"],
    },
    {
      n: 9,
      slug: "it-consultancy",
      icon: "it",
      title: "IT consultancy",
      short: "IT consultancy",
      description: "Planning and supporting the technology your business runs on.",
      tags: ["Systems planning", "Cloud & security", "Support"],
      keywords: ["website", "websites", "software", "systems", "cloud", "security", "network", "technology", "infrastructure", "crm", "erp", "app", "tech"],
    },
  ] satisfies Service[],

  about: {
    statement: "We are the bridge between your business and your results.",
    body:
      "Nine Labs Solutions is a marketing, events and technology company based in Dubai South. We are the bridge between your business and your results. We see your company as our own, and we work in both directions: your goals come to us, and our expertise goes to you. Nine activities, one team, one aim: results you can see.",
    philosophy:
      "A bridge only works when traffic moves in both directions. We don’t see clients as accounts to serve and invoice. We see your company as our own, and your results as our results.",
    stats: [
      { value: 9, label: "Activities" },
      { value: 1, label: "Team" },
      { value: 1, label: "Aim" },
    ],
    steps: [
      { n: "01", title: "Your goals reach us", text: "You tell us where you want to go. Your ideas and feedback matter as much as our strategy." },
      { n: "02", title: "Our expertise reaches you", text: "Nine activities under one roof, applied with a clear, research-led method." },
      { n: "03", title: "Together, we get across", text: "Honest reporting and measurable outcomes. We grow when you grow." },
    ],
  },

  values: [
    { key: "partnership", title: "Partnership", line: "We work with you, not just for you. Your ideas and feedback matter as much as our strategy." },
    { key: "ownership", title: "Ownership", line: "Your business is treated as our own, and we stand behind the results." },
    { key: "trust", title: "Trust", line: "Honest advice, clear reporting and no hidden surprises." },
    { key: "quality", title: "Quality", line: "Every campaign, video, event and strategy is built to a standard we would put our own name on." },
    { key: "loyalty", title: "Loyalty", line: "We stay with clients for the long run, and we grow when they grow." },
  ] satisfies Value[],

  quiz: {
    heading: "Meet The 9 Quiz.",
    text: "Tell us what you need, and our AI will show you how Nine Labs Solutions can deliver it.",
    cta: "Start The 9 Quiz",
    examples: [
      "We’re opening a new restaurant in Dubai Marina and need people to know about it…",
      "We need more B2B leads for our software company in the UAE…",
      "We’re planning a product launch event for 500 guests…",
      "We want to use AI to save our team time every week…",
    ],
    chips: [
      "Launch a brand",
      "Grow on social",
      "Plan an event",
      "Get more leads",
      "Use AI in my business",
      "Upgrade our IT",
    ],
  },

  ebooks: [
    {
      slug: "the-foundations",
      n: "01",
      title: "The Foundations",
      subtitle: "Marketing principles every business should know",
      oneLiner: "The foundations every business should know before spending a dirham on marketing.",
      tone: "blue",
      pages: 42,
      readTime: "35 min read",
      chapters: ["Know your customer", "Position before you promote", "The message that sticks", "Measuring what matters"],
    },
    {
      slug: "why-digital-why-now",
      n: "02",
      title: "Why Digital, Why Now",
      subtitle: "Why digital marketing matters in this era",
      oneLiner: "Why digital marketing matters in this era, and what changes when you get it right.",
      tone: "purple",
      pages: 38,
      readTime: "30 min read",
      chapters: ["Where attention lives now", "Search, social and the new funnel", "Content that compounds", "Data without the jargon"],
    },
    {
      slug: "the-nine-labs-method",
      n: "03",
      title: "The Nine Labs Method",
      subtitle: "How we work and the kind of work we do",
      oneLiner: "How Nine Labs Solutions works, and the kind of work we do for our partners.",
      tone: "duo",
      pages: 46,
      readTime: "40 min read",
      chapters: ["The bridge philosophy", "Nine activities, one team", "From brief to results", "Case notes from the field"],
    },
  ] satisfies Ebook[],

  closing: {
    line: "Ready to cross the bridge?",
    cta: "Start The 9 Quiz",
    loop: "Ready to cross the bridge? ✦ Start The 9 Quiz ✦ ",
  },

  footer: {
    copyright: "© 2026 Nine Labs Solutions. All rights reserved.",
  },
};

export type Site = typeof site;

export const whatsappHref = `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(site.contact.whatsappText)}`;
