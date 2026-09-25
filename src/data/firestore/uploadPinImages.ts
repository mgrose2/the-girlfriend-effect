/**
 * Pin images have to leave the phone before a board is any use to anyone else.
 *
 * Sprint 2 stores whatever the picker returned — a `file://` path inside this
 * app's own cache. That is meaningless on the other phone: the path either
 * does not exist or belongs to a different app. Sharing a board without this
 * step produces a grid of broken tiles on the receiving side.
 */

import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import type { Board, Pin } from '../../domain';

/** Already-remote images are left alone — re-uploading them would be pointless. */
function needsUpload(imageUrl: string): boolean {
  return !/^https?:\/\//i.test(imageUrl);
}

export type UploadProgress = {
  /** Pins uploaded so far, including ones that needed no work. */
  done: number;
  total: number;
};

/**
 * Uploads every local pin image and returns the board with remote URLs.
 *
 * Uploads run in sequence rather than in parallel. A board is capped at 12
 * pins, and twelve simultaneous uploads on a phone's uplink is how you get a
 * share that appears to hang.
 */
export async function uploadPinImages(
  board: Board,
  onProgress?: (progress: UploadProgress) => void,
): Promise<Board> {
  const storage = getStorage();
  const pins: Pin[] = [];
  let done = 0;

  for (const pin of board.pins) {
    if (!needsUpload(pin.imageUrl)) {
      pins.push(pin);
    } else {
      // Keyed by board and pin id, so re-sending a board overwrites its own
      // images instead of accumulating orphans in the bucket.
      const target = ref(storage, `boards/${board.id}/${pin.id}.jpg`);
      try {
        await putFile(target, stripScheme(pin.imageUrl));
        pins.push({ ...pin, imageUrl: await getDownloadURL(target) });
      } catch (cause) {
        throw new Error(describeUploadFailure(cause), { cause });
      }
    }
    done += 1;
    onProgress?.({ done, total: board.pins.length });
  }

  return { ...board, pins };
}

/**
 * putFile wants a filesystem path. The picker hands back `file:///…`, and
 * passing the scheme through makes the native side look for a file literally
 * named "file:".
 */
function stripScheme(uri: string): string {
  return uri.replace(/^file:\/\//i, '');
}

/**
 * The raw SDK strings are no use to a stylist mid-send. `object-not-found` on
 * an *upload* is the confusing one: it does not mean a missing file, it means
 * the bucket itself is not there — which is what an unprovisioned Firebase
 * Storage looks like from the client.
 */
function describeUploadFailure(cause: unknown): string {
  const text = String(cause);
  if (text.includes('object-not-found') || text.includes('bucket-not-found')) {
    return 'Picture storage is not set up for this app yet, so the board cannot be sent.';
  }
  if (text.includes('unauthorized') || text.includes('permission')) {
    return 'Not allowed to upload pictures. Check the Storage rules.';
  }
  if (text.includes('retry-limit') || text.includes('network')) {
    return 'Could not upload the pictures. Check your connection and try again.';
  }
  return `Could not upload the pictures: ${text}`;
}
