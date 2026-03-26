#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Populates the database with deterministic sample marketplace data.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { generateSeedItems } from './lib/seed-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - at server/database/db.sqlite (relative to repo root)
const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'db.sqlite');
const SEED_COUNT = Number(process.env.SEED_COUNT ?? 15);
const SEED_VALUE = Number(process.env.SEED_VALUE ?? 424242);

console.log('Database Seed Script');
console.log('====================');
console.log(`Database path: ${DB_PATH}`);
console.log(`Seed: ${SEED_VALUE}`);

if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found. Please run npm run db:init first.');
  process.exit(1);
}

const db = new Database(DB_PATH);

console.log('\nClearing existing data...');
db.prepare('DELETE FROM items').run();
db.prepare('DELETE FROM items_fts').run();
console.log('Cleared existing data');

console.log(`\nGenerating ${SEED_COUNT} deterministic items...`);
const items = generateSeedItems(SEED_COUNT, SEED_VALUE);

const insertStmt = db.prepare(`
  INSERT INTO items (
    title, description, price_cents, category, condition, status,
    is_featured, city, postal_code, country, delivery_available,
    created_at, updated_at, published_at, images
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const [index, item] of items.entries()) {
  insertStmt.run(
    item.title,
    item.description,
    item.price_cents,
    item.category,
    item.condition,
    item.status,
    item.is_featured ? 1 : 0,
    item.city,
    item.postal_code,
    item.country,
    item.delivery_available ? 1 : 0,
    item.created_at,
    item.updated_at,
    item.published_at,
    JSON.stringify(item.images)
  );

  console.log(`  Inserted item ${index + 1}: ${item.title} (${(item.price_cents / 100).toFixed(2)} EUR)`);
}

console.log('\nPopulating FTS5 index...');
db.prepare('INSERT INTO items_fts(items_fts) VALUES(\'rebuild\')').run();
console.log('FTS5 index populated');

const countResult = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
console.log(`\nSeeded ${countResult.count} items successfully`);

db.close();

console.log('\nNext steps:');
console.log('  - Run "npm run db:verify" to verify the seed data');
