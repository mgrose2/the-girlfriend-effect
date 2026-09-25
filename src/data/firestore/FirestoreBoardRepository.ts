import { deleteDoc, setDoc } from '@react-native-firebase/firestore';
import type { Board } from '../../domain';
import type { BoardRepository } from '../ports';
import {
  byCreatedAtDesc,
  COLLECTIONS,
  docRef,
  readDoc,
  readWhere,
  stripUndefined,
} from './collections';

export class FirestoreBoardRepository implements BoardRepository {
  async getById(id: string): Promise<Board | null> {
    return readDoc<Board>(COLLECTIONS.boards, id);
  }

  async findByShareCode(shareCode: string): Promise<Board | null> {
    // Queried against the stored code exactly, so the normalising has to
    // happen before this call — domain/normalizeShareCode is what the join
    // screen runs. Firestore has no case-insensitive equality to fall back on.
    const matches = await readWhere<Board>(
      COLLECTIONS.boards,
      'shareCode',
      normalize(shareCode),
    );
    return matches[0] ?? null;
  }

  async listByOwner(ownerId: string): Promise<Board[]> {
    const boards = await readWhere<Board>(COLLECTIONS.boards, 'ownerId', ownerId);
    // Sorted here rather than with orderBy: adding one would require a
    // composite index, and this list is a handful of documents.
    return boards.sort(byCreatedAtDesc);
  }

  async save(board: Board): Promise<Board> {
    // Codes are stored upper-cased so the equality query above has a single
    // canonical form to match.
    const normalized: Board =
      board.shareCode === undefined
        ? board
        : { ...board, shareCode: normalize(board.shareCode) };
    await setDoc(docRef(COLLECTIONS.boards, board.id), stripUndefined(normalized));
    return normalized;
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(docRef(COLLECTIONS.boards, id));
  }
}

function normalize(shareCode: string): string {
  return shareCode.trim().toUpperCase();
}
