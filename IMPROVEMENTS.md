# Super Shopper — Improvements Roadmap

Organized by impact vs effort. Each item is scoped to be workable as a standalone session.

---

## 🔴 Critical Bugs / Broken Features

### B1 — Item reorder doesn't persist
Items can be dragged up/down in home-storage but the `order_index` column doesn't exist yet.
**Fix:** Run migration in Supabase SQL editor:
```sql
ALTER TABLE items ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
```
No code changes needed — `useStorageStore.moveItem` already writes this column.

### B2 — Delete account silently fails
`useAuthStore.deleteAccount` calls `supabase.rpc('delete_user')` but the RPC doesn't exist in Supabase.
**Fix:** Create the `delete_user` SQL function in Supabase, or switch to direct row deletion with cascades.

### B3 — Duplicate items possible via Items tab
The Items tab add flow has no dedup check — only home-storage and store add flows run the `ilike` check before inserting.
**Fix:** Run same ilike dedup in `useItemStore.addItem`.

### B4 — Image upload failures are silent
`useItemStore` upload catch block is empty; users get no feedback if the Supabase Storage upload fails.
**Fix:** Surface error in `ItemDetailModal` with a snackbar.

---

## 🟠 High Impact, Relatively Quick

### Q1 — Quick-add to shopping list (skip qty dialog for qty=1)
**Problem:** Every checkbox tap forces a qty stepper dialog even when you just want 1.
**Fix:** Single tap = add qty 1 immediately, long-press = open qty dialog. Saves 2 taps per item per trip.
**Files:** `home-storage.tsx` — change `toggleItem` logic.

### Q2 — "Add to today's list" button in ItemDetailModal
**Problem:** No way to add an item to the shopping list from its detail view.
**Fix:** Add a cart-plus button in `ItemDetailModal` header. Call `useShoppingStore.addToList`.
**Files:** `components/ItemDetailModal.tsx`

### Q3 — Checked items move to bottom in shop mode
**Problem:** Checked items stay in place, making it hard to see what's left.
**Fix:** Automatically sort checked items to the bottom within each aisle section.
**Files:** `app/(tabs)/shop.tsx` — sort `item_store_locations` by checked status when rendering.

### Q4 — Collapsed sections auto-expand on search
**Problem:** Searching shows "0 results" for a section that's collapsed and has matches — confusing.
**Fix:** When search text is non-empty, treat all locations as expanded.
**Files:** `home-storage.tsx` — already partially done for subsections, needs to apply to parent too.

### Q5 — Sort preference persists across sessions
**Problem:** Sort order in Items tab resets every app restart.
**Fix:** Persist `sortOrder` in `useItemStore` via AsyncStorage (same pattern as `useSettingsStore`).
**Files:** `stores/useItemStore.ts`

### Q6 — Filter resets on tab navigation
**Problem:** Active filter chip (No Home / No Store) resets when switching tabs.
**Fix:** Store filter state in `useItemStore` (already in Zustand, just needs to not be local state).
**Files:** `app/(tabs)/items.tsx`

### Q7 — Delete item from within ItemDetailModal
**Problem:** Can't delete an item while viewing it — must close modal and find it in the list.
**Fix:** Add a delete (trash) icon button in the modal header.
**Files:** `components/ItemDetailModal.tsx`

### Q8 — "Add all to list" button per location
**Problem:** No bulk action — must tap every item individually per trip.
**Fix:** Add an "Add all" icon button in the location header that bulk-adds all unlisted items.
**Files:** `home-storage.tsx`

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

### M9 — Item count badge on Shop tab
**Problem:** No way to know how many items are on the list without switching to the Shop tab.
**Fix:** Show a badge count on the Shop tab icon using Expo Router's tab `tabBarBadge` option.
**Files:** `app/(tabs)/_layout.tsx`

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

### P5 — App version in Settings
Display version from `app.json` or `expo-constants` at the bottom of settings. Helps with bug reports.

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

