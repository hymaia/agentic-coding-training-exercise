import type { IItemRepository } from '../../domain/repositories/item.repository.port.js';
import { getDataBackend } from '../../shared/data-backend.js';

/**
 * Create the repository implementation selected by DATA_BACKEND.
 */
export async function createItemRepository(): Promise<IItemRepository> {
  const backend = getDataBackend();

  if (backend === 'json') {
    const { JsonItemRepository } = await import('./json-item.repository.impl.js');
    return new JsonItemRepository();
  }

  const { SQLiteItemRepository } = await import('./item.repository.impl.js');
  return new SQLiteItemRepository();
}
