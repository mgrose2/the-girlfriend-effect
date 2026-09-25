import { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { requiredSize } from '../../domain';
import type { CatalogItem } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, EmptyState, Screen, Text, colors, radius, spacing } from '../../ui';
import { useRequiredUser } from '../session';
import { formatPrice } from '../shop';
import { useCart } from './CartProvider';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Cart'>;
type Route = RouteProp<RootStackParamList, 'Cart'>;

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const recipient = useRequiredUser();
  const cart = useCart();

  const onCheckout = useCallback(
    () => navigation.navigate('Checkout', { boardId }),
    [navigation, boardId],
  );

  if (cart.items.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="Your bag is empty"
          body="Add something she picked and it shows up here."
          action={{ label: 'Back to your picks', onPress: () => navigation.goBack() }}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={cart.items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CartLine
            item={item}
            size={
              recipient.sizing === undefined
                ? null
                : requiredSize(item.category, recipient.sizing)
            }
            onRemove={() => cart.remove(item.id)}
          />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text variant="body" tone="muted">
            {cart.count === 1 ? '1 piece' : `${cart.count} pieces`}
          </Text>
          <Text variant="title">{formatPrice(cart.total)}</Text>
        </View>
        <Text variant="caption" tone="muted" style={styles.shippingNote}>
          Shipping and tax are not calculated in this prototype.
        </Text>
        <Button testID="go-to-checkout" label="Check out" onPress={onCheckout} />
      </View>
    </Screen>
  );
}

function CartLine({
  item,
  size,
  onRemove,
}: {
  item: CatalogItem;
  size: string | null;
  onRemove: () => void;
}) {
  return (
    <View style={styles.line}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
      </View>

      <View style={styles.lineBody}>
        <Text variant="caption" tone="muted">
          {item.retailer}
        </Text>
        <Text variant="body" numberOfLines={2}>
          {item.name}
        </Text>
        <Text variant="caption" tone="muted" style={styles.lineSize}>
          {size === null ? 'One size' : `Size ${size}`}
        </Text>
      </View>

      <View style={styles.lineEnd}>
        <Text variant="label">{formatPrice(item.price)}</Text>
        <Pressable
          testID={`remove-${item.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
          onPress={onRemove}
          // Generous hit area: this sits next to the price and a mis-tap that
          // silently deletes a pick is worse than one that does nothing.
          hitSlop={12}
          style={styles.remove}>
          <Text variant="caption" tone="accent">
            Remove
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  line: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbWrap: {
    width: 72,
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumb: { width: '100%', height: '100%' },
  lineBody: { flex: 1 },
  lineSize: { marginTop: spacing.xs },
  lineEnd: { alignItems: 'flex-end', justifyContent: 'space-between' },
  remove: { paddingTop: spacing.sm },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shippingNote: { marginTop: spacing.xs, marginBottom: spacing.md },
});
