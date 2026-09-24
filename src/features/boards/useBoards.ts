import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRepositories } from '../../data';
import type { Board } from '../../domain';

export type BoardsState = {
  boards: Board[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Boards owned by `ownerId`, reloaded every time the screen regains focus.
 *
 * Focus rather than mount: the list sits under the create and editor screens,
 * so a board added there has to show up on the way back without a manual pull
 * to refresh.
 */
export function useBoards(ownerId: string): BoardsState {
  const repos = useRepositories();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      repos.boards
        .listByOwner(ownerId)
        .then(result => {
          if (!cancelled) {
            setBoards(result);
            setError(null);
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
      // nonce is the manual reload trigger; it has no other use here.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repos, ownerId, nonce]),
  );

  return { boards, loading, error, reload };
}
