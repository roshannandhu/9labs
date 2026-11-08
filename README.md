# Nine Labs Solutions — Homepage (frontend demo)

Interactive frontend demo of the Nine Labs Solutions homepage, built from the client brief
(`docs/CLIENT_BRIEF.md`). It is a fully static site meant for **client review and approval**.
The admin panel, database, e-mail delivery and real AI come next (see `docs/PROJECT_PLAN.md`).

> **Hero: Concept A, "Light-built 9"** (spec and decisions: [`docs/HERO_CONCEPT_A.md`](docs/HERO_CONCEPT_A.md)). The earlier glass and particle concepts were removed at the owner's request.

## What's inside

| Section | Highlights |
|---|---|
| **Hero** | A **Sora ExtraBold 9 filled with electric-blue light**, leaning **7° forward**, about half the screen tall, in the exact centre of a full-bleed blueprint screen. **Intro (~3 s):** drafting lines, labels that type themselves on and the 7° guide draw; a spark traces the outline; light floods the 9 from the bottom up and the glow blooms to purple; the nine activities fly in. **At rest:** it breathes, a current of light drifts through it, a glint travels round its edge, a light band crosses every ~8 s, and on desktop it **tilts toward the mouse in 3D** (the grid, 9 and ring sit at different depths) with a highlight following the cursor. **Saturn ring:** the activities orbit a ring tilted to match the lean; back items really pass behind the opaque 9, front ones in front, all with names; step-and-hold (~3.6 s per item, ~44 s per loop); hover pauses, drag/swipe spins, arrow keys rotate, click opens the service (touch: first tap brings it to the front). **The bridge builds itself:** a pylon rises on the 9's edge, a cable draws to the front item, a light dot crosses both ways and **the 9 gives a heartbeat** when it arrives. Hovering *Start The 9 Quiz* sends the same pulse into the 9. A fixed caption under the 9 names the front activity. **Scroll:** the 9 shrinks, straightens and docks into the nav logo (Concept Lab toggle) while the ring's items ride down, gather and dissolve as the Services cards assemble. |
| **Section dividers** | Thin bridge cables (two pylons, a cable that draws as you scroll, one light dot that crosses) between sections. |
| **Services** | Desktop: the **Mirror Hall**, nine faux-glass cards in a pinned CSS-3D ring on a reflective pool (scroll or drag spins it, snapping card by card). Mobile: sticky stacked cards. Animated line icons for every activity. |
| **About** | Scroll-lit statement, count-up stats, a suspension **bridge drawn on scroll** with two-way traffic, the **Roadmap Ascent** "how we work" (a glowing node glides down a spine, plus a split-flap counter), and 5 value cards with a spotlight hover. |
| **The 9 Quiz** | Shader-gradient block with a typing input, plus a full-screen quiz (describe your need → "thinking" → matched activities + a bridge plan + WhatsApp / e-mail CTAs). Answers are simulated (`src/lib/quiz/mockEngine.ts`) behind a provider-neutral interface (`src/lib/quiz/provider.ts`). |
| **Free e-books** | Three CSS-3D books on a mirror shelf; the focused book lifts and casts a **halo in its cover colour** (auto-cycles on desktop). Click: the book flies to the centre, the cover swings open ("Inside this book" + form), and on submit the page turns to a success page. Validation and mock submit only. |
| **Contact / footer** | Closing line flowing along a bridge arc, contact cards, activity marquee, socials, floating WhatsApp button. |
| **Everywhere** | **Liquid-glass UI** (frosted panels with a blue→purple hairline; real lens refraction on Chromium) on the nav pill, chips, focus card, quiz and e-book panels; spring headings; blueprint grid with a cursor spotlight, film grain, Lenis smooth scroll, custom cursor (desktop), reduced-motion support, SEO metadata + JSON-LD + sitemap/robots + OG image. |

### Concept Lab (demo only)

The chip at the bottom-left lets the client switch the **9 typeface**, try **brand colours**, change grid intensity and orbit speed, preview reduced motion, and toggle the custom cursor, the WhatsApp button and the **logo dock on scroll**. Hide it in production with `NEXT_PUBLIC_DEMO_LAB=false`.

URL helper: `?motion=reduce` (note: Concept Lab settings, including this one, are remembered in the browser; use *Reset to defaults* to clear them).

### How the cover is built, and what it costs (brief §5.8)

- **Tech:** SVG + CSS + GSAP only. No WebGL, no canvas. The 9 is one inline SVG glyph; its intro, breathing and light band are CSS keyframes, so it paints with the HTML before any JS runs.
- **First paint:** the LCP element is the headline text; the hero adds only a few KB.
- **JS cost:** the orbit is one `requestAnimationFrame` loop moving nine elements with `transform`/`opacity` only; it pauses when the cover is off-screen or the tab is hidden.
- **Bundle:** removing three.js / React Three Fiber cut the shipped JS chunks from 2,236 KB to 1,085 KB (669 → 355 KB gzipped). Initial-page JS is about 346 KB gzipped.
- **Reduced motion:** a still cover (lit 9, items placed on the ring, front item highlighted, arc drawn; no intro, no auto-rotation).

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
