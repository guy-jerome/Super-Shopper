# Super Shopper — Cozy Style Redesign

**Theme:** Cozy shopping planning. Think Sunday morning grocery list on a yellow legal pad, house plants on the windowsill, warm tea, linen napkins. Pastel and earthy without being childish.

---

## ~~🎨 S0 — Establish Unified Color Palette~~ ✅ Done

Replace the current generic green palette in `constants/theme.ts` with a cohesive cozy system.

### Light mode
| Token | Hex | Usage |
|---|---|---|
| `cream` | `#FEFAE0` | App background (warm parchment) |
| `paper` | `#FFFEF7` | Card / surface backgrounds |
| `butter` | `#FFF3B0` | Notepad yellow (Shop tab bg) |
| `butterDark` | `#F0E060` | Notepad ruled lines, dividers |
| `sage` | `#7BA05B` | Primary — house plant green |
| `sageDark` | `#4E7C3A` | Primary pressed / active |
| `sageLight` | `#D4E8C2` | Chip backgrounds, badges |
| `dustyRose` | `#E8BFB8` | Accent / warning highlight |
| `lavender` | `#C8BEE8` | Tag chips, secondary accent |
| `warmBrown` | `#4A3728` | Primary text (pencil on paper) |
| `warmGrey` | `#8C7B6E` | Secondary text |
| `softShadow` | `#E8DDD0` | Borders, dividers |
| `error` | `#C0524A` | Errors (muted terracotta) |
| `lowStock` | `#D4874A` | Running low (earthy amber) |

### Dark mode ("cozy evening")
| Token | Hex | Usage |
|---|---|---|
| Background | `#1E1A16` | Deep warm black |
| Surface | `#2A2420` | Slightly lighter warm card |
| Primary | `#8FC46A` | Brighter sage |
| Text | `#EDE4D8` | Warm off-white |
| TextLight | `#A09080` | Muted warm grey |

**Files:** `constants/theme.ts`

---

## ~~📓 S1 — Shop Tab: Yellow Legal Pad~~ ✅ Done

The most distinctive change. The shopping list should feel like writing on a yellow notepad.

### Visual treatments
- **ScrollView background:** butter yellow (`#FFF3B0`)
- **Item rows:** each row has a subtle ruled line underneath (like legal pad lines) using `borderBottomColor: butterDark`
- **Completed items:** ~~strikethrough~~ in a red-pen color (`#C0524A`) with the text faded — feels like crossing off with a red pen
- **Aisle headers:** "sticky note" style — slightly deeper yellow card (`#FFE680`) with a small drop shadow, sage green text and location pin icon
- **Notes section:** looks like a torn notepad header — cream background with a slightly ragged bottom edge (using a subtle border or SVG-like shadow)
- **Progress bar:** styled as a pencil filling up (earthy sage)
- **FAB "Add Item":** pencil icon (`pencil-plus`) instead of generic `+`
- **Jump bar pills:** round kraft-paper style chips

**Files:** `app/(tabs)/shop.tsx` (JSX + `createStyles`)

---

## ~~🌿 S2 — Home Storage Tab: Plant Shelf / Pantry~~ ✅ Done

The home inventory should feel like a cozy organized pantry with house-plant energy.

### Visual treatments
- **Location headers:** rounded card with a left border stripe in sage green (like a folder tab)
- **Item rows:** cream background, warm brown text
- **LOW stock badge:** replace the harsh amber `LOW` chip with a small leaf icon (`leaf`) in earthy amber, inline with the item name — subtler and cuter
- **Low stock banner:** soft dusty rose / amber background (`#FDE8C8`) instead of the current yellow — feels more like a gentle reminder than an alert
- **Add Location FAB:** `sprout` icon
- **Section expand/collapse chevrons:** animate smoothly (already may exist, just ensure they feel polished)
- **Empty state:** illustration suggestion — "Your pantry is empty! Add your first location." with a small potted plant icon

**Files:** `app/(tabs)/home-storage.tsx`

---

## ~~🗂️ S3 — Items Tab: Recipe Card Catalog~~ ✅ Done

The global item catalog should feel like a box of recipe index cards.

### Visual treatments
- **Item cards:** each item renders as a slightly elevated card (`elevation: 1`) with rounded corners (12px) instead of flat rows — feels like a card in a recipe box
- **Tag chips:** pastel-colored by tag content (hash the tag name to a pastel from a palette of 6: sage, lavender, dusty rose, butter, peach, mint)
- **Search bar:** pill-shaped with a warm cream background and a small magnifying glass in sage
- **Sort/filter chips:** kraft-paper style (warm beige with warm brown text)
- **Empty state:** "No items yet — add your first from the Home or Stores tabs." with a little index card icon
- **Skeleton rows:** use the butter/cream palette (currently grey, will feel warmer)

