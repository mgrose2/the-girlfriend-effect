import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useRepositories } from '../../data';
import { overlappingTags, requiredSize } from '../../domain';
import type { Board, CatalogItem } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Chip, Screen, Text, colors, radius, spacing } from '../../ui';
import { useFunnel } from '../analytics';
import { useCart } from '../cart';
import { useRequiredUser } from '../session';
import { formatPrice } from './formatPrice';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ItemDetail'>;
type Route = RouteProp<RootStackParamList, 'ItemDetail'>;

export function ItemDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId, itemId } = useRoute<Route>().params;
  const repos = useRepositories();
  const recipient = useRequiredUser();
  const cart = useCart();
  const track = useFunnel();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repos.catalog.getById(itemId), repos.boards.getById(boardId)])
      .then(([foundItem, foundBoard]) => {
        if (!cancelled) {
          setItem(foundItem);
          setBoard(foundBoard);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repos, itemId, boardId]);

  const onAdd = useCallback(() => {
    if (item !== null) {
      cart.add(item, boardId);
      // Per item, so the gap between browsing and ordering is visible rather
      // than collapsing into a single "did he buy" bit.
      track('item_added', boardId, { itemId: item.id, price: item.price });
      navigation.goBack();
    }
  }, [item, cart, boardId, navigation, track]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      </Screen>
    );
  }

  if (item === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="heading" center>
            This piece is no longer listed
          </Text>
        </View>
      </Screen>
    );
  }

  const size =
    recipient.sizing === undefined
      ? null
      : requiredSize(item.category, recipient.sizing);
  const reasons = board === null ? [] : overlappingTags(item, board);
  const inBag = cart.has(item.id);

  return (
    <Screen scroll>
      <View style={styles.imageWrap}>
        {imageFailed ? (
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
            onError={() => setImageFailed(true)}
          />
        )}
      </View>

      <Text variant="caption" tone="muted" style={styles.retailer}>
        {item.retailer}
      </Text>
      <Text variant="title">{item.name}</Text>
      <Text variant="heading" style={styles.price}>
        {formatPrice(item.price)}
      </Text>

      {reasons.length > 0 ? (
        <View style={styles.section}>
          <Text variant="label" tone="muted">
            Why this is here
          </Text>
          <View style={styles.chips}>
            {reasons.map(tag => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          Your size
        </Text>
        {/* Shown, not chosen. matchCatalog already filtered on this, so
            offering a picker would only let someone select a size the item
            does not stock. */}
        <Text variant="body" style={styles.size}>
          {size === null ? 'One size' : size}
          <Text variant="caption" tone="muted">
            {size === null ? '' : '  · from the sizes you entered'}
          </Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          testID="add-to-bag"
          label={inBag ? 'In your bag' : 'Add to bag'}
          disabled={inBag}
          onPress={onAdd}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.md,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  retailer: { marginTop: spacing.lg },
  price: { marginTop: spacing.xs },
  section: { marginTop: spacing.lg },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  size: { marginTop: spacing.xs },
  footer: { marginTop: spacing.xl },
});
