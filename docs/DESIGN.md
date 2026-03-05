# Super Shopper - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  iOS App     │  │ Android App  │      │
│  │ (React Web)  │  │(React Native)│  │(React Native)│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘              │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Offline Layer  │
                    │  (Local Store)  │
                    │  AsyncStorage/  │
                    │  localStorage   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Sync Layer    │
                    │  (Supabase RT)  │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Backend Layer                               │
│                    ┌────────▼────────┐                         │
│                    │    Supabase     │                         │
│         ┌──────────┼─────────────────┼──────────┐             │
│         │          │                 │          │             │
│  ┌──────▼─────┐ ┌─▼──────────┐ ┌────▼─────┐ ┌─▼────────┐    │
│  │ PostgreSQL │ │  Auth      │ │ Realtime │ │ Storage  │    │
│  │  Database  │ │  Service   │ │  Service │ │ (Future) │    │
│  └────────────┘ └────────────┘ └──────────┘ └──────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend Framework:**
- **Expo (React Native)** - Version 50+
  - Expo Router for navigation
  - React Native Paper for UI components
  - Expo SecureStore for sensitive data

**State Management:**
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state & caching

**Backend & Database:**
- **Supabase**
  - PostgreSQL 15+
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Built-in authentication

**Offline Storage:**
- **AsyncStorage** (Mobile)
- **localStorage** (Web)
- **IndexedDB** (Web - future enhancement)

**Additional Libraries:**
- **react-native-draggable-flatlist** - Drag & drop
- **react-native-gesture-handler** - Touch gestures
- **date-fns** - Date manipulation
- **zod** - Schema validation

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram
```
┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │◄──────────────┐
│ email        │               │
│ created_at   │               │
│ updated_at   │               │
└──────────────┘               │
                               │
┌──────────────────────────┐   │
│  storage_locations       │   │
│──────────────────────────│   │
│ id (PK)                  │   │
│ user_id (FK) ────────────┼───┘
│ name                     │
│ order_index              │
│ created_at               │
└──────────────────────────┘
       ▲
       │
       │
┌──────┴───────────────────┐
│       items              │
│──────────────────────────│
│ id (PK)                  │
│ user_id (FK)             │
│ name                     │
│ home_location_id (FK)────┘
│ created_at               │
└──────┬───────────────────┘
       │
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌──────────────────────┐         ┌──────────────────────┐
│  store_profiles      │         │  shopping_list       │
│──────────────────────│         │──────────────────────│
│ id (PK)              │         │ id (PK)              │
│ user_id (FK)         │         │ user_id (FK)         │
│ name                 │         │ item_id (FK)         │
│ created_at           │         │ quantity             │
└──────┬───────────────┘         │ checked              │
       │                         │ shopping_date        │
       │                         │ created_at           │
       ▼                         └──────────────────────┘
┌──────────────────────┐
│    aisles            │
│──────────────────────│
│ id (PK)              │
│ store_id (FK)        │
│ name                 │
│ side (left/right)    │
│ order_index          │
│ created_at           │
└──────┬───────────────┘
       │
       │
       ▼
┌──────────────────────────┐
│   item_store_locations   │
│──────────────────────────│
│ id (PK)                  │
│ item_id (FK)             │
│ aisle_id (FK)            │
│ position_index           │
│ created_at               │
└──────────────────────────┘

┌──────────────────────┐
│  shopping_notes      │
│──────────────────────│
│ id (PK)              │
│ user_id (FK)         │
│ shopping_date        │
│ content              │
│ updated_at           │
└──────────────────────┘

┌──────────────────────┐
│  shared_lists        │
│──────────────────────│
│ id (PK)              │
│ owner_id (FK)        │
│ shared_with_id (FK)  │
│ permission_level     │
│ created_at           │
└──────────────────────┘
```

### 2.2 Database Tables

#### `users`
- Managed by Supabase Auth
- Extended with custom profile data

#### `storage_locations`
```sql
CREATE TABLE storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `store_profiles`
```sql
CREATE TABLE store_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `aisles`
```sql
CREATE TABLE aisles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES store_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  side TEXT CHECK (side IN ('left', 'right', 'center')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `items`
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  home_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `item_store_locations`
```sql
CREATE TABLE item_store_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  aisle_id UUID REFERENCES aisles(id) ON DELETE CASCADE,
  position_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, aisle_id)
);
```

#### `shopping_list`
```sql
CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  checked BOOLEAN DEFAULT FALSE,
  shopping_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `shopping_notes`
```sql
CREATE TABLE shopping_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shopping_date DATE DEFAULT CURRENT_DATE,
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, shopping_date)
);
```

#### `shared_lists`
```sql
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT CHECK (permission_level IN ('read', 'write')) DEFAULT 'write',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_id)
);
```

### 2.3 Row Level Security (RLS) Policies

All tables will have RLS enabled with policies like:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON storage_locations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view data shared with them
CREATE POLICY "Users can view shared data" ON storage_locations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT shared_with_id FROM shared_lists WHERE owner_id = storage_locations.user_id
    )
  );
