# Super Shopper — Improvements Roadmap

Organized by impact vs effort. Each item is scoped to be workable as a standalone session.

---

## 🔴 Critical Bugs / Broken Features

### B1 — Item reorder doesn't persist ⏳ awaiting SQL migration
Code is complete. Run this in Supabase SQL editor to activate:
```sql
ALTER TABLE items ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
```

### ~~B2 — Delete account silently fails~~ ✅ Done
Replaced broken `supabase.rpc('delete_user')` with direct `Promise.all` deletes across user data tables then `signOut`.

### ~~B3 — Duplicate items possible via Items tab~~ ✅ Done
`useItemStore.addItem` now runs same `ilike` dedup before insert — returns existing item if found.

### ~~B4 — Image upload failures are silent~~ ✅ Done
`uploadItemImage` returns `boolean`; `ItemDetailModal` shows a snackbar on upload failure.

---

## 🟠 High Impact, Relatively Quick

### ~~Q1 — Quick-add to shopping list~~ ✅ Done
Single tap = qty 1 instantly. Long-press = qty dialog. Long-press rename also added pencil icons on all store/aisle/location/subsection headers.

### ~~Q2 — "Add to today's list" button in ItemDetailModal~~ ✅ Done
Cart-plus/cart-check icon in header toggles the item on/off today's shopping list.

### ~~Q3 — Checked items move to bottom in shop mode~~ ✅ Done
Sorted checked items to bottom within each aisle group (and general/no-store list) via secondary `.sort((a, b) => Number(a.checked) - Number(b.checked))` in `aisleGroups` useMemo.

### ~~Q4 — Collapsed sections auto-expand on search~~ ✅ Done (was already implemented)
Both parent and subsection expand when search has text (`expanded.has(id) || !!search.trim()`).

### ~~Q5 — Sort preference persists across sessions~~ ✅ Done
`sortOrder` persisted to AsyncStorage key `super-shopper:item-sort`, loaded in `app/_layout.tsx` on startup.

### ~~Q6 — Filter resets on tab navigation~~ ✅ Done
`filterMode` moved from local React state to `useItemStore` Zustand store — survives tab switches.

### ~~Q7 — Delete item from within ItemDetailModal~~ ✅ Done
Trash icon in header opens confirmation dialog before permanently deleting the item.

### ~~Q8 — "Add all to list" button per location~~ ✅ Done
`cart-arrow-down` icon in each location header bulk-adds all unlisted items; shows snackbar with count. Skips already-listed items.

---

## 🟡 Medium Impact, Moderate Work

### ~~M1 — Onboarding flow for new users~~ ✅ Done
`components/OnboardingModal.tsx` created — 3-step full-screen modal with animated dot indicators, Skip and "Get started!" buttons. Shown once on first launch (AsyncStorage key `super-shopper:onboarding-done`). Wired into `home-storage.tsx`.

### ~~M2 — Global search across all tabs~~ ✅ Done
Items tab search shows location context badges (🏠 home location, 🛒 store aisle) under each result when searching.

### ~~M3 — Tag autocomplete / suggestions~~ ✅ Done
Typing in the tag field shows matching previously-used tags as tappable chips. Derived from `getAllTags()` in `useItemStore`.

### ~~M4 — Item usage details in delete confirmation~~ ✅ Done
Delete dialog shows "Also removes it from: home storage and store aisles." based on item's location flags.

### ~~M5 — Undo for destructive actions~~ ✅ Done
Snackbar with "Undo" button on item removal and clear-checked in Shop tab. 5-second deferred execution.

### ~~M6 — "System theme" option in settings~~ ✅ Done
Light/Auto/Dark segmented buttons replace the binary switch. "Auto" follows OS via `useColorScheme()`. `themeMode` persisted to AsyncStorage.

### ~~M7 — Shopping list history (past dates)~~ ✅ Done
"Past 7 days" collapsible section at the bottom of the Shop tab. Each date row expands to show items (with strikethrough for checked). `fetchHistory` added to `useShoppingStore`.

### ~~M8 — Activate offline sync~~ ✅ Done
`useOfflineSync()` is already called in `app/_layout.tsx`. The offline banner and sync queue (`lib/sync.ts`, `lib/storage.ts`) are fully wired up — no code changes needed.

