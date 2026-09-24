import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, elevation, radius, spacing } from './tokens';

export type CardProps = {
  children: ReactNode;
  /** Supply to make the whole card a press target (board rows, shop tiles). */
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card({ children, onPress, padded = true, style, testID }: CardProps) {
  const cardStyle = [styles.card, padded && styles.padded, style];

  if (!onPress) {
    return (
      <View testID={testID} style={cardStyle}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: elevation.card,
    overflow: 'hidden',
  },
  padded: { padding: spacing.md },
  pressed: { backgroundColor: colors.surfaceMuted },
});
