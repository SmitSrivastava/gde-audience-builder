
## Scope
Only `src/pages/Planning/PlanningPage.tsx`. No other files touched. No functionality changes elsewhere.

## 1. Fix the Audience 360 hero (HeroSection)

Current bug: the ring container is `780×780px` but lives inside an `h-[640px]` flex box, so it overflows and clips. Cards push off-canvas and the silhouette no longer sits in the visual center of the ring — matching the broken screenshot.

Fixes:
- Drop the fixed `h-[640px]` wrapper. Use a square container sized off a single `SIZE` constant (e.g. 620px) with `radius = (SIZE - cardWidth) / 2` so all 6 cards stay fully inside the visible area.
- Make the SVG, the connector math, the center silhouette, and the 6 floating cards all derive from the same `SIZE` / `CENTER` constants so the silhouette is mathematically centered (`top:50% / left:50%`) and all 6 signal cards orbit symmetrically at the 6 clock positions (top, top-right, bottom-right, bottom, bottom-left, top-left).
- Confirm the 6 signals render: Demographics, Affluence, Purchase, Psychographics, Digital, Intent (already in the `signals` array — the breakage is positional, not data).
- Keep entrance/hover animation and connector lines as-is.

## 2. Audience Scale by Sector — large numbers, no sparkline

In the `AudienceScale` section:
- Remove the `<Sparkline />` render and the `Sparkline` component usage.
- Promote the value to the hero element of each tile: `text-4xl font-extrabold tabular-nums` with `CountUp` (already animates 0 → final on scroll into view). Add `suffix="M"`.
- Keep the sector label below as small caption text. Keep hover lift and tooltip.
- Tighten grid to look balanced now that sparkline is gone (e.g. `lg:grid-cols-7` stays, padding bumped slightly).

## 3. Count-up on Addressable Consumers and Signals

The `MetricStrip` already uses `<CountUp>` for all four metrics including "Addressable Consumers" (350M+) and "Behavioral & Intent Signals" (2,000+). Verify they animate from 0 on first view; no logic change needed beyond making sure `inView` triggers (already wired with `useInView({ once: true })`).

## Out of scope
- No changes to sidebar, header, ecosystems, growth audiences, partner strips, CTA, or any other page.
- No new dependencies.
