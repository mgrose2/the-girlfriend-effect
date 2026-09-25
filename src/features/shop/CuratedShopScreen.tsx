import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { overlappingTags } from '../../domain';
import type { CatalogItem, Category } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Chip, EmptyState, Screen, Text, colors, radius, spacing } from '../../ui';
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
  const [category, setCategory] = useState<Category | null>(null);
  const { board, matched, items, categories, loading, error } = useCuratedShop(
    boardId,
    recipient.sizing,
    category,
  );
  const cart = useCart();

  // Computed once per board rather than per card, so scrolling the grid does
  // not re-derive the same overlap for every tile.
  const reasonsByItem = useMemo(() => {
    if (board === null) {
      return new Map<string, string[]>();
    }
    return new Map(matched.map(item => [item.id, overlappingTags(item, board)]));
  }, [matched, board]);

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
        <EmptyState
          tone="danger"
          title="Could not open your shop"
          body={error}
          action={{ label: 'Try again', onPress: () => navigation.replace('CuratedShop', { boardId }) }}
        />
      </Screen>
    );
  }

  // Without sizes every category filters to nothing, and the empty shop would
  // blame the board for what is really a missing profile.
  if (recipient.sizing === undefined) {
    return (
      <Screen>
        <EmptyState
          title="We need your sizes first"
          body="The shop only shows things that actually fit, so it needs your sizes before it can show you anything."
          action={{
            label: 'Add your sizes',
            onPress: () => navigation.navigate('SizingIntake', { boardId }),
          }}
        />
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
          <View>
            <View style={styles.header}>
              <Text variant="body" tone="muted">
                {summary(matched.length, board?.styleTags ?? [])}
              </Text>
            </View>
            {categories.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}>
                <Chip
                  testID="filter-all"
                  label="Everything"
                  selected={category === null}
                  onPress={() => setCategory(null)}
                />
                {categories.map(entry => (
                  <Chip
                    key={entry}
                    testID={`filter-${entry}`}
                    label={LABELS[entry]}
                    selected={category === entry}
                    onPress={() => setCategory(category === entry ? null : entry)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyShop filtered={category !== null} />}
        renderItem={({ item }) => (
          <ShopItemCard
            item={item}
            reasons={reasonsByItem.get(item.id) ?? []}
            onPress={() => openItem(item)}
          />
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

/** Plural nouns, since these label groups of things rather than one item. */
const LABELS: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessories',
};

/**
 * Two different empties. A filter with no results is the recipient's own doing
 * and needs no apology; a board with nothing at all is a dead end, and saying
 * only "nothing here" would read as the app being broken on the one screen
 * where giving up costs us the whole measurement.
 */
function EmptyShop({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <View style={styles.centered}>
        <Text variant="body" tone="muted" center>
          Nothing in that category. Try another.
        </Text>
      </View>
    );
  }

  return (
    <EmptyState
      title="Nothing in your size yet"
      body="These styles exist in the catalog, but not in the sizes you entered. Check your sizes, or ask her to widen the board's styles."
    />
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
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  filters: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
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
