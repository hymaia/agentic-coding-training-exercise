import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

export type DataBackend = 'sqlite' | 'json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getDataBackend(): DataBackend {
  const value = (process.env.DATA_BACKEND ?? 'sqlite').toLowerCase();
  return value === 'json' ? 'json' : 'sqlite';
}

export function getJsonDataPath(): string {
  if (process.env.JSON_DATA_PATH && process.env.JSON_DATA_PATH.trim().length > 0) {
    return process.env.JSON_DATA_PATH;
  }

  return path.join(__dirname, '../../', 'data', 'items.json');
}
