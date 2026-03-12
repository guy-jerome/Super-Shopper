# Visual Improvement Plan — Super Shopper

## Guiding Principles

- **Functionality first**: Checkboxes stay as distinct Paper `Checkbox` components. We dress the *row around them*, not the checkbox itself.
- **Season-native**: Every visual element should feel like it *belongs* to that season, not just recolored.
- **Additive layers**: Background → Cards → Headers → Dividers → Accents. Each layer can be built and shipped independently.
- **Web-safe**: SVG/CSS tricks for web; graceful no-ops on native (already established pattern via `getTextureStyle`).
- **No jank**: No JS-thread animations, no heavy images, no blocking renders.

---

## Season Identities (The "What It Feels Like")

| Season | Mood | Physical Object | Color Anchor |
|---|---|---|---|
| **Spring** | Fresh, hopeful, garden-ready | Seed catalog / gardener's notebook | Sage green + blush pink + honey yellow |
| **Summer** | Abundant, warm, market-day energy | Chalkboard market sign + woven basket | Raspberry + deep garden green + chalk white |
| **Autumn** | Cozy, thoughtful, planning-desk | Sticky note planner + open book | Warm amber + espresso brown + apple red |
| **Winter** | Snug, quiet, fireside | Notepad in your lap by the fire | Midnight navy + firelight orange + cream |

---

## Phase 1 — Color Palette Refinements

The existing palettes are close but missing a few punchy accent colors. Add these keys to `Colors` and each season palette:

```
accent      — a bold pop color for decorative elements (not UI chrome)
accentLight — a pale tint of accent for backgrounds/badges
cardBg      — the item card background (distinct from surface)
cardBorder  — subtle card border/shadow color
divider     — decorative divider color
stripe      — the left-edge accent bar on item rows
```

### Proposed values

**Spring**
- `accent`: `#E8A0A0` — soft poppy red
- `accentLight`: `#FBE8E8` — blush wash
- `cardBg`: `#FEFEFE` — crisp white
- `cardBorder`: `#D4E8CC` — pale sage
- `divider`: `#C8DFC0` — sage vine
- `stripe`: `#84CCAA` — garden mint
- **Palette fix**: `background` → `#F5F8EE` (softer sage-white, less yellow); `primary` → `#7BBFA8` (warmer sage-teal)

**Summer**
- `accent`: `#D4527A` — raspberry
- `accentLight`: `#FBE8EF` — blush wash
- `cardBg`: `#FAFDF5` — near-white with green breath
- `cardBorder`: `#B8D9A0` — light garden
- `divider`: `#8BC47A` — garden green
- `stripe`: `#D4527A` — raspberry pop
- **Palette fix**: `background` → `#EFF8E8` (less lime, more garden); add chalk-mode surface for chalkboard sections

**Autumn**
- `accent`: `#B84A3C` — apple red
- `accentLight`: `#F5E8E6` — apple blush
- `cardBg`: `#FEFAE8` — warm sticky-note cream
- `cardBorder`: `#D4B896` — kraft paper edge
- `divider`: `#C8A87A` — warm tan
- `stripe`: `#DA8359` — amber (reuse existing primary)
- **Palette fix**: add `espresso: '#3D2010'` for header text; `background` stays warm cream ✓

**Winter**
- `accent`: `#E8954A` — firelight orange
- `accentLight`: `#4A3020` — dark amber tint (for dark bg)
- `cardBg`: `#2C4560` — reuse existing surface
- `cardBorder`: `#3D5878` — slightly lighter navy
- `divider`: `#547792` — steel blue
- `stripe`: `#E8954A` — firelight orange pop on dark
- **Palette fix**: `primary` stays icy blue ✓; firelight orange is the secret weapon here

---

## Phase 2 — Seasonal Background Patterns

**Location**: Extend `getTextureStyle()` in `constants/theme.ts` to also return a `backgroundImage` tiled SVG pattern layered *under* the noise texture.

Each pattern is an inline SVG, tiled at ~120px, at ~4% opacity. These are purely decorative — invisible at a glance, give the screen depth on close inspection.

