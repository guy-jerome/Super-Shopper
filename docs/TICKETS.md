# Super Shopper — Actionable Issue Tickets

Generated from a full codebase + visual review. Organized by category and priority (P0–P3).

---

## 🔴 Security

### SEC-01 · deleteAccount leaves Supabase auth user intact · P0
**Description:** `useAuthStore.deleteAccount()` deletes all user rows from database tables but calls `supabase.auth.signOut()` instead of deleting the auth user. The auth account remains active — the user can still log back in, and if they sign up again with the same email it may fail or create a ghost account. This is also a GDPR compliance issue (right to erasure).  
**File:** `stores/useAuthStore.ts` lines 75–93  
**Fix:** Create a Supabase Edge Function with the service-role key to call `supabase.auth.admin.deleteUser(user.id)`, invoke it from the client after deleting DB rows.

---

### SEC-02 · No client-side email validation before auth API calls · P1
**Description:** `login.tsx` and `signup.tsx` only check that fields are non-empty before calling `signIn` / `signUp`. The `authSchema` Zod validator (which validates email format and password length ≥ 8) exists in `utils/validators.ts` but is never used on auth screens.  
**Files:** `app/auth/login.tsx`, `app/auth/signup.tsx`, `utils/validators.ts`  
**Fix:** Call `authSchema.safeParse({ email, password })` at the top of `handleLogin`/`handleSignUp`. Show field-level validation errors before making any network call.

---

### SEC-03 · Password minimum length inconsistency · P1
**Description:** `authSchema` requires passwords ≥ 8 characters, but `settings.tsx` `handleChangePassword` only checks `newPassword.length < 6`. A user could set a 6- or 7-character password via the Settings screen that the signup form would have rejected.  
**File:** `app/(tabs)/settings.tsx` line ~130  
**Fix:** Change the check to `newPassword.length < 8` (or import and reuse `authSchema.shape.password`).

---

### SEC-04 · shareWithEmail sends request without validating email format · P1
**Description:** `useShareStore.shareWithEmail(email)` makes a Supabase query with whatever string is passed, no format check. Provides no user feedback for obviously invalid inputs and wastes a network round-trip.  
**File:** `stores/useShareStore.ts`  
**Fix:** Add `z.string().email().safeParse(email)` check before the Supabase call; throw or return an error if invalid.

---

## 🟠 Bugs

### BUG-01 · Stale date if app stays open overnight · P1
**Description:** `today` is computed once at module import time in `home-storage.tsx`, `items.tsx`, and `components/ItemDetailModal.tsx` (`const today = new Date().toISOString().split("T")[0]`). If the app stays open across midnight, "today's" shopping list points to yesterday.  
**Files:** `app/(tabs)/home-storage.tsx`, `app/(tabs)/items.tsx`, `components/ItemDetailModal.tsx`  
**Fix:** Move `today` computation inside the component function or derive it in a `useMemo` / `useEffect` that refreshes on focus (`useFocusEffect`).

---

### BUG-02 · Offline sync only re-fetches shopping list, not storage locations or items · P1
**Description:** `useOfflineSync` calls only `fetchShoppingList` after reconnecting. If the user adds or removes storage locations or items while offline (queued via `lib/sync.ts`), the UI state for Home Storage and the Items catalog stays stale until the next full app restart.  
**File:** `hooks/useOfflineSync.ts`  
**Fix:** After `processPendingChanges()`, also call `fetchLocations(user.id)` and `fetchItems(user.id)` so all three stores reconcile on reconnect.

---

### BUG-03 · Silent data loss in offline sync queue · P2
**Description:** `processPendingChanges` in `lib/sync.ts` has an empty `catch {}` block. Failed syncs are silently retried, but there is no cap on retries, no error surfacing, and no way for the user to know their changes didn't sync.  
**File:** `lib/sync.ts` lines 35–42  
**Fix:** At minimum, log failures. Better: add a `retry_count` field to `PendingChange`; after N failures surface a Snackbar warning. Consider capping retries and discarding stale changes (e.g. > 7 days old).

