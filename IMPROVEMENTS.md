# Super Shopper — Improvements Roadmap

Organized by impact vs effort. Each item is scoped to be workable as a standalone session.

---

## 🔴 Critical Bugs / Broken Features

### B1 — Item reorder doesn't persist ⏳ awaiting SQL migration
Code is complete. Run this in Supabase SQL editor to activate:
```sql
ALTER TABLE items ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
```

### B2 — Delete account silently fails
`useAuthStore.deleteAccount` calls `supabase.rpc('delete_user')` but the RPC doesn't exist in Supabase.
**Fix:** Create the `delete_user` SQL function in Supabase, or switch to direct row deletion with cascades.

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

### M1 — Onboarding flow for new users
**Problem:** New users land on an empty home-storage screen with no guidance.
**Fix:** First-launch modal (stored in AsyncStorage) that walks through: add a location → apply a template → add items → go shop. 3–4 step walkthrough.
**Files:** New `components/OnboardingModal.tsx`, `app/(tabs)/home-storage.tsx`

### M2 — Global search across all tabs
**Problem:** Each tab has its own isolated search. No way to find "Milk" across home-storage + store + items at once.
**Fix:** Search bar at the top of the Items tab already covers items. Extend results to show which location and which store aisle the item lives in.
**Files:** `app/(tabs)/items.tsx`, `stores/useItemStore.ts`

### M3 — Tag autocomplete / suggestions
**Problem:** Tags are free-form with no suggestions — easy to create "dairy", "Dairy", "DAIRY" as separate tags.
**Fix:** When typing a tag in `ItemDetailModal`, show a dropdown of existing tags the user has used before.
**Files:** `components/ItemDetailModal.tsx`, `stores/useItemStore.ts` (derive unique tags list)

### M4 — Item usage details in delete confirmation
**Problem:** Deleting an item just says the name. Users don't know it will remove it from 3 locations and 2 store aisles.
**Fix:** Show a count like "This will remove Milk from Fridge and 2 store aisles."
**Files:** `app/(tabs)/items.tsx`

### M5 — Undo for destructive actions
**Problem:** Delete location, delete item, clear checked — all irreversible with no undo.
**Fix:** Snackbar with an "Undo" button that re-inserts the deleted row within a 5-second window. Pattern: buffer the delete, show snackbar, execute only if not cancelled.
**Files:** `home-storage.tsx`, `app/(tabs)/items.tsx`, `app/(tabs)/shop.tsx`

### M6 — "System theme" option in settings
**Problem:** Dark mode is manual toggle only. Many users expect system-level auto-switching.
**Fix:** Add a third mode ("System") alongside Light/Dark. Use `useColorScheme()` from React Native when in system mode.
**Files:** `stores/useSettingsStore.ts`, `constants/theme.ts`, `app/(tabs)/settings.tsx`

### M7 — Shopping list history (past dates)
**Problem:** No way to see what was bought last week.
**Fix:** Add a "History" section in the Shop tab — a date picker or "past 7 days" accordion that loads prior `shopping_list` rows.
**Files:** `app/(tabs)/shop.tsx`, `stores/useShoppingStore.ts`

### M8 — Activate offline sync
**Problem:** `hooks/useOfflineSync.ts` and `lib/sync.ts` are fully written but never wired in. The app has zero offline support.
**Fix:** Activate `useOfflineSync()` in `_layout.tsx` (already imported but check if called), wire mutation queue for key actions.
**Files:** `app/_layout.tsx`, `hooks/useOfflineSync.ts`

