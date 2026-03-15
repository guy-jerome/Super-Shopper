import './setup';
import { act } from 'react';
import { useItemStore } from '../stores/useItemStore';
import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as jest.Mock;

function buildChain(resolved: object) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single', 'maybeSingle', 'ilike', 'is', 'limit', 'or', 'gte', 'lt', 'upsert'];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single = jest.fn().mockResolvedValue(resolved);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved);
  (chain as any).then = Promise.resolve(resolved).then.bind(Promise.resolve(resolved));
  return chain;
}

const makeItem = (id: string, name = `Item ${id}`) => ({
  id,
  user_id: 'u1',
  name,
  brand: null,
  quantity: null,
  image_url: null,
  tags: [],
  home_location_id: null,
  order_index: 0,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  hasHomeLocation: false,
  hasStoreLocation: false,
});

beforeEach(() => {
  useItemStore.setState({ items: [], isLoading: false, sortOrder: 'name', filterMode: 'all' });
  mockFrom.mockReset();
});

describe('useItemStore — setSortOrder', () => {
  it('updates sortOrder in state', () => {
    useItemStore.getState().setSortOrder('recent');
    expect(useItemStore.getState().sortOrder).toBe('recent');
  });

  it('sorts item list by name', () => {
    useItemStore.setState({
      items: [makeItem('2', 'Zucchini'), makeItem('1', 'Apple')],
      sortOrder: 'name',
    });
    const { items, sortOrder } = useItemStore.getState();
    const sorted = [...items].sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    expect(sorted[0].name).toBe('Apple');
    expect(sorted[1].name).toBe('Zucchini');
  });
});

describe('useItemStore — setFilterMode', () => {
  it('updates filterMode in state', () => {
    useItemStore.getState().setFilterMode('no-home');
    expect(useItemStore.getState().filterMode).toBe('no-home');
  });
});

describe('useItemStore — updateItemTags', () => {
  it('optimistically updates tags on item', async () => {
    useItemStore.setState({ items: [makeItem('item-1')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useItemStore.getState().updateItemTags('item-1', ['dairy', 'fresh']);
    });

    const found = useItemStore.getState().items.find((i) => i.id === 'item-1');
    expect(found?.tags).toEqual(['dairy', 'fresh']);
  });
});

describe('useItemStore — updateItemName', () => {
  it('optimistically renames an item', async () => {
    useItemStore.setState({ items: [makeItem('item-1', 'Milk')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useItemStore.getState().updateItemName('item-1', 'Oat Milk');
    });

    const found = useItemStore.getState().items.find((i) => i.id === 'item-1');
    expect(found?.name).toBe('Oat Milk');
  });
});

describe('useItemStore — deleteItem', () => {
  it('removes the item from state', async () => {
    useItemStore.setState({ items: [makeItem('item-1'), makeItem('item-2')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useItemStore.getState().deleteItem('item-1');
    });

    const { items } = useItemStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-2');
  });
});

describe('useItemStore — getAllTags', () => {
  it('returns deduplicated tags across all items', () => {
    useItemStore.setState({
      items: [
        { ...makeItem('1'), tags: ['dairy', 'fresh'] },
        { ...makeItem('2'), tags: ['fresh', 'produce'] },
      ],
    });
    const tags = useItemStore.getState().getAllTags();
    expect(tags).toEqual(expect.arrayContaining(['dairy', 'fresh', 'produce']));
    // No duplicates
    expect(tags.filter((t) => t === 'fresh')).toHaveLength(1);
  });
});
