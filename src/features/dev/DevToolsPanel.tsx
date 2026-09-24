import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { resetAllData, seedSampleBoard, useRepositories } from '../../data';
import type { SeedResult } from '../../data';
import { Button, Card, Text, spacing } from '../../ui';

/**
 * Dev-only data controls. Render behind `flags.showDevTools` so it never
 * reaches the APK testers install.
 *
 * It is also the Sprint 1 acceptance check made permanent: seeding writes a
 * board and reads it back through the repository, and the count below is a
 * fresh `listByOwner` — so a green result here means the whole local stack
 * round-trips on device, not just in Jest.
 */
export function DevToolsPanel() {
  const repos = useRepositories();
  const [status, setStatus] = useState('Idle');
  const [busy, setBusy] = useState(false);
  // Remembered so Reset can prove the records really went, rather than just
  // reporting that the clear call did not throw.
  const [lastSeed, setLastSeed] = useState<SeedResult | null>(null);

  // Returns void rather than a promise: these are button handlers, and an
  // unawaited promise here is the point, not an oversight.
  const run = useCallback((label: string, work: () => Promise<string>) => {
    setBusy(true);
    setStatus(`${label}…`);
    work()
      .then(setStatus)
      .catch((error: unknown) => setStatus(`${label} failed: ${String(error)}`))
      .finally(() => setBusy(false));
  }, []);

  const onSeed = useCallback(() => {
    run('Seeding', async () => {
      const result = await seedSampleBoard(repos);
      setLastSeed(result);
      const owned = await repos.boards.listByOwner(result.stylist.id);
      return `Wrote and read back ${result.board.title} · ${owned.length} board(s) for this stylist`;
    });
  }, [repos, run]);

  const onReset = useCallback(() => {
    run('Resetting', async () => {
      const expected = lastSeed;
      await resetAllData(
        repos,
        expected === null
          ? undefined
          : { boardId: expected.board.id, userId: expected.stylist.id },
      );
      setLastSeed(null);
      return expected === null
        ? 'Storage cleared'
        : 'Storage cleared · seeded board and user confirmed gone';
    });
  }, [lastSeed, repos, run]);

  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        Dev tools
      </Text>
      <Text variant="caption" tone="muted" style={styles.status}>
        {status}
      </Text>
      <View style={styles.actions}>
        <Button
          testID="dev-seed"
          label="Seed sample board"
          variant="secondary"
          disabled={busy}
          onPress={onSeed}
        />
        <Button
          testID="dev-reset"
          label="Reset all data"
          variant="ghost"
          disabled={busy}
          onPress={onReset}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  status: { marginTop: spacing.xs },
  actions: { gap: spacing.xs, marginTop: spacing.sm },
});
