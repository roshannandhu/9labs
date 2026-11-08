# Nine Labs Solutions — Homepage (frontend demo)

Interactive frontend demo of the Nine Labs Solutions homepage, built from the client brief
(`docs/CLIENT_BRIEF.md`). It is a fully static site meant for **client review and approval**.
The admin panel, database, e-mail delivery and real AI come next (see `docs/PROJECT_PLAN.md`).

## What's inside

| Section | Highlights |
|---|---|
| **Hero** | A bold **Sora ExtraBold 9**. Concept C (default), **Liquid Glass Nine**, is a WebGL glass 9 with a neon tube along its centreline. The tube is split into **nine segments, one per activity**. Light particles stream into the tube, the segments ignite one by one, then the glass crystallises around them. A Fresnel rim runs blue at the core to purple at the edges, a light sweep crosses the glass, a highlight follows the cursor, and the **blueprint grid and aurora bend through the glass**. The **nine activities orbit the 9** as liquid-glass chips: the front one grows, its segment of the 9 glows purple, and **one bridge arc** links the chip to its segment, with light pulses running both ways. Hover pauses, drag/swipe spins with inertia, click jumps to the service, arrow keys rotate. **Scroll: the cover pins and the camera flies through the 9's bowl**, and a ring of light opens into the services. |
| **Services** | Desktop: the **Mirror Hall**, nine faux-glass cards in a pinned CSS-3D ring on a reflective pool (scroll or drag spins it, snapping card by card). Mobile: sticky stacked cards. Animated line icons for every activity. |
| **About** | Scroll-lit statement, count-up stats, a suspension **bridge drawn on scroll** with two-way traffic, the **Roadmap Ascent** "how we work" (a glowing node glides down a spine, plus a split-flap counter), and 5 value cards with a spotlight hover. |
| **The 9 Quiz** | Shader-gradient block with a typing input, plus a full-screen quiz (describe your need → "thinking" → matched activities + a bridge plan + WhatsApp / e-mail CTAs). Answers are simulated (`src/lib/quiz/mockEngine.ts`) behind a provider-neutral interface (`src/lib/quiz/provider.ts`). |
| **Free e-books** | Three CSS-3D books on a mirror shelf; the focused book lifts and casts a **halo in its cover colour** (auto-cycles on desktop). Click: the book flies to the centre, the cover swings open ("Inside this book" + form), and on submit the page turns to a success page. Validation and mock submit only. |
| **Contact / footer** | Closing line flowing along a bridge arc, contact cards, activity marquee, socials, floating WhatsApp button. |
| **Everywhere** | **Liquid-glass UI** (frosted panels with a blue→purple hairline; real lens refraction on Chromium) on the nav pill, chips, focus card, quiz and e-book panels; spring headings; blueprint grid with a cursor spotlight, film grain, Lenis smooth scroll, custom cursor (desktop), reduced-motion support, SEO metadata + JSON-LD + sitemap/robots + OG image. |

### Concept Lab (demo only)

The chip at the bottom-left lets the client compare the three **hero concepts** the brief asks for:
- **C, Liquid Glass Nine** (recommended);
- **A, Neon Segments** (SVG/CSS only; the lightest, and also the fallback);
- **B, Particle Nine**.

It also lets them switch the **9 typeface**, try **brand colours**, change grid intensity and orbit speed, preview reduced motion, and toggle the custom cursor, the WhatsApp button, the **portal dive** and the **NINE LABS wordmark** behind the glass. Hide it with `NEXT_PUBLIC_DEMO_LAB=false`.

URL helpers:
- `?concept=a|b|c`
- `?motion=reduce`
- `?tier=low|high` (3D quality)
- `?perf=off` (show the 3D even on slow GPUs)
- `?intro=<seconds>` (freeze the 3D intro at that moment, for reviews)

### How the cover is built, and what it costs (brief §5.8)

- **First paint:** an inline SVG poster of the neon 9 (a few KB, no JS needed). The LCP element is the headline text.
- **3D loading:** three.js / React Three Fiber are loaded with a dynamic import, client-only.
- **When the 3D appears:** only after a performance check passes. If the high tier is slow, it drops to the low tier; if that is still slow, the SVG poster stays.
- **Rendering limits:** DPR is capped at 1.5, and the canvas stops rendering when the cover is off-screen.
- **Reduced motion:** shows a still cover.
- **Verify on real hardware:** the cloud test browser has no GPU, so check the 3D on a real laptop and phone.

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
three.js + React Three Fiber + drei + postprocessing (3D hero, lazy-loaded) · React Bits components (`src/components/reactbits`, vendored, MIT + Commons Clause) ·
fonts via `next/font` (Space Grotesk, Inter, JetBrains Mono).

All copy lives in `src/content/site.ts`, shaped like the future Payload CMS collections so the admin can replace it without UI changes.
Placeholders (`hello@ninelabs.example`, `+971 5X XXX XXXX`, `#` social links, working e-book titles) are waiting for the client's real details.
