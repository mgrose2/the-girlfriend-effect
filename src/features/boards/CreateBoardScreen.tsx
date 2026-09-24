import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRepositories } from '../../data';
import { newId, STYLE_TAGS } from '../../domain';
import type { Board, StyleTag } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Chip, Screen, Text, TextField, spacing } from '../../ui';
import { useRequiredUser } from '../session';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateBoard'>;

export function CreateBoardScreen() {
  const navigation = useNavigation<Nav>();
  const repos = useRepositories();
  const stylist = useRequiredUser();

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<StyleTag[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmedTitle = title.trim();
  const titleError = trimmedTitle.length === 0 ? 'Give the board a name.' : undefined;
  const tagError =
    tags.length === 0 ? 'Pick at least one style — it is what filters his shop.' : undefined;
  const valid = titleError === undefined && tagError === undefined;

  const toggleTag = useCallback((tag: StyleTag) => {
    setTags(current =>
      current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag],
    );
  }, []);

  const onCreate = useCallback(() => {
    setSubmitted(true);
    if (!valid) {
      return;
    }
    setSaving(true);

    const board: Board = {
      id: newId('board'),
      ownerId: stylist.id,
      title: trimmedTitle,
      styleTags: tags,
      pins: [],
      createdAt: new Date().toISOString(),
    };

    repos.boards
      .save(board)
      // replace, not navigate: backing out of the editor should land on the
      // board list, not on a create form for a board that already exists.
      .then(() => navigation.replace('BoardEditor', { boardId: board.id }))
      .catch(() => setSaving(false));
  }, [valid, stylist.id, trimmedTitle, tags, repos, navigation]);

  const selected = useMemo(() => new Set(tags), [tags]);

  return (
    <Screen scroll>
      <TextField
        label="Board name"
        placeholder="Autumn layers"
        value={title}
        onChangeText={setTitle}
        autoFocus
        maxLength={60}
        error={submitted ? titleError : undefined}
        containerStyle={styles.field}
      />

      <Text variant="label" tone="muted" style={styles.sectionLabel}>
        Style
      </Text>
      <Text variant="caption" tone="muted">
        These tags decide which clothes he is shown. Pick as many as fit.
      </Text>
      <View style={styles.tags}>
        {STYLE_TAGS.map(tag => (
          <Chip
            key={tag}
            testID={`tag-${tag}`}
            label={tag}
            selected={selected.has(tag)}
            onPress={() => toggleTag(tag)}
          />
        ))}
      </View>
      {submitted && tagError !== undefined ? (
        <Text variant="caption" tone="danger" style={styles.tagError}>
          {tagError}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button
          testID="create-board"
          label="Create board"
          loading={saving}
          onPress={onCreate}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  sectionLabel: { marginTop: spacing.lg },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tagError: { marginTop: spacing.sm },
  footer: { marginTop: spacing.xl },
});
