import type { User } from '../../domain';
import type { UserRepository } from '../ports';
import { KEYS, readCollection, readValue, writeCollection, writeValue } from './storage';

export class LocalUserRepository implements UserRepository {
  async getById(id: string): Promise<User | null> {
    const users = await readCollection<User>(KEYS.users);
    return users[id] ?? null;
  }

  async save(user: User): Promise<User> {
    const users = await readCollection<User>(KEYS.users);
    users[user.id] = user;
    await writeCollection(KEYS.users, users);
    return user;
  }

  async getCurrent(): Promise<User | null> {
    const id = await readValue(KEYS.currentUserId);
    if (id === null) {
      return null;
    }
    // The pointer can outlive the record if storage was partially cleared;
    // getById returning null is the right answer, not a crash.
    return this.getById(id);
  }

  async setCurrent(userId: string | null): Promise<void> {
    await writeValue(KEYS.currentUserId, userId);
  }
}
