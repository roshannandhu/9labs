# Nine Labs Solutions — Homepage (frontend demo)

Interactive frontend demo of the Nine Labs Solutions homepage, built from the client brief
(`docs/CLIENT_BRIEF.md`). It is a fully static site meant for **client review and approval**.
The admin panel, database, e-mail delivery and real AI come next (see `docs/PROJECT_PLAN.md`).

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
| **Hero** | **"We provide 9"**: content on the left; on the right the **9 in Albert Sans Black** — the closest match to the 9 in the client's reference artwork (see `docs/digit-font-comparison.png`) — in the logo gradient. **Formed numbers are solid and crisp** (a glyph that lives inside the page, so it scrolls with the content and never jitters); when a number splits and re-forms it becomes **~12,000 particles** (~6,000 on phones, thinned automatically on slow devices) and cross-fades back to solid when it lands. Phones: content first, the 9 underneath. Scroll-driven only. |
| **Section dividers** | Thin bridge cables (two pylons, a cable that draws as you scroll, one light dot that crosses) between sections. |
| **Services — "Our 9 labs"** | **Pinned stacked deck**: as you scroll, the hero 9 splits and re-forms 1 → 9 beside a 3D stack of cards — the front card lifts and tilts away as the next one rises, each glowing in its own step of the logo gradient. Card and number are driven by the same scroll value (always in sync); snaps to whole numbers; 1–9 rail; ends with **"All nine. One team."** and a 3×3 grid. Each card's **Talk to us about this** opens the enquiry window. Reduced motion: an unpinned list. |
| **About** | Scroll-lit statement, count-up stats, then **How we work — the story bridge**: a pinned scene that builds in 3 steps as you scroll (your side → our side → the deck joins, two-way traffic, the 9 lights up, "Results"), with a split-flap counter 01 → 03 and each step's text. Laptop: a detailed side view; phone: a vertical top-down bridge, big and readable. Then 5 value cards. |
| **The 9 Quiz** | **9 tap-card questions**, one per screen (progress 1/9, back, keys 1–5), in a full-screen pop-up on phone and laptop. Question 1 is right on the page: tapping an answer starts the quiz with it filled in. **Result first** (no sign-up): top 3 activities with match % and why, a 3-step plan, **Send on WhatsApp** (all answers pre-filled) or e-mail. Rule-based in the browser (`src/lib/quiz/score.ts`) — no AI/API. Questions/points are content (admin later). |
| **Free e-books** | Laptop/tablet: three CSS-3D books on a mirror shelf; the focused one lifts with a halo; click to open a 3D spread with the form. **Phone: a horizontal, endlessly looping carousel** (swipe left/right, arrows, dots; vertical swipes still scroll the page) that opens into a **flat full-screen page** (cover peels open; 16 px fields, no iOS zoom, no surprise keyboard, fields stay above the keyboard). Covers can be uploaded images (admin later) with a designed fallback; titles wrap automatically. |
| **Talk to us** | A quick enquiry window from every activity card (phone: bottom sheet; laptop: centred card): activity pre-selected, "What do you need?" chips, budget and timeline chips, name*, company, message → **Send on WhatsApp** opens a chat with all of it written (or e-mail). Options are content (`site.enquiry`, `services[].needs`). |
| **Contact / footer** | Closing line flowing along a bridge arc, contact cards, activity marquee, socials, floating WhatsApp button. |
| **Everywhere** | **Liquid-glass UI** (frosted panels with a blue→purple hairline; real lens refraction on Chromium) on the nav pill, chips, focus card, quiz and e-book panels; spring headings; blueprint grid with a cursor spotlight, film grain, Lenis smooth scroll, custom cursor (desktop), reduced-motion support, SEO metadata + JSON-LD + sitemap/robots + OG image. |

### Concept Lab (demo only)

The chip at the bottom-left (desktop/tablet only) lets the client try **brand colours** (logo indigo vs. the brief's electric blue), change grid intensity, preview reduced motion, and toggle the custom cursor and the WhatsApp button. Hide it in production with `NEXT_PUBLIC_DEMO_LAB=false`.

URL helper: `?motion=reduce` (note: Concept Lab settings, including this one, are remembered in the browser; use *Reset to defaults* to clear them).

### How the cover is built, and what it costs (brief §5.8)

- **Logo intro:** one inline SVG (the wordmark rebuilt in parts) + a GSAP timeline; shown by CSS only while `<html data-intro="playing">`, which a tiny pre-paint script sets on the first visit of a session.
- **Particles:** one fixed 2D canvas (no WebGL). Digit targets are sampled once from the logo typeface on an offscreen canvas; particles fly between DOM slots measured each frame, as a pure function of scroll (reversible). Pre-rendered glow sprites, DPR ≤ 2, paused when the hero/services are off-screen. 2,200 particles desktop / 1,400 phone.
- **First paint:** the headline is the LCP element; the canvas starts only after the intro.
- **Bundle:** ~352 KB gzipped JS in total (no three.js).
- **Reduced motion:** no intro, no canvas, no pinning — a still 9 and a plain list of the nine cards.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm build        # static export → out/
```

## Deploy the demo (static)

`pnpm build` writes a static site to `out/`. Two options:

- **Cloudflare Pages:** connect this repo (build command `pnpm build`, output `out`), or run `npx wrangler pages deploy out`.
- Any static host (Netlify, S3, Vercel static, etc.).

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · Tailwind CSS v4 · GSAP (ScrollTrigger, DrawSVG) · Motion · Lenis ·
React Bits components (`src/components/reactbits`, vendored, MIT + Commons Clause) ·
fonts via `next/font` (Sora, Inter, JetBrains Mono).

All copy lives in `src/content/site.ts`, shaped like the future Payload CMS collections so the admin can replace it without UI changes.
Placeholders (`hello@ninelabs.example`, `+971 5X XXX XXXX`, `#` social links, working e-book titles) are waiting for the client's real details.
