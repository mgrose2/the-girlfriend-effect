/**
 * Build-time feature flags. Deliberately plain constants — there is no remote
 * config and no reason for one.
 */

export type Backend = 'local' | 'firestore';

export const flags = {
  /**
   * Which adapter set RepositoryProvider hands out.
   *
   * Sprint 3.3 flips this to 'firestore'. That flip is the whole payoff of the
   * ports layer: it is the only line that changes, and no screen notices.
   */
  backend: 'local' as Backend,

  /** Shows the dev-only data reset control. Off before the APK ships (6.3). */
  showDevTools: __DEV__,
} as const;