| Season | Pattern | SVG Elements |
|---|---|---|
| Spring | Scattered tiny bees + dots | `<circle>` spots, `<ellipse>` wings, `<line>` stingers |
| Summer | Tiny raspberry clusters | `<circle>` drupelets grouped in threes |
| Autumn | Tiny leaves + dots | `<path>` simple leaf shape, scattered |
| Winter | Snowflake grid | `<line>` 6-point snowflake, aligned grid |

**Implementation**: Add `getSeasonPattern(season: Season): string` returning a `data:image/svg+xml` URL, then layer it in `getTextureStyle` via `backgroundImage` as a comma-separated multi-layer value.

**Native**: No-op (same as current texture — already skipped on native).

---

## Phase 3 — Item Card Styling (The Biggest Visual Win)

Item rows are the most repeated element. Each season gets a distinct card personality while keeping the same functional structure: `[checkbox] [text block] [actions]`.

### Card anatomy (unchanged functionally)
```
┌──────────────────────────────────────────────────┐
│ ▌  ☑  Item Name                    [icon] [icon] │
│ ▌     brand · quantity                           │
└──────────────────────────────────────────────────┘
  ↑
  Left stripe (4px wide, full height, colored by location)
```

The `▌` left stripe is new — a `4px` wide `View` with `borderTopLeftRadius`/`borderBottomLeftRadius` matching the card radius, colored by `colors.stripe`. This visually anchors items without replacing the checkbox.

### Per-season card style

**Spring** — "Seed Packet"
- `cardBg`: crisp white
- Border: `1px solid colors.cardBorder` (pale sage)
- `borderRadius: 12`
- Left stripe: garden mint
- Slight `boxShadow: 0 1px 4px rgba(100,160,120,0.15)`

**Summer** — "Market Sticker"
- `cardBg`: near-white
- Border: `1.5px solid colors.cardBorder`
- `borderRadius: 8` (slightly more rectangular — label aesthetic)
- Left stripe: raspberry
- Faint `boxShadow: 0 2px 6px rgba(180,100,80,0.12)`

**Autumn** — "Sticky Note"
- `cardBg`: warm cream `#FEFAE8`
- No border, but `boxShadow: 2px 3px 8px rgba(80,40,10,0.18)` (sticky note drop shadow)
- `borderRadius: 4` (tighter corners, like a real sticky note)
- Left stripe: amber
- Top-right corner gets a tiny `triangle` fold effect (pure CSS `border` trick on web)

**Winter** — "Notepad Page"
- `cardBg`: `colors.surface` (dark blue card)
- Border: `1px solid colors.cardBorder`
- `borderRadius: 10`
- Left stripe: firelight orange — pops beautifully against dark bg
- Faint horizontal "ruled line" — a 1px `View` near the bottom of the card at 10% opacity (notepad aesthetic)

---

## Phase 4 — Section Headers & Dividers

Section headers (storage location names, aisle names) get seasonal character.

### Header treatment

**Spring**: Thin floral vine `divider` below header text. Achieve with a repeating SVG `backgroundImage` on a `View` (`height: 2`, `width: 100%`).

**Summer**: Header text on a subtle chalkboard-style chip — `backgroundColor: colors.primaryDark`, `color: '#F5F5DC'` (chalk white), `borderRadius: 6`, `paddingHorizontal: 10`. Like a market chalkboard tag.

**Autumn**: Header with a small washi-tape strip appearance — a `View` slightly rotated (`transform: [{ rotate: '-0.5deg' }]`) behind the text, `backgroundColor: colors.accentLight`. Gives the "tape holds this section" feel.

**Winter**: Header with a snowflake `·❄·` character on each side of the text, colored in `colors.divider`. Simple and effective.

### Dividers between sections

Replace flat `<Divider />` with a `<SeasonalDivider />` component using **react-native-svg**.

**Install**: `expo install react-native-svg` (Expo SDK package, Jest config already accounts for it).

