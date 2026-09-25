import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDoc } from '@react-native-firebase/firestore';
import type { Role, User } from '../../domain';
import type { UserRepository } from '../ports';
import { COLLECTIONS, docRef, readDoc, stripUndefined } from './collections';

/**
 * Which user this install is. Stays on the device rather than in Firestore —
 * "who is holding this phone" is a property of the phone, and putting it in a
 * shared database would mean two testers could overwrite each other.
 */
const CURRENT_USER_KEY = 'tge:currentUserId';

export class FirestoreUserRepository implements UserRepository {
  async getById(id: string): Promise<User | null> {
    return readDoc<User>(COLLECTIONS.users, id);
  }

  async findByRole(role: Role): Promise<User | null> {
    // Scoped to this device's own user ids, not a global query: every tester
    // shares one Firestore project, so asking for "a stylist" globally would
    // hand back a stranger's account.
    const id = await AsyncStorage.getItem(roleKey(role));
    if (id === null) {
      return null;
    }
    return this.getById(id);
  }

  async save(user: User): Promise<User> {
    await setDoc(docRef(COLLECTIONS.users, user.id), stripUndefined(user));
    await AsyncStorage.setItem(roleKey(user.role), user.id);
    return user;
  }

  async getCurrent(): Promise<User | null> {
    const id = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (id === null) {
      return null;
    }
    return this.getById(id);
  }

  async setCurrent(userId: string | null): Promise<void> {
    if (userId === null) {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      return;
    }
    await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
  }
}

function roleKey(role: Role): string {
  return `tge:userId:${role}`;
}

/** The device-local keys this adapter owns, so the reset helper can clear them. */
export const FIRESTORE_LOCAL_KEYS = [
  CURRENT_USER_KEY,
  roleKey('stylist'),
  roleKey('recipient'),
];
