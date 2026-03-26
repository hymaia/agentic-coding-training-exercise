import fs from 'node:fs';
import type {
  IItemRepository,
  PaginatedResult,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  SearchOptions
} from '../../domain/repositories/item.repository.port.js';
import type { Item, UpdateItemData } from '../../domain/entities/item.entity.js';
import { createCursor, parseCursor, type CursorData } from '../../shared/types.js';
import { getJsonDataPath } from '../../shared/data-backend.js';
import { ReadOnlyDataStoreError } from '../../shared/errors.js';

interface JsonDataFile {
  items: Item[];
}

const DEFAULT_SORT_FIELD = 'created_at';
const DEFAULT_SORT_DIRECTION: 'asc' | 'desc' = 'desc';

/**
 * JSON repository adapter for items.
 * Read operations are supported, while writes are disabled.
 */
export class JsonItemRepository implements IItemRepository {
  private readonly items: Item[];

  constructor() {
    this.items = this.loadItems();
  }

  async create(_data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'published_at'>): Promise<Item> {
    throw new ReadOnlyDataStoreError();
  }

  async findById(id: number): Promise<Item | null> {
    const item = this.items.find((entry) => entry.id === id);
    return item ? cloneItem(item) : null;
  }

  async findAll(options: {
    filters?: FilterOptions;
    sort?: SortOptions;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<Item>> {
    const filtered = this.applyFilters(this.items, options.filters);
    const sorted = this.applySort(filtered, options.sort);
    const paginated = this.applyPagination(sorted, options.pagination);

    return paginated;
  }

  async search(options: SearchOptions): Promise<PaginatedResult<Item>> {
    const normalizedQuery = options.query.trim().toLowerCase();
    const matched = this.items.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    const filtered = this.applyFilters(matched, options.filters);
    const sorted = this.applySort(filtered, { field: DEFAULT_SORT_FIELD, direction: DEFAULT_SORT_DIRECTION });
    const paginated = this.applyPagination(sorted, options.pagination);

    return paginated;
  }

  async update(_id: number, _data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'published_at'>): Promise<Item | null> {
    throw new ReadOnlyDataStoreError();
  }

  async patch(_id: number, _data: Partial<UpdateItemData>): Promise<Item | null> {
    throw new ReadOnlyDataStoreError();
  }

  async delete(_id: number): Promise<boolean> {
    throw new ReadOnlyDataStoreError();
  }

  async exists(id: number): Promise<boolean> {
    return this.items.some((entry) => entry.id === id);
  }

  private loadItems(): Item[] {
    const jsonPath = getJsonDataPath();
    const content = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(content) as JsonDataFile;

    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error(`Invalid JSON datastore file at ${jsonPath}`);
    }

    return parsed.items.map(normalizeItem);
  }

  private applyFilters(items: Item[], filters?: FilterOptions): Item[] {
    if (!filters) {
      return [...items];
    }

    return items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.city && item.city !== filters.city) return false;
      if (filters.postal_code && item.postal_code !== filters.postal_code) return false;
      if (filters.is_featured !== undefined && item.is_featured !== filters.is_featured) return false;
      if (filters.delivery_available !== undefined && item.delivery_available !== filters.delivery_available) return false;
      return true;
    });
  }

  private applySort(items: Item[], sort?: SortOptions): Item[] {
    const field = normalizeSortField(sort?.field);
    const direction = sort?.direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      const av = sortableValue(a, field);
      const bv = sortableValue(b, field);

      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return (a.id - b.id) * direction;
    });
  }

  private applyPagination(items: Item[], pagination?: PaginationOptions): PaginatedResult<Item> {
    const limit = pagination?.limit ?? 20;
    let cursorFiltered = items;

    if (pagination?.cursor) {
      const cursor = parseCursor(pagination.cursor);
      if (cursor) {
        cursorFiltered = applyCreatedAtCursor(items, cursor, DEFAULT_SORT_DIRECTION);
      }
    }

    const page = cursorFiltered.slice(0, limit + 1);
    const hasNextPage = page.length > limit;
    const resultItems = page.slice(0, limit).map(cloneItem);

    let nextCursor: string | undefined;
    if (hasNextPage && resultItems.length > 0) {
      const last = resultItems[resultItems.length - 1];
      const data: CursorData = {
        id: last.id,
        created_at: last.created_at
      };
      nextCursor = createCursor(data);
    }

    return {
      items: resultItems,
      next_cursor: nextCursor
    };
  }
}

function normalizeItem(item: Item): Item {
  return {
    ...item,
    images: Array.isArray(item.images) ? item.images : []
  };
}

function cloneItem(item: Item): Item {
  return {
    ...item,
    images: Array.isArray(item.images) ? item.images.map((image) => ({ ...image })) : []
  };
}

function normalizeSortField(field?: string): keyof Item {
  const allowedFields: Array<keyof Item> = ['id', 'title', 'price_cents', 'created_at', 'updated_at'];
  if (!field) return 'created_at';
  return allowedFields.includes(field as keyof Item) ? (field as keyof Item) : 'created_at';
}

function sortableValue(item: Item, field: keyof Item): string | number {
  const value = item[field];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  return '';
}

function applyCreatedAtCursor(items: Item[], cursor: CursorData, direction: 'asc' | 'desc'): Item[] {
  return items.filter((item) => {
    if (direction === 'desc') {
      if (item.created_at < cursor.created_at) return true;
      if (item.created_at > cursor.created_at) return false;
      return item.id < cursor.id;
    }

    if (item.created_at > cursor.created_at) return true;
    if (item.created_at < cursor.created_at) return false;
    return item.id > cursor.id;
  });
}