The component is `components/SeasonalDivider.tsx`. It reads `useColors()` and `useSettingsStore(s => s.season)` internally, so call sites are just `<SeasonalDivider />` with no props.

On native it renders an `<Svg>` component normally. On web the same SVG renders via the react-native-svg web shim. No Platform branching needed.

---

#### Spring — Flowering Vine (viewBox="0 0 300 32")

A wavy vine with 3 five-petal flowers and 4 simple leaves. Vine sits at y≈22, amplitude ±7px, period 75px.

```xml
<Svg viewBox="0 0 300 32" width="100%" height={32}>

  {/* Wavy vine */}
  <Path
    d="M 0,22 C 18,15 37,29 75,22 C 113,15 132,29 150,22 C 168,15 187,29 225,22 C 263,15 282,29 300,22"
    stroke={colors.stripe}
    strokeWidth={1.5}
    fill="none"
    strokeLinecap="round"
  />

  {/* Leaf 1 — x=37, vine peak, angled up-left */}
  <G transform="translate(37,18) rotate(-50)">
    <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7}/>
    <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5}/>
  </G>

  {/* Leaf 2 — x=112, vine trough, angled down-right */}
  <G transform="translate(112,26) rotate(130)">
    <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7}/>
    <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5}/>
  </G>

  {/* Leaf 3 — x=187, vine peak */}
  <G transform="translate(187,18) rotate(-50)">
    <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7}/>
    <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5}/>
  </G>

  {/* Leaf 4 — x=262, vine trough */}
  <G transform="translate(262,26) rotate(130)">
    <Path d="M 0,0 C -2,-4 2,-9 0,-13 C -2,-9 2,-4 0,0 Z" fill={colors.stripe} opacity={0.7}/>
    <Line x1={0} y1={0} x2={0} y2={-13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.5}/>
  </G>

  {/* Flower 1 — x=75 (blush pink) */}
  <G transform="translate(75,20)">
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(0)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(72)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(144)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(216)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(288)" />
    <Circle r={2.8} fill="#F5C040" />
  </G>

  {/* Flower 2 — x=150 (softer rose, offset rotation) */}
  <G transform="translate(150,20)">
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(36)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(108)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(180)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(252)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#FBBDD4" transform="rotate(324)" />
    <Circle r={2.8} fill="#F5C040" />
  </G>

  {/* Flower 3 — x=225 (blush pink, back to 0° offset) */}
  <G transform="translate(225,20)">
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(0)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(72)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(144)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(216)" />
    <Ellipse cx={0} cy={-5} rx={2} ry={3.5} fill="#F0B8C0" transform="rotate(288)" />
    <Circle r={2.8} fill="#F5C040" />
  </G>

</Svg>
```

---

#### Summer — Raspberry Branch (viewBox="0 0 300 34")

A curved branch with 3 raspberry clusters (7 drupelets each) and 2 simple leaves. Each drupelet gets a small white highlight dot.

