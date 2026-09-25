import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRepositories } from '../../data';
import type { Board, Order } from '../../domain';

export type BoardOrderSummary = {
  /** Items ordered off this board, across every order placed from it. */
  itemCount: number;
  total: number;
  lastOrderedAt: string;
};

/**
 * Orders placed against each of these boards, keyed by board id.
 *
 * This is the payoff loop: "he ordered three of your picks" is what makes a
 * stylist send a second board, and per plan §5.3 it is the thing that closes
 * the emotional circuit rather than a stat for us.
 */
export function useBoardOrders(boards: Board[]): Map<string, BoardOrderSummary> {
  const repos = useRepositories();
  const [summaries, setSummaries] = useState<Map<string, BoardOrderSummary>>(new Map());

  // Depend on the ids rather than the array, which is a new reference on every
  // reload of the board list and would otherwise re-query forever.
  const key = boards.map(board => board.id).join(',');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const ids = key.length === 0 ? [] : key.split(',');

      Promise.all(
        ids.map(async id => [id, await repos.orders.listByBoard(id)] as const),
      )
        .then(entries => {
          if (cancelled) {
            return;
          }
          const next = new Map<string, BoardOrderSummary>();
          for (const [id, orders] of entries) {
            const summary = summarize(orders);
            if (summary !== null) {
              next.set(id, summary);
            }
          }
          setSummaries(next);
        })
        .catch(() => {
          // A board list that cannot load its receipts is still a usable board
          // list. Failing quietly beats blocking the stylist's own boards.
        });

      return () => {
        cancelled = true;
      };
    }, [repos, key]),
  );

  return summaries;
}

function summarize(orders: Order[]): BoardOrderSummary | null {
  if (orders.length === 0) {
    return null;
  }
  return {
    itemCount: orders.reduce((sum, order) => sum + order.items.length, 0),
    total: orders.reduce((sum, order) => sum + order.total, 0),
    // listByBoard is newest-first in both adapters.
    lastOrderedAt: orders[0]?.createdAt ?? '',
  };
}
