# Tab Background Illustrations — Design Document

## Concept

Each tab has a unique **low-pixel illustration** anchored to the bottom of the screen. The illustrations sit behind all UI content at low opacity (15–20%), adding personality without interfering with usability. Colors are recolored per season using the app's existing palette.

---

## Tab Scenes

### 1. Home Storage — Italian Pantry Kitchen
**Mood**: Warm, cosy, rustic Italian cucina  
**Elements**:
- Open wooden shelves with labelled glass clip-top jars (flour, sugar, pasta, rice)
- Cloth bags tied with twine or metal clips hanging from a rail
- Braids of garlic and dried chili strands hanging from a beam/hook
- A terracotta tile countertop edge at the bottom
- A small olive oil bottle and a wooden spoon resting on the counter

**Seasonal tinting**:
| Season | Tint | Key changes |
|--------|------|-------------|
| Spring | Sage-teal wash | Fresh herb bundles added, light jar tones |
| Summer | Garden green | Basil pot on counter, brighter tiles |
| Autumn | Warm amber | Pumpkin or squash on shelf, warm terracotta |
| Winter | Cool slate-blue | Preserved jars more prominent, frost on window behind |

---

### 2. Items — Library / Study
**Mood**: Quiet, academic, cosy reading nook  
**Elements**:
- Tall wooden bookshelves with rows of spines (different heights and thicknesses)
- A few books stacked flat as risers
- A glass inkwell and a dip pen laid diagonally
- A rolled or folded paper scroll
- A small magnifying glass leaning against a shelf

**Seasonal tinting**:
| Season | Tint | Key changes |
|--------|------|-------------|
| Spring | Soft mint | Potted fern on a shelf, lighter wood tones |
| Summer | Warm green | Window light shaft, brighter paper tones |
| Autumn | Deep amber-brown | Candle on shelf, warm lamp glow, fallen leaf bookmark |
| Winter | Blue-grey | Frost on window, snow-white paper, dark wood |

---

### 3. Stores — Farmer's Market Stall
**Mood**: Outdoorsy, abundant, cheerful  
**Elements**:
- Candy-stripe awning at the top (red/white or seasonal color)
- Wooden crates and baskets overflowing with seasonal produce
- A hand-painted chalkboard price sign
- Artichokes, bread loaves, or a wheel of cheese on the counter
- A string of bare bulbs across the top (optional)

**Seasonal tinting**:
| Season | Tint | Key changes |
|--------|------|-------------|
| Spring | Soft pink/green | Asparagus, strawberries, pastel awning stripes |
| Summer | Vivid green/yellow | Tomatoes, corn, courgettes, bright awning |
| Autumn | Amber/orange | Pumpkins, squash, apples, root veg |
| Winter | Cool blue/white | Brussels sprouts, parsnips, dark stall wood, snowflakes on awning |

---

### 4. Shop — Home Desk / To-Do Nook
**Mood**: Productive but lived-in, familiar domestic chaos  
**Elements**:
- A spiral-bound notepad, open, with a short handwritten list
- Loose scraps of paper with scrawled notes
- A mug of coffee or tea (steam rising) in the corner
- A small potted succulent or trailing vine
- Pencils, a highlighter, and a biro scattered around
- A sticky note stuck crookedly to the corner

**Seasonal tinting**:
| Season | Tint | Key changes |
|--------|------|-------------|
| Spring | Mint/blush | Fresh flowers in a small vase, lighter notepad |
| Summer | Warm green | Iced drink instead of coffee, sunlight patch |
| Autumn | Warm cream/amber | Pumpkin spice latte mug, dried leaf on desk |
| Winter | Cool grey-blue | Hot cocoa mug, snow outside implied window |

---

### 5. Settings — Utility Closet / Laundry Room
**Mood**: Organised, domestic, slightly humorous  
**Elements**:
- A half-open closet door or cubby shelves
- Mop and broom leaning in a corner
- A laundry basket (wicker or plastic) with a cloth folded over the edge
- Cleaning spray bottles on a shelf
- A stack of neatly folded towels
- A hanging coat or apron on a hook

