# DESIGN.md — Kitobmarkazi Visual System

> Strict stylistic anchor. Source of truth = `:root` in [style.css](style.css) (lines 4-47). If this file and the code ever disagree, **the code wins** — update this file to match.
> Stack: vanilla HTML/CSS/JS, no build step, no Tailwind. Single global stylesheet + per-page `<style>` blocks in `<head>`.

---

## 1. Color Palette

### Brand
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#0A1628` | Primary dark bg (nav, hero gradients, footer) |
| `--navy2` | `#13294A` | Navy hover/lighter step |
| `--navy3` | `#0E2036` | Footer base |
| `--teal` | `#1D9E75` | Primary brand action color (CTAs, links, focus) |
| `--teal-d` | `#0F6E56` | Teal dark (text-on-light, gradient stop) |
| `--teal-l` | `#5DCAA5` | Teal light (accents on dark bg) |
| `--gold` | `#C2932E` | Accent — badges, underlines, secondary CTA (darkened from `#D9A93E` for contrast) |
| `--gold-l` | `#F0CC72` | Gold light (gradient stop, on-dark text accent) |
| `--gold-d` | `#9A6E1A` | Gold dark |

### Background / Surface
| Token | Hex | Use |
|---|---|---|
| `--cream` | `#FAF8F5` | Page background |
| `--cream2` | `#F2ECE2` | Tinted surface (icon chips, modal close bg) |
| `--white` | `#FFFFFF` | Card/surface base |
| `--surface` | `#FFFFFF` | Alias for elevated surfaces |
| `--surface-tinted` | `#F5F2EA` | Alias for tinted surfaces |

### Text (navy-tinted neutral scale)
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0B1320` | Primary text |
| `--mid` | `#3A475C` | Secondary text |
| `--light` | `#5C6B84` | Muted/label text |
| `--border` | `#DFE5EC` | Hairline borders |

### Gradients
```css
--grad-navy: linear-gradient(135deg,#0C1B30 0%,#0A1628 55%,#0B2A24 100%);
--grad-gold: linear-gradient(135deg,#F0CC72,#C2932E);
--grad-teal: linear-gradient(135deg,#1D9E75,#0F6E56);
```

### Rule
**Never hardcode a raw hex in new CSS.** Always reference a `var(--token)`. One-off status colors (e.g. wishlist red `#C0392B`) are the only tolerated exception, and only because they're semantic (destructive/favorite), not brand.

---

## 2. Typography

```css
--serif: 'Playfair Display', Georgia, serif;   /* headings, prices, emphasis */
--sans:  'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; /* body, UI */
```
Loaded via Google Fonts: `Manrope:wght@300;400;500;600;700;800` + `Playfair+Display:wght@600;700;800;900` (with `preconnect`, `display=swap`).

### Hierarchy
| Element | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Nav brand (`.bname`) | serif | 20px | 800 | letter-spacing 0.005em |
| Section title (`.st`) | serif | 30px (22px @≤600px) | 800 | gold underline via `::after`, letter-spacing -0.025em |
| Modal/product title | serif | 28-30px | 700 | line-height 1.15 |
| Section subtitle (`.ss`) | sans | 14px | 400 | `var(--mid)` |
| "See all" link (`.sa`) | sans | 13.5px | 600 | `var(--teal-d)` |
| Card title label | sans | 12px | 700 | uppercase, letter-spacing 0.07em |
| Body text | sans | 15-16px | 400 | line-height 1.6 |
| Book title | sans | 14.5px | 600 | line-height 1.25 |
| Book price | serif | 17px | 700 | `var(--teal-d)` |
| Nav link | sans | 14px | 500 (600 active) | |

### Base
```css
body{font-family:var(--sans);color:var(--ink);line-height:1.6;letter-spacing:-0.005em}
html{scroll-behavior:smooth;scroll-padding-top:80px}
```
**Rule of thumb:** serif = money/emotion (titles, prices, brand). Sans = everything functional (nav, buttons, body, labels).

---

## 3. Spacing & Layout

### 8px grid
```css
--sp-xs:4px; --sp-sm:8px; --sp-md:16px; --sp-lg:24px; --sp-xl:32px; --sp-2xl:48px; --sp-3xl:64px;
```

### Containers
- `.sec` — content wrapper: `max-width:1100px; margin:0 auto; padding:72px 32px 0`
- `.sec-alt` — full-bleed white strip variant, same inner max-width via child selector
- Footer inner: `max-width:1080px`
- Modal: `max-width:840px`

### Grid patterns
| Pattern | Rule |
|---|---|
| Book catalogue grid (`.books-grid`) | `grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px` → `minmax(180px,1fr)` @≤900px → fixed `repeat(2,1fr)` @≤600px |
| Modal | `grid-template-columns:330px 1fr` → `1fr` @≤680px |
| Footer top | `grid-template-columns:1.7fr 1fr 1.3fr` → `1fr 1fr` @≤780px → `1fr` @≤520px |
| Form rows (`.frow`) | `grid-template-columns:1fr 1fr` → `1fr` @≤600px |

### Breakpoints (do not invent new ones — reuse this set)
`520px, 600px, 680px, 780px, 900px, 950px`

### Mobile-first responsive rule
Per [KITOBMARKAZI.md](KITOBMARKAZI.md): breakpoints cluster at 600/680/760/780/860/900/950px. New responsive CSS should snap to this existing set unless a genuinely new layout requires otherwise.

