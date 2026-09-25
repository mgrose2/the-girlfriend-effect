/**
 * The single place that knows which adapter set is live. Screens call
 * `useRepositories()` and stay ignorant of whether the data came from
 * AsyncStorage or Firestore.
 *
 * This file is allowed to import concrete adapters. Nothing under `features/`
 * is — the eslint rule enforces it.
 */

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { flags } from '../config';
import { createFirestoreRepositories } from './firestore';
import { createLocalRepositories } from './local';
import type { Repositories } from './ports';

const RepositoryContext = createContext<Repositories | null>(null);

export type RepositoryProviderProps = {
  children: ReactNode;
  /**
   * Overrides the flag-selected set. Exists so a test or a throwaway screen
   * can inject fakes without touching global config.
   */
  repositories?: Repositories;
};

export function RepositoryProvider({ children, repositories }: RepositoryProviderProps) {
  // Adapters are stateless, but rebuilding them every render would hand a new
  // object identity to every consumer and re-run their effects.
  const value = useMemo(
    () => repositories ?? selectRepositories(flags.backend),
    [repositories],
  );

  return (
    <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
  );
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoryContext);
  if (repositories === null) {
    throw new Error('useRepositories must be used inside a RepositoryProvider');
  }
  return repositories;
}

function selectRepositories(backend: typeof flags.backend): Repositories {
  switch (backend) {
    case 'local':
      return createLocalRepositories();
    case 'firestore':
      return createFirestoreRepositories();
  }
}
