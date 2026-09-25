import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRepositories } from '../../data';
import { isValidShareCode, normalizeShareCode } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Screen, Text, TextField, spacing } from '../../ui';
import { useFunnel } from '../analytics';
import { useSession } from '../session';

type Nav = NativeStackNavigationProp<RootStackParamList, 'JoinBoard'>;

export function JoinBoardScreen() {
  const navigation = useNavigation<Nav>();
  const repos = useRepositories();
  const { enterAs } = useSession();
  const track = useFunnel();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onJoin = useCallback(() => {
    const normalized = normalizeShareCode(code);
    if (!isValidShareCode(normalized)) {
      setError('That code does not look right. It is four characters, like TGE-4F9K.');
      return;
    }

    setBusy(true);
    setError(null);

    (async () => {
      const board = await repos.boards.findByShareCode(normalized);
      if (board === null) {
        // Mentions connection because Firestore answers from its local cache
        // when offline: an unseen board comes back as "not found" rather than
        // as an error, and blaming the code would send him to double-check
        // something that was right all along.
        setError(
          "No board with that code. Check it against her message, and that you're online.",
        );
        return;
      }

      const recipient = await enterAs('recipient');

      // Claim the board, but never steal one already claimed by someone else.
      // Two people typing the same code should not silently swap ownership of
      // the order that follows.
      if (board.recipientId !== undefined && board.recipientId !== recipient.id) {
        setError('That board has already been opened by someone else.');
        return;
      }
      if (board.recipientId === undefined) {
        await repos.boards.save({ ...board, recipientId: recipient.id });
      }

      // Only once the code actually resolved and was claimed. Recording the
      // attempt would count mistyped codes as engagement.
      track('board_opened', board.id);

      // Intake is once per person, not once per board — a second board from
      // the same stylist should not ask for his sizes again.
      navigation.replace(
        recipient.sizing === undefined ? 'SizingIntake' : 'BoardReceived',
        { boardId: board.id },
      );
    })()
      .catch((cause: unknown) => setError(String(cause)))
      .finally(() => setBusy(false));
  }, [code, repos, enterAs, navigation, track]);

  return (
    <Screen scroll>
      <Text variant="title" style={styles.title}>
        Someone picked these for you
      </Text>
      <Text variant="body" tone="muted" style={styles.body}>
        Enter the code from their message.
      </Text>

      <TextField
        label="Code"
        placeholder="TGE-4F9K"
        value={code}
        onChangeText={value => {
          setCode(value);
          setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoFocus
        maxLength={12}
        error={error ?? undefined}
        containerStyle={styles.field}
      />

      <View style={styles.footer}>
        <Button
          testID="join-board"
          label="Open it"
          loading={busy}
          disabled={code.trim().length === 0}
          onPress={onJoin}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  body: { marginTop: spacing.sm },
  field: { marginTop: spacing.xl },
  footer: { marginTop: spacing.xl },
});