---

## 4. Component Patterns

### Buttons (`.btn` + variant)
Base: `border-radius:12px; font-weight:600; font-size:15px; transition:all .28s var(--ease-premium)`, with a `::before` white-sheen overlay that fades in on hover.
| Variant | Background | Text | Shadow |
|---|---|---|---|
| `.btn-teal` | `var(--grad-teal)` | white | `var(--sh-teal)`, lifts `translateY(-3px)` on hover |
| `.btn-gold` | `var(--grad-gold)` | `#3D2A00` | `var(--sh-gold)`, weight 700 |
| `.btn-navy` | `var(--navy)` → `var(--navy2)` on hover | white | soft navy shadow |
| `.btn-ghost` | white | `var(--ink)` | 1.5px border, turns teal on hover |

All buttons: `active` state = `translateY(1px) scale(0.99)` (tactile press feedback).

### Cards
- `.card` (generic): white, `border-radius:20px`, 1px `var(--border)`, `var(--sh-sm)` → `var(--sh-md)` + teal border on hover, lifts `-2px`
- `.book` (product card): same radius/shadow language, `aspect-ratio:2/3` cover, cover image zooms `scale(1.06)` on card hover
- Icon chips / circular badges: `border-radius:50%`, sized 26–42px depending on context (cart/wish icons = 42px, step numbers = 26px)
- Status badges (`.bc-badge`, `.modal-soon`): pill (`border-radius:20px` or `7px`), gold gradient bg, uppercase, letter-spacing 0.05em

### Navigation
- `.nav`: sticky, `height:70px`, `var(--grad-navy)` background, `backdrop-filter:blur(12px)`, gold hairline + soft shadow underneath
- Active link: gold underline that scales in from `scaleX(0)` → `scaleX(1)` (`var(--ease-out-expo)`)
- Mobile: slide-in drawer (`.nav-mobile`, 78%/max 320px wide) triggered by `.nav-burger` hamburger, backdrop blur overlay

### Elevation & motion tokens (reuse, don't reinvent)
```css
--sh-sm / --sh-md / --sh-lg / --sh-xl   /* neutral elevation, Tailwind/Shadcn-style layered shadows */
--sh-gold / --sh-teal                    /* colored glow shadows for brand CTAs */
--glow-teal / --glow-gold                /* 3px focus rings */
--ease-premium: cubic-bezier(0.16,1,0.3,1)  /* default hover/press easing */
--ease-smooth:  cubic-bezier(0.4,0,0.2,1)
```
Hover convention: lift (`translateY(-2px to -3px)`) + shadow escalation, never scale-up on cards (only on icon/badge pop feedback).

### Border-radius scale
| Size | px | Use |
|---|---|---|
| sm | 7-10px | tags, small icon boxes |
| md | 11-13px | inputs, nav cta, steps bar |
| lg | 20px | cards, book covers |
| xl | 24px | modal |
| full | 50% / 30px+ | avatars, counters, pills |

---

## 5. Anti-Patterns (intentionally avoided)

- **No CSS framework, no Tailwind, no utility-class soup.** Hand-authored CSS with semantic class names only.
- **No build step / preprocessor.** No Sass, PostCSS, CSS-in-JS — what's written ships as-is.
- **No raw hex in new rules** — always go through a `var(--token)` (see §1 rule).
- **No arbitrary new breakpoints** — reuse the existing set (§3) instead of picking one-off pixel values.
- **No motion without a reduced-motion fallback.** Every animation/transition must degrade under:
  ```css
  @media (prefers-reduced-motion: reduce){ *{animation-duration:.001ms!important;transition-duration:.001ms!important} }
  ```
- **No scale-up hover on cards.** Cards lift (`translateY`), they don't grow — scale is reserved for icon/badge "pop" feedback (heart, counters).
- **No ES6+ JS syntax** (project-wide convention, not CSS, but affects inline styling hooks): vanilla ES5 (`var`, `function(){}`) for browser-compat consistency — don't introduce arrow functions/template literals into shared `.js` files.
- **No silent removal of existing visual features** (badges, footer payment icons, mobile nav, scroll-reveal) — per [KITOBMARKAZI.md §9](KITOBMARKAZI.md), removing/replacing an existing UI element requires explicit confirmation first.
- **No decorative-only dependencies** — no icon-font/component libraries; icons are inline emoji or hand-placed SVG/img.
- **No layout via floats or `!important` overuse** — flex/grid throughout; the few existing `!important`s are scoped, mobile-breakpoint overrides only (e.g. `.books-grid` at ≤600px), not a general pattern to extend.

---

## 6. Quick Reference — "when adding a new component"

1. Background → `var(--cream)` (page) or `var(--white)` (surface), never plain `#fff`/`#000`.
2. Heading → `var(--serif)`, weight 700-800. Body/UI → `var(--sans)`, weight 400-600.
3. Radius → pick from scale in §4, don't invent new values.
4. Shadow → pick from `--sh-*` tokens, don't hand-roll `box-shadow` values.
5. Hover → lift + shadow escalation using `var(--ease-premium)`.
6. Spacing → snap to `--sp-*` (8px grid).
7. New breakpoint needed? → check §3 list first.
8. Test with `prefers-reduced-motion: reduce` before shipping any new animation.