### ~~M9 — Item count badge on Shop tab~~ ✅ Done
`tabBarBadge` on Shop tab shows unchecked item count. Updates reactively. Works on native (web doesn't render tab badges).

### M10 — Aisle "side" field — expose in UI
**Problem:** The `aisles` table has a `side` column (e.g., "Left", "Right", "Far wall") that shows in the aisle header but is never editable.
**Fix:** Add a "Side/Section" optional input when creating or editing an aisle.
**Files:** `app/(tabs)/stores.tsx`, `stores/useStoreStore.ts`

---

## 🟢 Larger Features / New Capabilities

### L1 — Shared Lists (family/household sharing)
**Problem:** The `shared_lists` table already exists in the DB schema, but the feature is dead UI in settings.
**Fix:**
- Add a `profiles` table (or use email lookup) to find another user
- Settings → Shared Lists → "Share with email" flow
- Shop tab shows shared list items merged (or toggled)
**Files:** New `stores/useShareStore.ts`, `app/(tabs)/settings.tsx`, `app/(tabs)/shop.tsx`

### L2 — Recurring / template shopping lists
**Problem:** Users shop the same items weekly but must re-add everything each trip.
**Fix:** "Save as template" button in shop tab. "Start from template" when creating a new shopping day. Stored as a JSON list locally or in a new `list_templates` table.
**Files:** New `stores/useListTemplateStore.ts`, `app/(tabs)/shop.tsx`

### L3 — Barcode scanner integration in add-item flows
**Problem:** `BarcodeScannerModal` component exists but is only connected to the Items tab standalone add flow, not to home-storage or store add flows.
**Fix:** Add a barcode icon button to all add-item modals. On scan, look up the barcode in OpenFoodFacts and pre-fill name/brand/quantity.
**Files:** `app/(tabs)/home-storage.tsx`, `app/(tabs)/stores.tsx`, `components/BarcodeScannerModal.tsx`

### L4 — Smart inventory depletion ("running low" alerts)
**Problem:** No proactive notifications — user only knows they need something when they physically check.
**Fix:** Items can have a "low stock" threshold. A badge or banner on Home Storage shows items marked low. Optional push notification via Expo Notifications.
**Files:** New `low_stock` field in DB, `stores/useStorageStore.ts`, `hooks/useNotifications.ts`

### L5 — Export shopping list
**Problem:** No way to share the list with someone who doesn't have the app (texting a family member, etc.).
**Fix:** "Share" button in shop tab that generates a plain text or image of the current list and opens the system share sheet via `expo-sharing`.
**Files:** `app/(tabs)/shop.tsx`

### L6 — User-created templates
**Problem:** Templates are hard-coded. Power users can't save their custom store layout as a reusable template.
**Fix:** "Save as Template" option when viewing a store or after setting up home storage. Saves to AsyncStorage (client-only is fine).
**Files:** `constants/templates.ts`, `stores/useTemplateStore.ts`, `app/(tabs)/stores.tsx`, `app/(tabs)/home-storage.tsx`

### L7 — No pagination / virtual list for large item catalogs
**Problem:** All items fetched on load. With 200+ items the UI will lag.
**Fix:** Paginate `fetchItems` with Supabase `.range()` or use a FlashList (virtualized) instead of ScrollView + map.
**Files:** `stores/useItemStore.ts`, `app/(tabs)/items.tsx`

---

## 🔵 Polish & Accessibility

### P1 — Haptic feedback on key actions
Add subtle haptics (check/uncheck, delete, reorder) using `expo-haptics`.

### P2 — Swipe-to-delete in home-storage item rows
`SwipeableRow` component already exists and is used in shop.tsx. Wire it up in home-storage too.

### P3 — Larger tap targets on icon buttons
Several `IconButton` rows have 3–4 buttons with size=18–20. On mobile these are very tight. Increase to size=22 with proper padding.

### P4 — Loading skeleton instead of spinner
Replace `ActivityIndicator` on initial loads with placeholder skeleton rows for a smoother perceived load time.

### ~~P5 — App version in Settings~~ ✅ Done
"Version 1.0.0" displayed below Sign Out button via `Constants.expoConfig?.version`.

### P6 — Empty state improvements
Several empty states are generic. Add context-specific tips:
- Home Storage empty → "Start by applying a template — it'll create Fridge, Pantry, and Freezer automatically"
- Shop empty → "Add items from Home Storage by tapping the checkbox next to any item"

---

## Priority Order Recommendation

**Do first (high ROI, low risk):**
B1 → Q1 → Q3 → Q2 → M9 → Q5

**Do next (UX polish that users will notice):**
Q4 → Q7 → Q8 → M5 → M3 → P2

**Bigger projects (when you want new features):**
L5 → M7 → L3 → L1 → M1

