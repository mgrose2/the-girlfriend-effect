import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';
import { colors, spacing } from './tokens';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for grids, which scroll themselves. */
  scroll?: boolean;
  /** Drop the default horizontal gutter for edge-to-edge grids and lists. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A native-stack header already covers the top inset; leaving 'top' out here
// avoids a double gap on the screens that have one.
const edges: readonly Edge[] = ['left', 'right', 'bottom'];

export function Screen({ children, scroll = false, padded = true, style }: ScreenProps) {
  const content = padded ? styles.padded : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, content, style]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
});
