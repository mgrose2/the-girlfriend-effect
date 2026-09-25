import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useRepositories } from '../../data';
import { requiredSize } from '../../domain';
import type { Board, CatalogItem, Order } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Card, Screen, Text, colors, radius, spacing } from '../../ui';
import { useSession } from '../session';
import { formatPrice } from '../shop';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Confirmation'>;
type Route = RouteProp<RootStackParamList, 'Confirmation'>;

export function ConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { orderId } = useRoute<Route>().params;
  const repos = useRepositories();
  const { user } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    repos.orders
      .getById(orderId)
      .then(async found => {
        if (cancelled) {
          return;
        }
        setOrder(found);
        if (found !== null) {
          const forBoard = await repos.boards.getById(found.boardId);
          if (!cancelled) {
            setBoard(forBoard);
          }
        }
      })
      .catch(() => {
        // The order is already placed; a failed read here is a display
        // problem, not a lost purchase. The fallback copy below covers it.
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repos, orderId]);

  const onDone = useCallback(() => {
    // Reset rather than goBack: the bag and checkout behind this screen belong
    // to an order that has already happened.
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelect' }] });
  }, [navigation]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="display">Done.</Text>
        <Text variant="body" tone="muted" style={styles.body}>
          {headline(order, board)}
        </Text>
      </View>

      {order !== null ? (
        <Card style={styles.summary}>
          {order.items.map((item, index) => (
            <OrderLine
              key={`${item.id}-${index}`}
              item={item}
              size={
                user?.sizing === undefined
                  ? null
                  : requiredSize(item.category, user.sizing)
              }
              last={index === order.items.length - 1}
            />
          ))}

          <View style={styles.totalRow}>
            <Text variant="label">Total</Text>
            <Text variant="heading">{formatPrice(order.total)}</Text>
          </View>
        </Card>
      ) : null}

      <Card style={styles.notice}>
        <Text variant="label">Nothing was actually charged</Text>
        <Text variant="caption" tone="muted" style={styles.noticeBody}>
          This is a prototype order. It records what you picked so we can see
          whether this idea works.
        </Text>
      </Card>

      <View style={styles.footer}>
        <Button testID="confirmation-done" label="Done" onPress={onDone} />
      </View>
    </Screen>
  );
}

/**
 * Names the board when it is known, because "she picked these" is the whole
 * emotional beat and a bare item count throws it away.
 */
function headline(order: Order | null, board: Board | null): string {
  if (order === null) {
    return 'Your order was placed.';
  }
  const pieces = order.items.length === 1 ? '1 piece' : `${order.items.length} pieces`;
  return board === null
    ? `${pieces} on the way.`
    : `${pieces} from ${board.title}, on the way.`;
}

function OrderLine({
  item,
  size,
  last,
}: {
  item: CatalogItem;
  size: string | null;
  last: boolean;
}) {
  return (
    <View style={[styles.line, last && styles.lineLast]}>
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
      <Text variant="label">{formatPrice(item.price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  header: { marginTop: spacing.xl },
  body: { marginTop: spacing.sm },
  summary: { marginTop: spacing.lg },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineLast: { borderBottomWidth: 0, marginBottom: 0 },
  thumbWrap: {
    width: 56,
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumb: { width: '100%', height: '100%' },
  lineBody: { flex: 1 },
  lineSize: { marginTop: spacing.xs },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  notice: { marginTop: spacing.lg, backgroundColor: colors.surfaceMuted },
  noticeBody: { marginTop: spacing.xs },
  footer: { marginTop: spacing.xl },
});
