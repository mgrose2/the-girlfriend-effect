/**
 * Who is using this install. There is no real auth and there will not be — see
 * CLAUDE.md — so a "session" is just the last user record this device created,
 * persisted through UserRepository so it survives a restart.
 *
 * React Context rather than a store, per plan §5.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRepositories } from '../../data';
import { newId } from '../../domain';
import type { Role, User } from '../../domain';

export type SessionValue = {
  user: User | null;
  /** True until the persisted user has been read back on mount. */
  loading: boolean;
  /**
   * Returns the existing user if they already hold this role, otherwise
   * creates one and makes it current.
   */
  enterAs: (role: Role, name?: string) => Promise<User>;
  /** Persists a change to the signed-in user — rename, sizing from 3.7. */
  updateUser: (changes: Partial<Omit<User, 'id'>>) => Promise<User>;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Placeholder name. The stylist's real name is not needed until 3.4, where the
 * recipient sees who sent the board — capturing it earlier would be a form
 * with no reason to exist yet.
 */
const DEFAULT_NAMES: Record<Role, string> = {
  stylist: 'You',
  recipient: 'You',
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    repos.users
      .getCurrent()
      .then(current => {
        if (!cancelled) {
          setUser(current);
        }
      })
      .catch(() => {
        // A failed read means no session, not a broken app.
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repos]);

  const enterAs = useCallback(
    async (role: Role, name?: string): Promise<User> => {
      const current = await repos.users.getCurrent();
      if (current !== null && current.role === role) {
        // Reuse rather than minting a second identity, or the board list would
        // come back empty every time you revisited it.
        setUser(current);
        return current;
      }

      const created: User = {
        id: newId('user'),
        name: name ?? DEFAULT_NAMES[role],
        role,
      };
      await repos.users.save(created);
      await repos.users.setCurrent(created.id);
      setUser(created);
      return created;
    },
    [repos],
  );

  const updateUser = useCallback(
    async (changes: Partial<Omit<User, 'id'>>): Promise<User> => {
      if (user === null) {
        throw new Error('updateUser called with no signed-in user');
      }
      const next: User = { ...user, ...changes };
      await repos.users.save(next);
      setUser(next);
      return next;
    },
    [repos, user],
  );

  const value = useMemo<SessionValue>(
    () => ({ user, loading, enterAs, updateUser }),
    [user, loading, enterAs, updateUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return session;
}

/** Narrowing helper for screens that cannot run without a user. */
export function useRequiredUser(): User {
  const { user } = useSession();
  if (user === null) {
    throw new Error('This screen requires a signed-in user');
  }
  return user;
}