---

### BUG-04 · Home Storage subtitle describes the Shop tab · P2
**Description:** The `PageHeader` subtitle on Home Storage reads "Check items you need to buy", but that's the Shop tab's role. Home Storage is for tracking what you own and where it's stored.  
**File:** `app/(tabs)/home-storage.tsx` line 314  
**Fix:** Change to something like "Browse your pantry & fridge" or "What's in your home right now".

---

### BUG-05 · Dead `seasonIcon` variable in three tab screens · P2
**Description:** `home-storage.tsx`, `items.tsx`, and `stores.tsx` all compute `seasonIcon` via a ternary chain but never use it — `PageHeader` now takes a `tab` prop and determines its own icon. This leaks into the bundle as dead code.  
**Files:** `app/(tabs)/home-storage.tsx` ~line 87, `app/(tabs)/items.tsx` ~line 75, `app/(tabs)/stores.tsx` ~line 51  
**Fix:** Delete the three `const seasonIcon = ...` lines.

---

### BUG-06 · Clear checked items has no undo · P2
**Description:** In Shop tab, "Clear checked" permanently deletes all checked items from the list (calls `clearCheckedItems()` immediately from a confirm dialog action). The existing `undoSnackbar` infrastructure is in place but not wired to this action.  
**File:** `app/(tabs)/shop.tsx` ~line 680  
**Fix:** Use the existing `showUndo()` helper so "Clear checked" is reversible within 5 seconds, matching the existing removal UX.

---

### BUG-07 · No input validation on item/store/aisle names in dialogs · P2
**Description:** `itemSchema`, `locationSchema`, `storeSchema`, `aisleSchema` are defined in `utils/validators.ts` but dialogs in `home-storage.tsx`, `stores.tsx`, and `items.tsx` only check `!name.trim()` before inserting. Names > 100 chars, or names that are just whitespace after normalization, can still be submitted.  
**Fix:** Call the appropriate Zod schema's `.safeParse()` in each dialog `onPress`, show inline error text, and block submission on failure.

---

### BUG-08 · `confirmAddToList` in Home Storage sets same quantity regardless of existing entry · P2
**Description:** `confirmAddToList` at `home-storage.tsx` calls `addToList(user.id, qtyTarget.id, qty)` for both the "already on list" and "not on list" branches — the two code paths are identical. The intent was probably to call `updateQuantity` when an entry already exists.  
**File:** `app/(tabs)/home-storage.tsx` (inside `confirmAddToList`)  
**Fix:** When the item is already on the list, call `updateQuantity(existing.id, qty)` instead of a duplicate `addToList`.

---

## 🟡 UX / UI

### UX-01 · No OS-level share sheet for household invite code · P1
**Description:** When a household invite code is generated in Settings, it's displayed as a `Text` element. Users have to manually copy it; there's no "Share" button to use the native share sheet (WhatsApp, Messages, etc.).  
**File:** `app/(tabs)/settings.tsx` (inside `handleGenerateCode` result UI)  
**Fix:** Add a `Share` icon button next to the generated code that calls `Share.share({ message: code })` from React Native's built-in `Share` API.

---

### UX-02 · Shop progress bar reaches 100% with no celebration or follow-up action · P2
**Description:** Once the last item is checked off, the progress bar shows 100% but nothing happens. There is no completion state, no nudge to clear the list, no congratulations feedback.  
**File:** `app/(tabs)/shop.tsx`  
**Fix:** When `checkedCount === shoppingList.length && shoppingList.length > 0`, show a brief animated success state and offer a "Clear & finish trip" button.

---

### UX-03 · Store list has no reorder control · P2
**Description:** Store profiles appear in `created_at` order indefinitely. Users can't prioritize their most-used store. Aisles have `moveAisle` up/down, but stores don't.  
**File:** `app/(tabs)/stores.tsx`, `stores/useStoreStore.ts`  
**Fix:** Add `order_index` to `store_profiles` table (migration), expose `moveStore` up/down in the store store, and add reorder arrows to the stores list screen.

