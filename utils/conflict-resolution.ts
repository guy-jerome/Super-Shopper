export function resolveLastWriteWins<T extends { updated_at: string }>(
  local: T,
  remote: T
): T {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();
  return localTime >= remoteTime ? local : remote;
}

export function mergeShoppingListItems<T extends { id: string; checked: boolean; updated_at: string }>(
  local: T[],
  remote: T[]
): T[] {
  const merged = new Map<string, T>();

  for (const item of remote) {
    merged.set(item.id, item);
  }

  for (const item of local) {
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
    } else {
      merged.set(item.id, resolveLastWriteWins(item, existing));
    }
  }

  return Array.from(merged.values());
}
