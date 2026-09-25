/**
 * The bag. React Context, per plan §5.
 *
 * Held in memory rather than persisted: the flow this is measuring happens in
 * one sitting, and a bag that outlives the app would quietly resurrect picks
 * from a board the recipient has already ordered from.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CatalogItem } from '../../domain';

export type CartValue = {
  items: CatalogItem[];
  /** Which board this bag belongs to, so a different board starts empty. */
  boardId: string | null;
  count: number;
  total: number;
  has: (itemId: string) => boolean;
  add: (item: CatalogItem, boardId: string) => void;
  remove: (itemId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [boardId, setBoardId] = useState<string | null>(null);

  const add = useCallback((item: CatalogItem, forBoard: string) => {
    setBoardId(current => {
      // Opening a different board starts a fresh bag. Carrying picks across
      // boards would put someone else's curation in this order.
      if (current !== null && current !== forBoard) {
        setItems([item]);
        return forBoard;
      }
      // No quantities: this is a set of picks, not a grocery basket, and
      // adding the same shirt twice is a misclick rather than an intent.
      setItems(existing =>
        existing.some(entry => entry.id === item.id) ? existing : [...existing, item],
      );
      return forBoard;
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setItems(existing => existing.filter(entry => entry.id !== itemId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setBoardId(null);
  }, []);

  const has = useCallback(
    (itemId: string) => items.some(entry => entry.id === itemId),
    [items],
  );

  const value = useMemo<CartValue>(
    () => ({
      items,
      boardId,
      count: items.length,
      total: items.reduce((sum, entry) => sum + entry.price, 0),
      has,
      add,
      remove,
      clear,
    }),
    [items, boardId, has, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const cart = useContext(CartContext);
  if (cart === null) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return cart;
}
