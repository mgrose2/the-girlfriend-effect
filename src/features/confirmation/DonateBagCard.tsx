import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, colors, spacing } from '../../ui';

/**
 * The donate-bag beat. Plan §1 puts return and donation logistics firmly out
 * of scope, so this deliberately promises nothing: tapping it records
 * interest and says so.
 *
 * It is here because the idea is part of the pitch, and whether anyone reaches
 * for it is worth learning while people are actually in the flow — but a
 * prototype that implies a courier is coming would be a lie told to a tester.
 */
export function DonateBagCard() {
  const [interested, setInterested] = useState(false);

  return (
    <Card style={styles.card}>
      <Text variant="label">Clearing space for these?</Text>
      <Text variant="caption" tone="muted" style={styles.body}>
        We're thinking about sending a bag for the things these replace, and
        donating what's still good. Not built yet — but tell us if you'd use it.
      </Text>

      {interested ? (
        <View style={styles.done}>
          <Text variant="caption" tone="accent">
            Noted — thanks. We'll be in touch if we build it.
          </Text>
        </View>
      ) : (
        <Button
          testID="donate-interest"
          label="I'd use that"
          variant="secondary"
          style={styles.cta}
          onPress={() => setInterested(true)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, backgroundColor: colors.accentMuted },
  body: { marginTop: spacing.xs },
  cta: { marginTop: spacing.md },
  done: { marginTop: spacing.md },
});
