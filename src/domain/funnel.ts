/**
 * The funnel. Plan §1: the test card's question is numeric — does the hit rate
 * clear 50% — and without timestamped events at each step the test round ends
 * with impressions instead of a number.
 *
 * Every event carries `boardId`, because the whole measurement is per-board:
 * of the boards that were sent, how many produced an order.
 */

export const FUNNEL_EVENTS = [
  /** Stylist generated a code and shared it. The denominator. */
  'board_sent',
  /** Recipient resolved a code. First sign he engaged at all. */
  'board_opened',
  'intake_completed',
  /** Fires per item, so a drop-off between browsing and ordering is visible. */
  'item_added',
  /** The numerator. */
  'order_placed',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];

export interface FunnelEvent {
  id: string;
  name: FunnelEventName;
  boardId: string;
  /** Who did it, when known. Absent for events before an identity exists. */
  userId?: string;
  /** ISO 8601, set on the device at the moment it happened. */
  at: string;
  /**
   * Small extras — item id, order total. Deliberately narrow: this is a funnel
   * counter, not an analytics platform, and a loose bag of fields would rot.
   */
  detail?: Record<string, string | number>;
}
