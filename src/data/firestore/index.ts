// Firestore adapters (Sprint 3). Additive — implementing the same ports as
// `local/` is what keeps the swap to one line in RepositoryProvider.

import { LocalCatalogRepository } from '../local/LocalCatalogRepository';
import type { Repositories } from '../ports';
import { FirestoreBoardRepository } from './FirestoreBoardRepository';
import { FirestoreOrderRepository } from './FirestoreOrderRepository';
import { FirestoreUserRepository } from './FirestoreUserRepository';

export function createFirestoreRepositories(): Repositories {
  return {
    users: new FirestoreUserRepository(),
    boards: new FirestoreBoardRepository(),
    // The catalog is hardcoded seed data, identical on every device and never
    // written. Uploading 48 fixed documents would buy nothing and add a
    // network round trip to the one screen that most needs to feel instant.
    catalog: new LocalCatalogRepository(),
    orders: new FirestoreOrderRepository(),
  };
}

export { FIRESTORE_LOCAL_KEYS } from './FirestoreUserRepository';
