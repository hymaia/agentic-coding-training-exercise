#!/usr/bin/env tsx
/**
 * Database Initialization Script
 *
 * Creates the SQLite database with the items table and FTS5 virtual table.
 * Run this script to initialize or reinitialize the database.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ensureDatabaseDirectory, migrateDatabase, hasOldDatabase } from '../server/typescript/src/shared/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - at server/database/db.sqlite (relative to repo root)
// From scripts/, go up one level to repo root, then into server/database/
const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'db.sqlite');

console.log('Database Initialization Script');
console.log('=============================');
console.log(`Database path: ${DB_PATH}`);

// Check for old database and migrate if needed
const oldDbPath = path.join(__dirname, '..', 'server', 'typescript', 'database', 'marketplace.db');
if (fs.existsSync(oldDbPath)) {
  console.log('\n⚠️  Old database detected at:');
  console.log(`   ${oldDbPath}`);
  console.log('   Migrating to new location...');
  migrateDatabase();
}

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  console.log(`\nCreating directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Remove existing database if it exists
if (fs.existsSync(DB_PATH)) {
  console.log('Removing existing database...');
  fs.unlinkSync(DB_PATH);
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Creating schema...');

// Create items table
const createItemsTable = `
  CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(title) >= 3 AND length(title) <= 200),
    description TEXT,
    price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
    category TEXT,
    condition TEXT NOT NULL CHECK(condition IN ('new', 'like_new', 'good', 'fair', 'parts', 'unknown')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'reserved', 'sold', 'archived')),
    is_featured INTEGER NOT NULL DEFAULT 0,
    city TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'FR',
    delivery_available INTEGER NOT NULL DEFAULT 0,
    warranty TEXT NOT NULL DEFAULT 'none' CHECK(warranty IN ('none', '6_months', '1_year', '2_years')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_at TEXT,
    images TEXT NOT NULL DEFAULT '[]'
  );
`;

db.exec(createItemsTable);
console.log('✓ Created items table');

// Create FTS5 virtual table for full-text search
const createFTSTable = `
  CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    description,
    content=items,
    content_rowid=rowid,
    tokenize='unicode61 remove_diacritics 1'
  );
`;

db.exec(createFTSTable);
console.log('✓ Created items_fts table (FTS5 full-text search)');

// Create triggers to keep FTS table in sync with items table
const createInsertTrigger = `
  CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, description)
    VALUES (new.rowid, new.title, new.description);
  END;
`;

const createUpdateTrigger = `
  CREATE TRIGGER items_au AFTER UPDATE ON items BEGIN
    UPDATE items_fts
    SET title = new.title, description = new.description
    WHERE rowid = new.rowid;
  END;
`;

const createDeleteTrigger = `
  CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE rowid = old.rowid;
  END;
`;

db.exec(createInsertTrigger);
db.exec(createUpdateTrigger);
db.exec(createDeleteTrigger);
console.log('✓ Created FTS sync triggers (items_ai, items_au, items_ad)');

// Create indexes for common queries
db.exec('CREATE INDEX idx_items_status ON items(status);');
console.log('✓ Created index on status');

db.exec('CREATE INDEX idx_items_category ON items(category);');
console.log('✓ Created index on category');

db.exec('CREATE INDEX idx_items_condition ON items(condition);');
console.log('✓ Created index on condition');

db.exec('CREATE INDEX idx_items_city ON items(city);');
console.log('✓ Created index on city');

db.exec('CREATE INDEX idx_items_price_cents ON items(price_cents);');
console.log('✓ Created index on price_cents');

db.exec('CREATE INDEX idx_items_warranty ON items(warranty);');
console.log('✓ Created index on warranty');

// Verify schema
const tableInfo = db.prepare("PRAGMA table_info(items)").all() as any[];
console.log(`\nSchema verification: ${tableInfo.length} columns in items table`);

// Close database
db.close();

console.log('\n✅ Database initialized successfully!');
console.log(`\nNext steps:`);
console.log(`  - Run 'npm run db:seed' to populate with sample data`);
console.log(`  - Run 'npm run db:verify' to verify the installation`);
