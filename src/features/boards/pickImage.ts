import { launchImageLibrary } from 'react-native-image-picker';

export type PickResult =
  | { status: 'picked'; uri: string }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

/**
 * Opens the system photo picker and returns one image.
 *
 * No runtime permission is requested: `launchImageLibrary` hands off to the
 * OS picker, which grants access to the single chosen file. Asking for
 * READ_MEDIA_IMAGES would be a scarier prompt for strictly less access.
 *
 * The picked file is copied into the app's cache by the library, so the URI is
 * a local `file://` path. That is invisible to any other device — Sprint 3.6
 * is what uploads it and makes sharing actually work.
 */
export async function pickImageFromLibrary(): Promise<PickResult> {
  try {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      // Compress on pick, per the plan's image-upload risk: these get uploaded
      // in 3.6 and a full-resolution camera photo is megabytes of nothing.
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 0.8,
    });

    if (response.didCancel === true) {
      return { status: 'cancelled' };
    }
    if (response.errorCode !== undefined) {
      return {
        status: 'failed',
        message: response.errorMessage ?? `Photo picker failed (${response.errorCode}).`,
      };
    }

    const uri = response.assets?.[0]?.uri;
    if (uri === undefined) {
      return { status: 'failed', message: 'That photo could not be read.' };
    }
    return { status: 'picked', uri };
  } catch (cause) {
    return { status: 'failed', message: String(cause) };
  }
}