**Files:** `app/(tabs)/items.tsx`

---

## ~~🛍️ S4 — Stores Tab: Farmer's Market~~ ✅ Done

Store profiles should feel like little market stall cards.

### Visual treatments
- **Store cards / headers:** rounded card with a small awning-style accent bar at top in sage (`height: 4, borderRadius: 4, backgroundColor: sage`) — like a market stall canopy
- **Aisle chips:** each aisle chip uses a soft pastel background (alternating from the palette)
- **Active store header:** sage green background strip with cream text — feels like a chalkboard sign
- **Add Store FAB:** `storefront` icon (already close, maybe `shopping` or keep `store`)
- **Empty state:** "No stores yet — add your local grocery store!" with a small basket icon

**Files:** `app/(tabs)/stores.tsx`

---

## ~~⚙️ S5 — Settings Tab: Cozy Personal Space~~ ✅ Done

Settings should feel warm and personal, like a journal's first page.

### Visual treatments
- **Account card:** cream background with a soft sage left border stripe, avatar in sage green — like a name tag sticker
- **List items:** warm cream rows with soft separators (no harsh lines)
- **Sign Out button:** muted terracotta outline instead of harsh red
- **Version number:** styled like a rubber stamp — small, muted, slightly rotated feel (just via `fontStyle: 'italic'` and `letterSpacing`)
- **Section headers:** small uppercase sage green labels above groups (like journal section tabs)

**Files:** `app/(tabs)/settings.tsx`

---

## ~~🏷️ S6 — Tab Bar: Warm & Whimsical~~ ✅ Done

The tab bar currently looks generic. Make it feel like part of the cozy app.

### Visual treatments
- **Background:** warm cream (`#FEFAE0`) with a soft sage top border (1px)
- **Active icon color:** sage green
- **Inactive icon color:** warm grey
- **Icon swaps (optional):**
  - Home → `home-heart` (warmer)
  - Items → `notebook-outline` (catalog/recipe card)
  - Stores → `storefront-outline`
  - Shop → `note-text-outline` (notepad!)
  - Settings → `cog-outline` (keep)
- **Badges:** sage green background instead of red

**Files:** `app/(tabs)/_layout.tsx`, `constants/theme.ts`

---

## ~~🌐 S7 — Global Shape Language~~ ✅ Done

Soft, rounded, approachable everywhere.

- **Border radius:** standardize to `8` (small), `12` (medium cards), `20` (pills/chips), `24` (FABs, large cards)
- **Shadows:** warm-tinted shadows (`shadowColor: '#4A3728'`, low opacity) instead of black
- **Dialogs:** rounded corners (`borderRadius: 16`) — Paper dialogs may support `style` prop
- **Buttons:** more padding, rounder — feels chunky and friendly
- **Dividers:** use `softShadow` color instead of full grey — subtler

**Files:** `constants/theme.ts` (add `radius` constants), all tab screens

---

## ~~🌙 S8 — Dark Mode: Cozy Evening Palette~~ ✅ Done

Dark mode should feel like planning your shopping list by candlelight — warm darks, not cold blue-greys.

Current dark mode uses generic dark greys. Replace with:
- Background: deep warm espresso (`#1E1A16`)
- Surface: slightly lighter warm card (`#2C2520`)
- Primary: sage stays green but slightly brighter (`#8FC46A`)
- Text: warm off-white (`#EDE4D8`)
- Notepad yellow in dark mode: muted gold (`#4A3F20`) instead of bright yellow

**Files:** `constants/theme.ts` (darkColors)

---

## ✏️ Implementation Order

```
S0 (palette) → S7 (shape language) → S6 (tab bar) → S1 (shop notepad) → S2 (home) → S3 (items) → S4 (stores) → S5 (settings) → S8 (dark mode)
```

S0 and S7 are foundations — do them first and everything else follows naturally.

---

## Notes / Constraints

- All changes stay within React Native Paper + StyleSheet — no new dependencies needed
- Functionality must remain 100% intact — purely visual
- Dark mode must be tested for every change in S0–S7 before S8
- The `useColors()` hook in `constants/theme.ts` is the single source of truth — adding new tokens there makes them available everywhere
