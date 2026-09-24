import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { flags } from '../../config';
import type { RootStackParamList } from '../../navigation';
import { Button, Screen, Text, spacing } from '../../ui';
import { DevToolsPanel } from '../dev';
import { useSession } from '../session';

type Nav = NativeStackNavigationProp<RootStackParamList, 'RoleSelect'>;

/**
 * The fork at the top of both flows: am I curating a board, or did someone
 * send me one?
 *
 * The recipient path lands in Sprint 3 (join by code) and is inert until then.
 */
export function RoleSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { enterAs } = useSession();
  const [busy, setBusy] = useState(false);

  const onStylist = useCallback(() => {
    setBusy(true);
    enterAs('stylist')
      .then(() => navigation.navigate('BoardList'))
      .catch(() => setBusy(false))
      .finally(() => setBusy(false));
  }, [enterAs, navigation]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="display">The Girlfriend Effect</Text>
        <Text variant="body" tone="muted" style={styles.subtitle}>
          Style someone you love, or see what they picked for you.
        </Text>
      </View>

      <View style={styles.actions}>
        {flags.showDevTools ? <DevToolsPanel /> : null}
        <Button
          testID="role-stylist"
          label="I'm making a board"
          disabled={busy}
          onPress={onStylist}
        />
        <Button
          testID="role-recipient"
          label="Someone sent me one"
          variant="secondary"
          onPress={noop}
        />
      </View>
    </Screen>
  );
}

// Placeholder until join-by-code (3.5) exists.
function noop() {}

const styles = StyleSheet.create({
  header: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