```

---

## 3. Application Architecture

### 3.1 Folder Structure
```
super-shopper/
├── app/                          # Expo Router pages
│   ├── (tabs)/                   # Tab navigation
│   │   ├── home-storage.tsx
│   │   ├── stores.tsx
│   │   ├── shop.tsx
│   │   └── settings.tsx
│   ├── auth/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── _layout.tsx               # Root layout
│   └── index.tsx                 # Entry point
├── components/                   # Reusable components
│   ├── StorageLocationCard.tsx
│   ├── AisleList.tsx
│   ├── ItemRow.tsx
│   ├── DraggableItem.tsx
│   └── ShoppingListItem.tsx
├── lib/                          # Business logic
│   ├── supabase.ts               # Supabase client
│   ├── storage.ts                # Local storage utils
│   └── sync.ts                   # Sync logic
├── stores/                       # Zustand stores
│   ├── useAuthStore.ts
│   ├── useStorageStore.ts
│   ├── useStoreStore.ts
│   └── useShoppingStore.ts
├── hooks/                        # Custom hooks
│   ├── useOfflineSync.ts
│   ├── useRealtimeSubscription.ts
│   └── useDragDrop.ts
├── types/                        # TypeScript types
│   ├── database.types.ts
│   └── app.types.ts
├── utils/                        # Helper functions
│   ├── conflict-resolution.ts
│   └── validators.ts
├── constants/
│   └── theme.ts
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

### 3.2 State Management Architecture

**Zustand Stores:**

```typescript
// useStorageStore.ts
interface StorageStore {
  locations: StorageLocation[];
  items: Item[];
  fetchLocations: () => Promise<void>;
  addLocation: (location: Partial<StorageLocation>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<StorageLocation>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  reorderLocations: (locations: StorageLocation[]) => Promise<void>;
}

// useShoppingStore.ts
interface ShoppingStore {
  shoppingList: ShoppingListItem[];
  notes: string;
  currentStore: StoreProfile | null;
  mode: 'edit' | 'shop';
  addToList: (itemId: string, quantity: number) => Promise<void>;
  toggleChecked: (itemId: string) => Promise<void>;
  updateNotes: (notes: string) => Promise<void>;
  clearCheckedItems: () => Promise<void>;
}
```

### 3.3 Offline Sync Strategy

**Sync Flow:**
```
1. User makes change → Update local store immediately
2. Queue change in pending_changes table
3. If online → Sync to Supabase
4. If offline → Wait for connection
5. On reconnect → Process pending_changes queue
6. Apply conflict resolution if needed
7. Clear pending_changes after successful sync
```

**Conflict Resolution:**
- Use `updated_at` timestamp
- Last-write-wins (LWW) strategy
- For shopping list: merge additions, latest status wins

**Pending Changes Table:**
```sql
CREATE TABLE pending_changes (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  data JSONB,
  timestamp BIGINT NOT NULL,
  synced BOOLEAN DEFAULT FALSE
);
```

---

## 4. User Interface Design

### 4.1 Screen Wireframes

#### Home Storage Screen
```
┌─────────────────────────────────────┐
│  ← Home Storage            [+] Edit │
├─────────────────────────────────────┤
│                                     │
│  🗄️  Pantry                    ▼    │
│    ☐ Rice (2)                       │
│    ☐ Pasta (1)                      │
│    ☑ Olive Oil (1)  ← Added to list│
│                                     │
│  🧊  Freezer                   ▼    │
│    ☐ Frozen Peas (1)                │
│    ☑ Ice Cream (2)                  │
│                                     │
│  🥬  Fridge                    ▼    │
│    ☐ Milk (1)                       │
│    ☐ Eggs (1)                       │
│                                     │
│             [Add Location]          │
└─────────────────────────────────────┘
```

#### Shop Mode Screen
```
┌─────────────────────────────────────┐
│  ← Shop: Walmart      Store ▼ [Edit]│
├─────────────────────────────────────┤
│  📝 Notes:                          │
│  Don't forget coupons!              │
│  ────────────────────────────────   │
│                                     │
│  Progress: 2/5 items    🛒          │
│                                     │
│  🥖 Bakery                          │
│    ☑ Bread (2)        [strikethrough│
│                                     │
│  🥬 Produce (Left)                  │
│    ☐ Lettuce (1)                    │
│    ☑ Tomatoes (3)     [strikethrough│
│                                     │
│  🥫 Canned Goods (Right)            │
│    ☐ Olive Oil (1)                  │
│    ☐ Pasta (2)                      │
│                                     │
│         [Clear Completed]           │
└─────────────────────────────────────┘
```

