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
  /** "What do you need?" chips in the Talk-to-us window (admin: add / edit / remove). */
  needs: string[];
};

/** The 9 Quiz: each answer adds points to activities (by their icon key); the top 3 are suggested. */
export type QuizOption = {
  id: string;
  label: string;
  weights: Partial<Record<IconKey, number>>;
  /** In a "pick all" question, choosing this clears the others (e.g. "Nothing yet"). */
  only?: boolean;
};
export type QuizQuestion = {
  id: string;
  /** Short label used in the WhatsApp summary ("Main goal: ..."). */
  label: string;
  q: string;
  hint?: string;
  /** Allow several answers (shows a Next button). */
  multi?: boolean;
  options: QuizOption[];
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
  /** Cover image (uploaded in the admin later). Without one, a designed cover is drawn from `tone`. */
  cover?: string;
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
      needs: ["Social media strategy", "Content calendar", "Account management", "Reels & short video", "Influencers", "Community growth"],
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
      needs: ["Google Ads", "Social media ads", "Campaign creative", "Outdoor & print", "Landing pages", "Retargeting"],
    },
    {
      n: 3,
      slug: "digital-content-creative-production",
      icon: "content",
      title: "Digital content and creative production",
      short: "Content & creative",
      description: "Videos, motion graphics and creative content that tell your story.",
      tags: ["Video", "Motion graphics", "Brand stories"],
      needs: ["Brand video", "Motion graphics", "Social content pack", "Copywriting", "Brand identity", "Product content"],
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
      needs: ["Product photography", "Event coverage", "Corporate headshots", "Aerial / drone", "Highlight film", "Live streaming"],
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
      needs: ["Corporate event", "Product launch", "Exhibition stand", "Conference", "Gala / awards night", "Event staffing"],
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
      needs: ["Press release", "Media relations", "Launch PR", "Crisis communications", "Thought leadership", "Award submissions"],
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
      needs: ["Marketing plan", "Brand positioning", "Market research", "Go-to-market", "Marketing audit", "Team training"],
    },
    {
      n: 8,
      slug: "ai-consultancy",
      icon: "ai",
      title: "AI consultancy",
      short: "AI consultancy",
      description: "Practical advice on using AI to work smarter and grow faster.",
      tags: ["AI roadmaps", "Automation", "Team training"],
      needs: ["AI strategy", "Automate a workflow", "AI chatbot / assistant", "Team AI training", "Data & reporting", "AI content tools"],
    },
    {
      n: 9,
      slug: "it-consultancy",
      icon: "it",
      title: "IT consultancy",
      short: "IT consultancy",
      description: "Planning and supporting the technology your business runs on.",
      tags: ["Systems planning", "Cloud & security", "Support"],
      needs: ["Website / web app", "Cloud setup", "Cyber security", "IT support", "CRM / ERP", "Network & devices"],
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
    text: "Nine quick questions, about a minute. Tap your answers and see which of our nine activities fit your business best.",
    cta: "Start The 9 Quiz",
    questions: [
      {
        id: "who",
        label: "About us",
        q: "What best describes you?",
        options: [
          { id: "startup", label: "A new business or startup", weights: { strategy: 2, social: 1, content: 1, it: 1 } },
          { id: "small", label: "A small business that wants to grow", weights: { social: 2, advertising: 1, content: 1 } },
          { id: "established", label: "An established company", weights: { strategy: 1, pr: 1, ai: 1, it: 1 } },
          { id: "brand", label: "A brand launching a product", weights: { advertising: 2, events: 1, pr: 1, content: 1 } },
          { id: "events", label: "An organiser, exhibitor or venue", weights: { events: 3, photo: 1 } },
        ],
      },
      {
        id: "goal",
        label: "Main goal",
        q: "What is your main goal right now?",
        options: [
          { id: "sales", label: "More customers and sales", weights: { advertising: 3, social: 2 } },
          { id: "known", label: "Make our brand known", weights: { social: 2, pr: 2, content: 1 } },
          { id: "launch", label: "Launch something new", weights: { events: 2, pr: 2, advertising: 1, content: 1 } },
          { id: "event", label: "Run an event or exhibition", weights: { events: 3, photo: 2 } },
          { id: "smarter", label: "Work smarter with AI and tech", weights: { ai: 3, it: 2 } },
        ],
      },
      {
        id: "where",
        label: "Customers",
        q: "Where do your customers find you?",
        options: [
          { id: "social", label: "On social media", weights: { social: 3, content: 1 } },
          { id: "search", label: "Searching on Google", weights: { advertising: 3 } },
          { id: "b2b", label: "Other businesses (B2B)", weights: { strategy: 2, pr: 1, events: 1 } },
          { id: "local", label: "Nearby, in person", weights: { advertising: 1, social: 1, events: 1 } },
          { id: "unsure", label: "We are not sure yet", weights: { strategy: 3 } },
        ],
      },
      {
        id: "online",
        label: "Online today",
        q: "How is your online presence today?",
        options: [
          { id: "zero", label: "We are starting from zero", weights: { strategy: 2, content: 2, it: 1 } },
          { id: "quiet", label: "We have pages, but they are quiet", weights: { social: 3, content: 2 } },
          { id: "flat", label: "Active, but not growing", weights: { advertising: 2, strategy: 2 } },
          { id: "strong", label: "Strong, and we want to scale", weights: { advertising: 2, ai: 1, pr: 1 } },
        ],
      },
      {
        id: "make",
        label: "Needs made",
        q: "What do you need made?",
        hint: "Pick all that apply.",
        multi: true,
        options: [
          { id: "photo", label: "Photos and video", weights: { photo: 3, content: 1 } },
          { id: "posts", label: "Social posts and reels", weights: { social: 2, content: 2 } },
          { id: "ads", label: "Ads and campaigns", weights: { advertising: 3 } },
          { id: "press", label: "Press and PR stories", weights: { pr: 3 } },
          { id: "advice", label: "Nothing yet, advice first", weights: { strategy: 3 }, only: true },
        ],
      },
      {
        id: "event",
        label: "Events",
        q: "Do you have an event coming up?",
        options: [
          { id: "soon", label: "Yes, within 3 months", weights: { events: 3, photo: 2 } },
          { id: "later", label: "Later this year", weights: { events: 2, photo: 1 } },
          { id: "regular", label: "We run events regularly", weights: { events: 2, photo: 2, pr: 1 } },
          { id: "none", label: "No events planned", weights: {} },
        ],
      },
      {
        id: "tech",
        label: "Tech & AI",
        q: "How does your team use tech and AI?",
        options: [
          { id: "little", label: "Hardly at all", weights: { it: 2, ai: 1 } },
          { id: "manual", label: "Basic tools, lots of manual work", weights: { ai: 3, it: 1 } },
          { id: "ai", label: "We want automation and AI", weights: { ai: 3 } },
          { id: "systems", label: "We need better systems or IT support", weights: { it: 3 } },
        ],
      },
      {
        id: "budget",
        label: "Monthly budget",
        q: "What monthly budget can you put into growth?",
        options: [
          { id: "lt5", label: "Under AED 5,000", weights: { social: 1, strategy: 1 } },
          { id: "5to20", label: "AED 5,000 – 20,000", weights: { social: 1, advertising: 1, content: 1 } },
          { id: "20to50", label: "AED 20,000 – 50,000", weights: { advertising: 1, events: 1, photo: 1 } },
          { id: "gt50", label: "AED 50,000+", weights: { events: 1, pr: 1, advertising: 1, ai: 1 } },
          { id: "unsure", label: "Not sure yet", weights: { strategy: 1 } },
        ],
      },
      {
        id: "when",
        label: "Start",
        q: "When would you like to start?",
        options: [
          { id: "asap", label: "As soon as possible", weights: {} },
          { id: "month", label: "Within a month", weights: {} },
          { id: "quarter", label: "In 1–3 months", weights: {} },
          { id: "exploring", label: "Just exploring for now", weights: { strategy: 1 } },
        ],
      },
    ] satisfies QuizQuestion[],
  },

  /** The "Talk to us about this" window (admin: add / edit / remove options). */
  enquiry: {
    title: "Talk to us",
    intro: "Tell us a little, and it goes straight to our team on WhatsApp.",
    budgets: ["Under AED 5k", "AED 5–20k", "AED 20–50k", "AED 50k+", "Not sure yet"],
    timelines: ["As soon as possible", "Within a month", "In 1–3 months", "Just exploring"],
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

/** A WhatsApp chat link to Nine Labs with a pre-filled message. */
export const waHref = (text: string = site.contact.whatsappText) =>
  `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(text)}`;
export const whatsappHref = waHref();
