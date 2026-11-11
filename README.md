# Nine Labs Solutions — website and admin panel

The Nine Labs Solutions website, built from the client brief (`docs/CLIENT_BRIEF.md`), together with
its **admin panel**. Everything a visitor sees — texts, buttons, the nine cards, books, quiz
questions, FAQ, pages, colours, contact details — is edited in the admin and shows on the site as
soon as it is saved. The forms are real: e-book requests are saved and e-mailed, finished quizzes and
"Talk to us" enquiries are saved for follow-up.

- **Website:** `src/app/(site)` — the homepage, `/about`, `/faq`, any page written in the admin, a page per book (`/ebooks/<name>`).
- **Admin:** `src/app/(payload)` — [Payload CMS](https://payloadcms.com) inside the same Next.js app, at `/admin` (or on its own hostname, see `ADMIN_HOST`).
- **How to use the admin:** [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) (written for the client).

## Run it

```bash
pnpm install
cp .env.example .env      # set PAYLOAD_SECRET and ADMIN_EMAILS (your Google e-mail)
pnpm dev                  # website: http://localhost:3000 · admin: http://localhost:3000/admin
```

On the first start the database is created (`data/ninelabs.db`) and filled from the built-in
content in `src/content/site.ts`, so the site looks complete straight away.

- **Signing in locally:** while no Google keys are set, the sign-in screen shows a
  *development sign-in* box — type an e-mail listed in `ADMIN_EMAILS`. This box does not exist in a
  production build.
- **E-mails locally:** while `SMTP_HOST` is empty nothing is sent; every e-mail is written to
  `data/outbox/` as a JSON file so the flows can be tried.

Other commands: `pnpm lint` · `pnpm build` and `pnpm start` (production) ·
`pnpm generate:types` and `pnpm generate:importmap` (after changing the admin's fields or its custom
components) · `pnpm payload migrate:create <name>` (after changing fields — see *Database* below).

## How it works

| Part | Where | Notes |
|---|---|---|
| Built-in content (the defaults) | `src/content/site.ts`, `src/content/types.ts` | Seeds an empty database; anything left empty in the admin falls back to it |
| What the admin can edit | `src/payload/collections/*`, `src/payload/globals/*` | One file per screen in the admin |
| Reading content on the site | `src/lib/content/getSite.ts` → `useSite()` (`src/components/providers/SiteProvider.tsx`) | Cached; every save in the admin clears the cache (`src/payload/hooks/revalidate.ts`) |
| Public forms | `src/app/api/public/*`, protection in `src/lib/forms/guard.ts` | Same-origin, schema-checked, hidden-field and timing traps, per-visitor limit |
| E-book sending | `src/lib/ebooks/send.ts`, `src/app/api/download/[token]` | Link, attachment or both; signed, expiring links; PDFs are private |
| Quiz scoring | `src/lib/quiz/score.ts` | The same function runs on the site, in the admin's simulator and on the server |
| Admin sign-in | `src/lib/auth/*`, `src/app/(payload)/api/auth/*` | Google only, for listed e-mails; a signed session cookie |
| Admin buttons | `src/payload/endpoints.ts`, `src/payload/components/*` | Approve & send, reject, exports, test e-mail, dashboard, quiz simulator |
| Admin on its own hostname | `src/proxy.ts` | Active when `ADMIN_HOST` is set |

**Fixed in code, by design:** the animations (particle 9, the nine service scenes, the bridge, the
3D books) and the *number and order* of the nine cards — each position has its own scene. Their
words, keywords, "What do you need?" choices and WhatsApp number are editable.

## Settings (`.env`)

See `.env.example` for the full list with explanations. The important ones:

| Setting | What it is |
|---|---|
| `PAYLOAD_SECRET` | Long random string; signs sessions and download links. Required in production |
| `NEXT_PUBLIC_SITE_URL` | The public address of the site (used in e-mailed links, SEO) |
| `ADMIN_EMAILS` | Google e-mails created as owners on first start |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in. Redirect URI to register: `<admin address>/api/auth/google/callback` |
| `ADMIN_HOST`, `NEXT_PUBLIC_ADMIN_URL` | e.g. `admin.example.com` and `https://admin.example.com`: the admin then answers only there |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | The mailbox that sends e-mails (the one that comes with the domain) |
| `DATABASE_URI` | SQLite file; default `file:./data/ninelabs.db` |

## Going live

The app needs a normal Node server with a disk that persists (for the database file and uploads):
a VPS or a Node host. Build with `pnpm build`, run with `pnpm start`.

- **Database:** SQLite through `@payloadcms/db-sqlite`. In production the committed migrations in
  `src/migrations` run on start-up. After changing any admin field, run
  `pnpm payload migrate:create <name>` and commit the new file.
- **Files:** images in `uploads/media`, e-book PDFs in `uploads/ebooks` (private). Back up `data/`
  and `uploads/` together.
- **E-mail:** set the SMTP settings of the domain's mailbox, and add the SPF, DKIM and DMARC records
  the mail provider gives you, or e-mails will land in spam. Domain mailboxes have a daily sending
  limit (usually a few hundred).
- **Admin address:** point `admin.<domain>` at the same app and set `ADMIN_HOST`.
- **Another host later** (serverless, Cloudflare): the three host-specific pieces are each one
  adapter in `src/payload.config.ts` — database, file storage (`ebookPath` in `src/lib/ebooks/send.ts`
  is the one place that reads PDFs from disk), and the mail transport (`src/lib/mail/transport.ts`;
  hosts without SMTP need an HTTP mail service there).

**Not verifiable until the client supplies them:** real Google sign-in (needs the Google client ID
and secret) and real e-mail delivery (needs the mailbox). Both were exercised through the
development sign-in and the local outbox.

## The site's design

> **New logo + themes (Nov 2026):** the client's new logo, purple `#8c53fe` → cyan `#5ce0e6`, traced from their file (25 of 87,583 px differ), in its exact colours in both themes with no badge; tagline Montserrat ExtraBold (white on dark, near-black on light). **Light (lavender) is the default**; the sun/moon button in the nav switches to dark and is remembered. In this logo the 9 is **negative space** — a 9 carved out of a solid A (its eye is the disc). Replace the trace with the client's SVG when supplied. Theming: Tailwind's `white` maps to the foreground ink (`--fg-rgb`); `.on-dark` / `.paper` pin the dark/light islands. The footer shows the build date (spots a stale cached copy).

> **v2 (Nov 2026): the client's real logo + a particle 9.** A logo landing animation ("The Hidden 9"), then a hero that says *we provide 9* with a particle 9, which splits and re-forms 1 → 9 beside each service card. The previous hero (light-filled 9 + Saturn ring + logo dock, "Concept A") is saved as the Git tag/branch **`backup/hero-light-9`** — not on the site. Approved plan: [`docs/LANDING_V2_PLAN.md`](docs/LANDING_V2_PLAN.md).

> **Studio, not software (Nov 2026):** the owner felt the UI read as an engineering tool rather than a
> creative agency's. Removed: the dimension/REV/lat-long readouts on the hero's drafting lines, the
> CAD plus-mark grid layer, film grain, the service cards' corner brackets and outlined ghost numbers,
> and the About bridge diagram's monospace labels (now a pure shape plus a normal-HTML caption that
> wraps instead of forcing the diagram to scroll sideways on phones). Added an italic serif accent
> (Fraunces) for headline emphasis words, and small labels moved from monospace onto the brand sans.
> Also fixed: the e-book's phone page opened to a contents page instead of the form — it now opens
> straight to the form, with the chapter list one tap away above it, matching the desktop spread.

