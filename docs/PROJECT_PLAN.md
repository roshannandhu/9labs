# Nine Labs Solutions — Project Plan

_Prepared from the client brief (Homepage Content and Design Brief, final version 7 Nov 2026)._

**Current stage:** frontend demo for client approval (see `README.md`). Backend/admin follow after approval.


> Phase order updated per user: **Frontend demo → client approval → backend/admin.**

## 1. What the client needs (brief analysis)

| Area | Requirement from brief | Hidden / implied need |
|---|---|---|
| Hero | A large blue 9 in the exact centre that feels alive. The 9 activities orbit it; the front one is bigger and brighter with name and description. Hover pauses, click goes to the service, swipe on mobile. Text is never covered. | Activity names must be real HTML text (SEO and accessibility) |
| Grid | Barely visible white grid (4–8%) with corner marks, ticks and plus signs. May drift or react to the mouse. | Pure CSS, almost no JS |
| Bridge | Neon-purple lines connect the activities to the 9; dividers use the bridge motif | Light pulses travel both ways ("traffic both directions") |
| Sections | Nav → Cover → Services (9 cards, purple hover glow) → About + 5 values → 9 Quiz → E-books (3) → Closing CTA → Footer | Fade-and-rise on scroll |
| Motion | Smooth and subtle; must not slow the page; reduced-motion still version | A written note on how it is built and its load cost |
| Mobile | The 9 stays centred; smaller swipeable ring or row; buttons stacked | No pinning on touch |
| Quiz | The visitor describes their need and AI explains how Nine Labs delivers it | Provider TBD (Gemini, Groq or another, discussed later); rate limiting |
| E-books | 2–3 cover cards with download | 3D book opens → form → approval → automatic e-mail |
| Originality | theninelabs.com is inspiration only | Our own 9, grid, bridge and wording |
| Deliverables (§7) | 2–3 concepts, animation note, timeline, list of missing items | Concept Lab demo covers the concepts |

## 2. Stack and hosting (recommended)

**One full-stack Next.js app on Cloudflare Workers** via `@opennextjs/cloudflare`. Not Pages: `next-on-pages` is deprecated, Edge-only, and broken on Next 16.

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TS), Tailwind v4 |
| Admin / CMS | **Payload CMS 3** inside the same app at `/admin` (official Cloudflare template) |
| Database | **Cloudflare D1** (SQLite) via `@payloadcms/db-d1-sqlite` |
| Storage | **Cloudflare R2**: a public bucket for media and a **private** bucket for e-book PDFs (`@payloadcms/storage-r2`) |
| E-mail | **Resend** + React Email (free 3,000/month, 100/day; Pro $20). Cloudflare Email Service once it leaves beta |
| Anti-spam | Cloudflare Turnstile + Workers rate limiting + honeypot |
| Caching | OpenNext R2 incremental cache (ISR); Payload hooks → `revalidateTag` |
| Images | `next/image` + Cloudflare Images binding |
| Language | English at launch; i18n-ready for Arabic later |

Workers Paid **$5/month** is required (Payload bundle size). Expected running cost is about $5/month plus Resend free tier, AI usage (TBD) and the domain. Fallback host: Vercel + Neon Postgres + Vercel Blob.

## 3. Animation sources

Design reference: getlayers.ai (cinematic scroll, shader gradients, grain, mirror sections, custom cursor), used for ideas only. Custom SVG + GSAP (DrawSVG, ScrollTrigger, SplitText, Flip, Draggable/Inertia; all free) · Motion for React UI transitions · Lenis smooth scroll · React Bits (SplitText, BlurText, DecryptedText, ScrollReveal, AnimatedContent, FadeContent, SpotlightCard, MagicBento, BorderGlow, TiltedCard, StarBorder, Magnet, ClickSpark, PillNav, StaggeredMenu, CurvedLoop, LogoLoop, TextType, AnimatedList, SoftAurora, LightRays, Orb, ShapeGrid, GridDistortion, OrbitImages and CircularCarousel as references) · R3F for the 3D concept (lazy) · custom SVG activity icons (base shapes from Lucide/Tabler; Lordicon or LottieFiles as an alternative). React Bits licence: MIT + Commons Clause, which allows use inside the client site.

