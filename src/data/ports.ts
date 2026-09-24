/**
 * The ports half of ports-and-adapters. Screens depend on these interfaces and
 * nothing else; `local/` and `firestore/` are the adapters behind them.
 *
 * Every method is async even where the local adapter resolves instantly — a
 * Firestore call must not change the shape of a single call site.
 */

import type { Board, CatalogItem, Order, Role, User } from '../domain';

export interface UserRepository {
  getById(id: string): Promise<User | null>;
  /**
   * An existing identity for this role on this device, if there is one.
   *
   * Exists because one phone can play both parts — during QA, a demo, or a
   * couple sharing a handset. Without it, switching roles and back would mint
   * a fresh stylist each time and orphan the boards the previous one owned.
   */
  findByRole(role: Role): Promise<User | null>;
  /** Insert or replace, keyed on `user.id`. Returns the stored record. */
  save(user: User): Promise<User>;
  /**
   * Who is using this install. There is no real auth (deliberately — see
   * CLAUDE.md), so identity is just the last name entered on this device.
   */
  getCurrent(): Promise<User | null>;
  setCurrent(userId: string | null): Promise<void>;
}

export interface BoardRepository {
  getById(id: string): Promise<Board | null>;
  /** Resolves a shared board from its human-typable code. Sprint 3.5. */
  findByShareCode(shareCode: string): Promise<Board | null>;
  listByOwner(ownerId: string): Promise<Board[]>;
  /** Insert or replace, keyed on `board.id`. Returns the stored record. */
  save(board: Board): Promise<Board>;
  remove(id: string): Promise<void>;
}

/**
 * Read-only: the catalog is hardcoded seed data, not retailer APIs. It stays
 * behind a port anyway so the shop screen does not import seed JSON directly.
 */
export interface CatalogRepository {
  list(): Promise<CatalogItem[]>;
  getById(id: string): Promise<CatalogItem | null>;
}

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  /** Drives the stylist-side receipt in 5.3. */
  listByBoard(boardId: string): Promise<Order[]>;
  listByRecipient(recipientId: string): Promise<Order[]>;
}

/** The full set an adapter package must provide. */
export interface Repositories {
  users: UserRepository;
  boards: BoardRepository;
  catalog: CatalogRepository;
  orders: OrderRepository;
}
