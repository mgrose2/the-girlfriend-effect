import { useCallback, useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CatalogItem } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Screen, Text, colors, radius, spacing } from '../../ui';
import { useCart } from '../cart';
import { useRequiredUser } from '../session';
import { ShopItemCard } from './ShopItemCard';
import { useCuratedShop } from './useCuratedShop';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CuratedShop'>;
type Route = RouteProp<RootStackParamList, 'CuratedShop'>;

const COLUMNS = 2;

export function CuratedShopScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const recipient = useRequiredUser();
  const { board, items, loading, error } = useCuratedShop(boardId, recipient.sizing);
  const cart = useCart();

  useLayoutEffect(() => {
    navigation.setOptions({
      ...(board === null ? {} : { title: board.title }),
      // In the header rather than a floating button: the grid scrolls, and a
      // bag that scrolls away is a bag he forgets he filled.
      //
      // headerRight must be a function — that is React Navigation's API, not a
      // nested component definition, and BagButton is declared at module level.
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <BagButton
          count={cart.count}
          onPress={() => navigation.navigate('Cart', { boardId })}
        />
      ),
    });
  }, [navigation, board, cart.count, boardId]);

  const openItem = useCallback(
    (item: CatalogItem) => navigation.navigate('ItemDetail', { boardId, itemId: item.id }),
    [navigation, boardId],
  );

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      </Screen>
    );
  }

  if (error !== null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="heading" center>
            Could not open your shop
          </Text>
          <Text variant="body" tone="muted" center style={styles.body}>
            {error}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="body" tone="muted">
              {summary(items.length, board?.styleTags ?? [])}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyShop />}
        renderItem={({ item }) => (
          <ShopItemCard item={item} onPress={() => openItem(item)} />
        )}
      />
    </Screen>
  );
}

function BagButton({ count, onPress }: { count: number; onPress: () => void }) {
  const full = count > 0;
  return (
    <Pressable
      testID="open-bag"
      accessibilityRole="button"
      accessibilityLabel={`Bag, ${count} item${count === 1 ? '' : 's'}`}
      onPress={onPress}
      hitSlop={12}
      style={[styles.bagButton, full && styles.bagButtonFull]}>
      <Text variant="label" tone={full ? 'inverse' : 'default'}>
        Bag{full ? ` ${count}` : ''}
      </Text>
    </Pressable>
  );
}

function summary(count: number, tags: string[]): string {
  const what = count === 1 ? '1 piece' : `${count} pieces`;
  return tags.length === 0
    ? `${what} in your size`
    : `${what} in your size, picked for ${tags.join(' and ')}`;
}

/**
 * Reached when the board's tags and the recipient's sizes have no overlap in
 * the catalog. Says which of the two is the constraint, because "nothing here"
 * with no explanation reads as the app being broken.
 */
function EmptyShop() {
  return (
    <View style={styles.centered}>
      <Text variant="heading" center>
        Nothing in your size yet
      </Text>
      <Text variant="body" tone="muted" center style={styles.body}>
        These styles exist in the catalog, but not in the sizes you entered.
        Check your sizes, or ask her to widen the board's styles.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
  },
  body: { marginTop: spacing.sm },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  row: { gap: spacing.md, marginBottom: spacing.lg },
  bagButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bagButtonFull: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