## 4. E-book flow (production)

`POST /api/ebook-requests` → Zod + Turnstile + rate limit + dedupe → a **Lead** in D1 (`pending`, or `approved` when auto-send is on) → admin alert.
Payload `afterChange` on Leads: when approved (auto, the **Approve & send** button, or bulk) → signed expiring HMAC download token → branded React Email via Resend → status `sent`/`failed` (with retry) + log.
`GET /api/download/[token]` → streams the PDF from private R2 → counts the download. Approval mode is a global admin switch with a per-book override. DNS needs SPF, DKIM and DMARC.

## 5. Admin (Payload): full control

**Globals:**
- Site Settings: logo, favicon, brand colours, maintenance mode.
- Navigation: items and CTA.
- Hero: copy, buttons, carousel speed, concept.
- **Contact & Social:** email, phone, **WhatsApp number + prefill + floating button on/off**; Instagram, LinkedIn, Facebook, X, TikTok, YouTube and more, each with a pasted URL, **on/off toggle** and order.
- SEO: titles, descriptions, OG, canonical, index toggle, verification codes.
- Integrations: GA4, GTM, Meta Pixel, LinkedIn Insight, Clarity, each with on/off and an automatic cookie banner.
- E-book Delivery: approval mode, link expiry, sender details, editable template with `{{name}}`, `{{bookTitle}}`, `{{downloadLink}}`.
- **Quiz settings**: intro copy + the **9 questions** (question, short label, hint, single/multi, and per option a label + points per activity; an option can be "only", e.g. *Nothing yet*). Order by drag-and-drop. This is what `site.quiz.questions` is today.
- **Enquiry Options** ("Talk to us" window): title, intro line, **budget** chips, **timeline** chips (add / edit / remove / reorder). Per-activity "What do you need?" chips live on each Service (below).
- Theme: default theme (light, as now), dark mode toggle on/off.
- Footer.

