// AsyncStorage adapters (Sprint 1). Reachable only from RepositoryProvider —
// the features/ eslint rule blocks screens from importing anything here.

import type { Repositories } from '../ports';
import { LocalAnalyticsRepository } from './LocalAnalyticsRepository';
import { LocalBoardRepository } from './LocalBoardRepository';
import { LocalCatalogRepository } from './LocalCatalogRepository';
import { LocalOrderRepository } from './LocalOrderRepository';
import { LocalUserRepository } from './LocalUserRepository';

export function createLocalRepositories(): Repositories {
  return {
    users: new LocalUserRepository(),
    boards: new LocalBoardRepository(),
    catalog: new LocalCatalogRepository(),
    orders: new LocalOrderRepository(),
    analytics: new LocalAnalyticsRepository(),
  };
}

export { clearAll as clearLocalStorage } from './storage';