## What's inside

| Section | Highlights |
|---|---|
| **Landing animation** | **"The Hidden 9"** (~3 s, once per session, skippable; add `?intro` to the URL to replay it), over a **blurred** view of the page: **"LABS"** (with a whole A) and "NINE LABS / SOLUTIONS" are on screen; an **invisible 9** (an SVG mask — it only ever removes the A, so it shows the page's own background in light or dark) **falls into the A and carves itself in**, its eye passing down through it, and lands as the exact logo (full A minus the 9 = the logo's A, checked by rasterising). Then the logo flies onto the nav logo (top-left) and the blur lifts onto the hero. Reduced motion: no intro. |
| **Hero** | **"We provide 9"**: content on the left; on the right the **9 in Albert Sans Black** — the closest match to the 9 in the client's reference artwork (see `docs/digit-font-comparison.png`) — in the logo gradient (light mode: black → indigo, like the lavender logo file; dark mode: purple → cyan, like the black logo file — the logo and landing animation follow the same rule). **Formed numbers are solid and crisp** (a glyph that lives inside the page, so it scrolls with the content and never jitters); when a number splits and re-forms it becomes **~12,000 particles** (~6,000 on phones, thinned automatically on slow devices) and cross-fades back to solid when it lands. Phones: content first, the 9 underneath. Scroll-driven only. |
| **Section dividers** | Thin bridge cables (two pylons, a cable that draws as you scroll, one light dot that crosses) between sections. |
| **Services — "Our 9 labs"** | **Travelling swarm** — nothing pins or snaps. Each of the 9 cards has its own number; scrolling from one card to the next, the number's particles lift off and pour across the screen into the next card's number (1 → 9). Laptop: rows zig-zag (number left / card right, then swapped), so the swarm sweeps across the page; phone: the number sits above each card. Cards the swarm is not on show their number as a faint watermark; the card whose number is formed lights up. Ends with **"All nine. One team."** (the swarm becomes a small 9) and a 3×3 grid. Each card's **Talk to us about this** opens the enquiry window. Reduced motion: a plain list. |
| **About** | Scroll-lit statement, count-up stats, then **How we work — the story bridge** in 3 steps (your side → our side → the deck joins, two-way traffic, the 9 lights up, "Results"). Nothing pins. Laptop: a detailed side view that builds as it scrolls up through the screen, with a split-flap counter 01 → 03 and each step's text. Phone: the same bridge at full size in a **sideways panorama** you swipe along (page scroll stays free), snapping to 3 stops — Your side · The middle · Our side — with a caption each and a slower-moving skyline for depth; it builds once as it comes into view, then the traffic runs. Then 5 value cards. |
| **The 9 Quiz** | On the page: a white glass card with a slow aurora in the logo colours (light mode) or the shader card (dark mode). **9 tap-card questions**, one per screen (progress 1/9, back, keys 1–5), in a full-screen pop-up on phone and laptop. Question 1 is right on the page: tapping an answer starts the quiz with it filled in. **Result first** (no sign-up): top 3 activities with match % and why, a 3-step plan, **Send on WhatsApp** (all answers pre-filled) or e-mail. Rule-based (`src/lib/quiz/score.ts`) — no AI/API. Questions, points and every sentence are edited in the admin; each finished quiz is saved there, and "e-mail me this plan" really sends. |
| **Free e-books** | Laptop/tablet: three CSS-3D books on a mirror shelf; the focused one lifts with a halo; click to open a 3D spread with the form. **Phone: a horizontal, endlessly looping carousel** (swipe left/right, arrows, dots; vertical swipes still scroll the page) that opens into a **flat full-screen page** (cover peels open; 16 px fields, no iOS zoom, no surprise keyboard, fields stay above the keyboard). Books, covers and PDFs are managed in the admin (a designed cover is drawn when none is uploaded); the form saves a real request, which is approved and e-mailed from the admin. |
| **Talk to us** | A quick enquiry window from every activity card (phone: bottom sheet; laptop: centred card): activity pre-selected, "What do you need?" chips, budget and timeline chips, name*, company, message → **Send on WhatsApp** opens a chat with all of it written (or e-mail). Every label and choice is edited in the admin, and each enquiry is saved there just before WhatsApp opens. |
| **Contact / footer** | Closing line flowing along a bridge arc, contact cards, activity marquee, socials, floating WhatsApp button. |
| **Everywhere** | **Liquid-glass UI** (frosted panels with a blue→purple hairline; real lens refraction on Chromium) on the nav pill, chips, focus card, quiz and e-book panels; spring headings; blueprint grid with a cursor spotlight, film grain, Lenis smooth scroll, custom cursor (desktop), reduced-motion support, SEO metadata + JSON-LD + sitemap/robots + OG image. |