**Collections:**
- Services (9): title, short name, description, tags, icon, **needs** (the "What do you need?" chips in the Talk-to-us window). Values (5).
- E-books: title, subtitle, one-liner, **cover image upload** (optional: without one, the site draws a designed cover from the book's tone; titles wrap automatically), tone, pages, read time, chapters, private PDF, sample pages, form-field config, SEO, **order** and **on/off** (the phone carousel and the desktop shelf follow this order).
- **Leads**: Approve & send, Reject, Resend, bulk approve, CSV export.
- **Quiz Submissions** (all 9 answers, the top-3 result, and whether they tapped WhatsApp / e-mail), **Enquiries** (from the Talk-to-us window: activity, needs, budget, timeline, name, company, message, channel), Contact Messages, Pages (Privacy/Terms), Media, Users (Admin/Editor roles).

**Extras:** a dashboard (pending approvals, leads per book), live preview, revalidation on save, optional Cloudflare Access on `/admin`.

## 6. SEO (production)

- SSR/ISR HTML with all text in the DOM; per-page metadata editable in the admin; dynamic OG images; `sitemap.ts` and `robots.ts` from the CMS.
- JSON-LD: Organization, ProfessionalService/LocalBusiness, Service ×9, Book ×3, WebSite, BreadcrumbList.
- Inner pages `/services/[slug]`, `/ebooks/[slug]`, `/quiz`, `/privacy`.
- CWV targets: LCP < 2.5s, CLS < 0.1, INP < 200ms; WebGL only lazy on desktop.

## 7. The 9 Quiz (production) — rule-based, no AI

Decided Nov 2026: **no AI / no API key**. The quiz is 9 tap-card questions; the result is worked out in the browser (`src/lib/quiz/score.ts`): every answer adds points to activities, the top 3 are shown with a match %, "why" (quoting the visitor's own answers) and a 3-step plan, then **Send on WhatsApp** (all answers pre-filled) or e-mail.

Backend for production:
- Questions/options/points come from the **Quiz settings** global (same shape as `site.quiz.questions`).
- `POST /api/quiz-submissions` (Zod + Turnstile + rate limit) saves the answers + result to **Quiz Submissions** — fire-and-forget, never blocks the result.
- "E-mail me this plan": `POST /api/quiz-email` → Resend with the plan (demo only fakes it today).

## 7b. "Talk to us" enquiries (production)

The Talk-to-us window on each activity card builds a WhatsApp message (activity, needs, budget, timeline, name, company, message) and opens `wa.me` — this needs no backend. For records:
- `POST /api/enquiries` (Zod + Turnstile + rate limit) logs the enquiry to **Enquiries** just before the WhatsApp/e-mail redirect (fire-and-forget), plus an admin alert e-mail.
- Options come from **Enquiry Options** + each Service's **needs**.

## 8. Phases

| Phase | Work | Output |
|---|---|---|
| **1: Frontend demo** (now, about 1–1.5 weeks) | Full animated homepage, Concept Lab with 3 hero concepts, 3D e-books, mock quiz | Demo link + walkthrough video for client approval |
| 2: Content and polish | Apply client feedback, final colours, logo, copy, covers | Approved design |
| 3: Admin + backend (about 1.5 weeks) | OpenNext on Workers, Payload + D1 + R2, e-book approval → e-mail → download, socials/WhatsApp/integrations, privacy, cookie banner | Admin login for the client |
| 4: Launch (about 1 week) | Quiz/enquiry logging + quiz e-mail, SEO inner pages, QA, domain + e-mail DNS, production deploy, admin guide | Live site + handover |

## 9. Items needed from the client

Logo (SVG) · exact colour codes · final headline, sub-headline and About copy · email, phone/WhatsApp and social links · **3 e-book PDFs, titles, one-liners and covers** · confirmation of the 9 activities · domain + Cloudflare account access · DNS access for e-mail · Resend account · admin users · tracking IDs (optional) · privacy policy text (UAE PDPL) · sign-off on the 9 quiz questions and the Talk-to-us options (budgets, timelines, needs per activity).

## 10. Production verification

Local `pnpm dev` with Cloudflare bindings, then `opennextjs-cloudflare preview` in workerd. Playwright e2e for the e-book approval → e-mail → download path. Lighthouse mobile ≥ 90/95/100. Rich Results test, axe, mail-tester ≥ 9/10. Admin edits (headline, WhatsApp toggle, Instagram URL) appear on the live site within seconds.

---

## Appendix — Cinematic ideas adopted from getlayers.ai (ideas only, no code or assets copied)


I studied getlayers.ai: its homepage, a template page (AI Studio), the About and MCP pages. It is Textura studio's library of "cinematic AI sites": templates, 3D scenes shown as MP4 loops, mouse-reactive shader gradients, section patterns (Mirror Hall, Carousel Spotlight, Roadmap Ascent, Cards Cascade, Colonnade), animated backgrounds, and text and custom-cursor tools. Its templates are Next.js + Lenis + Three.js/WebGL shaders + video, dark tones, subtle grain, and PageSpeed claims of mobile 98 / desktop 100 / SEO 100. We take the **ideas only** and build everything ourselves in Nine Labs' own look (no copied code or assets; premium layers are paywalled anyway):

1. **"Cinematic scroll" Concept C (upgrade of Hologram 3D):** a chrome-and-neon 3D **9** turning in the dark, with a drifting bloom of blue/purple particles. **As you scroll, the camera flies around the 9 and through the orbit ring**, then hands off into the Services journey. R3F tube + MeshPhysicalMaterial (metal/clearcoat) + emissive neon core + bloom, with the camera path tied to ScrollTrigger progress. Lazy-loaded on desktop; mobile falls back to Concept A.
2. **Film grain + vignette overlay:** a fixed SVG `feTurbulence` noise layer at about 3–4% opacity over the black, for a cinematic texture (CSS only, no runtime cost).
3. **Interactive shader gradient** behind The 9 Quiz block and the Closing CTA: a tiny raw-WebGL fragment shader (about 3 KB) of flowing blue↔purple light that bends toward the cursor and pauses off-screen. It replaces SoftAurora, with a CSS-gradient fallback.
4. **Stats strip** in About: "09 Activities · 01 Team · 01 Aim", counting up (CountUp) in mono labels, taken straight from the brief's line "Nine activities, one team, one aim".
5. **"How we work" ascending steps on the bridge** (Roadmap Ascent idea): three nodes rise along the bridge cable: *Your goals reach us → Our expertise reaches you → Together we get across.*
6. **Mirror-floor e-book shelf** (Mirror Hall idea): the 3 books stand on a glossy black floor with soft reflections (a flipped, masked copy) and a light sweep. The reflection follows the hover tilt.
7. **Services cards with mini scenes on hover** (their hover-preview videos, done with our own animated SVG/canvas scenes): each card's icon expands into a short looping scene (likes flying up, spotlight sweep, aperture snap…).
8. **Custom cursor** (desktop only; can be turned off in Concept Lab; off for reduced motion): a small neon ring that snaps magnetically to buttons and links and shows context labels such as "Open" on books, "Explore" on cards and "Drag" on the orbit ring.
9. **Performance targets as high as theirs:** PageSpeed **mobile ≥ 95, desktop 100, SEO 100** for Concept A.
10. *(Optional later)* If the client buys a GetLayers plan, its MCP server (`https://mcp.getlayers.ai/mcp`) could pull premium scenes. Not needed for this build.


---

## Frontend demo — decisions so far (Nov 2026)

- **The 9 is a real bold font glyph**, not a hand-drawn line: Space Grotesk Bold (same family as the headlines) by default, with Outfit Black as a heavier option in the Concept Lab. One outline drives every version: neon SVG, particles, 3D extrusion, logo, favicon, OG image and book cover.
- **Hero default = Cinematic 3D.** An extruded 9 with chrome bevels, a dark glass face and a neon tube running around its outline (with flowing light), standing on a receding blueprint floor with orbit tracks and light comets. The neon SVG version paints instantly as a poster, then cross-fades into 3D once the GPU proves smooth (≈14 fps or better). Weak devices or no WebGL keep the neon 9. Phones get a lighter quality tier.
- **No spoke lines** from the activities to the 9. The connection is shown by the orbit itself (3D rings in the cinematic concept, a fine elliptical track in the 2D concepts).
- Items passing behind the 9 dim further, so the orbit reads as going round the 9.


---

## Hero presentation: "Liquid Glass Nine" (decided Nov 2026)

**Typeface:** Sora ExtraBold (800) for the 9 and all headings.

**Three concepts for the client** (brief §7):

| Concept | What it is | Load |
|---|---|---|
| **C, Liquid Glass Nine** (default) | A glass 9 with a neon tube inside it. The tube has nine segments, one per activity. Particles stream in and the segments ignite. The rim runs blue → purple, and a light sweep plus a cursor highlight move over the glass. The blueprint grid and aurora bend through the glass. Scrolling dives through the 9's bowl. | WebGL, lazy-loaded, perf-guarded |
| **A, Neon Segments** | The same story in SVG/CSS: a neon 9 split into nine segments that ignite in turn; the front activity's segment glows purple. | Few KB; also the fallback |
| **B, Particle Nine** | Glowing particles assemble the 9 from the grid. | 2D canvas |

**Shared across all three concepts:**
- **Bridge:** one neon-purple arc from the front activity to *its* segment of the 9, with light pulses running both ways (the brief's "traffic in both directions"). No spokes.
- **Morphism:** liquid glass and neon only.
  - Liquid glass covers the frosted panels and the blue→purple gradient hairline. Chromium also gets an SVG lens refraction.
  - Glass is used on the nav pill, orbit chips, focus card, quiz and e-book panels, and the services ring cards. The ring cards use faux glass, because backdrop-filter is unreliable inside 3D transforms.
  - `prefers-reduced-transparency` switches every glass panel to solid.
  - Neumorphism and claymorphism are rejected: they read poorly on pure black and don't fit a tech brand.

**Other sections:**
- **Services:** the Mirror Hall ring.
- **About:** Roadmap Ascent.
- **E-books:** Spectra halo.
- **Headings:** spring headings.
