/**
 * Shared Firestore plumbing. The adapters below it are deliberately dull —
 * the interesting decisions all live here.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from '@react-native-firebase/firestore';
export const COLLECTIONS = {
  users: 'users',
  boards: 'boards',
  orders: 'orders',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Types are inferred from the functions rather than imported by name.
 * @react-native-firebase renamed its type surface between major versions —
 * v26 dropped the FirebaseFirestoreTypes namespace — and inference does not
 * care what the current names are.
 */
export function db(): ReturnType<typeof getFirestore> {
  return getFirestore();
}

export function docRef(name: CollectionName, id: string) {
  return doc(db(), name, id);
}

export function collectionRef(name: CollectionName) {
  return collection(db(), name);
}

/**
 * Reads one document, or null when it is not there.
 *
 * The document id is spread back over the data. Every entity in the domain
 * carries its own `id`, and relying on the field stored inside the document
 * would leave the two able to disagree.
 */
export async function readDoc<T>(name: CollectionName, id: string): Promise<T | null> {
  const snapshot = await getDoc(docRef(name, id));
  if (!snapshot.exists()) {
    return null;
  }
  return { ...(snapshot.data() as T), id: snapshot.id };
}

/** Reads every document matching one equality filter. */
export async function readWhere<T>(
  name: CollectionName,
  field: string,
  value: unknown,
): Promise<T[]> {
  const snapshot = await getDocs(query(collectionRef(name), where(field, '==', value)));
  return snapshot.docs.map(entry => ({
    ...(entry.data() as T),
    id: entry.id,
  }));
}

/**
 * Firestore rejects `undefined` field values outright, and the domain uses
 * optional fields throughout — `recipientId`, `sentAt`, `note`, `preferredFit`.
 * Stripping them is what lets the same object satisfy both.
 *
 * Recurses through nested objects and arrays because a Board carries Pins and
 * an Order carries CatalogItems.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry !== undefined) {
      result[key] = stripUndefined(entry);
    }
  }
  return result as T;
}

/** Newest first, matching the local adapters so screens see one ordering. */
export function byCreatedAtDesc<T extends { createdAt: string }>(a: T, b: T): number {
  return b.createdAt.localeCompare(a.createdAt);
}
