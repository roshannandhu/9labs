/**
 * The website's built-in content: the defaults the site ships with.
 *
 * Everything here can be changed in the admin (Payload). `getSite()` (src/lib/content/getSite.ts)
 * lays the admin's values over these, so anything left empty there falls back to this file, and
 * `pnpm seed` copies this file into a fresh database. Components read the merged result with
 * `useSite()`; only the fixed facts of the nine activities (their order, icon and anchor) are
 * read from here directly, because each position has its own animated scene.
 */
import type { SiteData } from "./types";
export type * from "./types";

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
  /** Send this activity's enquiries to a different WhatsApp number (digits only). */
  whatsappNumber?: string;
};

/**
 * The 9 Quiz: a tap-card answer. The service each answer fits is worked out from its own words —
 * by the AI, or by the offline keyword matcher (src/lib/quiz/backup.ts) — so no answer is mapped to
 * a service by hand. `solves` is an optional line the admin can write to steer and show the reply.
 */
export type QuizOption = {
  id: string;
  label: string;
  /** Optional "what we say" line for this answer — shown on the result when the AI is off, and read by the matcher. Empty = the matched service's description. */
  solves?: string;
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
  /** Which part of the result sentence this question fills ("You're {who}, your goal is {goal}…"). */
  role?: "who" | "goal" | "when";
  /** Adds an "Other" card where the client types their own need, in their own words. */
  allowOther?: boolean;
  otherPlaceholder?: string;
  options: QuizOption[];
};

export type Value = { key: string; title: string; line: string };

/** The ideas an admin can pick from for a designed cover (see BookCover.tsx). */
export const COVER_ARTS = ["foundation", "signal", "nine", "growth", "idea", "network", "target", "bridge"] as const;
export type CoverArt = (typeof COVER_ARTS)[number];

export type Ebook = {
  id: string;
  slug: string;
  n: string;
  title: string;
  subtitle: string;
  oneLiner: string;
  tone: "blue" | "purple" | "duo";
  /** The picture on a designed cover. Missing = auto: one of the first three, by the book number. */
  art?: CoverArt;
  pages: number;
  readTime: string;
  chapters: string[];
  /** Shown on the shelf/carousel. Switched off without deleting. */
  enabled: boolean;
  /** The file in IndexedDB (src/lib/files.ts); required before a request can be sent. */
  pdfFileId?: string;
  pdfName?: string;
  pdfSize?: number;
  /** Per-book override of the general Book settings ("inherit" = use the general setting). */
  approvalMode: "inherit" | "manual" | "auto";
  deliveryMode: "inherit" | "link" | "attachment" | "both";
  requests: number;
  sent: number;
  downloads: number;
  /** Cover image (uploaded in the admin). Without one, a designed cover is drawn from `tone`. */
  cover?: string;
  /** A logo placed on the designed cover (ignored once `cover` is set). */
  coverLogo?: string;
};

