import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Pin } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Chip, Screen, Text, colors, radius, spacing } from '../../ui';
import { pickImageFromLibrary } from './pickImage';
import { useBoard } from './useBoard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BoardEditor'>;
type Route = RouteProp<RootStackParamList, 'BoardEditor'>;

/**
 * Around a dozen pins is where a board stops reading as a considered pick and
 * starts reading as a camera roll dump — and the upload in 3.6 has to carry
 * every one of them.
 */
export const MAX_PINS = 12;

const COLUMNS = 3;

export function BoardEditorScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const { board, loading, error, update } = useBoard(boardId);
  const [picking, setPicking] = useState(false);

  const addFromLibrary = useCallback(() => {
    setPicking(true);
    pickImageFromLibrary()
      .then(result => {
        if (result.status === 'picked') {
          navigation.navigate('PinDetails', { boardId, imageUrl: result.uri });
          return;
        }
        if (result.status === 'failed') {
          Alert.alert('Could not add that photo', result.message);
        }
      })
      .finally(() => setPicking(false));
  }, [navigation, boardId]);

  const addPin = useCallback(() => {
    Alert.alert('Add a pin', 'Where is the picture coming from?', [
      { text: 'Photo library', onPress: addFromLibrary },
      {
        text: 'Paste a link',
        onPress: () => navigation.navigate('PinDetails', { boardId }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [addFromLibrary, navigation, boardId]);

  useLayoutEffect(() => {
    if (board !== null) {
      navigation.setOptions({ title: board.title });
    }
  }, [navigation, board]);

  const removePin = useCallback(
    (pin: Pin) => {
      Alert.alert('Remove this pin?', undefined, [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            update(current => ({
              ...current,
              pins: current.pins.filter(p => p.id !== pin.id),
            })).catch(() => {
              // useBoard rolled the grid back and surfaced the error already.
            });
          },
        },
      ]);
    },
    [update],
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
          <Text variant="body" tone="muted" center style={styles.centeredBody}>
            {error ?? 'That board no longer exists.'}
          </Text>
        </View>
      </Screen>
    );
  }

  const full = board.pins.length >= MAX_PINS;

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
            <View style={styles.tags}>
              {board.styleTags.map(tag => (
                <Chip key={tag} label={tag} />
              ))}
            </View>
            <Text variant="caption" tone="muted" style={styles.count}>
              {board.pins.length} of {MAX_PINS} pins
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="heading" center>
              No pins yet
            </Text>
            <Text variant="body" tone="muted" center style={styles.centeredBody}>
              Add screenshots or saved photos of things you'd love to see him in.
            </Text>
          </View>
        }
        renderItem={({ item }) => <PinTile pin={item} onLongPress={() => removePin(item)} />}
      />

      <View style={styles.footer}>
        {full ? (
          <Text variant="caption" tone="muted" center style={styles.fullNote}>
            That's {MAX_PINS} pins — plenty to pick from.
          </Text>
        ) : null}
        <Button
          testID="add-pin"
          label="Add a pin"
          disabled={full}
          loading={picking}
          onPress={addPin}
        />
      </View>
    </Screen>
  );
}

function PinTile({ pin, onLongPress }: { pin: Pin; onLongPress: () => void }) {
  const [failed, setFailed] = useState(false);

  return (
    <Pressable
      testID={`pin-${pin.id}`}
      onLongPress={onLongPress}
      accessibilityRole="imagebutton"
      accessibilityLabel={pin.note ?? 'Board pin'}
      accessibilityHint="Long press to remove"
      style={styles.tile}>
      {failed ? (
        <View style={styles.tileFallback}>
          <Text variant="caption" tone="muted" center>
            Image unavailable
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri: pin.imageUrl }}
          style={styles.tileImage}
          onError={() => setFailed(true)}
        />
      )}
    </Pressable>
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
  centeredBody: { marginTop: spacing.sm },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  count: { marginTop: spacing.sm, marginBottom: spacing.xs },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  row: { gap: spacing.xs, marginBottom: spacing.xs },
  tile: {
    flex: 1 / COLUMNS,
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  tileImage: { width: '100%', height: '100%' },
  tileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  fullNote: { marginBottom: spacing.sm },
});
