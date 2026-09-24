/**
 * Design tokens. Every colour, space, radius and type scale the app uses lives
 * here — the polish pass in Sprint 5 should be edits to this file, not a sweep
 * through every screen.
 *
 * Light mode only. The app is shown to testers in one sitting on a phone they
 * hand back; a dark theme is surface area the test round does not pay for.
 */

export const colors = {
  // Warm off-white rather than pure white — the product is meant to feel
  // curated and personal, not like a spreadsheet.
  background: '#FAF7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F2ECE8',

  text: '#1C1917',
  textMuted: '#6B615C',
  textInverse: '#FFFFFF',

  accent: '#B4654A',
  accentPressed: '#96513A',
  accentMuted: '#EFE0D9',

  border: '#E4DAD4',
  danger: '#B3261E',
  success: '#2E6B4F',
} as const;

/** 4pt base scale. Use these, never raw numbers, in screen styles. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Android elevation, kept here so cards and sheets stay consistent. */
export const elevation = {
  card: 2,
  sheet: 8,
} as const;
