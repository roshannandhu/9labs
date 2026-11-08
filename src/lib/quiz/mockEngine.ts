import { site, type Service } from "@/content/site";

export type QuizMatch = { service: Service; score: number; why: string };
export type QuizAnswer = {
  summary: string;
  matches: QuizMatch[];
  steps: { title: string; text: string }[];
  whatsappText: string;
};

const WHY: Record<string, (ctx: Ctx) => string> = {
  "digital-social-media-marketing": (c) =>
    `${c.industry ? `A ${c.industry} brand` : "Your brand"} grows where your audience already scrolls — we'd plan the content, run the channels and build a community around it.`,
  advertising: () => "Paid campaigns put your message in front of the right people quickly — with tight targeting and spend you can track to results.",
  "digital-content-creative-production": () => "Short videos and motion graphics make your story easy to share — we'd produce a library of content that works across every channel.",
  "photography-events-filming": () => "Strong visuals do the selling: product and brand photography plus filming that captures you at your best.",
  "events-trade-shows": (c) => `We'd plan, promote and run the event end-to-end${c.loc ? ` ${c.loc}` : ""} — venue, stand, guests and the follow-up that turns attendees into leads.`,
  "pr-communications": () => "PR builds trust you can't buy with ads — media relations and clear messaging that grow your reputation and your voice.",
  "marketing-strategy-consultancy": (c) =>
    `Every good result starts with direction: a research-led plan for ${c.industry ? `the ${c.industry} market` : "your market"}${c.loc ? ` ${c.loc}` : ""}, so each dirham has a job.`,
  "ai-consultancy": () => "Practical AI — automating repetitive work, smarter customer replies and tools your team will actually use.",
  "it-consultancy": () => "Reliable technology underneath it all: the systems, website and cloud setup your business runs on, planned and supported.",
};

type Ctx = { loc: string; industry: string };

const LOCATIONS: [RegExp, string][] = [
  [/\bdubai marina\b/, "in Dubai Marina"],
  [/\bdubai south\b/, "in Dubai South"],
  [/\bdubai\b/, "in Dubai"],
  [/\babu dhabi\b/, "in Abu Dhabi"],
  [/\bsharjah\b/, "in Sharjah"],
  [/\b(uae|emirates)\b/, "across the UAE"],
  [/\b(ksa|saudi|riyadh|jeddah)\b/, "in Saudi Arabia"],
  [/\b(gcc|middle east)\b/, "across the GCC"],
];

const INDUSTRIES: [RegExp, string][] = [
  [/\b(restaurant|cafe|café|coffee|food|kitchen|bakery)\b/, "hospitality"],
  [/\b(hotel|resort|travel|tourism)\b/, "hospitality"],
  [/\b(software|saas|app|tech|startup)\b/, "technology"],
  [/\b(real estate|property|properties|developer)\b/, "real-estate"],
  [/\b(clinic|medical|health|dental|pharma)\b/, "healthcare"],
  [/\b(retail|shop|store|e-?commerce|fashion|beauty)\b/, "retail"],
  [/\b(b2b|industrial|logistics|manufactur)/, "B2B"],
  [/\b(school|education|academy|university)\b/, "education"],
  [/\b(bank|finance|fintech|insurance)\b/, "finance"],
];

function context(text: string): Ctx {
  const loc = LOCATIONS.find(([re]) => re.test(text))?.[1] ?? "";
  const industry = INDUSTRIES.find(([re]) => re.test(text))?.[1] ?? "";
  return { loc, industry };
}

function score(service: Service, text: string) {
  let s = 0;
  for (const kw of service.keywords) {
    const re = new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(text)) s += kw.includes(" ") ? 2.2 : 1.4;
  }
  return s;
}

/** Deterministic "AI" for the demo: keyword scoring + friendly templates. */
export function analyze(input: string): QuizAnswer {
  const text = ` ${input.toLowerCase()} `;
  const ctx = context(text);
  const scored = site.services
    .map((s) => ({ s, v: score(s, text) + (s.slug === "marketing-strategy-consultancy" ? 0.9 : 0) }))
    .sort((a, b) => b.v - a.v);

  const fallback = ["marketing-strategy-consultancy", "digital-social-media-marketing", "digital-content-creative-production"];
  let top = scored.filter((x) => x.v > 1).slice(0, 3).map((x) => x.s);
  for (const slug of fallback) {
    if (top.length >= 3) break;
    const svc = site.services.find((s) => s.slug === slug)!;
    if (!top.includes(svc)) top.push(svc);
  }
  top = top.slice(0, 3);

  const maxV = Math.max(...scored.map((x) => x.v), 1);
  const matches: QuizMatch[] = top.map((service, i) => {
    const v = scored.find((x) => x.s === service)?.v ?? 0;
    const pct = Math.round(Math.min(97, 74 + (v / maxV) * 21 - i * 3));
    return { service, score: pct, why: WHY[service.slug]?.(ctx) ?? service.description };
  });

  const [a, b, c] = matches.map((m) => m.service);
  const forWho = ctx.industry ? `For your ${ctx.industry} business` : ctx.loc ? "For your business" : "";
  const where = ctx.loc ? ` ${ctx.loc}` : "";
  const lead = forWho ? `${forWho}${where}, we’d lead with` : "We’d lead with";
  const summary =
    `${lead} ${a.title.toLowerCase()}, back it with ${b.title.toLowerCase()}, and add ${c.title.toLowerCase()} ` +
    `so every part pulls in the same direction. One team, one plan — with results you can measure from the first month.`;

  const steps = [
    { title: "Discover", text: "A short research sprint: your audience, competitors and goals become a one-page plan you sign off." },
    { title: "Build", text: `${a.short} and ${b.short.toLowerCase()} go live together — produced, launched and managed by one team.` },
    { title: "Deliver & measure", text: `${c.short} completes the picture, with clear monthly reporting and no hidden surprises.` },
  ];

  const whatsappText = `Hi Nine Labs! I took The 9 Quiz. My need: "${input.trim().slice(0, 240)}". Suggested: ${matches
    .map((m) => m.service.short)
    .join(", ")}. Can we talk?`;

  return { summary, matches, steps, whatsappText };
}
