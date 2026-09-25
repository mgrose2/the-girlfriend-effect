import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRepositories } from '../../data';
import { matchCatalog } from '../../domain';
import type { Board, CatalogItem, Category, SizingProfile } from '../../domain';

export type CuratedShopState = {
  board: Board | null;
  /** Everything that matched, before any category filter. */
  matched: CatalogItem[];
  /** What the grid should render, after the filter. */
  items: CatalogItem[];
  /** Only the categories actually present, so no filter leads to a dead end. */
  categories: Category[];
  loading: boolean;
  /** Set when the shop cannot be built at all, as opposed to being empty. */
  error: string | null;
};

/** Reads better than alphabetical — roughly how an outfit is assembled. */
const CATEGORY_ORDER: Category[] = ['top', 'bottom', 'outerwear', 'shoes', 'accessory'];

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
  category: Category | null = null,
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

  const matched = useMemo(() => {
    if (board === null || sizing === undefined) {
      return [];
    }
    return matchCatalog(catalog, board, sizing);
  }, [catalog, board, sizing]);

  // Derived from what matched, not from the full Category union: offering
  // "shoes" on a board with no matching shoes is a filter that can only
  // disappoint.
  const categories = useMemo(() => {
    const present = new Set(matched.map(item => item.category));
    return CATEGORY_ORDER.filter(entry => present.has(entry));
  }, [matched]);

  const items = useMemo(
    () =>
      category === null ? matched : matched.filter(item => item.category === category),
    [matched, category],
  );

  return { board, matched, items, categories, loading, error };
}
