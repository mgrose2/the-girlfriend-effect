import { Image, StyleSheet, View } from 'react-native';
import type { Board } from '../../domain';
import { Card, Chip, Text, colors, radius, spacing } from '../../ui';

/** How many pin thumbnails fit on a row of the card without crowding it. */
const PREVIEW_COUNT = 4;

export function BoardCard({ board, onPress }: { board: Board; onPress: () => void }) {
  const preview = board.pins.slice(0, PREVIEW_COUNT);
  const overflow = board.pins.length - preview.length;

  return (
    <Card onPress={onPress} testID={`board-${board.id}`} style={styles.card}>
      <Text variant="heading">{board.title}</Text>

      <View style={styles.tags}>
        {board.styleTags.map(tag => (
          <Chip key={tag} label={tag} />
        ))}
      </View>

      {preview.length > 0 ? (
        <View style={styles.preview}>
          {preview.map(pin => (
            <Image key={pin.id} source={{ uri: pin.imageUrl }} style={styles.thumb} />
          ))}
          {overflow > 0 ? (
            <View style={[styles.thumb, styles.overflow]}>
              <Text variant="caption" tone="muted">
                +{overflow}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text variant="caption" tone="muted" style={styles.meta}>
        {describe(board)}
      </Text>
    </Card>
  );
}

function describe(board: Board): string {
  const pins = board.pins.length === 1 ? '1 pin' : `${board.pins.length} pins`;
  return board.sentAt === undefined ? `${pins} · draft` : `${pins} · sent`;
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  preview: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  thumb: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { marginTop: spacing.sm },
});
