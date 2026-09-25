import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { publishBoardImages, useRepositories } from '../../data';
import type { UploadProgress } from '../../data';
import { generateShareCode } from '../../domain';
import type { Board } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Card, EmptyState, Screen, Text, colors, spacing } from '../../ui';
import { useFunnel } from '../analytics';

type Route = RouteProp<RootStackParamList, 'ShareBoard'>;

/** Generation is cheap and collisions are rare; give up rather than spin. */
const MAX_CODE_ATTEMPTS = 8;

export function ShareBoardScreen() {
  const { boardId } = useRoute<Route>().params;
  const repos = useRepositories();
  const track = useFunnel();

  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    /**
     * Uploads the images, then assigns a code the first time and reuses it
     * after. Regenerating on every visit would invalidate a code already
     * sitting in somebody's text messages.
     *
     * Images go first deliberately: the code must not exist until the board
     * behind it is actually viewable, or the recipient types it in and gets a
     * grid of broken tiles.
     */
    async function ensureShared(): Promise<Board> {
      const found = await repos.boards.getById(boardId);
      if (found === null) {
        throw new Error('That board no longer exists.');
      }

      const published = await publishBoardImages(found, next => {
        if (!cancelled) {
          setProgress(next);
        }
      });
      const uploaded = published !== found;

      if (found.shareCode !== undefined) {
        // Nothing new to say, but the URLs may have changed.
        return uploaded ? repos.boards.save(published) : found;
      }

      const shareCode = await allocateCode();
      const shared: Board = {
        ...published,
        shareCode,
        sentAt: found.sentAt ?? new Date().toISOString(),
      };
      return repos.boards.save(shared);
    }

    async function allocateCode(): Promise<string> {
      for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
        const candidate = generateShareCode();
        const taken = await repos.boards.findByShareCode(candidate);
        if (taken === null) {
          return candidate;
        }
      }
      throw new Error('Could not find a free code. Try again in a moment.');
    }

    ensureShared()
      .then(result => {
        if (!cancelled) {
          setBoard(result);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repos, boardId]);

  const onShare = useCallback(() => {
    if (board?.shareCode === undefined) {
      return;
    }
    // Hands off to the OS sheet — the plan sends boards over the couple's own
    // text messages rather than building any in-app messaging.
    // Recorded here rather than when the code is generated. Opening this
    // screen is not sending — counting it would inflate the denominator with
    // boards that never left her phone.
    track('board_sent', board.id, { pins: board.pins.length });
    Share.share({ message: invitation(board.title, board.shareCode) }).catch(() => {
      // A dismissed share sheet is not a failure worth reporting.
    });
  }, [board, track]);

  if (error !== null) {
    return (
      <Screen>
        <EmptyState tone="danger" title="Could not share this board" body={error} />
      </Screen>
    );
  }

  if (board?.shareCode === undefined) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
        {progress !== null && progress.done < progress.total ? (
          <Text variant="caption" tone="muted" center style={styles.body}>
            Sending your pictures… {progress.done} of {progress.total}
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title" style={styles.title}>
        {board.title} is ready to send
      </Text>
      <Text variant="body" tone="muted" style={styles.body}>
        Send him this code. He enters it in the app to see what you picked.
      </Text>

      <Card style={styles.codeCard}>
        <Text variant="caption" tone="muted" center>
          His code
        </Text>
        <Text variant="display" center style={styles.code} selectable>
          {board.shareCode}
        </Text>
      </Card>

      <Button testID="share-board" label="Send it" onPress={onShare} />

      <Text variant="caption" tone="muted" center style={styles.footnote}>
        {board.pins.length === 1 ? '1 pin' : `${board.pins.length} pins`} · the code
        keeps working, so you can send it again.
      </Text>
    </Screen>
  );
}

function invitation(title: string, code: string): string {
  return `I made you a board on The Girlfriend Effect — "${title}". Open the app and enter ${code}.`;
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  title: { marginTop: spacing.lg },
  body: { marginTop: spacing.sm },
  codeCard: { marginVertical: spacing.xl },
  code: {
    marginTop: spacing.xs,
    // Wide tracking so the code is read one character at a time, which is how
    // it gets copied into a message.
    letterSpacing: 4,
  },
  footnote: { marginTop: spacing.md },
});
