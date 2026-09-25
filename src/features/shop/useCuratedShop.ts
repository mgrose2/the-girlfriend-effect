import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRepositories } from '../../data';
import { matchCatalog } from '../../domain';
import type { Board, CatalogItem, SizingProfile } from '../../domain';

export type CuratedShopState = {
  board: Board | null;
  items: CatalogItem[];
  loading: boolean;
  /** Set when the shop cannot be built at all, as opposed to being empty. */
  error: string | null;
};

/**
 * The board's picks, filtered by the recipient's sizes.
 *
 * Matching runs here rather than in the screen so the screen has nothing to
 * decide — `matchCatalog` is the tested logic from 1.4 and this is its only
 * caller.
 */
export function useCuratedShop(
  boardId: string,
  sizing: SizingProfile | undefined,
): CuratedShopState {
  const repos = useRepositories();
  const [board, setBoard] = useState<Board | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [found, items] = await Promise.all([
      repos.boards.getById(boardId),
      repos.catalog.list(),
    ]);
    if (found === null) {
      throw new Error('That board no longer exists.');
    }
    return { found, items };
  }, [repos, boardId]);

  useEffect(() => {
    let cancelled = false;
    load()
      .then(({ found, items }) => {
        if (!cancelled) {
          setBoard(found);
          setCatalog(items);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const items = useMemo(() => {
    if (board === null || sizing === undefined) {
      return [];
    }
    return matchCatalog(catalog, board, sizing);
  }, [catalog, board, sizing]);

  return { board, items, loading, error };
}
