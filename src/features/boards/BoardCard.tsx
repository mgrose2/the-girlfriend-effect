import { Image, StyleSheet, View } from 'react-native';
import type { Board } from '../../domain';
import { Card, Chip, Text, colors, radius, spacing } from '../../ui';
import type { BoardOrderSummary } from './useBoardOrders';

/** How many pin thumbnails fit on a row of the card without crowding it. */
const PREVIEW_COUNT = 4;

export type BoardCardProps = {
  board: Board;
  /** Present once anything has been ordered off this board. */
  orders?: BoardOrderSummary;
  onPress: () => void;
};

export function BoardCard({ board, orders, onPress }: BoardCardProps) {
  const overflow = Math.max(0, board.pins.length - PREVIEW_COUNT);
  // When there is overflow, the last slot becomes the "+N" tile.
  const preview = board.pins.slice(0, overflow > 0 ? PREVIEW_COUNT - 1 : PREVIEW_COUNT);
  const filled = preview.length + (overflow > 0 ? 1 : 0);
  const padding = Array.from(
    { length: PREVIEW_COUNT - filled },
    (_, index) => `spacer-${index}`,
  );

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
            // Sizing on the wrapper, not the Image: aspectRatio applied
            // straight to an Image lays out the box without drawing anything.
            <View key={pin.id} style={styles.thumb}>
              <Image source={{ uri: pin.imageUrl }} style={styles.thumbImage} />
            </View>
          ))}
          {overflow > 0 ? (
            <View style={[styles.thumb, styles.overflow]}>
              <Text variant="caption" tone="muted">
                +{overflow}
              </Text>
            </View>
          ) : null}
          {/* Empty slots keep every thumbnail the same size. Without them a
              one-pin board stretches its single flex:1 thumb across the whole
              row, and the 3:4 ratio then makes the card taller than the
              screen. */}
          {padding.map(key => (
            <View key={key} style={styles.thumbSpacer} />
          ))}
        </View>
      ) : null}

      {orders === undefined ? (
        <Text variant="caption" tone="muted" style={styles.meta}>
          {describe(board)}
        </Text>
      ) : (
        <View style={styles.receipt}>
          <Text variant="label" tone="accent">
            {ordered(orders.itemCount)}
          </Text>
          <Text variant="caption" tone="muted" style={styles.receiptMeta}>
            {describe(board)}
          </Text>
        </View>
      )}
    </Card>
  );
}

function describe(board: Board): string {
  const pins = board.pins.length === 1 ? '1 pin' : `${board.pins.length} pins`;
  return board.sentAt === undefined ? `${pins} · draft` : `${pins} · sent`;
}

/**
 * Says "your picks", not "items". The number is only meaningful to her because
 * they were hers.
 */
function ordered(itemCount: number): string {
  return itemCount === 1
    ? 'He ordered 1 of your picks'
    : `He ordered ${itemCount} of your picks`;
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
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbSpacer: { flex: 1 },
  overflow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { marginTop: spacing.sm },
  receipt: { marginTop: spacing.sm },
  receiptMeta: { marginTop: 2 },
});