export const site: SiteData = {
  name: "Nine Labs Solutions",
  shortName: "Nine Labs",
  location: "Dubai South District, Dubai, UAE",
  type: "Marketing, events and technology company",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ninelabs.example",
  tagline: "Marketing, events and technology — the bridge between your business and your results.",
  mapUrl: "https://maps.google.com/?q=Dubai+South",
  geo: { locality: "Dubai South", region: "Dubai", country: "AE", latitude: 24.89, longitude: 55.16 },

  contact: {
    email: "hello@ninelabs.example",
    phone: "+971 5X XXX XXXX",
    whatsappNumber: "971500000000",
    whatsappText: "Hi Nine Labs, I'd like to talk about a project.",
    whatsappFab: true,
    fabLabel: "Chat with us",
    chatLabel: "Chat on WhatsApp",
  },

  socials: [
    { key: "instagram", label: "Instagram", href: "#" },
    { key: "linkedin", label: "LinkedIn", href: "#" },
    { key: "x", label: "X", href: "#" },
    { key: "facebook", label: "Facebook", href: "#" },
    { key: "tiktok", label: "TikTok", href: "#" },
    { key: "youtube", label: "YouTube", href: "#" },
  ],

  nav: [
    { label: "Home", href: "#home", id: "home" },
    { label: "Services", href: "#services", id: "services" },
    { label: "About", href: "#about", id: "about" },
    { label: "Free E-books", href: "#ebooks", id: "ebooks" },
    { label: "The 9 Quiz", href: "#quiz", id: "quiz" },
    { label: "Contact", href: "#contact", id: "contact" },
  ],
  navCta: { label: "Start The 9 Quiz", action: "quiz" },
  sections: ["services", "about", "ebooks", "quiz", "faq", "contact"],

  hero: {
    eyebrow: "Marketing · Events · Technology",
    eyebrowExtra: " — Dubai South",
    headline: "Marketing, events and technology,",
    headlineAccent: "built to deliver results.",
    sub: "From AI consultancy to video content and live events, Nine Labs Solutions helps brands in the UAE and beyond grow with a clear method and measurable outcomes.",
    primary: { label: "Start The 9 Quiz", action: "quiz" },
    secondary: { label: "Download our free e-books", action: "link", href: "#ebooks" },
    caption: "9 services · one vision",
  },

  servicesSection: {
    label: "Our 9 labs",
    heading: "Nine team.",
    accent: "Nine activities.",
    intro:
      "Everything your Idea needs to launch, scale, and stand out — from initial strategy to final production, all under one roof.",
    outro: "Nine teams.",
    outroAccent: "One vision.",
    cardCta: "Talk to us about this",
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
    label: "About us",
    strip: "Nine services · nine dedicated teams · one vision",
    story: {
      label: "How we work",
      heading: "Three steps",
      accent: "across the bridge.",
      yourSideLabel: "Your side",
      yourSideTitle: "Your business",
      yourSideChips: ["Goals", "Ideas", "Feedback"],
      ourSideLabel: "Our side",
      ourSideTitle: "Nine Labs",
      middleLabel: "The middle",
      pillOut: "Your goals →",
      pillIn: "← Our expertise",
      result: "✓ Results",
    },
    valuesLabel: "Our values",
    valuesHeading: "What we stand on.",
    valuesIntro: "Five core principles behind every strategy we build, every system we deploy, and every brand we scale.",
    more: "Read more about us",
    statement: "We are the bridge between your business and your *Goal*.",
    body:
      "Nine Labs Solutions is a marketing, events and technology company based in Dubai. We are the bridge between your business and your results. We see your company as our own, and we work in both directions: your goals come to us, and our expertise goes to you. Nine services, nine dedicated teams, one vision: results you can see.",
    philosophy:
      "A bridge only works when traffic moves in both directions. We don’t see clients as accounts to serve and invoice. We see your company as our own, and your results as our results.",
    stats: [
      { value: 9, label: "Services" },
      { value: 9, label: "Teams" },
      { value: 1, label: "Vision" },
    ],
    steps: [
      { n: "01", title: "Your goals reach us", text: "You tell us where you want to go. Your ideas and feedback matter as much as our strategy." },
      { n: "02", title: "Our expertise reaches you", text: "Nine dedicated services backed by data, research, and specialist execution—tailored to your stage of growth." },
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

  aboutPage: {
    missionLabel: "Our mission",
    mission: "To bridge businesses and their goals with quality marketing, events and technology services, treating every client's company as our own.",
    visionLabel: "Our vision",
    vision: "To become the most trusted two-way growth partner for brands in Dubai and beyond.",
    servicesHeading: "What we do",
    servicesLink: "See all services",
    stepsLabel: "How we work",
    stepsHeading: "The bridge, in",
    stepsAccent: "five steps.",
    stepsIntro: "A bridge carries traffic both ways, so every step involves you as well as us.",
    steps: [
      { title: "Listen", text: "We start by understanding your business, your customers and your goals. The 9 Quiz can be your first step." },
      { title: "Plan", text: "We agree a clear plan with you: what we will do, when, and what success looks like." },
      { title: "Build", text: "We create and deliver the work to a standard we would put our own name on." },
      { title: "Report", text: "We show you what is happening in clear, honest reporting, including what is not working." },
      { title: "Improve", text: "We review the results together and adjust, so the next step is stronger than the last." },
    ],
    commitmentsHeading: "Our commitments to clients",
    commitments: [
      { text: "A can-do mindset: we look for a practical way to meet client needs, while staying honest about what is possible and maintaining quality.", enabled: true },
      { text: "A clear scope, timeline and price agreed before work starts. [Details to be confirmed.]", enabled: false },
      { text: "Regular updates and open communication throughout the work.", enabled: true },
      { text: "Your feedback shapes the work at every stage.", enabled: true },
      { text: "Your business information is treated as confidential.", enabled: true },
    ],
    findUsHeading: "Where to find us",
  },

  quiz: {
    label: "The 9 Quiz",
    heading: "Meet",
    accent: "The 9 Quiz.",
    meta: "{count} questions · about a minute · no sign-up",
    result: {
      label: "Your Nine Labs plan",
      heading: "Here’s how we’d get you across.",
      summary: "You're {who}, and your main goal is “{goal}”. Here is where Nine Labs would start{when}.",
      why: "Because you said “{answers}”.",
      steps: [
        { title: "A short discovery call", text: "We listen first: your goals, your customers and what has worked so far." },
        { title: "Start with {first}", text: "{firstDescription}" },
        { title: "Measure, then grow", text: "Add {next} when the numbers say it's time. Clear monthly reporting." },
      ],
      matches: 3,
      whatsappCta: "Send this to Nine Labs on WhatsApp",
      whatsappIntro: "Hi Nine Labs! I took The 9 Quiz.",
      whatsappOutro: "Can we talk?",
      emailEnabled: true,
      emailPlaceholder: "Or e-mail it to me: you@company.com",
      emailCta: "E-mail me",
      emailSent: "Plan on its way to {email}.",
      retake: "↺ Retake",
      ebooksCta: "Get the free e-books →",
    },
    ai: { enabled: false, tone: "friendly", notes: "", maxOtherChars: 300, allowPrices: false, geminiDailyLimitEstimate: 1000 },
    text: "Nine quick questions, about a minute. Tap your answers and see which of our nine activities fit your business best.",
    cta: "Start The 9 Quiz",
    // No answer is mapped to a service by hand. Each `solves` line both shows on the result (when the
    // AI is off) and feeds the offline keyword matcher (src/lib/quiz/backup.ts) that picks the services.
    questions: [
      {
        id: "who",
        role: "who",
        label: "About us",
        q: "What best describes you?",
        allowOther: true,
        options: [
          { id: "startup", label: "A new business or startup", solves: "We shape your brand, offer and launch plan so you start on the right foot." },
          { id: "small", label: "A small business that wants to grow", solves: "We turn your social pages into a steady source of new customers." },
          { id: "established", label: "An established company", solves: "We tell your story in the press and media so your name carries more weight." },
          { id: "brand", label: "A brand launching a product", solves: "We build the launch campaign that puts your product in front of the right buyers." },
          { id: "events", label: "An organiser, exhibitor or venue", solves: "We plan, build and run stands and events that pull people in." },
        ],
      },
      {
        id: "goal",
        role: "goal",
        label: "Main goal",
        q: "What is your main goal right now?",
        allowOther: true,
        options: [
          { id: "sales", label: "More customers and sales", solves: "Targeted ads that reach people ready to buy, measured on real sales." },
          { id: "known", label: "Make our brand known", solves: "Regular, on-brand content that gets your name seen and remembered." },
          { id: "launch", label: "Launch something new", solves: "A launch moment, with event, content and buzz, so people notice from day one." },
          { id: "event", label: "Run an event or exhibition", solves: "Full event and exhibition production, from concept to the last guest." },
          { id: "smarter", label: "Work smarter with AI and tech", solves: "We find where AI saves your team time and set it up for you." },
        ],
      },
      {
        id: "where",
        label: "Customers",
        q: "Where do your customers find you?",
        allowOther: true,
        options: [
          { id: "social", label: "On social media", solves: "We meet your customers where they scroll, with content made for each platform." },
          { id: "search", label: "Searching on Google", solves: "Search ads and landing pages that catch people the moment they look for you." },
          { id: "b2b", label: "Other businesses (B2B)", solves: "A clear B2B plan: who to reach, what to say and where to say it." },
          { id: "local", label: "Nearby, in person", solves: "Local targeting and community content that brings nearby people through your door." },
          { id: "unsure", label: "We are not sure yet", solves: "We find out where your customers really are before you spend on anything." },
        ],
      },
      {
        id: "online",
        label: "Online today",
        q: "How is your online presence today?",
        allowOther: true,
        options: [
          { id: "zero", label: "We are starting from zero", solves: "We build your presence from scratch: the look, the pages and the first content." },
          { id: "quiet", label: "We have pages, but they are quiet", solves: "Fresh photos, videos and posts that bring quiet pages back to life." },
          { id: "flat", label: "Active, but not growing", solves: "Paid reach and sharper targeting to break through the plateau." },
          { id: "strong", label: "Strong, and we want to scale", solves: "We scale what is working with bigger campaigns and tighter tracking." },
        ],
      },
      {
        id: "make",
        label: "Needs made",
        q: "What do you need made most?",
        allowOther: true,
        options: [
          { id: "photo", label: "Photos and video", solves: "Our crew shoots the photos and video your brand needs." },
          { id: "posts", label: "Social posts and reels", solves: "A steady stream of posts and reels, made by our creative team." },
          { id: "ads", label: "Ads and campaigns", solves: "Campaign creative and ad management under one roof." },
          { id: "press", label: "Press and PR stories", solves: "Press releases, media contacts and stories journalists want to run." },
          { id: "advice", label: "Nothing yet, advice first", solves: "We start with a strategy session, so you know exactly what to do first." },
        ],
      },
      {
        id: "event",
        label: "Events",
        q: "Do you have an event coming up?",
        allowOther: true,
        options: [
          { id: "soon", label: "Yes, within 3 months", solves: "We can start planning right away: stand, staging and promotion." },
          { id: "later", label: "Later this year", solves: "Time to plan it properly and build buzz well ahead of the day." },
          { id: "regular", label: "We run events regularly", solves: "Photo and video coverage that turns every event into content." },
          { id: "none", label: "No events planned", solves: "No event needed: we focus on your everyday marketing." },
        ],
      },
      {
        id: "tech",
        label: "Tech & AI",
        q: "How does your team use tech and AI?",
        allowOther: true,
        options: [
          { id: "little", label: "Hardly at all", solves: "We set up the basic tools and systems your team needs." },
          { id: "manual", label: "Basic tools, lots of manual work", solves: "We automate the repetitive work so your team can focus on customers." },
          { id: "ai", label: "We want automation and AI", solves: "We design and build the AI and automation you have in mind." },
          { id: "systems", label: "We need better systems or IT support", solves: "IT support and systems that keep your business running smoothly." },
        ],
      },
      {
        id: "budget",
        label: "Monthly budget",
        q: "What monthly budget can you put into growth?",
        allowOther: true,
        options: [
          { id: "lt5", label: "Under AED 5,000", solves: "We focus your budget on the few things that bring the most back." },
          { id: "5to20", label: "AED 5,000 – 20,000", solves: "Enough for steady social growth plus some paid reach." },
          { id: "20to50", label: "AED 20,000 – 50,000", solves: "Room for a full campaign mix across ads and content." },
          { id: "gt50", label: "AED 50,000+", solves: "A full-scale, multi-channel plan with room to test and grow." },
          { id: "unsure", label: "Not sure yet", solves: "We help you set a budget that matches your goals." },
        ],
      },
      {
        id: "when",
        role: "when",
        label: "Start",
        q: "When would you like to start?",
        allowOther: true,
        options: [
          { id: "asap", label: "As soon as possible", solves: "We will book your discovery call as soon as you message us." },
          { id: "month", label: "Within a month", solves: "We plan now, so everything is ready when you are." },
          { id: "quarter", label: "In 1–3 months", solves: "We map out the plan now and start when you are ready." },
          { id: "exploring", label: "Just exploring for now", solves: "No pressure: a free chat to explore your options." },
        ],
      },
    ] satisfies QuizQuestion[],
  },

  /** The "Talk to us about this" window (admin: add / edit / remove options). */
  enquiry: {
    title: "Talk to us",
    intro: "Tell us a little, and it goes straight to our team on WhatsApp.",
    activityLabel: "Activity",
    needsLabel: "What do you need?",
    budgetLabel: "Budget",
    timelineLabel: "When",
    nameLabel: "Your name *",
    namePlaceholder: "Your name",
    nameError: "Please add your name.",
    companyLabel: "Company",
    companyPlaceholder: "Optional",
    messageLabel: "Message",
    messagePlaceholder: "Anything else we should know? (optional)",
    whatsappCta: "Send on WhatsApp",
    emailEnabled: true,
    emailCta: "E-mail instead",
    greeting: "Hi Nine Labs! 👋",
    signature: "(Sent from the Nine Labs website)",
    thanksTitle: "Thanks, {name}!",
    thanksText: "Your message is ready in WhatsApp — just press send. We usually reply within a working day.",
    again: "Open WhatsApp again",
    budgets: ["Under AED 5k", "AED 5–20k", "AED 20–50k", "AED 50k+", "Not sure yet"],
    timelines: ["As soon as possible", "Within a month", "In 1–3 months", "Just exploring"],
    fields: ["needs", "budget", "timeline", "company", "message"],
    required: [],
    refCode: true,
    emailSubject: "Enquiry: {service}",
    redirect: { mode: "direct", seconds: 3, newTab: true },
    template: [
      "Hi Nine Labs! 👋",
      "I'm {name}[ from {company}].",
      "",
      "Interested in: {service}",
      "[What we need: {needs}]",
      "[Budget: {budget}]",
      "[Timeline: {timeline}]",
      "",
      "{message}",
      "",
      "[Ref: {ref}]",
      "(Sent from the Nine Labs website)",
    ].join("\n"),
  },

  ebooksSection: {
    label: "Free e-books",
    heading: "Principles, not tricks.",
    accent: "Free to read.",
    intro: "Three short e-books that explain how growth really works — and how we work. Pick one, open it, and we’ll send it to your inbox.",
    cardLabel: "E-book {n} · {pages} pages",
    cardCta: "Get the free e-book",
    insideLabel: "Inside this book",
  },
  ebookForm: {
    eyebrow: "Free e-book · {n}",
    title: "Where should we send it?",
    text: "We’ll email “{title}” to you.",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@company.com",
    phoneLabel: "Phone / WhatsApp",
    phonePlaceholder: "50 123 4567",
    phoneRequired: true,
    companyLabel: "Company",
    companyPlaceholder: "Company name",
    showCompany: true,
    consent: "I agree to receive this e-book and occasional updates from Nine Labs Solutions. Unsubscribe anytime.",
    submit: "Send me the e-book",
    sending: "Sending…",
    codes: [
      { code: "+971", label: "UAE +971" },
      { code: "+966", label: "KSA +966" },
      { code: "+974", label: "QA +974" },
      { code: "+965", label: "KW +965" },
      { code: "+973", label: "BH +973" },
      { code: "+968", label: "OM +968" },
      { code: "+91", label: "IN +91" },
      { code: "+44", label: "UK +44" },
      { code: "+1", label: "US +1" },
    ],
    defaultCode: "+971",
    successTitle: "You’re on the list{name}!",
    successPending: "We’ll send “{title}” to {email} in a few minutes. Keep an eye on your inbox.",
    successSent: "“{title}” is on its way to {email}. Check your inbox (and the spam folder, just in case).",
    error: "Sorry, that didn’t go through. Please try again in a moment.",
    back: "Back to the shelf",
  },

  ebooks: [
    {
      id: "book-1",
      slug: "the-foundations",
      n: "01",
      title: "The Foundations",
      subtitle: "Marketing principles every business should know",
      oneLiner: "The foundations every business should know before spending a dirham on marketing.",
      tone: "blue",
      pages: 42,
      readTime: "35 min read",
      chapters: ["Know your customer", "Position before you promote", "The message that sticks", "Measuring what matters"],
      enabled: true,
      approvalMode: "inherit",
      deliveryMode: "inherit",
      requests: 0,
      sent: 0,
      downloads: 0,
    },
    {
      id: "book-2",
      slug: "why-digital-why-now",
      n: "02",
      title: "Why Digital, Why Now",
      subtitle: "Why digital marketing matters in this era",
      oneLiner: "Why digital marketing matters in this era, and what changes when you get it right.",
      tone: "purple",
      pages: 38,
      readTime: "30 min read",
      chapters: ["Where attention lives now", "Search, social and the new funnel", "Content that compounds", "Data without the jargon"],
      enabled: true,
      approvalMode: "inherit",
      deliveryMode: "inherit",
      requests: 0,
      sent: 0,
      downloads: 0,
    },
    {
      id: "book-3",
      slug: "the-nine-labs-method",
      n: "03",
      title: "The Nine Labs Method",
      subtitle: "How we work and the kind of work we do",
      oneLiner: "How Nine Labs Solutions works, and the kind of work we do for our partners.",
      tone: "duo",
      pages: 46,
      readTime: "40 min read",
      chapters: ["The bridge philosophy", "Nine activities, one team", "From brief to results", "Case notes from the field"],
      enabled: true,
      approvalMode: "inherit",
      deliveryMode: "inherit",
      requests: 0,
      sent: 0,
      downloads: 0,
    },
  ] satisfies Ebook[],

  closing: {
    label: "Contact",
    heading: "Ready to cross",
    accent: "the bridge?",
    text: "Tell us where you want to go. Your goals reach us, our expertise reaches you — and together we get across.",
    emailLabel: "Email",
    phoneLabel: "Phone / WhatsApp",
    visitLabel: "Visit",
    cta: "Start The 9 Quiz",
    loop: "Ready to cross the bridge? ✦ Start The 9 Quiz ✦ ",
  },

  footer: {
    copyright: "© 2026 Nine Labs Solutions. All rights reserved.",
    navTitle: "Navigate",
    activitiesTitle: "Activities",
    contactTitle: "Contact",
    pagesTitle: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Privacy", href: "/privacy" },
    ],
  },

  faqPreview: { enabled: false, label: "FAQ", heading: "Questions,", accent: "answered.", cta: "See all FAQs", count: 4, items: [] },

  theme: { default: "light", toggle: true, intro: true, grid: 0.06, colors: {} },

  seo: {
    title: "Nine Labs Solutions — Marketing, Events & Technology in Dubai",
    titleTemplate: "%s · Nine Labs Solutions",
    description:
      "From AI consultancy to video content and live events, Nine Labs Solutions helps brands in the UAE and beyond grow with a clear method and measurable outcomes.",
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
    index: true,
  },

  integrations: {
    cookieText: "We use cookies to understand how the site is used. You can accept or decline.",
    cookieAccept: "Accept",
    cookieDecline: "Decline",
  },
};

export type Site = SiteData;

/** A WhatsApp chat link with a pre-filled message. */
export const waLink = (number: string, text: string) => `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Fill `{name}` style placeholders in admin-edited text. Unknown placeholders are left as they are. */
export const fill = (template: string, values: Record<string, string | number | undefined>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (values[k] === undefined ? m : String(values[k])));

/** A book card's label ("E-book 04 · 40 pages"); a part that needs the page count is dropped while it's still 0. */
export const bookCardLabel = (template: string, book: { n: string; pages: number }) =>
  template
    .split("·")
    .filter((part) => book.pages > 0 || !part.includes("{pages}"))
    .map((part) => fill(part, { n: book.n, pages: book.pages }).trim())
    .join(" · ");
