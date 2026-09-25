/**
 * Thin JSON layer over AsyncStorage. Collections are stored as one
 * id-keyed object per entity rather than a key per record, which keeps reads
 * to a single round trip — the whole dataset here is a handful of boards.
 *
 * Read-modify-write is not atomic. That is fine for a prototype where one
 * person uses one device at a time, and it stops mattering entirely in Sprint
 * 3 when Firestore takes over as the real store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  users: 'tge:users',
  currentUserId: 'tge:currentUserId',
  boards: 'tge:boards',
  orders: 'tge:orders',
  events: 'tge:events',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

/** Every key this app owns — the reset helper in 1.8 clears exactly these. */
export const ALL_KEYS: StorageKey[] = Object.values(KEYS);

export async function readCollection<T>(key: StorageKey): Promise<Record<string, T>> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    // Treat anything unexpected as empty rather than throwing. A tester whose
    // storage got mangled should see an empty app, not a white screen.
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, T>;
  } catch {
    return {};
  }
}

export async function writeCollection<T>(
  key: StorageKey,
  value: Record<string, T>,
): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readValue(key: StorageKey): Promise<string | null> {
  return AsyncStorage.getItem(key);
}

export async function writeValue(key: StorageKey, value: string | null): Promise<void> {
  if (value === null) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function clearAll(): Promise<void> {
  // removeMany, not multiRemove — AsyncStorage v2 renamed the batch API.
  // Clearing only our own keys rather than calling clear(), so a reset during
  // a demo cannot take anything else on the device with it.
  await AsyncStorage.removeMany([...ALL_KEYS]);
}

/** Newest first — every list in the UI wants the most recent thing on top. */
export function byCreatedAtDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}
