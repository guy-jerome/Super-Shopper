import './setup';
import { act } from 'react';
import { useStorageStore } from '../stores/useStorageStore';
import { supabase } from '../lib/supabase';

const mockFrom = supabase.from as jest.Mock;

function buildChain(resolved: object) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single', 'maybeSingle', 'limit', 'ilike', 'is', 'or', 'gte', 'lt', 'upsert'];
  methods.forEach((m) => { chain[m] = jest.fn(() => chain); });
  chain.single = jest.fn().mockResolvedValue(resolved);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved);
  (chain as any).then = Promise.resolve(resolved).then.bind(Promise.resolve(resolved));
  return chain;
}

const makeLocation = (id: string, orderIndex = 0) => ({
  id,
  user_id: 'u1',
  name: `Location ${id}`,
  parent_id: null,
  order_index: orderIndex,
  created_at: '',
  updated_at: '',
  items: [],
  subsections: [],
});

beforeEach(() => {
  useStorageStore.setState({ locations: [], isLoading: false });
  mockFrom.mockReset();
});

describe('useStorageStore — addLocation', () => {
  it('appends new location to state', async () => {
    const newLoc = makeLocation('loc-1');
    const chain = buildChain({ data: newLoc, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().addLocation('u1', 'Pantry');
    });

    const { locations } = useStorageStore.getState();
    expect(locations).toHaveLength(1);
    expect(locations[0].id).toBe('loc-1');
  });

  it('does not modify state on supabase error', async () => {
    const chain = buildChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().addLocation('u1', 'Pantry');
    });

    expect(useStorageStore.getState().locations).toHaveLength(0);
  });
});

describe('useStorageStore — deleteLocation', () => {
  it('removes location from state', async () => {
    useStorageStore.setState({ locations: [makeLocation('loc-1'), makeLocation('loc-2')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().deleteLocation('loc-1');
    });

    const { locations } = useStorageStore.getState();
    expect(locations).toHaveLength(1);
    expect(locations[0].id).toBe('loc-2');
  });
});

describe('useStorageStore — moveLocation', () => {
  it('swaps order with next location when moving down', async () => {
    useStorageStore.setState({
      locations: [makeLocation('a', 0), makeLocation('b', 1), makeLocation('c', 2)],
    });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().moveLocation('a', 'down');
    });

    const { locations } = useStorageStore.getState();
    expect(locations[0].id).toBe('b');
    expect(locations[1].id).toBe('a');
  });

  it('swaps order with previous location when moving up', async () => {
    useStorageStore.setState({
      locations: [makeLocation('a', 0), makeLocation('b', 1)],
    });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().moveLocation('b', 'up');
    });

    const { locations } = useStorageStore.getState();
    expect(locations[0].id).toBe('b');
    expect(locations[1].id).toBe('a');
  });
});

describe('useStorageStore — updateLocation', () => {
  it('renames a location in state', async () => {
    useStorageStore.setState({ locations: [makeLocation('loc-1')] });
    const chain = buildChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useStorageStore.getState().updateLocation('loc-1', 'Fridge');
    });

    const { locations } = useStorageStore.getState();
    expect(locations[0].name).toBe('Fridge');
  });
});
