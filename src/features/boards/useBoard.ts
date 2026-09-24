import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRepositories } from '../../data';
import type { Board } from '../../domain';

export type BoardState = {
  board: Board | null;
  loading: boolean;
  error: string | null;
  /**
   * Applies a change and persists it. The local copy updates first so the grid
   * does not flicker while AsyncStorage settles; a failed write rolls back.
   */
  update: (change: (current: Board) => Board) => Promise<void>;
};

export function useBoard(boardId: string): BoardState {
  const repos = useRepositories();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On focus, not mount: the pin-details screen sits on top of the editor and
  // writes to the same board, so the editor has to re-read on the way back or
  // it renders a grid missing the pin just added.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      repos.boards
        .getById(boardId)
        .then(found => {
          if (!cancelled) {
            setBoard(found);
            setError(found === null ? 'That board no longer exists.' : null);
          }
        })
        .catch((cause: unknown) => {
          if (!cancelled) {
            setError(String(cause));
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
    }, [repos, boardId]),
  );

  const update = useCallback(
    async (change: (current: Board) => Board) => {
      if (board === null) {
        return;
      }
      const previous = board;
      const next = change(board);
      setBoard(next);
      try {
        await repos.boards.save(next);
      } catch (cause) {
        setBoard(previous);
        setError(String(cause));
        throw cause;
      }
    },
    [board, repos],
  );

  return { board, loading, error, update };
}
