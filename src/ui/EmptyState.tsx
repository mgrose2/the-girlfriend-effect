import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Button } from './Button';
import { Text } from './Text';
import { spacing } from './tokens';

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Present only when there is something useful to do about it. */
  action?: { label: string; onPress: () => void };
  /** Tints the title — for genuine failures rather than empty-but-fine. */
  tone?: 'neutral' | 'danger';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * The centred "nothing here" / "that went wrong" block. Every screen had its
 * own copy of this, which is how they drifted into three different spacings.
 */
export function EmptyState({
  title,
  body,
  action,
  tone = 'neutral',
  style,
  testID,
}: EmptyStateProps) {
  return (
    <View testID={testID} style={[styles.wrap, style]}>
      <Text variant="heading" center tone={tone === 'danger' ? 'danger' : 'default'}>
        {title}
      </Text>
      {body !== undefined ? (
        <Text variant="body" tone="muted" center style={styles.body}>
          {body}
        </Text>
      ) : null}
      {action !== undefined ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          block={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
  },
  body: { marginTop: spacing.sm },
  action: { marginTop: spacing.lg },
});
