// Ports and adapters. `features/` imports types from `./ports` and gets
// instances from `useRepositories()` — never from `local/` or `firestore/`.
export type {
  BoardRepository,
  CatalogRepository,
  OrderRepository,
  Repositories,
  UserRepository,
} from './ports';
