# Nine Labs v2 — logo landing animation + particle 9 → "1 to 9" services

## Context

The owner shared the client's real logo and redirected the homepage:

- **Part A — landing animation for the new logo.** It plays first, then the logo **flies to the
  top-left and stays fixed in the nav**. It must **not overlap/merge with the hero**.
- **Part B — replace the already-built hero.** Today a light-filled 9 + orbit ring take ~60% of the
  top, with a scroll/dock story into a Mirror Hall services ring. All of that goes (kept only as a
  **saved Git copy**). New story: the hero says **"we provide 9"** — content + particles forming a
  full 9; scrolling, the 9 **splits** and the particles re-form **1 → 9**, one number per service card.
- Feedback that still applies: "not techy — a marketing startup", and **phone must be clean and
  responsive**.

**The logo:** wordmark "L9BS" = "LABS" with the **A built from a 9** (round head = the A's hole, tail
= left leg, solid triangle = right leg); heavy geometric sans (close to **Montserrat Black**); B with
slot counters; S with two small "node" dots; gradient near-black → indigo → violet-blue (~#3530D0);
"NINE LABS / SOLUTIONS" below; designed on lavender (~#E8DEEC).

## Decisions (owner-approved)

| Topic | Decision |
|---|---|
| Landing animation | **"The Hidden 9" + gradient sweep** (~2.4 s), then the logo flies top-left, fixed in the nav; the hero starts only after. Skippable; once per session; reduced motion = logo already in the nav. |
| Logo use after intro | The logo artwork lives **only in the nav**; the hero does not reuse it. |
| Numbers' typeface | Hero 9 and 1→9 use the **logo's typeface** (Montserrat Black 900 — closest match to the logo letters; swap if the client names the exact font). |
| Hero layout | **Split Classic** — content left (~45%), **full** particle 9 right (~55%), clearly readable as a 9. Phone: content first, the 9 below. |
| Services flow | **Pinned Split Stage**: section holds while scrolling; big particle number (1→9) on one side, matching card swaps in on the other; 1–9 progress rail; ends with a **3×3 finale** of all nine. |
| Particle colour | Brief colours: **electric blue (#3B82FF)** body, **neon purple at the edges** of each shape, soft glow. |
| Site colours | **Black background + logo indigo/violet accents** with lavender highlights (indigo for fills/buttons — it's too dark for text on black; a lighter violet/lavender for links/highlights). |
| Interaction | **Scroll only** — no mouse/touch reaction (a faint idle shimmer only). |
| Backup | **Saved Git copy only** (tag + branch); removed from the site. |
| Phone | Fully responsive and uncluttered at 360–430 px, tablet and landscape. |

## Approach

### 0. Backup (first)
- `git tag backup/hero-light-9` + branch `backup/hero-light-9` at the current HEAD; push both.

### 1. Logo assets — `src/components/brand/LogoMark.tsx` (new)
- Recreate the L9BS logo as an **inline SVG built from separate parts** (L · the 9 [head + tail]
  · the A's triangle leg · B · S · two node dots · "NINE LABS / SOLUTIONS"), so the intro can animate
  each part. Traced from the supplied image; replaced by the client's SVG when supplied.
- **Dark-background gradient** (the original's black end disappears on black): lavender → violet →
  logo indigo. Variants: `full` (intro) and `compact` (nav: wordmark only).
- `src/components/layout/Logo.tsx` → renders `<LogoMark variant="compact">`; keeps `data-logo-9`
  as the intro's landing target.

### 2. Landing animation — `src/components/intro/LogoIntro.tsx` (new)
- Fixed full-screen overlay (black, soft lavender glow), GSAP timeline (reuse `src/lib/gsap.ts`):
  L, B, S rise in leaving a gap → the 9 drops into the A's slot with a soft bounce, triangle leg
  locks → gradient sweep left→right, node dots pulse, tagline letter-spaces in → **FLIP into the
  nav slot** (measure `[data-logo-9]`, translate+scale the overlay logo onto it) → overlay fades.
- Locks scroll during play (`getLenis()?.stop()` / `start()` from `src/lib/scroll.ts`); skip on
  tap/click/scroll/Esc; `sessionStorage` "seen" flag; reduced motion = skip.
- Dispatches `nl:intro-done` (or sets `window.__nlIntroDone`) — the hero waits for it.
- Mounted in `src/app/layout.tsx`. Nav **stops auto-hiding** (`src/components/layout/Nav.tsx`,
  remove the `setHidden` scroll logic) so the logo stays fixed at the top.

### 3. Particle engine — `src/components/particles/` (new; 2D canvas, no WebGL)
- `targets.ts`: render each digit "1"…"9" with Montserrat 900 to an offscreen canvas (after
  `document.fonts.load`), read alpha, sample **N** points per digit (N = 2,200 desktop / 900 phone,
  same N for every digit so particles map 1:1), and an **edge factor** per point (near a
  transparent pixel → purple, interior → blue). Cached per size.
- `ParticleStage.tsx`: **one fixed, full-viewport canvas** (pointer-events none, behind content)
  active while the hero and the services stage are on screen; particles fly between DOM **anchor
  slots** (hero 9 slot, services number slot) so the 9 really travels and splits into the "1".
  - Positions are a **pure function of scroll** (reversible): between number k and k+1 each
    particle follows a curve A_k → scatter point S → A_{k+1}; light lerp smoothing on top.
  - Drawing: pre-rendered glow sprite per colour via `drawImage`; DPR capped at 2; rAF only while
    visible and moving (IntersectionObserver + idle detection); `document.hidden` pauses.
  - Reduced motion: static digit drawn at its slot, no pin.
- Font: add **Montserrat (weight 900)** in a shared `src/lib/fonts.ts` (next/font) used by
  `layout.tsx` and the engine (needs the generated family name).

### 4. Hero — rewrite `src/components/hero/Hero.tsx`
- Desktop/tablet: grid `[content | 9-slot]`; content = existing label, headline (with the Fraunces
  accent), sub-headline, two buttons (copy from `src/content/site.ts`). Right column = an empty
  sized `<div data-particle-slot="hero">` the canvas draws the 9 into.
- Starts after `nl:intro-done`: content rises in (existing `.rise-in`), particles stream in from the
  edges and **assemble the 9** (~1.4 s).
- Phone: content first, 9 slot below (~38svh), buttons full-width; no overlaps, no sideways scroll.
- Delete: `NineLight.tsx`, `OrbitCarousel.tsx`, `BlueprintConstruction.tsx`, their CSS (`.nine-*`,
  `.orbit-*`, `.bridge-arc/.bridge-*`, `construct-*`, `.cta-*`), the logo-dock/heartbeat/pulse code.
  Keep `nine-path.ts` (still used by `opengraph-image.tsx`, `BookCover.tsx`, `QuizOverlay.tsx`).

### 5. Services — `src/components/services/ServicesStage.tsx` (new) replaces the ring + deck
- GSAP ScrollTrigger pin (pattern from the old `ServicesRing.tsx`: `refreshPriority: 0`, scrub,
  `registerAnchorPrefix("service-")` so `#service-<slug>` lands on the right step); length ≈ 9
  steps × ~70vh + finale.
- Layout desktop: `[number slot | card]` + **1–9 progress rail** below; the card swaps with a short
  slide/fade per step (reuse `ServiceCard.tsx`, new `mode="stage"`; icons from
  `ActivityIcon.tsx`).
- Phone: number slot on top (~32svh), card below, rail as dots; one step per scroll segment.
- **Finale:** particles gather into a small 9 above "All 9. One team." and a **3×3 grid** of compact
  tiles (icon + short name, links to the card's step); phone keeps 3×3 with small tiles.
- Remove `ServicesRing.tsx`, the stack deck in `Services.tsx`, and `.ring-*` CSS.
  Reduced motion: no pin — a simple list of the 9 cards with a static number each.

### 6. Colours & settings
- `src/app/globals.css` tokens: add `--nl-indigo` (~#3530D0) and `--nl-lavender` (~#E8DEEC);
  primary button = indigo gradient with white text; links/highlights = light violet/lavender; keep
  `--nl-blue` (#3B82FF) and the neon purple for the particles.
- `DemoSettings.tsx` / `ConceptLab.tsx`: remove `logoDock`, `glyph`, `orbitSpeed`; add the indigo
  swatches. `BlueprintGrid.tsx`: drop the `bp-lit` layer that tracked `[data-hero-nine]`.

### 7. Docs
- `README.md`: new hero/intro/services description, backup tag name, how-it's-built + cost note.

## Verification

- `pnpm exec tsc --noEmit`, `pnpm exec eslint src`, `pnpm build` — all clean; no console errors.
- Browser pane at **360×740, 390×844, 430×932, 768×1024, 844×390 (landscape), 1024×768, 1440×900,
  1920×1080**: intro plays → logo lands exactly on the nav logo → hero; the 9 is fully visible and
  readable; scroll 1→9 forward and back (reversible, numbers correct per card); finale grid; no
  horizontal overflow (`scrollWidth === innerWidth`); nothing overlaps text/buttons.
- Intro: skip by tap/scroll/Esc; second visit in the same session skips it; `?motion=reduce`
  shows a still page (logo in nav, static 9, unpinned list).
- `#service-<slug>` anchors land on the right step; nav stays visible and fixed.
- Performance: frame timing sampled during the morph on desktop and 390px; particle counts and DPR
  cap honoured; canvas idle when off-screen.
- Redeploy the GitHub Pages demo (`NEXT_BASE_PATH=/9labs NEXT_PUBLIC_NOINDEX=1 pnpm build` →
  `gh-pages`) and confirm it serves the new build. Note: real-phone check still needed by the owner.
