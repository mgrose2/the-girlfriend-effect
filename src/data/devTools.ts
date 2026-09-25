/**
 * Dev-only data helpers. Part of the data module's public surface so a screen
 * can call them without reaching into `local/` — which the eslint rule
 * forbids and which would break the moment Firestore lands.
 *
 * Gated at the call site by `flags.showDevTools`, which is `__DEV__`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateShareCode, newId } from '../domain';
import type { Board, StyleTag, User } from '../domain';
import { FIRESTORE_LOCAL_KEYS } from './firestore';
import { clearLocalStorage } from './local';
import type { Repositories } from './ports';

/**
 * Clears this device's data. The catalog needs no reload — it is seed data
 * served straight from the bundle, never persisted.
 *
 * Device-local only, deliberately. On the Firestore backend the boards and
 * orders stay in the shared database: a tester resetting their own phone must
 * not delete the board their partner is still looking at. What goes is the
 * identity, which is what makes the app behave like a fresh install.
 *
 * Pass the ids of records you expect to be gone and they are read back through
 * the repositories afterwards. Jest cannot cover this — AsyncStorage is native
 * — so the check has to happen on device or not at all.
 */
export async function resetAllData(repos?: Repositories): Promise<void> {
  await clearLocalStorage();
  await AsyncStorage.removeMany([...FIRESTORE_LOCAL_KEYS]);

  if (repos === undefined) {
    return;
  }

  // Verify the one thing that must be true on either backend: this device no
  // longer has an identity. Checking that a board is gone would be wrong on
  // Firestore, where the board is supposed to survive — it belongs to the
  // other phone too.
  const current = await repos.users.getCurrent();
  if (current !== null) {
    throw new Error(`Reset left ${current.id} signed in`);
  }
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
        // .png matters — placehold.co serves SVG otherwise, which RN cannot render.
        imageUrl: 'https://placehold.co/600x800/EFE0D9/1C1917.png?text=Chore+Coat',
        note: 'Something like this but in olive',
        tags: ['workwear'],
      },
      {
        id: newId('pin'),
        imageUrl: 'https://placehold.co/600x800/EFE0D9/1C1917.png?text=Oxford+Shirt',
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

export type DemoBoard = { title: string; shareCode: string };

type DemoBoardSpec = {
  title: string;
  styleTags: StyleTag[];
  pinLabels: string[];
};

const DEMO_BOARDS: DemoBoardSpec[] = [
  { title: 'Fall Layers', styleTags: ['old money', 'workwear'], pinLabels: ['Chore Coat', 'Oxford Shirt'] },
  { title: 'Street Ready', styleTags: ['streetwear'], pinLabels: ['Graphic Tee', 'Cargo Pants', 'Low Sneakers'] },
  { title: 'Weekend Casual', styleTags: ['athleisure', 'minimal'], pinLabels: ['Half-Zip', 'Jogger'] },
  { title: 'Office Neutral', styleTags: ['workwear', 'minimal'], pinLabels: ['Blazer', 'Trouser', 'Loafer'] },
];

/**
 * Writes several boards that are already "sent" — a share code and `sentAt`
 * assigned up front, no stylist device required to produce them. A tester
 * can join one straight away, which is the point: 6.4 exists so nobody
 * installing the APK stares at an empty app before they can try anything.
 *
 * A fresh demo stylist is created each call rather than reused, so re-running
 * this after a reset can't collide with a stylist id that no longer exists.
 */
export async function seedDemoBoards(repos: Repositories): Promise<DemoBoard[]> {
  const stylist: User = {
    id: newId('user'),
    name: 'Demo Stylist',
    role: 'stylist',
  };
  await repos.users.save(stylist);

  const results: DemoBoard[] = [];
  for (const spec of DEMO_BOARDS) {
    const now = new Date().toISOString();
    const board: Board = {
      id: newId('board'),
      ownerId: stylist.id,
      title: spec.title,
      styleTags: spec.styleTags,
      pins: spec.pinLabels.map(label => ({
        id: newId('pin'),
        // .png matters — placehold.co serves SVG otherwise, which RN cannot render.
        imageUrl: `https://placehold.co/600x800/EFE0D9/1C1917.png?text=${encodeURIComponent(label)}`,
        tags: spec.styleTags,
      })),
      createdAt: now,
      sentAt: now,
      shareCode: generateShareCode(),
    };
    const saved = await repos.boards.save(board);
    results.push({ title: saved.title, shareCode: saved.shareCode ?? '' });
  }

  return results;
}
