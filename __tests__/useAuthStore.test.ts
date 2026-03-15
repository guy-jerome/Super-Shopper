import './setup';
import { act } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';

const mockAuth = supabase.auth as jest.Mocked<typeof supabase.auth>;
const mockFrom = supabase.from as jest.Mock;

// add auth methods not in base mock
beforeAll(() => {
  (supabase.auth as any).getUser = jest.fn();
  (supabase.auth as any).updateUser = jest.fn();
  (supabase as any).functions = { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) };
});

beforeEach(() => {
  useAuthStore.setState({ user: null, isLoading: true, isRecovery: false });
  jest.clearAllMocks();
  // re-apply defaults after clearAllMocks
  (supabase.auth as any).getUser.mockResolvedValue({ data: { user: null }, error: null });
  (supabase.auth as any).updateUser.mockResolvedValue({ data: null, error: null });
  (supabase as any).functions.invoke.mockResolvedValue({ data: null, error: null });
});

describe('useAuthStore — initialize', () => {
  it('sets isLoading: false and user: null when no session', async () => {
    (mockAuth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    const { user, isLoading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoading).toBe(false);
  });

  it('sets user from an existing session', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com' } as any;
    (mockAuth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: fakeUser } },
      error: null,
    });

    await act(async () => {
      await useAuthStore.getState().initialize();
    });

    expect(useAuthStore.getState().user).toEqual(fakeUser);
  });
});

describe('useAuthStore — signIn', () => {
  it('resolves without error on success', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await act(async () => {
      await expect(
        useAuthStore.getState().signIn('a@b.com', 'pass')
      ).resolves.toBeUndefined();
    });
  });

  it('throws the Supabase error on failure', async () => {
    (mockAuth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    await act(async () => {
      await expect(
        useAuthStore.getState().signIn('a@b.com', 'wrong')
      ).rejects.toMatchObject({ message: 'Invalid credentials' });
    });
  });
});

describe('useAuthStore — signOut', () => {
  it('clears user state after sign-out', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as any });
    (mockAuth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

    await act(async () => {
      await useAuthStore.getState().signOut();
    });

    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('useAuthStore — updatePassword', () => {
  it('clears isRecovery flag on success', async () => {
    useAuthStore.setState({ isRecovery: true });

    await act(async () => {
      await useAuthStore.getState().updatePassword('newSecurePass1!');
    });

    expect(useAuthStore.getState().isRecovery).toBe(false);
  });

  it('throws on update error', async () => {
    (supabase.auth as any).updateUser.mockResolvedValueOnce({
      data: null,
      error: { message: 'Weak password' },
    });

    await act(async () => {
      await expect(
        useAuthStore.getState().updatePassword('x')
      ).rejects.toMatchObject({ message: 'Weak password' });
    });
  });
});

describe('useAuthStore — deleteAccount', () => {
  it('clears user and calls signOut', async () => {
    const fakeUser = { id: 'u1' } as any;
    useAuthStore.setState({ user: fakeUser });
    (supabase.auth as any).getUser.mockResolvedValueOnce({
      data: { user: fakeUser },
      error: null,
    });
    (mockAuth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

    const chain: any = {};
    ['select','delete','eq'].forEach((m) => { chain[m] = jest.fn(() => chain); });
    (chain as any).then = Promise.resolve({ data: null, error: null }).then.bind(
      Promise.resolve({ data: null, error: null })
    );
    mockFrom.mockReturnValue(chain);

    await act(async () => {
      await useAuthStore.getState().deleteAccount();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});
