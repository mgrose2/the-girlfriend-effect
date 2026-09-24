/**
 * Dev-only data helpers. Part of the data module's public surface so a screen
 * can call them without reaching into `local/` — which the eslint rule
 * forbids and which would break the moment Firestore lands.
 *
 * Gated at the call site by `flags.showDevTools`, which is `__DEV__`.
 */

import { newId } from '../domain';
import type { Board, User } from '../domain';
import { clearLocalStorage } from './local';
import type { Repositories } from './ports';

/**
 * Wipes every key this app owns. The catalog needs no reload — it is seed
 * data served straight from the bundle, never persisted.
 */
export async function resetAllData(): Promise<void> {
  await clearLocalStorage();
}

export type SeedResult = {
  stylist: User;
  board: Board;
};

/**
 * Writes one stylist and one board, then reads the board back through the
 * repository rather than trusting the write. This is the round trip Sprint 1
 * is finished when it can do.
 */
export async function seedSampleBoard(repos: Repositories): Promise<SeedResult> {
  const stylist: User = {
    id: newId('user'),
    name: 'Sample Stylist',
    role: 'stylist',
  };
  await repos.users.save(stylist);

  const board: Board = {
    id: newId('board'),
    ownerId: stylist.id,
    title: 'Autumn Layers',
    styleTags: ['old money', 'workwear'],
    pins: [
      {
        id: newId('pin'),
        imageUrl: 'https://placehold.co/600x800/EFE0D9/1C1917?text=Chore+Coat',
        note: 'Something like this but in olive',
        tags: ['workwear'],
      },
      {
        id: newId('pin'),
        imageUrl: 'https://placehold.co/600x800/EFE0D9/1C1917?text=Oxford+Shirt',
        tags: ['old money'],
      },
    ],
    createdAt: new Date().toISOString(),
  };
  await repos.boards.save(board);

  const readBack = await repos.boards.getById(board.id);
  if (readBack === null) {
    throw new Error(`Seed wrote board ${board.id} but could not read it back`);
  }

  return { stylist, board: readBack };
}
