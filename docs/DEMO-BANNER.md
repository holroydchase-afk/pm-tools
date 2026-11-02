# Demo banner standard (DEMO-BAR)

Every public demo in the studio marks itself the same way: a slim **Demo** bar at the top that opens a short drawer. Chase asked for it on Oct 31 because each demo had its own banner, and they looked bolted on. The behavior and the words are fixed here; the look comes from each product's own design system.

Reference build: `demo/fake-db.js` in this repo (Build Slate and the Near-Term Roadmap demos). Tests: `tests/e2e/demos.e2e.ts`, the `DEMO-BAR` and `DEMO-R` cases. Review: ux-reviewer scored the old bars 4/10 and this one 7/10 before its fixes DEMO-R1..R6, all applied.

## Pattern: push-down drawer, not a modal
The bar is a disclosure: one button that opens a panel below it, which pushes the app down.
- A modal covers the app the visitor came to try, needs a focus trap and a scrim, and turns a two-line note into an interruption.
- The drawer is the plain WAI-ARIA disclosure pattern (a button with `aria-expanded`), so it needs no focus management beyond Esc, and the page never jumps under a layer.
- The bar sits in the page flow at the top, not sticky, so it never eats screen space while someone works in the demo.

## Collapsed bar
| Part | Rule |
|---|---|
| Height | 44px (the tap target), at most 48px with the border |
| Far left | The way back: a link, `← Portfolio`, with a divider after it. A visitor always has a visible way out (DEMO-R1) |
| Then | A **Demo** badge: the word Demo, small caps, an outlined pill in the body text color. Never the product's accent: that color means "act here" (DEMO-R2) |
| Middle | Muted text. Phone: `Sample data`. From 600px: `Sample data · changes stay in this browser`. Hidden below 360px |
| Right | `Details` plus a chevron that turns over when open. It is the more-info indicator |
| Hit area | Everything after the back link is one `<button aria-expanded aria-controls aria-label="Demo details">` (a link can't sit inside a button) |
| Surface | The product's card surface, body text color and a 1px divider. Never a hard-coded brand color |

## Open drawer
Drawer text is 16px with 1.5 line height, at most 70 characters wide. Standard copy, with the product's name filled in:

> This is the real `<Product>`, running on made-up sample data. Anything you change is saved only in this browser and is never sent anywhere. Reset demo puts the sample data back.

Adapt only what is untrue for a product, keeping the same order: what it is, that the data is made up, where changes go, then how to start over. For example a demo that keeps nothing says "Nothing you do is saved; reload to start over." and drops the Reset button. A demo that sends nothing anywhere must never claim otherwise, and one that does call a server must say so.

Actions, in this order:
1. **Reset demo** (a secondary button: outline in the divider color). It asks first, inline: "Put the sample data back? Your changes will be lost." [Reset] [Keep]. After the reload the drawer opens once and starts with "Sample data restored." Leave it out if the demo keeps no state.
2. **The way back** in full (a link, for example `← How I keep it all moving`), the same target as `← Portfolio`.
3. Optional: **Code on GitHub**.

## Accessibility
- The bar is a `<section aria-label="Demo">` (a named region), so screen readers can find it.
- The toggle carries `aria-expanded`, `aria-controls` and the short name "Demo details"; Esc closes the drawer and puts focus back on the toggle.
- Every control is at least 44px tall; the focus ring is visible in light and dark.
- The chevron is decorative (`aria-hidden`), and its turn is skipped under reduced motion.
- Badge and text meet WCAG AA in the product's light and dark themes (they reuse token pairs the product already checks).

## Tokens
The bar reads the product's tokens and falls back to neutral values. A product whose names differ maps them once:

| Bar variable | Reads by default |
|---|---|
| `--demo-bg` | `--surface` |
| `--demo-fg` | `--ink` |
| `--demo-muted` | `--muted` |
| `--demo-line` | `--line` |
| `--demo-badge-bg` / `--demo-badge-fg` | transparent / `--ink` |
| `--demo-font` | `--f-body` |

Products with their own UI kit (React Native Web, a component library) build the same parts from their own components instead: the same copy, behavior and checks matter, not this file's CSS.

## Done when (per product)
- Collapsed on every load, at most 48px tall at 390px and 1280px, no sideways scroll down to 320px, with the back link visible.
- Opening it shows the standard copy and pushes the app down; Esc closes it and focus returns to the toggle.
- Bar font and surface match the product's own, and the badge isn't the accent color (checked in a browser test).
- Reset asks first; Keep changes nothing.
- Before and after screenshots at 390px and 1280px, light and dark, reviewed by ux-reviewer.
- The product's older banner, notice or "demo" line is removed, so there is only one.
