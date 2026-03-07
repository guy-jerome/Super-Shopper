# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web

# Run tests (single pass)
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx jest path/to/test.test.ts

# E2E tests (Playwright)
npm run test:e2e
```

## Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

**Super Shopper** is a cross-platform (iOS/Android/Web) shopping list app built with Expo. Items have a dual-location concept: a **home storage location** (e.g., Pantry, Fridge) and a **store aisle location** per grocery store. Users browse their home inventory, check off items they need, and shop with the list organized by aisle.

### Navigation (Expo Router)

File-based routing via `expo-router`. Entry point `app/index.tsx` redirects to the main tabs. Auth guard lives in `app/_layout.tsx`, which uses `useAuthStore` to redirect unauthenticated users to `/auth/login`.

Tab routes under `app/(tabs)/`:
- `home-storage` — Browse storage locations and items; check items to add to shopping list
- `items` — Global item catalog with tags, sort, and image support
- `stores` — Create store profiles and configure aisles/item positions
- `shop` — Shopping mode: view list organized by store aisles, check off items
- `settings` — Account and app settings

### State Management (Zustand)

Four domain stores in `stores/`:

| Store | Responsibility |
|---|---|
| `useAuthStore` | Supabase auth session, login/signup/logout |
| `useStorageStore` | Home storage locations and their items |
| `useStoreStore` | Store profiles, aisles, and item-store-locations; `activeStore` holds the currently viewed store with full nested data |
| `useShoppingStore` | Shopping list items for today's date, notes, current store selection (persisted via AsyncStorage), shop/edit mode |
| `useItemStore` | Global item catalog with sort order and image upload to Supabase Storage |

### Database (Supabase/PostgreSQL)

Key tables and relationships:
- `items` — Global item record with optional `home_location_id` and optional metadata (`brand`, `quantity`, `image_url`, `tags[]`)
- `storage_locations` — User's home locations (Pantry, Fridge, etc.), ordered by `order_index`
- `store_profiles` → `aisles` → `item_store_locations` — Store layout hierarchy; `item_store_locations` links items to aisles with `position_index` and optional `position_tag`
- `shopping_list` — Items added to today's shopping trip (`shopping_date = CURRENT_DATE`), with `checked` status and `quantity`
- `shopping_notes` — Per-user, per-date notes; upserted (composite PK: `user_id + shopping_date`)

All tables use RLS scoped to `auth.uid()`.

### Key Patterns

- **Item reuse**: When adding an item by name to a storage location or aisle, the stores first try to find an existing item by name (`ilike`) before inserting a new one, preserving existing location links.
- **Ordering**: Locations and aisles use integer `order_index`; items within aisles use `position_index`. Reordering updates all affected rows in parallel.
- **Types**: `types/app.types.ts` re-exports Supabase-generated row types from `types/database.types.ts` and defines composite types like `StorageLocationWithItems`, `StoreWithAisles`, `AisleWithItems`.
- **Theme**: `constants/theme.ts` exports `theme`/`darkTheme` (React Native Paper MD3) and `colors`/`spacing` constants.
- **Path alias**: `@/` maps to the project root (configured in `tsconfig.json` and Jest `moduleNameMapper`).
