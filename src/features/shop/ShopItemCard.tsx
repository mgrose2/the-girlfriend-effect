import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { CatalogItem } from '../../domain';
import { Text, colors, radius, spacing } from '../../ui';
import { formatPrice } from './formatPrice';

export type ShopItemCardProps = {
  item: CatalogItem;
  /** Tags this item shares with the board — the "why this" chips from 4.6. */
  reasons?: string[];
  onPress: () => void;
};

export function ShopItemCard({ item, reasons = [], onPress }: ShopItemCardProps) {
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      testID={`shop-item-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.retailer}, ${formatPrice(item.price)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {failed ? (
          <View style={styles.imageFallback}>
            <Text variant="caption" tone="muted" center>
              {item.name}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
        <View style={styles.retailer}>
          <Text variant="caption" tone="inverse">
            {item.retailer}
          </Text>
        </View>
      </View>

      <Text variant="body" numberOfLines={2} style={styles.name}>
        {item.name}
      </Text>
      <Text variant="label">{formatPrice(item.price)}</Text>

      {reasons.length > 0 ? (
        <Text variant="caption" tone="accent" numberOfLines={1} style={styles.reasons}>
          {reasons.join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  pressed: { opacity: 0.7 },
  imageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  retailer: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    // Not the accent colour: the badge is a fact about the item, and tinting
    // it would read as a recommendation the retailer did not earn.
    backgroundColor: 'rgba(28,25,23,0.72)',
  },
  name: { marginTop: spacing.sm },
  reasons: { marginTop: spacing.xs },
});
