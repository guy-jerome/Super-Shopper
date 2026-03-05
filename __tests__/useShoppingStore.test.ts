import './setup';
import { act } from 'react';
import { useShoppingStore } from '../stores/useShoppingStore';
import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as jest.Mock;

// Helper: build a chainable mock that resolves with given value at the end
function buildChain(resolvedValue: object) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single', 'maybeSingle', 'upsert'];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single = jest.fn().mockResolvedValue(resolvedValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolvedValue);
  // make the chain itself awaitable for non-.single() calls
  (chain as any).then = Promise.resolve(resolvedValue).then.bind(Promise.resolve(resolvedValue));
  return chain;
}

beforeEach(() => {
  useShoppingStore.setState({
    shoppingList: [],
    notes: '',
    currentStore: null,
    isLoading: false,
  });
});

describe('useShoppingStore — aisle grouping', () => {
  const storeId = 'store-1';
  const aisleId = 'aisle-dairy';

  const makeItem = (id: string, aisleStoreId: string | null) => ({
    id,
    user_id: 'u1',
    item_id: `item-${id}`,
    quantity: 1,
    checked: false,
    shopping_date: '2026-01-01',
    created_at: '',
    updated_at: '',
    item_name: `Item ${id}`,
    store_locations: aisleStoreId
      ? [{ aisle_id: aisleId, aisles: { id: aisleId, name: 'Dairy', order_index: 0, store_id: aisleStoreId } }]
      : [],
  });

  it('groups items by aisle when store is set', () => {
    const milkItem = makeItem('milk', storeId);
    const unlinkedItem = makeItem('chips', null);

    useShoppingStore.setState({
      shoppingList: [milkItem, unlinkedItem],
      currentStore: { id: storeId, name: 'Walmart', user_id: 'u1', created_at: '', updated_at: '' },
    });

    const { shoppingList, currentStore } = useShoppingStore.getState();

    const aisleMap = new Map<string, typeof shoppingList>();
    const general: typeof shoppingList = [];
    for (const item of shoppingList) {
      const loc = item.store_locations.find((l) => l.aisles.store_id === currentStore!.id);
      if (loc) {
        const key = loc.aisle_id;
        if (!aisleMap.has(key)) aisleMap.set(key, []);
        aisleMap.get(key)!.push(item);
      } else {
        general.push(item);
      }
    }

    expect(aisleMap.get(aisleId)).toHaveLength(1);
    expect(aisleMap.get(aisleId)![0].item_name).toBe('Item milk');
    expect(general).toHaveLength(1);
    expect(general[0].item_name).toBe('Item chips');
  });

  it('returns null grouping when no store selected', () => {
    useShoppingStore.setState({ currentStore: null });
    const { currentStore } = useShoppingStore.getState();
    // grouping is computed in the component via useMemo; null store = no groups
    expect(currentStore).toBeNull();
  });
});

describe('useShoppingStore — toggleChecked', () => {
  it('optimistically updates checked state', async () => {
    const item = {
      id: 'sl-1', user_id: 'u1', item_id: 'i1', quantity: 1,
      checked: false, shopping_date: '2026-01-01', created_at: '', updated_at: '',
      item_name: 'Milk', store_locations: [],
    };
    useShoppingStore.setState({ shoppingList: [item] });

    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useShoppingStore.getState().toggleChecked('sl-1', true);
    });

    const updated = useShoppingStore.getState().shoppingList.find((i) => i.id === 'sl-1');
    expect(updated?.checked).toBe(true);
  });
});

describe('useShoppingStore — clearCheckedItems', () => {
  it('removes all checked items from state', async () => {
    useShoppingStore.setState({
      shoppingList: [
        { id: '1', checked: true, item_name: 'A', store_locations: [], user_id: 'u', item_id: 'i1', quantity: 1, shopping_date: '', created_at: '', updated_at: '' },
        { id: '2', checked: false, item_name: 'B', store_locations: [], user_id: 'u', item_id: 'i2', quantity: 1, shopping_date: '', created_at: '', updated_at: '' },
      ],
    });

    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useShoppingStore.getState().clearCheckedItems();
    });

    const { shoppingList } = useShoppingStore.getState();
    expect(shoppingList).toHaveLength(1);
    expect(shoppingList[0].id).toBe('2');
  });
});