```xml
<Svg viewBox="0 0 300 34" width="100%" height={34}>

  {/* Branch */}
  <Path
    d="M 0,26 C 50,23 80,21 120,23 C 160,25 180,21 220,23 C 250,25 270,23 300,23"
    stroke="#7A5230"
    strokeWidth={1.2}
    fill="none"
    strokeLinecap="round"
  />

  {/* Stem to raspberry 1 */}
  <Line x1={65} y1={23} x2={65} y2={15} stroke="#7A5230" strokeWidth={1} />

  {/* Raspberry cluster 1 at (65, 11) — center + 6 ring drupelets */}
  <G transform="translate(65,11)">
    <Circle cx={0}    cy={0}     r={2.5} fill="#C84B6B"/>
    <Circle cx={0}    cy={-3.5}  r={2.5} fill="#D4527A"/>
    <Circle cx={3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    <Circle cx={3.03} cy={1.75}  r={2.5} fill="#D4527A"/>
    <Circle cx={0}    cy={3.5}   r={2.5} fill="#C84B6B"/>
    <Circle cx={-3.03} cy={1.75} r={2.5} fill="#D4527A"/>
    <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    {/* Highlights */}
    <Circle cx={-0.8} cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)"/>
    <Circle cx={2.2}  cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)"/>
    <Circle cx={-0.8} cy={-0.8}  r={0.7} fill="rgba(255,255,255,0.4)"/>
  </G>

  {/* Leaf near x=95 */}
  <Path
    d="M 95,23 C 92,17 100,13 102,18 C 99,22 95,23 95,23 Z"
    fill={colors.primaryDark}
    opacity={0.85}
  />
  <Line x1={95} y1={23} x2={103} y2={13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.6}/>

  {/* Stem to raspberry 2 */}
  <Line x1={155} y1={22} x2={155} y2={14} stroke="#7A5230" strokeWidth={1} />

  {/* Raspberry cluster 2 at (155, 10) */}
  <G transform="translate(155,10)">
    <Circle cx={0}    cy={0}     r={2.5} fill="#C84B6B"/>
    <Circle cx={0}    cy={-3.5}  r={2.5} fill="#D4527A"/>
    <Circle cx={3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    <Circle cx={3.03} cy={1.75}  r={2.5} fill="#D4527A"/>
    <Circle cx={0}    cy={3.5}   r={2.5} fill="#C84B6B"/>
    <Circle cx={-3.03} cy={1.75} r={2.5} fill="#D4527A"/>
    <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    <Circle cx={-0.8} cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)"/>
    <Circle cx={2.2}  cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)"/>
  </G>

  {/* Leaf near x=185 */}
  <Path
    d="M 185,23 C 183,17 191,13 193,18 C 190,22 185,23 185,23 Z"
    fill={colors.primaryDark}
    opacity={0.85}
  />
  <Line x1={185} y1={23} x2={193} y2={13} stroke={colors.primaryDark} strokeWidth={0.6} opacity={0.6}/>

  {/* Stem to raspberry 3 */}
  <Line x1={245} y1={23} x2={245} y2={15} stroke="#7A5230" strokeWidth={1} />

  {/* Raspberry cluster 3 at (245, 11) */}
  <G transform="translate(245,11)">
    <Circle cx={0}    cy={0}     r={2.5} fill="#C84B6B"/>
    <Circle cx={0}    cy={-3.5}  r={2.5} fill="#D4527A"/>
    <Circle cx={3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    <Circle cx={3.03} cy={1.75}  r={2.5} fill="#D4527A"/>
    <Circle cx={0}    cy={3.5}   r={2.5} fill="#C84B6B"/>
    <Circle cx={-3.03} cy={1.75} r={2.5} fill="#D4527A"/>
    <Circle cx={-3.03} cy={-1.75} r={2.5} fill="#C84B6B"/>
    <Circle cx={-0.8} cy={-4.2}  r={0.7} fill="rgba(255,255,255,0.55)"/>
    <Circle cx={2.2}  cy={-2.5}  r={0.7} fill="rgba(255,255,255,0.45)"/>
  </G>

</Svg>
```

---

#### Autumn — Maple Leaves on Twig (viewBox="0 0 300 38")

A thin horizontal twig with 3 maple leaves at slightly different rotations and heights, like they've just landed. Maple leaf shape uses a simplified 10-point star path with a stem.

The maple leaf path (centered at origin, ~26px tall including stem):
```
M 0,-13
L 1.5,-9   C 3,-10 5,-11 5,-11   L 3.5,-7
C 5,-7 9,-5 9,-5               L 6,-3
C 8,-1 11,1 11,1               L 7,1
C 7,4 5,5 3,5                  L 0,9
L -3,5     C -5,5 -7,4 -7,1    L -11,1
C -11,1 -8,-1 -6,-3            L -9,-5
C -9,-5 -5,-7 -3.5,-7          L -5,-11
C -5,-11 -3,-10 -1.5,-9        Z
M 0,9 L 0,13
```