---

### UX-04 · Previous shopping history cannot be re-added to today's list · P2
**Description:** `fetchHistory` loads the last 7 days of shopping lists into `history` and the Shop tab has a history panel. However, tapping a historical item only views it — there's no "Add to today's list" action from history.  
**File:** `app/(tabs)/shop.tsx` (history panel)  
**Fix:** Add a "Re-add" icon button on each historical item that calls `addToList` for today's date.

---

### UX-05 · Barcode scanner only accessible from Stores tab · P2
**Description:** `BarcodeScannerModal` is imported in both `home-storage.tsx` and `stores.tsx` but only the Stores tab's add-item flow actually opens it. Home Storage has a state variable `showBarcodeScanner` but no visible trigger.  
**Files:** `app/(tabs)/home-storage.tsx`, `app/(tabs)/stores.tsx`  
**Fix:** Expose a barcode scan button in the Home Storage add-item dialog (next to the FoodSearch input), matching Stores tab behavior.

---

### UX-06 · Items tab and Home Storage show different subsets for "suggest existing" · P2
**Description:** The item suggestion filter in `home-storage.tsx` is `!i.hasHomeLocation` — items already in a storage location are excluded from add-item suggestions. This makes it impossible to add an item to a second location (e.g. "Milk" in both Fridge and Second Fridge).  
**File:** `app/(tabs)/home-storage.tsx` `itemSuggestions` computation  
**Fix:** Remove the `!i.hasHomeLocation` filter from suggestions; allow linking any catalog item to any location.

---

### UX-07 · No feedback when tapping "Add to list" for an item already on the list (Items tab) · P2
**Description:** `handleAddToList` in `items.tsx` silently returns if `isInList(item.id)`. The button still appears active (shows "Add to list" icon) but does nothing — no Snackbar, no visual state change.  
**File:** `app/(tabs)/items.tsx`  
**Fix:** Either grey out/disable the add button for items already on the list, or show a brief Snackbar "Already on today's list".

---

### UX-08 · Account initials derived from only first 2 email characters · P3
**Description:** `const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'` produces "AA" for "aaron@..." and "GO" for "google@...". It's better to show initials from the name, or realistically the first char of the local-part.  
**File:** `app/(tabs)/settings.tsx`  
**Fix:** Low priority. Could take first char of email local-part as initial: `email.split('@')[0].slice(0,1).toUpperCase()`. Better yet, add a display name field to `profiles` and derive initials from that.

---

### UX-09 · No "empty state" guidance when shop list has no store selected · P3
**Description:** With no active store, the shop list renders in a flat single section with no grouping. There's no hint explaining that selecting a store enables aisle-by-aisle organization.  
**File:** `app/(tabs)/shop.tsx`  
**Fix:** When `currentStore === null` and the list is non-empty, show a subtle inline banner: "Select a store to organize items by aisle."

---

### UX-10 · Settings "Change Password" dialog enforces weaker rule than stated · P3
**Description:** The on-screen label says "Password must be at least 6 characters" but the signup form enforces 8. Users who signed up via the standard flow have ≥ 8-char passwords and the consistency break is confusing. (Also linked to SEC-03.)  
**File:** `app/(tabs)/settings.tsx`  
**Fix:** Align both to 8 characters minimum and update the helper text in the dialog.

---

## 🟢 Feature Improvements

### FEAT-01 · Surface store templates discovery in Stores tab · P2
**Description:** `useStoreTemplateStore` (save/load user-created templates) and `STORE_TEMPLATES` (built-in templates) are fully implemented in `stores.tsx` but are buried behind a FAB sub-menu. New users won't find them.  
**Fix:** Add a visible "Start from template" card to the empty state in the Stores screen (when `stores.length === 0`), and expose a "Templates" chip or icon in the header when stores exist.

