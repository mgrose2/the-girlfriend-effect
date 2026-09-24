import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { newId } from '../../domain';
import type { Pin } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Screen, Text, TextField, colors, radius, spacing } from '../../ui';
import { useBoard } from './useBoard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PinDetails'>;
type Route = RouteProp<RootStackParamList, 'PinDetails'>;

/**
 * Note and source for a pin that has already been chosen. Both optional — the
 * picture is the point, and making the stylist write a caption for every pin
 * is friction on the one person we need to stay enthusiastic.
 */
export function PinDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId, imageUrl } = useRoute<Route>().params;
  const { board, update } = useBoard(boardId);

  const [note, setNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSave = useCallback(() => {
    if (board === null) {
      return;
    }
    setSaving(true);

    const trimmedNote = note.trim();
    const trimmedSource = sourceUrl.trim();
    const pin: Pin = {
      id: newId('pin'),
      imageUrl,
      // Omitted rather than stored empty, so `note === undefined` stays the
      // single way to ask "is there a note".
      ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
      ...(trimmedSource.length > 0 ? { sourceUrl: trimmedSource } : {}),
      tags: [],
    };

    update(current => ({ ...current, pins: [...current.pins, pin] }))
      .then(() => navigation.goBack())
      .catch(() => setSaving(false));
  }, [board, note, sourceUrl, imageUrl, update, navigation]);

  return (
    <Screen scroll>
      <View style={styles.previewWrap}>
        {failed ? (
          <View style={[styles.preview, styles.previewFallback]}>
            <Text variant="caption" tone="muted" center>
              That image could not be loaded.
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.preview}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
      </View>

      <TextField
        label="Note (optional)"
        placeholder="Something like this but in olive"
        value={note}
        onChangeText={setNote}
        maxLength={140}
        multiline
        containerStyle={styles.field}
      />

      <TextField
        label="Where it's from (optional)"
        placeholder="https://"
        value={sourceUrl}
        onChangeText={setSourceUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        containerStyle={styles.field}
      />

      <View style={styles.footer}>
        <Button
          testID="save-pin"
          label="Add to board"
          loading={saving}
          disabled={board === null}
          onPress={onSave}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewWrap: { alignItems: 'center', marginTop: spacing.md },
  preview: {
    width: '70%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  previewFallback: { alignItems: 'center', justifyContent: 'center' },
  field: { marginTop: spacing.lg },
  footer: { marginTop: spacing.xl },
});
