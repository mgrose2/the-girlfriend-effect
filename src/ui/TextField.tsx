import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, spacing, typography } from './tokens';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field in the danger tone. Presence also colours the border. */
  error?: string;
  /** Quiet helper text, hidden whenever `error` is set. */
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  hint,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.focused,
          error !== undefined && styles.errored,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={event => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
      {error !== undefined ? (
        <Text variant="caption" tone="danger" style={styles.footnote}>
          {error}
        </Text>
      ) : hint !== undefined ? (
        <Text variant="caption" tone="muted" style={styles.footnote}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    // Vertical padding rather than a fixed height so multiline grows.
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  focused: { borderColor: colors.accent },
  errored: { borderColor: colors.danger },
  footnote: { marginTop: spacing.xs },
});
