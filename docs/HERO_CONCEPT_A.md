# Hero rebuild: Concept A "Light-built 9", plus a full frontend review

Hand-off document. Whoever continues this work (e.g. a Claude Desktop session on the owner's PC) should read this file first, then `docs/CLIENT_BRIEF.md`, then `README.md`.

- Branch: `claude/client-animation-books-plan-grtwcu`.
- Ask the owner before any serious change. Use simple, understandable questions; any number of questions is fine.

## Why

The owner rejected the previous hero:
- The WebGL "Liquid Glass Nine": glass on black looks grey and dirty.
- The segmented line inside the 9: it reads as "a 9 inside a 9", a dashed loading line.
- Too many effects at once: sea, stars, comets, particles, portal dive.

The brief asks for something simpler and stronger.

## Decisions (confirmed by the owner)

1. **Only concept A remains.**
   - Delete the WebGL glass 9 (`src/components/hero/NineCinematic.tsx`) and the particle 9 (`src/components/hero/NineParticles.tsx`).
   - Remove the Concept Lab "hero concept" switch and the `concept` setting.
   - Remove `three`, `@react-three/fiber`, `@react-three/drei` and `@react-three/postprocessing` if nothing else uses them.
   - Remove the URL helpers `?concept`, `?tier`, `?perf` and `?intro`.
   - Remove unused code in `nine-path.ts`: `NINE_SPINE`, `NINE_BOWL`, `WORDMARK`, the extra glyphs if the typeface option goes, and `d3`.
2. **The 9 leans forward 7°**, top to the right, like a confident italic. The ring is tilted the same 7° so they read as one system.
3. **Dock into the logo on scroll:** yes, behind a Concept Lab toggle (default on), because the client's real logo is still "to be supplied".
4. **No glass 9 and no line inside the 9.** The 9 is one clean shape filled with light.
5. **Hero must not feel "inside a box".** It goes full-bleed: no masks with hard edges, no framed stage, no boxed panels around the 9.

## What the brief requires (`docs/CLIENT_BRIEF.md` §5.4–5.10)

- **The 9 and grid:** a large electric-blue 9 in the **exact centre** of a black screen. Its soft glow fades to **neon purple at the edges**. It "feels alive" with a gentle pulse or slow shimmer. A faint blueprint grid (4–8% white) sits behind it.
- **Carousel:**
  - The nine activities travel **around** the 9 on a circular or oval path. Each one is a graphic element **with its name beside it**.
  - The **front** one becomes larger and brighter, and its name **and one-line description** appear clearly. The others stay smaller and dimmer, behind and beside the 9.
  - Slow and smooth. Pauses on hover. A click goes to that activity in Services. Swipe on mobile.
- **Text:** the headline, sub-headline and two buttons are never covered by moving elements. Place them below the 9.
- **Bridge:** a fine **neon-purple line or arc** connects an activity to the 9. It shows the bridge idea "quietly", with traffic in both directions.
- **Grid details:** optional corner marks, measurement ticks and plus signs. The grid drifts slowly or reacts slightly to the mouse, never distracting.
- **Speed and accessibility:** motion is smooth and subtle and must not slow the page. Explain how it's built and what it costs. Reduced motion shows a still cover.
- **Mobile:** the 9 stays centred. The carousel becomes a smaller swipeable ring. Text and buttons stack below the 9 and are easy to tap.
- **Differentiators:** the electric-blue 9, the blueprint grid and the bridge. theninelabs.com is inspiration only; copy nothing.

## The spec

### 1. The 9 at rest
- **Glyph and lean:** the Sora ExtraBold 9 (existing `GLYPHS.sora.d` in `src/components/hero/nine-path.ts`), leaned 7° forward. Use an SVG `skewX(-7)` around the baseline so it stays centred.
- **Fill:** solid light, not glass.
  - Electric blue `#3B82FF` body.
  - A lighter core `#8FB8FF` towards the centre.
  - Soft neon-purple `#B98CFF` glow outside the edges.
  - Use the existing `--nl-*` CSS tokens so Concept Lab colours still work.
- **Edge highlight:** a thin sharp highlight on the top-left edges, as if light is catching them.
- **Breathing:** the glow intensity rises and falls on a ~5 s sine.
- **Shimmer:** every ~8 s a soft diagonal light band slides across the 9, clipped to the glyph.
- **Cursor hotspot (desktop):** a brighter radial spot inside the fill follows the cursor while it is over the 9.
- **Opacity:** the fill must be opaque enough to hide items passing behind it. See the occlusion section.

### 2. Intro: "planned, then built" (~3 s, once per visit; the headline is readable from the first frame)

| Time | What happens |
|---|---|
| 0.0–0.8 s | The grid fades in. Compass arcs sweep and measurement ticks draw. A vertical guide line and the 7° lean line appear at the base, with a small angle arc and the label "7°". Reuse and extend `BlueprintConstruction.tsx`. |
| 0.6–1.6 s | A bright point with a spark traces the **outline** of the 9 like a pen (`pathLength` + dashoffset). |
| 1.4–2.4 s | Electric-blue light **floods the 9 from the bottom up**, like liquid. Use a clipPath of the glyph with a rising shape whose top edge is a glowing wave. At the top: a soft flash, then the glow blooms outward to purple. The outline melts into the edge highlight, and the construction lines fade to ~3%. |
| 2.0–3.0 s | The nine activities fly in from outside the screen edges with faint trails and settle into the ring. The last one lands at the front. |
| 3.0 s | The bridge arc draws to the front item, and the caption appears. |

### 3. Carousel ("Saturn ring", rework `src/components/hero/OrbitCarousel.tsx`)
- **Path:** a tilted ellipse wrapping the 9 (tilt 7°, matching the lean). Back items pass behind the upper 9; front items pass in front of the lower 9.
- **Real occlusion, the "around" feeling:**
  - Back-half items render **below** the 9 layer; front-half items render above it.
  - The existing depth-based `zIndex` logic already does this split.
  - Because the new 9 is an opaque filled shape, items behind it are genuinely hidden and reappear on the other side.
  - Drop the old "fake occlusion" dimming.
- **Names on every item:** the brief says "name beside it". Back items are smaller and dimmer.
  - Front item: 1.4× scale, purple glow, bright name.
  - On phones, back-item names may hide for space. Ask the owner if unsure.
- **Step and hold:** each item glides to the front (ease in-out), holds ~3 s, then the next one comes. A full loop is about 40 s.
  - Hover pauses.
  - Drag/swipe works with inertia.
  - Arrow keys rotate.
  - Touch: the first tap brings an item to the front; the second tap opens its service.
- **Caption:** a fixed caption **under the 9** with the front item's name and one-line description.
  - No box: text with a thin purple line.
  - It swaps with a short fade.
  - It replaces the current boxed "Now orbiting" focus panel.
- **Bridge arc:** only while an item is at the front.
  - A fine purple arc draws from the item to the 9 in ~0.6 s.
  - A light dot runs to the 9, then back: "your goals reach us, our expertise reaches you".
  - The arc fades when the item leaves.
  - One line only, never always-on.
- **Icons:** keep the animated activity icons (`src/components/icons/ActivityIcon.tsx`). They already follow the brief's suggested visuals.

### 4. Grid and the "not in a box" feeling
- **Full-bleed hero:** full viewport height (`svh`), with the grid edge to edge.
  - No framed stage, no hard mask edges.
  - Turn the corner coordinate labels into small blueprint notes near the 9, not screen-corner boxes.
- **Glow:** the 9's glow bleeds into the next section, with no hard line where the hero ends.
- **Grid:** ~6% white, with small plus signs at some crossings.
  - Parallax 4–6 px with the mouse.
  - Lines near the 9 brighten slightly, as if lit by its glow.
- **Phone ring:** on phones the ring is **wider than the screen**, so side items slide off the edges and come back. This makes the space feel bigger than the device.

### 5. Responsive (fluid `clamp()` sizes, no jumpy breakpoints)

| Device | Layout |
|---|---|
| 1440+ desktop | 9 ≈ 60% of viewport height, ring ≈ 70% of width, text below. Mouse: grid ±4 px, 9 lean ±2°, ring tilt ±2°. |
| 1920–2560 | The 9 caps at a maximum size; the grid and glow fill the rest so it never looks empty. |
| 1024–1440 laptop | Same as desktop, slightly smaller; everything on one screen. |
| Tablet | 9 ≈ 45% of height, ring ≈ 90% of width; swipe and tap. |
| Phone 360–430 | 9 ≈ 38% of height, centred. Ring wider than the screen. Caption, headline and full-width buttons stacked. On short phones the 9 shrinks so the buttons stay visible. Gentle sway instead of mouse effects. |
| Phone landscape | 9 and ring on the left, text on the right. |
| Reduced motion | Still picture: lit 9, items placed on the ring, front item highlighted, arc drawn. No intro, no auto-rotation. |

### 6. Scroll out
- **Ring:** it opens outward like a flower, and the nine items fly down toward the Services section, so the carousel turns into the services.
- **Logo dock (toggle, default on):** the 9 shrinks, straightens from 7° to 0°, and docks into the nav logo `src/components/layout/Logo.tsx`. The logo lights up when it arrives.
- **Toggle:** add `logoDock` to `src/components/providers/DemoSettings.tsx` and a toggle to `src/components/lab/ConceptLab.tsx`.

### 7. How it's built (the note the client asked for, brief §5.8)
- **Tech:** SVG + CSS + GSAP only. No WebGL and no canvas for the hero.
- **First paint:** the inline SVG 9 paints immediately; the LCP element is the headline.
- **Weight:** the hero adds only a few KB. Removing three.js / R3F cuts the JS bundle substantially; measure before and after.
- **Off-screen:** the orbit rAF loop already pauses off-screen; keep that.
- **Reduced motion:** gives a still cover.

## Then: whole-frontend review (senior UI / motion pass)

Check every section on real sizes:
- widths 360, 390, 414, 768, 1024, 1280, 1440, 1920, 2560;
- landscape phone;
- `prefers-reduced-motion`.

Fix anything that feels boxed, cramped, slow or noisy. Sections to check:
- Nav and mobile menu (portal);
- Services: Mirror Hall ring on desktop, sticky stack on mobile, grid for reduced motion;
- About: statement, stats, bridge, Roadmap Ascent, values;
- The 9 Quiz block and overlay;
- E-books shelf (Spectra halo) and book dialog + form;
- Closing CTA and footer;
- WhatsApp button and Concept Lab.

**Speed:**
- Check the bundle after removing three.js.
- Fonts: next/font with `display: swap` and the Latin subset.
- Below-the-fold work: lazy, with ScrollTriggers created only when needed.
- Animate only transform and opacity.
- No layout thrash in scroll handlers.
- Targets: Lighthouse mobile performance ≥ 90, CLS 0, LCP < 2 s.

**Motion polish:**
- One clear idea per section.
- Consistent easing (`--ease-out-expo`).
- Nothing loops in a distracting way.
- Every effect has a reduced-motion fallback.

**Accessibility:**
- Keyboard focus visible everywhere.
- Carousel items are real links.
- Text contrast ≥ 4.5:1, including on glass panels.

**Checks:** `pnpm exec tsc --noEmit`, `pnpm exec eslint src` and `pnpm build`, all clean. Take screenshots at the sizes above, with zero console errors.

**Docs:** update `README.md`, removing concepts B/C, `?concept`, `?tier`, `?perf` and `?intro`. Add the build note above.

**Git:** commit with clear messages and push to `claude/client-animation-books-plan-grtwcu`.

## Project facts
- **Stack:** Next.js 16 (App Router, static export; read `node_modules/next/dist/docs` before writing Next code, see `AGENTS.md`), React 19, Tailwind v4 and GSAP 3 (`src/lib/gsap.ts`). Lenis smooth scroll (`src/lib/scroll.ts`, use `scrollToId`, `registerAnchorPrefix`) and Motion. React Bits components are vendored in `src/components/reactbits`.
- **Run:** Node 20+, pnpm 10 (`corepack enable`), then `pnpm install` and `pnpm dev`.
- **ScrollTrigger pins:** any pinned trigger sets `refreshPriority: 0` so triggers sort by page position (see `ServicesRing.tsx`, `RoadmapAscent.tsx`).
- **React Compiler lint rules:**
  - No `setState` directly inside effects; use a callback, or an eslint-disable comment with a reason for client-only init.
  - Don't mutate props or hook values.
  - No `Math.random` during render.