---

### FEAT-02 · Bulk "restock" flow from Low Stock badge · P2
**Description:** `useLowStockStore` tracks low-stock item IDs and drives the Home tab badge count. But clicking the badge (if possible) or seeing flagged items gives no "Add all low-stock items to shopping list" action.  
**Fix:** Add a "Restock all" button in the Home Storage screen when any items are flagged low-stock, which calls `addToList` for each flagged item.

---

### FEAT-03 · Invite code shareable via OS share sheet · P2
**Description:** (See UX-01 above — also a feature gap.) Extends to: the share-by-email flow is the only collaboration entry point. Adding native share sheet support for the invite code would significantly reduce friction for household invitations.

---

### FEAT-04 · "Add to today's list" from Item Detail modal · P3
**Description:** `ItemDetailModal` already checks `isOnList` and shows an "Add to list" / "Remove from list" toggle button. This is good — just making sure it's discoverable. Consider adding this button as a swipe action on the Items tab list rows as well.

---

### FEAT-05 · Export / print shopping list · P3
**Description:** No way to export the current shopping list to text, PDF, or share it as a message. Users shopping with a partner who doesn't have the app have no option.  
**Fix:** Add a share icon in the Shop tab header that serializes `shoppingList` to a plain text list and invokes the OS share sheet.

---

## ⚙️ Architecture / Performance

### ARCH-01 · `useHouseholdStore` casts entire Supabase client to `any` · P2
**Description:** `const db = supabase as any` at the top of `useHouseholdStore.ts` disables all TypeScript type checking for every household-related DB call. Errors in table names, column names, or return types will only surface at runtime.  
**File:** `stores/useHouseholdStore.ts`  
**Fix:** Add the household tables (`households`, `household_members`, `household_invites`) to `types/database.types.ts` and remove the `as any` cast.

---

### ARCH-02 · `processPendingChanges` has no version/conflict resolution for concurrent edits · P2
**Description:** The offline queue in `lib/sync.ts` processes changes in timestamp order with no optimistic locking. If a household member edits the same shopping list item online while another is offline, the last-write-wins replay could clobber data silently.  
**File:** `lib/sync.ts`  
**Fix:** For `UPDATE` operations, add a `WHERE updated_at = <expected>` condition (or use `updated_at` to apply only if server row hasn't changed since the change was queued). The existing `conflict-resolution.ts` utility may already have helpers for this.

---

### ARCH-03 · `fetchStores` orders by `created_at` with no `order_index` column · P2
**Description:** Store profiles have no `order_index` and are fetched `created_at ASC`. There's no user-reorderable sort. This is also noted in UX-03.  
**File:** `stores/useStoreStore.ts`  
**Fix:** Add a migration to add `order_index integer default 0` to `store_profiles`. Implement `moveStore` in `useStoreStore`.

---

### ARCH-04 · Multiple stores compute the same `seasonIcon` locally · P3
**Description:** `home-storage.tsx`, `items.tsx`, `stores.tsx`, and `settings.tsx` all contain the same 4-branch ternary for mapping `season → icon name`. It's copy-pasted in 4 places. (BUG-05 notes that 3 of these uses are also dead code.)  
**Fix:** Export a `seasonIconName(season: Season): string` helper from `constants/theme.ts`, and delete the duplicates. After fixing BUG-05, only `settings.tsx` will legitimately use it.

---

### ARCH-05 · `today` computed at module scope in multiple files · P3
**Description:** See BUG-01. Beyond the stale-date bug, computing `today` at import time means it's shared state between test runs (Jest). The `ItemDetailModal` has `const today = ...` at module level — any test that mounts this component and crosses midnight will fail.  
**Fix:** Export a `getToday()` utility from a shared module and call it inside components on each render (or on focus via `useFocusEffect`).

---

*Total: 5 Security, 8 Bug, 10 UX, 5 Feature, 5 Architecture — 33 tickets*
