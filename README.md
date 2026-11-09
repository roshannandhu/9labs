# Nine Labs Solutions — Homepage (frontend demo)

Interactive frontend demo of the Nine Labs Solutions homepage, built from the client brief
(`docs/CLIENT_BRIEF.md`). It is a fully static site meant for **client review and approval**.
The admin panel, database, e-mail delivery and real AI come next (see `docs/PROJECT_PLAN.md`).

> **Logo (Nov 2026):** the wordmark is traced from the client's logo image (pixel contours, within half a pixel) in its **original colours** — black `#030303` → indigo `#3533cb`, on lavender `#e9ddeb`; tagline in Montserrat ExtraBold, sized from the file. On our black pages it always sits on its own lavender badge. Replace with the client's SVG when supplied.

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
| **Landing animation** | **"The Hidden 9"** (~4 s, once per session, skippable by tap/click/scroll/key; add `?intro` to the URL to replay it): on the logo's own lavender, **"LABS"** rises in as a plain word — then the **9 appears above and falls onto the A**; on impact the A gives way and becomes the logo's triangle leg, the 9 bounces once and settles: **L9BS**. A light sweep crosses it, "NINE LABS / SOLUTIONS" spreads in, then the **lavender screen shrinks into the nav's lavender logo badge** while the logo flies onto it (top-left, fixed). The hero only starts after it (they never overlap). Reduced motion: no intro, the logo is simply in the nav. |
| **Hero** | **"We provide 9"**: content on the left (headline with the serif accent, sub-headline, Start The 9 Quiz / e-books); on the right a **9 built from ~2,200 particles** (1,400 on phones) in the logo's typeface (Montserrat Black), electric blue with neon-purple edges, streaming in once the intro ends. Phones: content first, the 9 underneath. Particles react **only to scroll** (no mouse/touch effects). |
| **Section dividers** | Thin bridge cables (two pylons, a cable that draws as you scroll, one light dot that crosses) between sections. |
| **Services — "Our 9 labs"** | **Pinned split stage**: as you scroll, the hero 9 **splits and re-forms 1, 2 … 9**, each number beside its service card (cards swap in step by step; a 1–9 rail jumps to any step; scroll snaps to whole numbers, and scrolling back re-forms the earlier number). Ends with **"All nine. One team."** — the swarm becomes a small 9 above a 3×3 grid of all nine activities. Phones: number on top, card below. Reduced motion: an unpinned list with a still number per card. |
| **About** | Scroll-lit statement, count-up stats, a suspension **bridge drawn on scroll** with two-way traffic, the **Roadmap Ascent** "how we work" (a glowing node glides down a spine, plus a split-flap counter), and 5 value cards with a spotlight hover. |
| **The 9 Quiz** | Shader-gradient block with a typing input, plus a full-screen quiz (describe your need → "thinking" → matched activities + a bridge plan + WhatsApp / e-mail CTAs). Answers are simulated (`src/lib/quiz/mockEngine.ts`) behind a provider-neutral interface (`src/lib/quiz/provider.ts`). |
| **Free e-books** | Three CSS-3D books on a mirror shelf; the focused book lifts and casts a **halo in its cover colour** (auto-cycles on desktop). Click: the book flies to the centre, the cover swings open ("Inside this book" + form), and on submit the page turns to a success page. Validation and mock submit only. |
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
