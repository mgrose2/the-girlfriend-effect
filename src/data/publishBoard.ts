/**
 * Getting a board into a state the *other* phone can actually render.
 *
 * Lives on the data barrel rather than in `firestore/` so the share screen can
 * call it without importing a concrete adapter — the same rule that keeps
 * every other screen backend-agnostic.
 */

import { flags } from '../config';
import type { Board } from '../domain';
import { uploadPinImages } from './firestore/uploadPinImages';
import type { UploadProgress } from './firestore/uploadPinImages';

export type { UploadProgress };

/**
 * Uploads any local pin images and returns the board with shareable URLs.
 *
 * On the local backend this is a no-op: there is no second device to render
 * anything, and an offline dev build should not need a network round trip to
 * open the share screen.
 */
export async function publishBoardImages(
  board: Board,
  onProgress?: (progress: UploadProgress) => void,
): Promise<Board> {
  if (flags.backend === 'local') {
    return board;
  }
  return uploadPinImages(board, onProgress);
}
