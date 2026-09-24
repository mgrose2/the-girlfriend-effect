import type { Board } from '../../domain';
import type { BoardRepository } from '../ports';
import { byCreatedAtDesc, KEYS, readCollection, writeCollection } from './storage';

export class LocalBoardRepository implements BoardRepository {
  async getById(id: string): Promise<Board | null> {
    const boards = await readCollection<Board>(KEYS.boards);
    return boards[id] ?? null;
  }

  async findByShareCode(shareCode: string): Promise<Board | null> {
    const boards = await readCollection<Board>(KEYS.boards);
    // Codes are typed in by hand off a text message, so casing and padding
    // are the recipient's problem to get wrong and ours to absorb.
    const wanted = normalizeCode(shareCode);
    const match = Object.values(boards).find(
      board => board.shareCode !== undefined && normalizeCode(board.shareCode) === wanted,
    );
    return match ?? null;
  }

  async listByOwner(ownerId: string): Promise<Board[]> {
    const boards = await readCollection<Board>(KEYS.boards);
    return Object.values(boards)
      .filter(board => board.ownerId === ownerId)
      .sort(byCreatedAtDesc);
  }

  async save(board: Board): Promise<Board> {
    const boards = await readCollection<Board>(KEYS.boards);
    boards[board.id] = board;
    await writeCollection(KEYS.boards, boards);
    return board;
  }

  async remove(id: string): Promise<void> {
    const boards = await readCollection<Board>(KEYS.boards);
    delete boards[id];
    await writeCollection(KEYS.boards, boards);
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}
