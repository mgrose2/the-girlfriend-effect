import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { newId, STYLE_TAGS } from '../../domain';
import type { Pin, StyleTag } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Chip, Screen, Text, TextField, colors, radius, spacing } from '../../ui';
import { useBoard } from './useBoard';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PinDetails'>;
type Route = RouteProp<RootStackParamList, 'PinDetails'>;

/**
 * Details for a pin from either source. When the camera-roll path (2.4) sends
 * an `imageUrl` the picture is fixed and just previewed; when the URL path
 * (2.5) sends none, the same screen grows a link field and previews as you
 * type.
 *
 * One screen rather than two: the note, source and (from 2.6) tags are
 * identical either way, and a second copy would drift.
 */
export function PinDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const params = useRoute<Route>().params;
  const { board, update } = useBoard(params.boardId);

  const fromLibrary = params.imageUrl !== undefined;
  const [imageUrl, setImageUrl] = useState(params.imageUrl ?? '');
  const [note, setNote] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // Tags default to the board's, so the common case — this pin is more of what
  // the board is already about — needs no taps at all. null means "not touched
  // yet", which is how the default survives the board loading asynchronously.
  const [tags, setTags] = useState<StyleTag[] | null>(null);
  const effectiveTags = useMemo(
    () => tags ?? board?.styleTags ?? [],
    [tags, board],
  );

  const toggleTag = useCallback(
    (tag: StyleTag) => {
      setTags(current => {
        const base = current ?? board?.styleTags ?? [];
        return base.includes(tag) ? base.filter(t => t !== tag) : [...base, tag];
      });
    },
    [board],
  );

  const trimmedImage = imageUrl.trim();
  const imageError = validateImageUrl(trimmedImage);

  /**
   * Preview URL, settled after typing stops.
   *
   * Without this the preview fetches on every keystroke, so typing a link out
   * by hand fires a request per character and leaves the error showing against
   * a half-finished address — the picture looks broken when it is fine.
   * Pasting, which is the normal case, arrives in one change and is unaffected.
   */
  const [previewUrl, setPreviewUrl] = useState(trimmedImage);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewUrl(trimmedImage);
      setLoadFailed(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [trimmedImage]);

  const onSave = useCallback(() => {
    setSubmitted(true);
    if (board === null || imageError !== undefined) {
      return;
    }
    setSaving(true);

    const trimmedNote = note.trim();
    const trimmedSource = sourceUrl.trim();
    const pin: Pin = {
      id: newId('pin'),
      imageUrl: trimmedImage,
      // Omitted rather than stored empty, so `note === undefined` stays the
      // single way to ask "is there a note".
      ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
      ...(trimmedSource.length > 0 ? { sourceUrl: trimmedSource } : {}),
      tags: effectiveTags,
    };

    update(current => ({ ...current, pins: [...current.pins, pin] }))
      .then(() => navigation.goBack())
      .catch(() => setSaving(false));
  }, [
    board,
    imageError,
    note,
    sourceUrl,
    trimmedImage,
    effectiveTags,
    update,
    navigation,
  ]);

  return (
    <Screen scroll>
      {fromLibrary ? null : (
        <TextField
          label="Image link"
          placeholder="https://…"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType="url"
          hint="Paste the address of a picture — long-press an image in a browser to copy it."
          error={submitted ? imageError : undefined}
          containerStyle={styles.field}
        />
      )}

      <View style={styles.previewWrap}>
        {/* The sizing lives on this wrapper, never on the Image. A percentage
            width plus aspectRatio applied straight to an Image lays the box out
            but never draws the bitmap, which reads as a silently broken
            picture — onLoad still fires, so nothing looks wrong in logs. */}
        <View style={styles.preview}>
          {previewUrl.length === 0 || loadFailed ? (
            <View style={styles.previewFallback}>
              <Text variant="caption" tone="muted" center>
                {previewUrl.length === 0
                  ? 'Preview appears here'
                  : 'That link did not load an image.'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: previewUrl }}
              style={styles.previewImage}
              resizeMode="cover"
              onError={() => setLoadFailed(true)}
            />
          )}
        </View>
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

      <Text variant="label" tone="muted" style={styles.sectionLabel}>
        Style
      </Text>
      <Text variant="caption" tone="muted">
        Starts from the board's styles. Narrow it if this pin is its own thing.
      </Text>
      <View style={styles.tags}>
        {STYLE_TAGS.map(tag => (
          <Chip
            key={tag}
            testID={`pin-tag-${tag}`}
            label={tag}
            selected={effectiveTags.includes(tag)}
            onPress={() => toggleTag(tag)}
          />
        ))}
      </View>

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

/**
 * Shape check only. Whether the link actually resolves to an image is
 * something the preview answers far better than a regex can.
 */
function validateImageUrl(value: string): string | undefined {
  if (value.length === 0) {
    return 'Paste a link to a picture.';
  }
  if (!/^(https?|file|content):\/\//i.test(value)) {
    return 'That needs to start with http:// or https://';
  }
  return undefined;
}

const styles = StyleSheet.create({
  previewWrap: { alignItems: 'center', marginTop: spacing.md },
  preview: {
    width: '70%',
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  previewFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  field: { marginTop: spacing.lg },
  sectionLabel: { marginTop: spacing.lg },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  footer: { marginTop: spacing.xl },
});
