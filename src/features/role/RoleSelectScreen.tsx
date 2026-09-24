import { StyleSheet, View } from 'react-native';
import { flags } from '../../config';
import { DevToolsPanel } from '../dev';
import { Button, Screen, Text, spacing } from '../../ui';

/**
 * The fork at the top of both flows: am I curating a board, or did someone
 * send me one?
 *
 * The two destinations do not exist yet — the stylist path lands in Sprint 2
 * (board list) and the recipient path in Sprint 3 (join by code). Until then
 * this screen exists to prove the navigator and the UI primitives render on
 * device.
 */
export function RoleSelectScreen() {
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
          onPress={noop}
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

// Placeholder until the board list (2.1) and join-by-code (3.5) screens exist.
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
