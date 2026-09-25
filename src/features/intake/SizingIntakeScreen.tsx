import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { SizingProfile } from '../../domain';
import type { RootStackParamList } from '../../navigation';
import { Button, Chip, Screen, Text, TextField, spacing } from '../../ui';
import { useFunnel } from '../analytics';
import { useSession } from '../session';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SizingIntake'>;
type Route = RouteProp<RootStackParamList, 'SizingIntake'>;

const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const FITS = ['slim', 'regular', 'relaxed'];

/**
 * Asked once per person, right after they open their first board.
 *
 * These four numbers are the entire size half of the matching rules, so a
 * wrong answer here shows him an empty shop or the wrong clothes. That is why
 * every field is required except fit — and why the copy says what they are
 * for rather than just labelling them.
 */
export function SizingIntakeScreen() {
  const navigation = useNavigation<Nav>();
  const { boardId } = useRoute<Route>().params;
  const { updateUser } = useSession();
  const track = useFunnel();

  const [shirtSize, setShirtSize] = useState<string | null>(null);
  const [waist, setWaist] = useState('');
  const [inseam, setInseam] = useState('');
  const [shoe, setShoe] = useState('');
  const [fit, setFit] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const waistError = numberError(waist, 26, 48, 'waist');
  const inseamError = numberError(inseam, 26, 40, 'inseam');
  const shoeError = numberError(shoe, 5, 18, 'shoe size');
  const shirtError = shirtSize === null ? 'Pick a shirt size.' : undefined;
  const valid =
    shirtError === undefined &&
    waistError === undefined &&
    inseamError === undefined &&
    shoeError === undefined;

  const onSave = useCallback(() => {
    setSubmitted(true);
    if (!valid || shirtSize === null) {
      return;
    }
    setSaving(true);

    const sizing: SizingProfile = {
      shirtSize,
      pantWaist: Number(waist),
      pantInseam: Number(inseam),
      shoeSize: Number(shoe),
      ...(fit === null ? {} : { preferredFit: fit }),
    };

    updateUser({ sizing })
      .then(() => {
        track('intake_completed', boardId);
        navigation.replace('BoardReceived', { boardId });
      })
      .catch(() => setSaving(false));
  }, [
    valid,
    shirtSize,
    waist,
    inseam,
    shoe,
    fit,
    updateUser,
    navigation,
    boardId,
    track,
  ]);

  return (
    <Screen scroll>
      <Text variant="title" style={styles.title}>
        First, your sizes
      </Text>
      <Text variant="body" tone="muted" style={styles.body}>
        So you only see things that actually fit. Asked once.
      </Text>

      <Text variant="label" tone="muted" style={styles.sectionLabel}>
        Shirt
      </Text>
      <View style={styles.chips}>
        {SHIRT_SIZES.map(size => (
          <Chip
            key={size}
            testID={`shirt-${size}`}
            label={size}
            selected={shirtSize === size}
            onPress={() => setShirtSize(size)}
          />
        ))}
      </View>
      {submitted && shirtError !== undefined ? (
        <Text variant="caption" tone="danger" style={styles.chipError}>
          {shirtError}
        </Text>
      ) : null}

      <View style={styles.pair}>
        <TextField
          label="Waist"
          placeholder="32"
          value={waist}
          onChangeText={setWaist}
          keyboardType="number-pad"
          maxLength={2}
          error={submitted ? waistError : undefined}
          containerStyle={styles.pairField}
        />
        <TextField
          label="Inseam"
          placeholder="32"
          value={inseam}
          onChangeText={setInseam}
          keyboardType="number-pad"
          maxLength={2}
          error={submitted ? inseamError : undefined}
          containerStyle={styles.pairField}
        />
      </View>

      <TextField
        label="Shoe size (US)"
        placeholder="10.5"
        value={shoe}
        onChangeText={setShoe}
        keyboardType="decimal-pad"
        maxLength={4}
        error={submitted ? shoeError : undefined}
        containerStyle={styles.field}
      />

      <Text variant="label" tone="muted" style={styles.sectionLabel}>
        Fit you like (optional)
      </Text>
      <View style={styles.chips}>
        {FITS.map(option => (
          <Chip
            key={option}
            testID={`fit-${option}`}
            label={option}
            selected={fit === option}
            // Tapping the selected chip clears it — the field is optional and
            // there is otherwise no way back to "no preference".
            onPress={() => setFit(current => (current === option ? null : option))}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          testID="save-sizing"
          label="See what she picked"
          loading={saving}
          onPress={onSave}
        />
      </View>
    </Screen>
  );
}

/**
 * Range-checked rather than merely numeric. A mistyped 3 instead of 32 would
 * otherwise be stored happily and quietly match nothing in the catalog.
 */
function numberError(
  raw: string,
  min: number,
  max: number,
  label: string,
): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return `Enter your ${label}.`;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return `${capitalize(label)} should be a number.`;
  }
  if (value < min || value > max) {
    return `That ${label} looks off — expected ${min} to ${max}.`;
  }
  return undefined;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  body: { marginTop: spacing.sm },
  sectionLabel: { marginTop: spacing.lg },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  chipError: { marginTop: spacing.sm },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairField: { flex: 1, marginTop: spacing.lg },
  field: { marginTop: spacing.lg },
  footer: { marginTop: spacing.xl },
});
