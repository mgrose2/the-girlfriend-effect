import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Board } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Screen, Text, colors, spacing } from '../../ui';
import { useRequiredUser } from '../session';
import { BoardCard } from './BoardCard';
import { useBoardOrders } from './useBoardOrders';
import { useBoards } from './useBoards';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BoardList'>;

export function BoardListScreen() {
  const navigation = useNavigation<Nav>();
  const stylist = useRequiredUser();
  const { boards, loading, error } = useBoards(stylist.id);
  const orders = useBoardOrders(boards);

  const openBoard = useCallback(
    (board: Board) => navigation.navigate('BoardEditor', { boardId: board.id }),
    [navigation],
  );

  const newBoard = useCallback(() => navigation.navigate('CreateBoard'), [navigation]);

  return (
    <Screen padded={false}>
      <FlatList
        data={boards}
        keyExtractor={board => board.id}
        renderItem={({ item }) => (
          <BoardCard
            board={item}
            orders={orders.get(item.id)}
            onPress={() => openBoard(item)}
          />
        )}
        contentContainerStyle={styles.list}
        // undefined rather than null: FlatList's slot types do not accept null.
        ListEmptyComponent={
          loading ? undefined : <EmptyState error={error} onPress={newBoard} />
        }
        ListHeaderComponent={
          loading && boards.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : undefined
        }
      />

      <View style={styles.footer}>
        <Button testID="new-board" label="New board" onPress={newBoard} />
      </View>
    </Screen>
  );
}

function EmptyState({ error, onPress }: { error: string | null; onPress: () => void }) {
  if (error !== null) {
    return (
      <View style={styles.empty}>
        <Text variant="heading" center>
          Could not load your boards
        </Text>
        <Text variant="body" tone="muted" center style={styles.emptyBody}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.empty}>
      <Text variant="heading" center>
        No boards yet
      </Text>
      <Text variant="body" tone="muted" center style={styles.emptyBody}>
        A board is a handful of pictures that say what you'd love to see him
        wearing. Build one, then send it.
      </Text>
      <Button
        testID="empty-new-board"
        label="Make your first board"
        onPress={onPress}
        block={false}
        style={styles.emptyCta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  loading: { marginTop: spacing.xl },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyBody: { marginTop: spacing.sm },
  emptyCta: { marginTop: spacing.lg },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
