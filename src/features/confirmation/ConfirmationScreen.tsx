import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useRepositories } from '../../data';
import type { Order } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Card, Screen, Text, colors, spacing } from '../../ui';
import { formatPrice } from '../shop';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Confirmation'>;
type Route = RouteProp<RootStackParamList, 'Confirmation'>;

/**
 * Deliberately thin. 5.1 gives this the full order summary and 5.2 adds the
 * donate-bag card; this exists so 4.5 has somewhere to land, because a
 * checkout that dead-ends is not an order anyone would call complete.
 */
export function ConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { orderId } = useRoute<Route>().params;
  const repos = useRepositories();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    repos.orders
      .getById(orderId)
      .then(found => {
        if (!cancelled) {
          setOrder(found);
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
          {order === null
            ? 'Your order was placed.'
            : `${order.items.length === 1 ? '1 piece' : `${order.items.length} pieces`} on the way — ${formatPrice(order.total)}.`}
        </Text>
      </View>

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

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  header: { marginTop: spacing.xxl },
  body: { marginTop: spacing.sm },
  notice: { marginTop: spacing.xl, backgroundColor: colors.surfaceMuted },
  noticeBody: { marginTop: spacing.xs },
  footer: { marginTop: spacing.xl },
});
