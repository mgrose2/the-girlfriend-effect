import type { FunnelEvent } from '../../domain';
import type { AnalyticsRepository } from '../ports';
import { KEYS, readCollection, writeCollection } from './storage';

export class LocalAnalyticsRepository implements AnalyticsRepository {
  async track(event: FunnelEvent): Promise<void> {
    try {
      const events = await readCollection<FunnelEvent>(KEYS.events);
      events[event.id] = event;
      await writeCollection(KEYS.events, events);
    } catch (cause) {
      // Same contract as the Firestore adapter: never reject. A dropped event
      // costs one data point; breaking the flow costs the whole run.
      console.warn('[funnel] failed to record', event.name, String(cause));
    }
  }

  async listByBoard(boardId: string): Promise<FunnelEvent[]> {
    const events = await readCollection<FunnelEvent>(KEYS.events);
    return Object.values(events)
      .filter(event => event.boardId === boardId)
      .sort((a, b) => a.at.localeCompare(b.at));
  }
}
