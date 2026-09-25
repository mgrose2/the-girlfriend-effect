import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useRepositories } from '../../data';
import { newId } from '../../domain';
import type { Order } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Card, Screen, Text, TextField, colors, spacing } from '../../ui';
import { useRequiredUser } from '../session';
import { formatPrice } from '../shop';
import { useCart } from './CartProvider';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;
type Route = RouteProp<RootStackParamList, 'Checkout'>;

/**
 * Fake checkout. Writes an `Order` and stops — there is no payment processor,
 * no card entry and no validation of either, and that is a deliberate scope
 * decision rather than an unfinished one (see CLAUDE.md).
 *
 * The address field is here because a checkout with no shipping step does not
 * feel like a checkout, and the thing being measured is whether someone
 * *completes* one. It is captured for realism, not used: nothing ships.
 */
export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const repos = useRepositories();
  const recipient = useRequiredUser();
  const cart = useCart();

  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressError =
    address.trim().length === 0 ? 'Where should it go?' : undefined;

  const onPlace = useCallback(() => {
    setSubmitted(true);
    if (addressError !== undefined || cart.items.length === 0) {
      return;
    }
    setPlacing(true);
    setError(null);

    const order: Order = {
      id: newId('order'),
      boardId,
      recipientId: recipient.id,
      items: cart.items,
      total: cart.total,
      status: 'placed',
      createdAt: new Date().toISOString(),
    };

    repos.orders
      .create(order)
      .then(created => {
        // Clear only after the write lands. Clearing first would lose the bag
        // on a failed order and leave nothing to retry with.
        cart.clear();
        navigation.replace('Confirmation', { orderId: created.id });
      })
      .catch((cause: unknown) => {
        setError(
          `Could not place the order: ${cause instanceof Error ? cause.message : String(cause)}`,
        );
        setPlacing(false);
      });
  }, [addressError, cart, boardId, recipient.id, repos, navigation]);

  return (
    <Screen scroll>
      <Card style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text variant="body" tone="muted">
            {cart.count === 1 ? '1 piece' : `${cart.count} pieces`}
          </Text>
          <Text variant="title">{formatPrice(cart.total)}</Text>
        </View>
      </Card>

      <TextField
        label="Shipping address"
        placeholder="Street, city, zip"
        value={address}
        onChangeText={value => {
          setAddress(value);
          setSubmitted(false);
        }}
        multiline
        error={submitted ? addressError : undefined}
        containerStyle={styles.field}
      />

      <Card style={styles.notice}>
        <Text variant="label">No payment is taken</Text>
        <Text variant="caption" tone="muted" style={styles.noticeBody}>
          This is a prototype. Placing the order records what you picked so we
          can see whether the idea works — nothing is charged and nothing ships.
        </Text>
      </Card>

      {error !== null ? (
        <Text variant="caption" tone="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button
          testID="place-order"
          label="Place order"
          loading={placing}
          disabled={cart.items.length === 0}
          onPress={onPlace}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: spacing.md },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  field: { marginTop: spacing.lg },
  notice: {
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  noticeBody: { marginTop: spacing.xs },
  error: { marginTop: spacing.md },
  footer: { marginTop: spacing.xl },
});
