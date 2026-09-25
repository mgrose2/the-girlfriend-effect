import { setDoc } from '@react-native-firebase/firestore';
import type { FunnelEvent } from '../../domain';
import type { AnalyticsRepository } from '../ports';
import { COLLECTIONS, docRef, readWhere, stripUndefined } from './collections';

export class FirestoreAnalyticsRepository implements AnalyticsRepository {
  async track(event: FunnelEvent): Promise<void> {
    try {
      await setDoc(docRef(COLLECTIONS.events, event.id), stripUndefined(event));
    } catch (cause) {
      // Swallowed on purpose. A dropped event costs one data point; an
      // unhandled rejection here would break the very flow being measured,
      // which costs the whole run.
      console.warn('[funnel] failed to record', event.name, String(cause));
    }
  }

  async listByBoard(boardId: string): Promise<FunnelEvent[]> {
    const events = await readWhere<FunnelEvent>(COLLECTIONS.events, 'boardId', boardId);
    return events.sort((a, b) => a.at.localeCompare(b.at));
  }
}
