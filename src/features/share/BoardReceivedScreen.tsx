import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Pin } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { useBoard } from '../boards';
import { Button, Chip, Screen, Text, colors, radius, spacing } from '../../ui';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BoardReceived'>;
type Route = RouteProp<RootStackParamList, 'BoardReceived'>;

const COLUMNS = 2;

/**
 * What the recipient sees first: the board itself, before any shopping.
 *
 * Not in plan §3's screen list, which jumps straight from intake to the shop.
 * It earns its place because the pitch is "someone who loves you picked
 * these" — going directly to a filtered grid of merchandise skips the only
 * moment that makes this feel personal rather than like an ad.
 */
export function BoardReceivedScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const { board, loading, error } = useBoard(boardId);

  const openShop = useCallback(
    () => navigation.navigate('CuratedShop', { boardId }),
    [navigation, boardId],
  );

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      </Screen>
    );
  }

  if (board === null) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="heading" center>
            Board unavailable
          </Text>
          <Text variant="body" tone="muted" center style={styles.body}>
            {error ?? 'That board no longer exists.'}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={board.pins}
        keyExtractor={pin => pin.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="title">{board.title}</Text>
            <Text variant="body" tone="muted" style={styles.body}>
              Picked for you. Here's the look.
            </Text>
            <View style={styles.tags}>
              {board.styleTags.map(tag => (
                <Chip key={tag} label={tag} />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => <PinTile pin={item} />}
      />

      <View style={styles.footer}>
        <Button testID="open-shop" label="Shop these picks" onPress={openShop} />
      </View>
    </Screen>
  );
}

function PinTile({ pin }: { pin: Pin }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileImageWrap}>
        <Image source={{ uri: pin.imageUrl }} style={styles.tileImage} />
      </View>
      {pin.note !== undefined ? (
        <Text variant="caption" tone="muted" style={styles.note}>
          {pin.note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { marginTop: spacing.sm },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  tile: { flex: 1 / COLUMNS },
  tileImageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  tileImage: { width: '100%', height: '100%' },
  note: { marginTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
