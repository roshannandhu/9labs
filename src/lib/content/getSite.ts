import "server-only";
import { unstable_cache } from "next/cache";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { site as defaults, type Ebook, type IconKey, type QuizQuestion, type Service, type Value } from "@/content/site";
import type { FaqItem, NavItem, SectionKey, SiteData, SocialKey } from "@/content/types";
import { SITE_TAG } from "@/payload/hooks/revalidate";

export const payloadClient = (): Promise<Payload> => getPayload({ config });

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Text the admin may deliberately leave empty (an empty value hides it instead of restoring the default). */
const MAY_BE_EMPTY = new Set([
  "accent", "headlineAccent", "outroAccent", "eyebrowExtra", "caption", "strip", "intro", "meta", "philosophy", "text", "tagline",
  "greeting", "signature", "whatsappOutro", "whatsappIntro", "companyPlaceholder", "namePlaceholder", "emailPlaceholder", "phonePlaceholder",
  "messagePlaceholder", "loop", "eyebrow", "ga4", "gtm", "metaPixel", "googleVerification", "valuesIntro", "why", "href", "pagesTitle", "label",
]);

/**
 * Lay the admin's values over the built-in defaults: a missing value keeps the default, lists are
 * taken as saved (an emptied list stays empty), and Payload's row ids are dropped.
 */
function merge<T>(d: T, c: unknown, key = ""): T {
  if (c === null || c === undefined) return d;
  if (Array.isArray(d)) {
    if (!Array.isArray(c)) return d;
    const sample = d[0];
    return c.map((row) => (isRec(row) ? (isRec(sample) ? shape(sample, row) : strip(row)) : row)) as T;
  }
  if (isRec(d)) {
    if (!isRec(c)) return d;
    const out: Rec = { ...d };
    for (const k of Object.keys(d)) out[k] = merge((d as Rec)[k], c[k], k);
    return out as T;
  }
  if (typeof d === "string") return (typeof c === "string" && (c.trim() !== "" || MAY_BE_EMPTY.has(key)) ? c : d) as T;
  if (typeof d === "number") return (typeof c === "number" && Number.isFinite(c) ? c : d) as T;
  if (typeof d === "boolean") return (typeof c === "boolean" ? c : d) as T;
  return (c as T) ?? d;
}
/** A list row as saved, cut to the fields the site knows (no fallback: an empty cell stays empty). */
function shape(sample: Rec, row: Rec): Rec {
  const out: Rec = {};
  for (const [k, v] of Object.entries(sample)) {
    const c = row[k];
    if (typeof v === "string") out[k] = str(c);
    else if (typeof v === "number") out[k] = Number(c) || 0;
    else if (typeof v === "boolean") out[k] = Boolean(c);
    else if (isRec(v)) out[k] = isRec(c) ? shape(v, c) : v;
    else out[k] = c ?? v;
  }
  return out;
}
const strip = (row: Rec) => {
  const out = { ...row };
  delete out.id;
  return out;
};

const mediaUrl = (v: unknown): string | undefined => (isRec(v) && typeof v.url === "string" ? v.url : undefined);