### ~~M9 — Item count badge on Shop tab~~ ✅ Done
`tabBarBadge` on Shop tab shows unchecked item count. Updates reactively. Works on native (web doesn't render tab badges).

### ~~M10 — Aisle "side" field — expose in UI~~ ✅ Done
"Side / Section (optional)" text input added to the Rename Aisle dialog. `updateAisle` in `useStoreStore` now accepts an optional `side` parameter and persists it to DB.

---

## 🟢 Larger Features / New Capabilities

### L1 — Shared Lists (family/household sharing)
**Problem:** The `shared_lists` table already exists in the DB schema, but the feature is dead UI in settings.
**Fix:**
- Add a `profiles` table (or use email lookup) to find another user
- Settings → Shared Lists → "Share with email" flow
- Shop tab shows shared list items merged (or toggled)
**Files:** New `stores/useShareStore.ts`, `app/(tabs)/settings.tsx`, `app/(tabs)/shop.tsx`

### ~~L2 — Recurring / template shopping lists~~ ✅ Done
Bookmark icon in Shop header opens save/load menu. Templates stored in AsyncStorage via `useListTemplateStore`. Save current list as a named template; load it back to bulk-add items on future trips.

### ~~L3 — Barcode scanner integration in add-item flows~~ ✅ Done
Barcode icon added to the Add Item sheet in both Home Storage and Stores tabs. On scan, looks up OpenFoodFacts and pre-fills item name. Reuses existing `BarcodeScannerModal`.

### L4 — Smart inventory depletion ("running low" alerts)
**Problem:** No proactive notifications — user only knows they need something when they physically check.
**Fix:** Items can have a "low stock" threshold. A badge or banner on Home Storage shows items marked low. Optional push notification via Expo Notifications.
**Files:** New `low_stock` field in DB, `stores/useStorageStore.ts`, `hooks/useNotifications.ts`

### ~~L5 — Export shopping list~~ ✅ Done
Share icon in Shop header (visible when list is non-empty) opens the system share sheet with a plain-text shopping list via React Native `Share` API.

### L6 — User-created templates
**Problem:** Templates are hard-coded. Power users can't save their custom store layout as a reusable template.
**Fix:** "Save as Template" option when viewing a store or after setting up home storage. Saves to AsyncStorage (client-only is fine).
**Files:** `constants/templates.ts`, `stores/useTemplateStore.ts`, `app/(tabs)/stores.tsx`, `app/(tabs)/home-storage.tsx`

### ~~L7 — No pagination / virtual list for large item catalogs~~ ✅ Done
Items tab now uses `FlatList` instead of `ScrollView+map`, providing native virtualization for large catalogs without changing the fetch logic.

---

## 🔵 Polish & Accessibility

### ~~P1 — Haptic feedback on key actions~~ ✅ Done
`expo-haptics` installed. `Haptics.impactAsync(Light)` fires on item toggle in home-storage and shop tab.

### ~~P2 — Swipe-to-delete in home-storage item rows~~ ✅ Done
`AnimatedItemRow` wrapped in `SwipeableRow` — swipe left reveals red delete action. Delete button also kept for web usability.

### ~~P3 — Larger tap targets on icon buttons~~ ✅ Done
All `size={18}` and `size={20}` `IconButton` instances across the 4 tab screens updated to `size={22}`.

### ~~P4 — Loading skeleton instead of spinner~~ ✅ Done
`components/SkeletonRow.tsx` with pulsing animation replaces `ActivityIndicator` on initial load in home-storage, items, and shop.

### ~~P5 — App version in Settings~~ ✅ Done
"Version 1.0.0" displayed below Sign Out button via `Constants.expoConfig?.version`.

### ~~P6 — Empty state improvements~~ ✅ Done
Home Storage and Shop empty states updated with context-specific tips referencing templates and the Home tab workflow.

---

## Priority Order Recommendation

**Do first (high ROI, low risk):**
B1 → Q1 → Q3 → Q2 → M9 → Q5

**Do next (UX polish that users will notice):**
Q4 → Q7 → Q8 → M5 → M3 → P2

**Bigger projects (when you want new features):**
L5 → M7 → L3 → L1 → M1

