# Super Shopper — Next Ticket Batch

Covers remaining bugs, UX gaps, and architecture issues identified after the initial 33-ticket audit.

---

## 🟠 Bugs

### BUG-1 · `items.tsx` stale `today` across midnight · P1
**Description:** `const today = new Date().toISOString().split("T")[0]` on line 86 of `items.tsx` is a plain `const` inside the component body. The Items tab stays mounted in memory by the tab navigator, so if the device crosses midnight without a re-render, `today` is stale and `fetchShoppingList` fetches yesterday's list. `shop.tsx` and `home-storage.tsx` both already use `useState` + `useFocusEffect` — `items.tsx` never received this fix.
**File:** `app/(tabs)/items.tsx` line 86
**Fix:** Replace the bare `const today = ...` with `useState` initialised with `() => new Date().toISOString().split("T")[0]`, and add a `useFocusEffect(useCallback(...))` that refreshes it to the current date on each tab focus.

---

## 🟡 UX / UI

### UX-1 · No "Finish Trip" CTA at 100% shopping completion · P2
**Description:** Confetti fires and the progress bar shows "✓ All done!", but the only way to close out the trip is to scroll to the bottom "Clear X completed items" button. There is no prominent one-tap finish action at the moment of completion.
**File:** `app/(tabs)/shop.tsx`
**Fix:** When `checkedCount === total && total > 0`, replace the progress bar's label area with a bold "Finish Trip" `Button` that calls `clearCheckedItems()` inline, so the natural completion flow is a single tap directly below the progress bar.

---

### UX-2 · Item thumbnails absent from Shop and Home Storage rows · P2
**Description:** Items store `image_url` from barcode scan and FoodSearch. Only `items.tsx` and `ItemDetailModal` render them. Shopping list rows and home-storage item rows show no thumbnail, making it harder to visually confirm items while in-store.
**Files:** `app/(tabs)/shop.tsx` (ShopItem component), `app/(tabs)/home-storage.tsx` (StorageItem component)
**Fix:** Add a 32×32 (borderRadius 6) `Image` in the leading position of each row when `image_url` is non-null. Requires passing `image_url` through the row component props; both stores already include it on the list entry type.

---

### UX-3 · No search in Shop tab · P2
**Description:** With 20+ items on a shopping list, finding a specific one requires scrolling through all aisle sections. `items.tsx` already has a collapsible search bar pattern that filters the list in place.
**File:** `app/(tabs)/shop.tsx`
**Fix:** Add a search `TextInput` (collapsed by default, toggled with a search `IconButton` in the header) that filters `shoppingList` by `item_name` before the aisle grouping `useMemo` runs.

---

### UX-4 · Shop tab bar shows no unchecked item count badge · P3
**Description:** The shop tab icon gives no indication of how many unchecked items are waiting. Expo Router's `tabBarBadge` option can show a live count visible from any tab. The badge should clear when all items are checked or the list is empty.
**File:** `app/(tabs)/_layout.tsx`
**Fix:** Subscribe to `useShoppingStore` in the tab layout to derive `uncheckedCount`; pass it as `tabBarBadge={uncheckedCount > 0 ? uncheckedCount : undefined}` on the shop tab `Tabs.Screen`.

---

## ⚙️ Architecture / Quality

### ARCH-1 · No React error boundary · P2
**Description:** An uncaught render error (e.g. unexpected `null` from a Supabase schema change, or a reanimated exception) produces a blank white screen with no recovery path. There is no error boundary anywhere in the component tree.
**Fix:** Add an `ErrorBoundary` class component (React class component with `componentDidCatch`) wrapping the root layout in `app/_layout.tsx`. Should display a friendly "Something went wrong — tap to reload" screen with a button that calls `Updates.reloadAsync()` or falls back to `router.replace('/')`.

---

### ARCH-2 · Unit test coverage far below 80% (NFR-5.4.3) · P2
**Description:** Only `useShoppingStore` and `openFoodSearch` have tests. `useStorageStore`, `useStoreStore`, `useItemStore`, and `useAuthStore` have zero coverage. The requirement `NFR-5.4.3` specifies >80% automated test coverage.
**Fix:** Add test files for each of the four untested stores, covering: core mutations (add, update, remove), selector/derived state accuracy, and optimistic update + rollback paths where applicable. Use the existing `useShoppingStore` test as the pattern.

---

### ARCH-3 · Web keyboard shortcuts absent (UI-3.5.3) · P3
**Description:** `UI-3.5.3` in REQUIREMENTS.md lists keyboard shortcuts as a requirement for the web platform. Currently none are implemented.
**Fix:** Add a `useEffect` guarded by `Platform.OS === 'web'` in a shared hook (`hooks/useWebKeyboard.ts`) that registers a `keydown` listener. Minimum set:
- `Escape` — close any open dialog / modal
- `Enter` — confirm the currently active dialog (same as pressing the primary action button)
- `Space` — toggle the focused shopping list item's checked state
Call the hook from `app/(tabs)/shop.tsx` and from dialog-heavy screens.

---

*Total new tickets: 1 Bug, 3 UX, 3 Architecture — 7 tickets*