### Concept Lab (off by default)

The chip at the bottom-left (desktop/tablet only) lets the client try **brand colours** (logo indigo vs. the brief's electric blue), change grid intensity, preview reduced motion, and toggle the custom cursor and the WhatsApp button. It was a demo tool for the first client review; the look is now set in the admin. Switch it on with `NEXT_PUBLIC_DEMO_LAB=true`.

URL helper: `?motion=reduce` (note: Concept Lab settings, including this one, are remembered in the browser; use *Reset to defaults* to clear them).

### How the cover is built, and what it costs (brief §5.8)

- **Logo intro:** one inline SVG (the wordmark rebuilt in parts) + a GSAP timeline; shown by CSS only while `<html data-intro="playing">`, which a tiny pre-paint script sets on the first visit of a session.
- **Particles:** one fixed 2D canvas (no WebGL). Digit targets are sampled once from the logo typeface on an offscreen canvas; particles fly between DOM slots measured each frame, as a pure function of scroll (reversible). Pre-rendered glow sprites, DPR ≤ 2, paused when the hero/services are off-screen. 2,200 particles desktop / 1,400 phone.
- **First paint:** the headline is the LCP element; the canvas starts only after the intro.
- **Bundle:** ~352 KB gzipped JS in total (no three.js).
- **Reduced motion:** no intro, no canvas, no pinning — a still 9 and a plain list of the nine cards.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Payload CMS 3 (SQLite, Lexical
rich text, Nodemailer) · GSAP (ScrollTrigger, DrawSVG) · Motion · Lenis ·
React Bits components (`src/components/reactbits`, vendored, MIT + Commons Clause) ·
fonts via `next/font`.

Placeholders still waiting for the client's real details — all editable in the admin: contact
e-mail and phone, WhatsApp number, social links, the e-book PDFs and covers, the About and Privacy
texts.
