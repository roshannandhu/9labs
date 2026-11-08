# Nine Labs Solutions — Homepage (frontend demo)

Interactive frontend demo of the Nine Labs Solutions homepage, built from the client brief
(`docs/CLIENT_BRIEF.md`). It is a fully static site meant for **client review and approval**.
The admin panel, database, e-mail delivery and real AI come next (see `docs/PROJECT_PLAN.md`).

## What's inside

| Section | Highlights |
|---|---|
| **Hero** | A bold font **9** (Space Grotesk Bold; Outfit Black as an option). It starts as a neon channel letter drawn on a blueprint, then cross-fades into a **cinematic 3D 9** (chrome bevels, glass face, neon light flowing around the outline) standing on a receding blueprint floor with orbit tracks. The **nine activities orbit the 9**: the front one grows and shows its description, items behind the 9 dim, hover pauses, drag/swipe spins with inertia, click jumps to the service, arrow keys rotate. Scrolling flies the camera around the 9. |
| **Services** | Desktop: pinned horizontal journey through 9 cards with snapping, a big counter and a bridge progress line. Mobile: sticky stacked cards. Animated line icons for every activity. |
| **About** | Scroll-lit statement, count-up stats, a suspension **bridge drawn on scroll** with two-way traffic ("Your goals →", "← Our expertise") meeting at the 9, ascending "how we work" steps, 5 value cards with a spotlight hover. |
| **The 9 Quiz** | Shader-gradient block with a typing input, plus a full-screen quiz (describe your need → "thinking" → matched activities + a bridge plan + WhatsApp / e-mail CTAs). Answers are simulated (`src/lib/quiz/mockEngine.ts`) behind a provider-neutral interface (`src/lib/quiz/provider.ts`). |
| **Free e-books** | Three CSS-3D books on a mirror shelf. Click: the book flies to the centre, the cover swings open ("Inside this book" + form), and on submit the page turns to a success page. Validation and mock submit only. |
| **Contact / footer** | Closing line flowing along a bridge arc, contact cards, activity marquee, socials, floating WhatsApp button. |
| **Everywhere** | Blueprint grid with a cursor spotlight, film grain, Lenis smooth scroll, custom cursor (desktop), reduced-motion support, SEO metadata + JSON-LD + sitemap/robots + OG image. |

### Concept Lab (demo only)

The chip at the bottom-left lets the client compare **hero concepts** (C Cinematic 3D · A Neon · B Particle grid), switch the **9 typeface**, try **brand colours**, grid intensity, orbit speed, the reduced-motion preview, the custom cursor and the WhatsApp button. Hide it with `NEXT_PUBLIC_DEMO_LAB=false`.

URL helpers: `?concept=a|b|c`, `?motion=reduce`, `?tier=low|high` (3D quality), `?perf=off` (show the 3D even on slow GPUs).

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
