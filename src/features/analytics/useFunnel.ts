import { useCallback } from 'react';
import { useRepositories } from '../../data';
import { newId } from '../../domain';
import type { FunnelEvent, FunnelEventName } from '../../domain';
import { useSession } from '../session';

export type TrackFn = (
  name: FunnelEventName,
  boardId: string,
  detail?: FunnelEvent['detail'],
) => void;

/**
 * Records funnel events. Fire-and-forget by design: the call returns void so
 * no screen is tempted to await a counter, and the adapters never reject.
 *
 * The user id is attached automatically when there is one — board_sent has a
 * stylist, board_opened may not have a recipient yet.
 */
export function useFunnel(): TrackFn {
  const repos = useRepositories();
  const { user } = useSession();

  return useCallback(
    (name, boardId, detail) => {
      const event: FunnelEvent = {
        id: newId('evt'),
        name,
        boardId,
        // Stamped here, not server-side: the ordering that matters is what the
        // person did, and a device clock is closer to that than write latency.
        at: new Date().toISOString(),
        ...(user === null ? {} : { userId: user.id }),
        ...(detail === undefined ? {} : { detail }),
      };
      // Not awaited on purpose — see the contract above. `track` already
      // swallows its own failures, so there is nothing here to handle.
      repos.analytics.track(event).catch(() => {});
    },
    [repos, user],
  );
}