**Seasonal tinting**:
| Season | Tint | Key changes |
|--------|------|-------------|
| Spring | Fresh mint | Open window, spring cleaning feel, floral detergent label |
| Summer | Light green | Bright tiles, lighter palette |
| Autumn | Warm tan | Cosy wool blanket in basket, warm light |
| Winter | Soft blue-grey | Thick jumpers in basket, darker closet |

---

## Technical Implementation

### Asset format: SVG (strongly recommended)
- SVGs can have named fill colors replaced at render time via props
- No quality loss at any screen density
- File sizes stay small (< 20KB per illustration)
- Each illustration exports with a **5-color palette** that maps to season tokens

### Palette mapping (per illustration)
Each SVG uses exactly 5 named color roles:

| Role | Used for |
|------|----------|
| `bg` | Sky, wall, or ambient background fill |
| `primary` | Main structural element (shelf, awning, desk surface) |
| `secondary` | Secondary element (jar lids, produce, notepad) |
| `accent` | Pop detail (garlic braids, sticky note, price sign) |
| `shadow` | Depth and edge shading |

At render time the component swaps these 5 fills for the current season's palette tokens (e.g. `springColors.primary`, `springColors.accent`, etc.).

### Composition and positioning
```
┌─────────────────────────┐
│  Header / Page Title    │
│                         │
│  [UI content — cards,   │
│   lists, inputs]        │
│                         │
│                         │
│  ░░░░░░░░░░░░░░░░░░░░░  │  ← illustration starts ~60% down
│  ░░░ illustration  ░░░  │     position: absolute, bottom: 0
│  ░░░░░░░░░░░░░░░░░░░░░  │     opacity: 0.15–0.20
└─────────────────────────┘
```
- `position: 'absolute'`, `bottom: 0`, `left: 0`, `right: 0`
- `height`: 45–55% of screen height
- `opacity`: 0.15–0.20 (tweak per illustration — busier scenes go lower)
- `zIndex: 0` — behind all content which sits at `zIndex: 1`

### Component shape
```tsx
// components/TabBackground.tsx
<TabBackground tab="home-storage" />
```
- Reads `useSettingsStore().season` internally
- Renders the correct SVG with the correct palette swap
- Wrapped in `StyleSheet.absoluteFill` at low opacity

### Commissioning the art
**Brief for an artist / pixel art tool**:
- Style: **16×16 or 32×32 grid pixel art**, upscaled 4× for display (128px or 256px tile)
- Canvas: **390 × 260px** final export (full-width, bottom half of screen)
- Palette: **exactly 5 fills** (provide hex codes per season when commissioning)  
- Format: **SVG with named `id` attributes on each fill group** OR flat PNG if SVG pixel art is too complex
- Mood: charming, slightly whimsical, not cartoonish — think Stardew Valley aesthetics at low opacity

If going PNG route instead of SVG, export one spritesheet per season (4 seasons × 5 tabs = 20 PNGs) and reference by `[tab]-[season].png` filename convention.

---

## Colour reference per season

| Token | Spring | Summer | Autumn | Winter |
|-------|--------|--------|--------|--------|
| primary | `#7BBFA8` | `#6BA85C` | `#DA8359` | *(see theme.ts)* |
| accent | `#E8A0A0` | `#D4527A` | `#B84A3C` | *(see theme.ts)* |
| background | `#F5F8EE` | `#EFF8E8` | `#FCFAEE` | *(see theme.ts)* |
| cardBorder | `#D4E8CC` | `#B8D9A0` | `#D4B896` | *(see theme.ts)* |
| softShadow | `#D4E8CC` | `#C0E0A8` | `#E0CDB8` | *(see theme.ts)* |

---

## Phased rollout suggestion

1. **Phase 1** — Commission/generate illustrations for the two highest-traffic tabs first: **Shop** and **Home Storage**
2. **Phase 2** — Add **Items** and **Stores**
3. **Phase 3** — Add **Settings** (lowest traffic, lowest priority)
4. **Phase 4** — Add seasonal variants (start with Autumn as base, then derive Spring/Summer/Winter tints)
