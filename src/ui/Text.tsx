import { Text as RNText, StyleSheet } from 'react-native';
import type { StyleProp, TextProps as RNTextProps, TextStyle } from 'react-native';
import { colors, typography } from './tokens';
import type { TypographyVariant } from './tokens';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  /** `muted` for secondary copy, `inverse` for text on an accent surface. */
  tone?: 'default' | 'muted' | 'inverse' | 'accent' | 'danger';
  center?: boolean;
  style?: StyleProp<TextStyle>;
};

const tones: Record<NonNullable<TextProps['tone']>, TextStyle> = {
  default: { color: colors.text },
  muted: { color: colors.textMuted },
  inverse: { color: colors.textInverse },
  accent: { color: colors.accent },
  danger: { color: colors.danger },
};

export function Text({
  variant = 'body',
  tone = 'default',
  center = false,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[typography[variant], tones[tone], center && styles.center, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
