import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing } from './tokens';

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Omit to render a static label — used for read-only tag lists. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Chip({ label, selected = false, onPress, style, testID }: ChipProps) {
  const body = (
    <Text variant="caption" tone={selected ? 'inverse' : 'default'}>
      {label}
    </Text>
  );
  const chipStyle = [styles.chip, selected && styles.selected, style];

  if (onPress === undefined) {
    return (
      <Pressable testID={testID} disabled style={chipStyle}>
        {body}
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [...chipStyle, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
