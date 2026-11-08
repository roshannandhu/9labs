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
- Quiz settings; Footer.

**Collections:**
- Services (9), Values (5).
- E-books: cover, private PDF, sample pages, chapters, form-field config, SEO.
- **Leads**: Approve & send, Reject, Resend, bulk approve, CSV export.
- Quiz Submissions, Contact Messages, Pages (Privacy/Terms), Media, Users (Admin/Editor roles).

**Extras:** a dashboard (pending approvals, leads per book), live preview, revalidation on save, optional Cloudflare Access on `/admin`.

## 6. SEO (production)

- SSR/ISR HTML with all text in the DOM; per-page metadata editable in the admin; dynamic OG images; `sitemap.ts` and `robots.ts` from the CMS.
- JSON-LD: Organization, ProfessionalService/LocalBusiness, Service ×9, Book ×3, WebSite, BreadcrumbList.
- Inner pages `/services/[slug]`, `/ebooks/[slug]`, `/quiz`, `/privacy`.
- CWV targets: LCP < 2.5s, CLS < 0.1, INP < 200ms; WebGL only lazy on desktop.

## 7. The 9 Quiz (production)

`POST /api/quiz` behind the provider-neutral `provider.ts`. The AI provider (Gemini, Groq or another) is decided later. Turnstile, per-IP daily limit, 1,000-character cap; submissions saved in D1.

## 8. Phases

| Phase | Work | Output |
|---|---|---|
| **1: Frontend demo** (now, about 1–1.5 weeks) | Full animated homepage, Concept Lab with 3 hero concepts, 3D e-books, mock quiz | Demo link + walkthrough video for client approval |
| 2: Content and polish | Apply client feedback, final colours, logo, copy, covers | Approved design |
| 3: Admin + backend (about 1.5 weeks) | OpenNext on Workers, Payload + D1 + R2, e-book approval → e-mail → download, socials/WhatsApp/integrations, privacy, cookie banner | Admin login for the client |
| 4: Quiz AI + launch (about 1 week) | Real AI provider, SEO inner pages, QA, domain + e-mail DNS, production deploy, admin guide | Live site + handover |

## 9. Items needed from the client

Logo (SVG) · exact colour codes · final headline, sub-headline and About copy · email, phone/WhatsApp and social links · **3 e-book PDFs, titles, one-liners and covers** · confirmation of the 9 activities · domain + Cloudflare account access · DNS access for e-mail · Resend account · admin users · tracking IDs (optional) · privacy policy text (UAE PDPL) · AI provider choice and key (later).

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