```xml
<Svg viewBox="0 0 300 38" width="100%" height={38}>

  {/* Twig */}
  <Path
    d="M 20,26 C 80,23 140,25 180,24 C 220,23 260,25 280,25"
    stroke="#7A4A20"
    strokeWidth={1.3}
    fill="none"
    strokeLinecap="round"
  />

  {/* Small twig branches up to each leaf */}
  <Line x1={70}  y1={24} x2={68}  y2={17} stroke="#7A4A20" strokeWidth={0.9}/>
  <Line x1={150} y1={24} x2={152} y2={16} stroke="#7A4A20" strokeWidth={0.9}/>
  <Line x1={230} y1={24} x2={228} y2={17} stroke="#7A4A20" strokeWidth={0.9}/>

  {/* Leaf 1 — amber, slight left tilt, attached at x=68, y=17 */}
  <G transform="translate(68,17) rotate(-8)">
    <Path
      d="M 0,-11 L 1.2,-7.5 C 2.5,-8.5 4,-9 4,-9 L 3,-5.5 C 4.5,-5.5 7.5,-4 7.5,-4 L 5,-2.5 C 7,0 9,2 9,2 L 6,1.5 C 5.5,3.5 4,4.5 2.5,4.5 L 0,8 L -2.5,4.5 C -4,4.5 -5.5,3.5 -6,1.5 L -9,2 C -9,2 -7,0 -5,-2.5 L -7.5,-4 C -7.5,-4 -4.5,-5.5 -3,-5.5 L -4,-9 C -4,-9 -2.5,-8.5 -1.2,-7.5 Z M 0,8 L 0,11"
      fill="#DA8359"
      stroke="#C06A40"
      strokeWidth={0.4}
    />
  </G>

  {/* Leaf 2 — apple red, slight right tilt */}
  <G transform="translate(152,16) rotate(6)">
    <Path
      d="M 0,-11 L 1.2,-7.5 C 2.5,-8.5 4,-9 4,-9 L 3,-5.5 C 4.5,-5.5 7.5,-4 7.5,-4 L 5,-2.5 C 7,0 9,2 9,2 L 6,1.5 C 5.5,3.5 4,4.5 2.5,4.5 L 0,8 L -2.5,4.5 C -4,4.5 -5.5,3.5 -6,1.5 L -9,2 C -9,2 -7,0 -5,-2.5 L -7.5,-4 C -7.5,-4 -4.5,-5.5 -3,-5.5 L -4,-9 C -4,-9 -2.5,-8.5 -1.2,-7.5 Z M 0,8 L 0,11"
      fill="#B84A3C"
      stroke="#963C30"
      strokeWidth={0.4}
    />
  </G>

  {/* Leaf 3 — warm gold, moderate tilt left */}
  <G transform="translate(228,17) rotate(-14)">
    <Path
      d="M 0,-11 L 1.2,-7.5 C 2.5,-8.5 4,-9 4,-9 L 3,-5.5 C 4.5,-5.5 7.5,-4 7.5,-4 L 5,-2.5 C 7,0 9,2 9,2 L 6,1.5 C 5.5,3.5 4,4.5 2.5,4.5 L 0,8 L -2.5,4.5 C -4,4.5 -5.5,3.5 -6,1.5 L -9,2 C -9,2 -7,0 -5,-2.5 L -7.5,-4 C -7.5,-4 -4.5,-5.5 -3,-5.5 L -4,-9 C -4,-9 -2.5,-8.5 -1.2,-7.5 Z M 0,8 L 0,11"
      fill="#C89040"
      stroke="#A87030"
      strokeWidth={0.4}
    />
  </G>

</Svg>
```

---

#### Winter — Crystal Snowflake (viewBox="0 0 300 32")

A detailed 6-arm snowflake centered on the divider. Each arm has a main bar plus two sets of perpendicular crossbars at 40% and 70% of arm length. Flanked by dotted icy blue lines that fade toward the edges, and two smaller 4-arm diamond snowflakes.

