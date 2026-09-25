import { setDoc } from '@react-native-firebase/firestore';
import type { Order } from '../../domain';
import type { OrderRepository } from '../ports';
import {
  byCreatedAtDesc,
  COLLECTIONS,
  docRef,
  readDoc,
  readWhere,
  stripUndefined,
} from './collections';

export class FirestoreOrderRepository implements OrderRepository {
  async create(order: Order): Promise<Order> {
    await setDoc(docRef(COLLECTIONS.orders, order.id), stripUndefined(order));
    return order;
  }

  async getById(id: string): Promise<Order | null> {
    return readDoc<Order>(COLLECTIONS.orders, id);
  }

  async listByBoard(boardId: string): Promise<Order[]> {
    const orders = await readWhere<Order>(COLLECTIONS.orders, 'boardId', boardId);
    return orders.sort(byCreatedAtDesc);
  }

  async listByRecipient(recipientId: string): Promise<Order[]> {
    const orders = await readWhere<Order>(COLLECTIONS.orders, 'recipientId', recipientId);
    return orders.sort(byCreatedAtDesc);
  }
}