const SOCIAL_LABELS: Record<SocialKey, string> = { instagram: "Instagram", linkedin: "LinkedIn", x: "X", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube" };

function questions(rows: unknown): QuizQuestion[] | null {
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows.filter(isRec).map((q) => ({
    id: str(q.id),
    label: str(q.label),
    q: str(q.q),
    hint: str(q.hint) || undefined,
    multi: Boolean(q.multi),
    role: q.role === "who" || q.role === "goal" || q.role === "when" ? q.role : undefined,
    options: (Array.isArray(q.options) ? q.options : []).filter(isRec).map((o) => ({
      id: str(o.id),
      label: str(o.label),
      only: Boolean(o.only) || undefined,
      weights: Object.fromEntries(Object.entries(isRec(o.points) ? o.points : {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])) as Partial<Record<IconKey, number>>,
    })),
  }));
}

export function faqItem(doc: Rec): FaqItem {
  const answer = doc.answer as Parameters<typeof convertLexicalToHTML>[0]["data"] | undefined;
  return {
    id: String(doc.id),
    question: str(doc.question),
    category: str(doc.category) || undefined,
    answerHtml: answer ? convertLexicalToHTML({ data: answer }) : "",
    answerText: answer ? convertLexicalToPlaintext({ data: answer }) : "",
  };
}

async function load(): Promise<SiteData> {
  const payload = await payloadClient();
  const o = { overrideAccess: true, depth: 1 } as const;
  const [svc, vals, books, company, navigation, homepage, footer, settings, quiz, enquiry, ebookSettings] = await Promise.all([
    payload.find({ collection: "services", sort: "n", limit: 20, ...o }),
    payload.find({ collection: "values", sort: "_order", limit: 50, ...o }),
    payload.find({ collection: "ebooks", sort: "_order", limit: 50, where: { enabled: { not_equals: false } }, ...o }),
    payload.findGlobal({ slug: "company", ...o }),
    payload.findGlobal({ slug: "navigation", ...o }),
    payload.findGlobal({ slug: "homepage", ...o }),
    payload.findGlobal({ slug: "footer", ...o }),
    payload.findGlobal({ slug: "site-settings", ...o }),
    payload.findGlobal({ slug: "quiz-settings", ...o }),
    payload.findGlobal({ slug: "enquiry-settings", ...o }),
    payload.findGlobal({ slug: "ebook-settings", ...o }),
  ]);

  // An empty database (not seeded yet): the built-in content as it is.
  if (!svc.docs.length) return defaults;

  const c = company as unknown as Rec;
  const h = homepage as unknown as Rec;
  const s = settings as unknown as Rec;
  const qz = quiz as unknown as Rec;
  const es = ebookSettings as unknown as Rec;

  // the nine cards: order, icon and anchor are fixed (each position has its own scene); the words come from the admin
  const services: Service[] = defaults.services.map((d) => {
    const doc = (svc.docs as unknown as Rec[]).find((x) => x.n === d.n);
    if (!doc) return d;
    const m = merge({ title: d.title, short: d.short, description: d.description, tags: d.tags, needs: d.needs }, doc);
    return { ...d, ...m, whatsappNumber: str(doc.whatsappNumber) || undefined };
  });

  const values: Value[] = (vals.docs as unknown as Rec[]).map((v) => ({ key: str(v.key) || "partnership", title: str(v.title), line: str(v.line) }));

  const ebooks: Ebook[] = (books.docs as unknown as Rec[]).map((b, i) => ({
    slug: str(b.slug),
    n: String(i + 1).padStart(2, "0"),
    title: str(b.title),
    subtitle: str(b.subtitle),
    oneLiner: str(b.oneLiner),
    tone: b.tone === "purple" || b.tone === "duo" ? b.tone : "blue",
    pages: Number(b.pages) || 0,
    readTime: str(b.readTime),
    chapters: Array.isArray(b.chapters) ? (b.chapters as string[]) : [],
    cover: (isRec(b.cover) && isRec(b.cover.sizes) && mediaUrl(b.cover.sizes.cover)) || mediaUrl(b.cover),
  }));

  const nav: NavItem[] = (Array.isArray((navigation as unknown as Rec).items) ? ((navigation as unknown as Rec).items as Rec[]) : [])
    .map((n) => (n.kind === "link" ? { label: str(n.label), href: str(n.href), id: str(n.href) } : { label: str(n.label), href: `#${str(n.section) || "home"}`, id: str(n.section) || "home" }))
    .filter((n) => n.label && n.href);

  const sections = (Array.isArray(h.sections) ? (h.sections as Rec[]) : []).filter((x) => x.enabled !== false).map((x) => str(x.section) as SectionKey);

  const socials = (Array.isArray(c.socials) ? (c.socials as Rec[]) : [])
    .filter((x) => x.enabled !== false && /^https?:\/\//.test(str(x.href)) && str(x.key) in SOCIAL_LABELS)
    .map((x) => ({ key: x.key as SocialKey, label: SOCIAL_LABELS[x.key as SocialKey], href: str(x.href) }));

  const preview = merge({ ...defaults.faqPreview, count: 4 }, h.faqPreview);
  let faqItems: FaqItem[] = [];
  if (preview.enabled) {
    const f = await payload.find({ collection: "faqs", sort: "_order", limit: preview.count, where: { enabled: { not_equals: false } }, overrideAccess: true, depth: 0 });
    faqItems = (f.docs as unknown as Rec[]).map(faqItem);
  }

  const theme = merge(defaults.theme, s.theme);
  const colors = Object.fromEntries(Object.entries(isRec(isRec(s.theme) ? s.theme.colors : null) ? ((s.theme as Rec).colors as Rec) : {}).filter(([, v]) => typeof v === "string" && /^#[0-9a-f]{3,6}$/i.test(v)));

  const about = merge(defaults.about, h.about);
  const quizBase = merge({ label: defaults.quiz.label, heading: defaults.quiz.heading, accent: defaults.quiz.accent, text: defaults.quiz.text, cta: defaults.quiz.cta, meta: defaults.quiz.meta, result: defaults.quiz.result }, qz);

  return {
    ...merge(
      { name: defaults.name, shortName: defaults.shortName, type: defaults.type, tagline: defaults.tagline, location: defaults.location, mapUrl: defaults.mapUrl, geo: defaults.geo, contact: defaults.contact },
      c,
    ),
    url: defaults.url,
    logo: mediaUrl(c.logo),
    favicon: mediaUrl(c.favicon),
    socials,
    nav: nav.length ? nav : defaults.nav,
    navCta: merge(defaults.navCta, (navigation as unknown as Rec).cta),
    sections: sections.length || Array.isArray(h.sections) ? sections : defaults.sections,
    hero: merge(defaults.hero, h.hero),
    servicesSection: merge(defaults.servicesSection, h.servicesSection),
    services,
    about: { ...about, steps: about.steps.length === 3 ? about.steps : defaults.about.steps, stats: about.stats.length ? about.stats : defaults.about.stats },
    values,
    quiz: { ...quizBase, questions: questions(qz.questions) ?? defaults.quiz.questions },
    enquiry: merge(defaults.enquiry, enquiry),
    ebooksSection: merge(defaults.ebooksSection, es.section),
    ebookForm: merge(defaults.ebookForm, es.form),
    ebooks,
    closing: merge(defaults.closing, h.closing),
    footer: merge(defaults.footer, footer),
    faqPreview: { enabled: preview.enabled && faqItems.length > 0, label: preview.label, heading: preview.heading, accent: preview.accent, cta: preview.cta, items: faqItems },
    theme: { ...theme, colors },
    seo: { ...merge(defaults.seo, s.seo), ogImage: mediaUrl(isRec(s.seo) ? s.seo.ogImage : null) },
    integrations: merge(defaults.integrations, s.integrations),
  };
}

const cached = unstable_cache(load, ["site-data-v1"], { tags: [SITE_TAG] });

/**
 * Everything the public site shows, as one object. Cached until an admin saves something
 * (every Payload afterChange hook clears the `site` tag). If the database cannot be read, the
 * built-in content is shown instead of an error page.
 */
export async function getSite(): Promise<SiteData> {
  try {
    return await cached();
  } catch (err) {
    console.error("[site] could not read content from the database — showing the built-in content.", err);
    return defaults;
  }
}
