import './setup';
import { act } from 'react';
import { useStoreStore } from '../stores/useStoreStore';
import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as jest.Mock;

function buildChain(resolved: object) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single', 'maybeSingle', 'ilike', 'or', 'gte', 'lt', 'upsert', 'limit'];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single = jest.fn().mockResolvedValue(resolved);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved);
  (chain as any).then = Promise.resolve(resolved).then.bind(Promise.resolve(resolved));
  return chain;
}

const makeStore = (id: string, orderIndex = 0) => ({
  id,
  user_id: 'u1',
  name: `Store ${id}`,
  order_index: orderIndex,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
});

beforeEach(() => {
  useStoreStore.setState({ stores: [], activeStore: null, isLoading: false });
  mockFrom.mockReset();
});

describe('useStoreStore — addStore', () => {
  it('appends a new store to state', async () => {
    const newStore = makeStore('store-1');
    const chain = buildChain({ data: newStore, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().addStore('u1', 'Walmart');
    });

    const { stores } = useStoreStore.getState();
    expect(stores).toHaveLength(1);
    expect(stores[0].id).toBe('store-1');
  });

  it('does not modify state on error', async () => {
    const chain = buildChain({ data: null, error: { message: 'fail' } });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().addStore('u1', 'Walmart');
    });

    expect(useStoreStore.getState().stores).toHaveLength(0);
  });
});

describe('useStoreStore — deleteStore', () => {
  it('removes a store from state', async () => {
    useStoreStore.setState({ stores: [makeStore('store-1'), makeStore('store-2')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().deleteStore('store-1');
    });

    const { stores } = useStoreStore.getState();
    expect(stores).toHaveLength(1);
    expect(stores[0].id).toBe('store-2');
  });
});

describe('useStoreStore — moveStore', () => {
  it('moves store down by swapping with next', async () => {
    useStoreStore.setState({
      stores: [makeStore('a', 0), makeStore('b', 1), makeStore('c', 2)],
    });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().moveStore('a', 'down');
    });

    const { stores } = useStoreStore.getState();
    expect(stores[0].id).toBe('b');
    expect(stores[1].id).toBe('a');
  });

  it('moves store up by swapping with previous', async () => {
    useStoreStore.setState({
      stores: [makeStore('a', 0), makeStore('b', 1)],
    });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().moveStore('b', 'up');
    });

    const { stores } = useStoreStore.getState();
    expect(stores[0].id).toBe('b');
    expect(stores[1].id).toBe('a');
  });
});

describe('useStoreStore — updateStore', () => {
  it('renames a store in state', async () => {
    useStoreStore.setState({ stores: [makeStore('store-1')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStoreStore.getState().updateStore('store-1', 'Target');
    });

    const { stores } = useStoreStore.getState();
    expect(stores[0].name).toBe('Target');
  });
});
