/**
 * Build-time feature flags. Deliberately plain constants — there is no remote
 * config and no reason for one.
 */

export type Backend = 'local' | 'firestore';

export const flags = {
  /**
   * Which adapter set RepositoryProvider hands out.
   *
   * Flipped to 'firestore' in 3.3, and that really was the only line that
   * changed — no screen was touched.
   *
   * Set it back to 'local' to work offline or on a machine without
   * google-services.json. Everything except cross-device sharing behaves the
   * same either way.
   */
  backend: 'firestore' as Backend,

  /** Shows the dev-only data reset control. Off before the APK ships (6.3). */
  showDevTools: __DEV__,
} as const;