#### Store Edit Mode
```
┌─────────────────────────────────────┐
│  ← Walmart               [Shop Mode]│
├─────────────────────────────────────┤
│  [Add Aisle]            🔍 Search   │
│                                     │
│  ☰ Bakery (Left) - 12 items    ▼   │
│     ☰ Bread                         │
│     ☰ Bagels                        │
│     ☰ Croissants                    │
│        [+ Add Item]                 │
│                                     │
│  ☰ Produce (Left) - 24 items   ▼   │
│     ☰ Lettuce                       │
│     ☰ Tomatoes                      │
│        [+ Add Item]                 │
│                                     │
│  ☰ Dairy (Right) - 18 items    ▼   │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Navigation Structure
```
Bottom Tabs (Mobile) / Sidebar (Web):
├── 🏠 Home Storage
├── 🏪 Stores
├── 🛒 Shop
└── ⚙️  Settings

Settings Menu:
├── Account
├── Shared Lists
├── Theme (Light/Dark)
├── Clear Data
└── Logout
```

### 4.3 Design System

**Color Palette:**
```
Primary:    #4CAF50  (Green - success, checked items)
Secondary:  #2196F3  (Blue - interactive elements)
Error:      #F44336  (Red - delete, errors)
Warning:    #FF9800  (Orange - warnings)
Background: #FFFFFF  (Light mode)
Surface:    #F5F5F5  (Cards, elevated surfaces)
Text:       #212121  (Primary text)
TextLight:  #757575  (Secondary text)
```

**Typography:**
```
Heading 1:  32px, Bold
Heading 2:  24px, SemiBold
Heading 3:  20px, SemiBold
Body:       16px, Regular
Caption:    14px, Regular
Button:     16px, SemiBold
```

**Spacing:**
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
```

---

## 5. API Design

### 5.1 Supabase Queries

**Fetch Home Storage with Items:**
```typescript
const { data, error } = await supabase
  .from('storage_locations')
  .select(`
    *,
    items (*)
  `)
  .eq('user_id', userId)
  .order('order_index', { ascending: true });
```

**Fetch Shopping List for Store:**
```typescript
const { data, error } = await supabase
  .from('shopping_list')
  .select(`
    *,
    items (
      *,
      item_store_locations!inner (
        aisle_id,
        position_index,
        aisles (
          name,
          side,
          order_index
        )
      )
    )
  `)
  .eq('user_id', userId)
  .eq('shopping_date', currentDate)
  .eq('items.item_store_locations.aisles.store_id', storeId);
```

**Real-time Subscription:**
```typescript
const subscription = supabase
  .channel('shopping_list_changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shopping_list',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update local state
    }
  )
  .subscribe();
```

### 5.2 Custom Hooks

**useOfflineSync:**
```typescript
const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    // Monitor network status
    // Process pending changes when online
  }, [isOnline]);

  return { isOnline, isSyncing, pendingChanges };
};
```

---

## 6. Security Considerations

### 6.1 Authentication
- Email/password authentication via Supabase Auth
- JWT tokens for session management
- Secure token storage (SecureStore on mobile)
- Password requirements: min 8 chars, 1 uppercase, 1 number

### 6.2 Authorization
- Row Level Security (RLS) on all tables
- User can only access their own data + shared lists
- Shared list permissions: read-only or write

### 6.3 Data Validation
- Input validation on client and server
- SQL injection prevention via parameterized queries
- XSS prevention via sanitization

---

## 7. Performance Optimization

### 7.1 Frontend
- Lazy loading for screens
- Virtualized lists (FlatList) for long item lists
- Memoization of expensive components
- Debounced search/filter inputs

### 7.2 Database
- Indexes on foreign keys and frequently queried columns
- Pagination for large datasets
- Efficient queries with selective joins

### 7.3 Offline Performance
- Local-first approach (read from local store first)
- Background sync to avoid blocking UI
- Delta updates (only sync changes)

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Business logic functions
- Utility functions
- State management stores

### 8.2 Integration Tests
- API calls to Supabase
- Offline sync logic
- Conflict resolution

### 8.3 E2E Tests
- Critical user flows
- Auth flows
- Shopping list workflow

### 8.4 Manual Testing
- Cross-device sync testing
- Offline mode testing
- Multi-user collaboration

---

## 9. Deployment Strategy

### 9.1 Development Environment
- Local Supabase instance (optional)
- Expo Go for rapid testing
- Hot reload enabled

### 9.2 Staging Environment
- Supabase staging project
- TestFlight (iOS) / Internal Testing (Android)
- Web preview deployment (Vercel/Netlify)

### 9.3 Production
- Supabase production project
- App Store (iOS) / Play Store (Android)
- Web deployment (Vercel/Netlify)

### 9.4 CI/CD
- GitHub Actions for automated builds
- Automated testing on PR
- EAS Build for mobile apps

---

## 10. Monitoring & Analytics

### 10.1 Error Tracking
- Sentry for crash reporting
- Custom error logging

### 10.2 Analytics
- Usage metrics (feature adoption)
- Performance metrics (load times)
- User retention

### 10.3 Database Monitoring
- Supabase dashboard metrics
- Query performance tracking

---

**Document Version**: 1.0  
**Last Updated**: March 1, 2026  
**Status**: Draft
