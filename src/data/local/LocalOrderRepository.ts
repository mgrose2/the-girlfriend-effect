import type { Order } from '../../domain';
import type { OrderRepository } from '../ports';
import { byCreatedAtDesc, KEYS, readCollection, writeCollection } from './storage';

export class LocalOrderRepository implements OrderRepository {
  async create(order: Order): Promise<Order> {
    const orders = await readCollection<Order>(KEYS.orders);
    orders[order.id] = order;
    await writeCollection(KEYS.orders, orders);
    return order;
  }

  async getById(id: string): Promise<Order | null> {
    const orders = await readCollection<Order>(KEYS.orders);
    return orders[id] ?? null;
  }

  async listByBoard(boardId: string): Promise<Order[]> {
    return this.query(order => order.boardId === boardId);
  }

  async listByRecipient(recipientId: string): Promise<Order[]> {
    return this.query(order => order.recipientId === recipientId);
  }

  private async query(predicate: (order: Order) => boolean): Promise<Order[]> {
    const orders = await readCollection<Order>(KEYS.orders);
    return Object.values(orders).filter(predicate).sort(byCreatedAtDesc);
  }
}