```xml
<Svg viewBox="0 0 300 32" width="100%" height={32}>

  {/* Left dotted line — fades into snowflake */}
  <Line x1={8}   y1={16} x2={118} y2={16} stroke={colors.divider} strokeWidth={1} strokeDasharray="2,5" strokeLinecap="round"/>

  {/* Right dotted line */}
  <Line x1={182} y1={16} x2={292} y2={16} stroke={colors.divider} strokeWidth={1} strokeDasharray="2,5" strokeLinecap="round"/>

  {/* Small flanking diamond snowflake — left at x=100 */}
  <G transform="translate(100,16)" stroke={colors.primary} strokeWidth={1} strokeLinecap="round">
    <Line x1={0} y1={-5} x2={0}  y2={5}/>
    <Line x1={-5} y1={0} x2={5}  y2={0}/>
    <Line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5}/>
    <Line x1={3.5}  y1={-3.5} x2={-3.5} y2={3.5}/>
    <Circle cx={0} cy={0} r={1.2} fill={colors.primary} stroke="none"/>
  </G>

  {/* Small flanking diamond snowflake — right at x=200 */}
  <G transform="translate(200,16)" stroke={colors.primary} strokeWidth={1} strokeLinecap="round">
    <Line x1={0} y1={-5} x2={0}  y2={5}/>
    <Line x1={-5} y1={0} x2={5}  y2={0}/>
    <Line x1={-3.5} y1={-3.5} x2={3.5} y2={3.5}/>
    <Line x1={3.5}  y1={-3.5} x2={-3.5} y2={3.5}/>
    <Circle cx={0} cy={0} r={1.2} fill={colors.primary} stroke="none"/>
  </G>

  {/* Main snowflake at x=150 — 6-arm crystal */}
  <G transform="translate(150,16)" stroke={colors.primary} strokeLinecap="round">

    {/* 6 main arms (one per 60°) */}
    {[0, 60, 120, 180, 240, 300].map(angle => (
      <G key={angle} transform={`rotate(${angle})`}>
        {/* Main arm */}
        <Line x1={0} y1={-13} x2={0} y2={13} strokeWidth={1.6}/>
        {/* Crossbar at 40% (y=±5) */}
        <Line x1={-3.5} y1={-5} x2={3.5} y2={-5} strokeWidth={1}/>
        <Line x1={-3.5} y1={5}  x2={3.5} y2={5}  strokeWidth={1}/>
        {/* Crossbar at 70% (y=±9) */}
        <Line x1={-2} y1={-9} x2={2} y2={-9} strokeWidth={0.9}/>
        <Line x1={-2} y1={9}  x2={2} y2={9}  strokeWidth={0.9}/>
        {/* Tip dot */}
        <Circle cx={0} cy={-13} r={1.2} fill={colors.primary} stroke="none"/>
        <Circle cx={0} cy={13}  r={1.2} fill={colors.primary} stroke="none"/>
      </G>
    ))}

    {/* Center hex */}
    <Circle cx={0} cy={0} r={2.5} fill={colors.primary} stroke="none"/>
    <Circle cx={0} cy={0} r={1.2} fill={colors.background} stroke="none"/>

  </G>

</Svg>
```

> **Note**: The `{[0,60,...].map(...)}` in the snowflake uses JSX map — in the actual component file this works fine since it's a `.tsx` file. react-native-svg supports all standard SVG transform strings.

---

## Phase 5 — PageHeader Enhancements

`PageHeader` already has an accent stripe + curved shelf edge. Layer on:

1. **Seasonal icon in the header background** — a larger (60px), low-opacity (8%) seasonal icon `MaterialCommunityIcons` in the far right of the header area, `pointerEvents: none`, `position: absolute`. Per tab AND per season.

2. **Handwritten font option for title** — add `titleFont?: 'display' | 'handwritten'` prop. When `handwritten`, use `Caveat_700Bold` (add via `@expo-google-fonts/caveat`) for the title only. Use `handwritten` on home-storage and shop tabs for maximum charm.

3. **Accent stripe upgrade** — increase from `3px` to `5px`. Add a second stripe at `2px` in `colors.accentLight` directly below it. Creates a double-rule effect like a notebook margin.

