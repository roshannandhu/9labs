import type { Payload } from "payload";
import { site } from "../content/site";
import { ACTIVITIES } from "./fields";
import { DELIVERY_DEFAULTS, EBOOK_EMAIL } from "../lib/mail/defaults";

/** Plain paragraphs → the rich-text editor's document format. */
export function richText(paragraphs: string[]) {
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: paragraphs.map((p) => ({
        type: "paragraph",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        textStyle: "",
        children: [{ type: "text", text: p, detail: 0, format: 0, mode: "normal" as const, style: "", version: 1 }],
      })),
    },
  };
}

const FAQS: { question: string; answer: string[]; category: string }[] = [
  {
    category: "About us",
    question: "What does Nine Labs Solutions do?",
    answer: [
      "We are a marketing, events and technology company based in Dubai South. One team covers nine activities: social media, advertising, content and creative production, photography and filming, events and trade shows, PR, strategy, AI consultancy and IT consultancy.",
    ],
  },
  {
    category: "About us",
    question: "Where are you based, and who do you work with?",
    answer: ["We are based in Dubai South and work with brands in Dubai, across the UAE and beyond."],
  },
  {
    category: "The 9 Quiz",
    question: "How does The 9 Quiz work?",
    answer: [
      "It is a short set of tap-to-answer questions about your business, your goal, your budget and your timing. At the end you see which of our nine activities fit you best and a simple three-step plan. There is no sign-up, and you can send the result straight to us on WhatsApp.",
    ],
  },
  {
    category: "E-books",
    question: "Are the e-books really free?",
    answer: ["Yes. Choose a book, tell us where to send it, and we e-mail it to you. We only use your details to send the book and occasional updates, and you can unsubscribe at any time."],
  },
  {
    category: "Working with us",
    question: "How do I start a project with you?",
    answer: ["Open any of the nine activities and press “Talk to us about this”, take The 9 Quiz, or message us on WhatsApp. We start with a short discovery call to understand your goals."],
  },
];

async function seedUsers(payload: Payload) {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  for (const email of emails) {
    const found = await payload.find({ collection: "users", where: { email: { equals: email } }, limit: 1, overrideAccess: true });
    if (!found.totalDocs) await payload.create({ collection: "users", data: { email, role: "owner", active: true }, overrideAccess: true });
  }
}

