import type { CatalogItem } from '../../domain';
import type { CatalogRepository } from '../ports';
import { CATALOG } from '../seed/catalog';

/**
 * Serves the hardcoded seed. Nothing is persisted — the catalog is read-only
 * and identical on every device, so writing it to AsyncStorage would only
 * create a second copy to keep in sync.
 *
 * Still async, and still behind the port, so the shop screen never learns
 * where its items came from.
 */
export class LocalCatalogRepository implements CatalogRepository {
  async list(): Promise<CatalogItem[]> {
    return [...CATALOG];
  }

  async getById(id: string): Promise<CatalogItem | null> {
    return CATALOG.find(item => item.id === id) ?? null;
  }
}