### Per-tab header icon (seasonal)

| Tab | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| Home Storage | `flower` | `basket` | `cupboard` | `fire` |
| Items | `bee` | `notebook` | `book-open` | `yarn` |
| Stores | `store` | `cart` | `map-marker` | `snowflake` |
| Shop | `clipboard-list` | `bag-personal` | `format-list-checkbox` | `gift` |
| Settings | `ladybug` | `leaf` | `coffee` | `cat` |

---

## Phase 6 — Tab Bar Seasonal Personality

The `FloatingTabBar` already has a frosted glass look. Enhance:

1. **Active tab pill** — currently a solid color. Make it the `colors.accent` with slight transparency (`rgba(accent, 0.2)`), and the active icon in `colors.accent`.

2. **Seasonal tab bar border** — add a `1px` top border in `colors.divider` at 30% opacity. Subtle frame.

3. **Winter special** — the tab bar background becomes `rgba(30,42,60,0.92)` (deeper navy) with icy blue active pill. Already close — just tighten the values.

---

## Phase 7 — Empty State Enhancements

`EmptyState` already has an icon blob circle. Add seasonal flavor text and icon per tab:

| Tab | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|
| Home Storage | "Your shelves are bare — time to plant some groceries!" | "Basket's empty — let's fill it!" | "Nothing on the shelves yet" | "Cozy and empty in here" |
| Items | "No items yet — start your collection" | "A blank slate — what do you need?" | "Open a fresh page" | "Nothing in the basket yet" |
| Stores | "No stores yet — add your favourite market" | "No market set up yet" | "Add your shops here" | "No stores mapped yet" |
| Shop | "Nothing on the list — enjoy the freedom!" | "List is clear — you're all set!" | "List is blank — what do you need?" | "Nothing to fetch — stay warm!" |

---

## Phase 8 — Shop Tab Special Treatment

The shop tab is the most-used functional screen. It gets extra love:

1. **Aisle group headers** styled as the seasonal section header (Phase 4).

2. **Checked item rows** — already at `opacity: 0.65`. Add a CSS `text-decoration: line-through` on web (achieved via `textDecorationLine: 'line-through'` on the Text style). The strikethrough makes the list feel satisfying and physical.

3. **Progress bar seasonal colors** — the existing `ShoppingProgress` bar fill uses `colors.primary`. Change to `colors.accent` so it pops.

4. **Notes section** — give the notes `TextInput` a slight cream background (`colors.cardBg`) with a dashed border (`borderStyle: 'dashed', borderColor: colors.divider`), like a sticky note.

---

## Build Order (Recommended)

| Step | What | Impact | Effort |
|---|---|---|---|
| 1 | Palette refinements (Phase 1) | Unlocks everything else | Low |
| 2 | Item card left stripe + seasonal card style (Phase 3) | Biggest visual change | Medium |
| 3 | Seasonal background pattern (Phase 2) | Mood setter | Low |
| 4 | SeasonalDivider component (Phase 4) | Polish | Low |
| 5 | Section header treatments (Phase 4) | Character | Medium |
| 6 | PageHeader handwritten font + double stripe (Phase 5) | Charm | Low |
| 7 | PageHeader seasonal background icon (Phase 5) | Depth | Low |
| 8 | Strikethrough + notes style in shop (Phase 8) | Functional delight | Low |
| 9 | Empty state copy (Phase 7) | Personality | Very Low |
| 10 | Tab bar accent pill (Phase 6) | Polish | Low |
| 11 | Caveat font for headers (Phase 5) | Handwritten charm | Low (npm install) |

---

## What We Are NOT Doing (and Why)

- **Replacing checkboxes with icons** — breaks accessibility, legibility, and muscle memory
- **Heavy background images / photos** — too slow, too large, fights with text
- **Per-item custom illustrations** — maintenance nightmare
- **Animations on background patterns** — unnecessary jank risk
- **Dark/light mode toggle** — seasons handle this; winter IS the dark theme