/** Copy the built-in content (src/content/site.ts) into an empty database, so the first run looks exactly like the site did before the admin existed. */
export async function seed(payload: Payload) {
  payload.logger.info("Seeding the database from the built-in content…");

  for (const s of site.services) {
    await payload.create({
      collection: "services",
      overrideAccess: true,
      data: { n: s.n, icon: s.icon, slug: s.slug, title: s.title, short: s.short, description: s.description, tags: s.tags, needs: s.needs },
    });
  }
  for (const v of site.values) await payload.create({ collection: "values", overrideAccess: true, data: { key: v.key as "partnership", title: v.title, line: v.line } });
  for (const b of site.ebooks) {
    await payload.create({
      collection: "ebooks",
      overrideAccess: true,
      data: { title: b.title, slug: b.slug, subtitle: b.subtitle, oneLiner: b.oneLiner, tone: b.tone, pages: b.pages, readTime: b.readTime, chapters: b.chapters, enabled: true },
    });
  }
  for (const f of FAQS) await payload.create({ collection: "faqs", overrideAccess: true, data: { question: f.question, answer: richText(f.answer), category: f.category, enabled: true } });

  await payload.create({
    collection: "pages",
    overrideAccess: true,
    data: {
      title: "About Nine Labs Solutions",
      slug: "about",
      eyebrow: "About us",
      intro: site.about.statement,
      body: richText([site.about.body, site.about.philosophy]),
      showStats: true,
      showSteps: true,
      showValues: true,
      showServices: true,
      showCta: true,
    },
  });
  await payload.create({
    collection: "pages",
    overrideAccess: true,
    data: { title: "Frequently asked questions", slug: "faq", eyebrow: "FAQ", intro: "Short answers to the questions we hear most. Can't find yours? Message us on WhatsApp.", showCta: true },
  });
  await payload.create({
    collection: "pages",
    overrideAccess: true,
    data: {
      title: "Privacy",
      slug: "privacy",
      eyebrow: "Privacy",
      intro: "How we handle the details you share with us.",
      body: richText([
        "When you ask for an e-book, take the quiz or send an enquiry, we keep the details you give us (such as your name, e-mail, phone number and company) so we can send what you asked for and reply to you.",
        "We do not sell your details. You can ask us to correct or delete them at any time by writing to us.",
        "This page is a starting text. Replace it with your full privacy policy in the admin under Content → Pages.",
      ]),
      showCta: false,
    },
  });

  await payload.updateGlobal({
    slug: "company",
    overrideAccess: true,
    data: {
      name: site.name,
      shortName: site.shortName,
      type: site.type,
      tagline: site.tagline,
      location: site.location,
      mapUrl: site.mapUrl,
      geo: site.geo,
      contact: site.contact,
      socials: site.socials.map((s) => ({ key: s.key, href: s.href === "#" ? "" : s.href, enabled: true })),
    },
  });
  await payload.updateGlobal({
    slug: "navigation",
    overrideAccess: true,
    data: { items: site.nav.map((n) => ({ label: n.label, kind: "section" as const, section: n.id as "home" })), cta: site.navCta },
  });
  await payload.updateGlobal({
    slug: "homepage",
    overrideAccess: true,
    data: {
      sections: site.sections.map((section) => ({ section, enabled: true })),
      hero: site.hero,
      servicesSection: site.servicesSection,
      about: {
        label: site.about.label,
        statement: site.about.statement,
        body: site.about.body,
        philosophy: site.about.philosophy,
        stats: site.about.stats,
        strip: site.about.strip,
        story: site.about.story,
        steps: site.about.steps,
        valuesLabel: site.about.valuesLabel,
        valuesHeading: site.about.valuesHeading,
        valuesIntro: site.about.valuesIntro,
      },
      closing: site.closing,
      faqPreview: { enabled: site.faqPreview.enabled, count: 4, label: site.faqPreview.label, heading: site.faqPreview.heading, accent: site.faqPreview.accent, cta: site.faqPreview.cta },
    },
  });
  await payload.updateGlobal({ slug: "footer", overrideAccess: true, data: site.footer });
  await payload.updateGlobal({
    slug: "site-settings",
    overrideAccess: true,
    data: {
      theme: { default: site.theme.default, toggle: site.theme.toggle, intro: site.theme.intro, grid: site.theme.grid, colors: {} },
      seo: { title: site.seo.title, titleTemplate: site.seo.titleTemplate, description: site.seo.description, keywords: site.seo.keywords, index: site.seo.index },
      integrations: site.integrations,
    },
  });
  const q = site.quiz;
  await payload.updateGlobal({
    slug: "quiz-settings",
    overrideAccess: true,
    data: {
      label: q.label,
      heading: q.heading,
      accent: q.accent,
      text: q.text,
      cta: q.cta,
      meta: q.meta,
      result: q.result,
      questions: q.questions.map((question) => ({
        id: question.id,
        q: question.q,
        label: question.label,
        hint: question.hint,
        multi: Boolean(question.multi),
        role: (question.role ?? "none") as "none" | "who" | "goal" | "when",
        options: question.options.map((o) => ({
          id: `${question.id}-${o.id}`,
          label: o.label,
          only: Boolean(o.only),
          points: Object.fromEntries(ACTIVITIES.map((a) => [a.value, o.weights[a.value] ?? 0])),
        })),
      })),
    },
  });
  await payload.updateGlobal({ slug: "enquiry-settings", overrideAccess: true, data: site.enquiry });
  await payload.updateGlobal({
    slug: "ebook-settings",
    overrideAccess: true,
    data: { delivery: DELIVERY_DEFAULTS, email: EBOOK_EMAIL, section: site.ebooksSection, form: site.ebookForm },
  });

  payload.logger.info("Seeding done.");
}

export async function seedIfEmpty(payload: Payload) {
  // never during `next build`: several workers would seed at once
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { totalDocs } = await payload.count({ collection: "services", overrideAccess: true });
    if (!totalDocs) await seed(payload);
    await seedUsers(payload);
  } catch (err) {
    payload.logger.error({ err }, "Seeding failed");
  }
}
