#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * Populates the database with 15 random items with realistic French marketplace data.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - at server/database/db.sqlite (relative to repo root)
const DB_PATH = path.join(__dirname, '..', 'server', 'database', 'db.sqlite');

console.log('Database Seed Script');
console.log('====================');
console.log(`Database path: ${DB_PATH}`);

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found. Please run npm run db:init first.');
  process.exit(1);
}

// Create database connection
const db = new Database(DB_PATH);

// Sample data for generating realistic items
const CATEGORIES = [
  'Ordinateurs',
  'Appareils Photo',
  'Consoles',
  'Téléphones',
  'Tablettes',
  'Audio',
  'Accessoires',
  'Montres'
];

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'parts', 'unknown'];

const STATUSES = ['draft', 'active', 'reserved', 'sold', 'archived'];

const WARRANTIES = ['none', '6_months', '1_year', '2_years'];

const CITIES = [
  { name: 'Strasbourg', postalCode: '67000' },
  { name: 'Paris', postalCode: '75001' },
  { name: 'Lyon', postalCode: '69001' },
  { name: 'Marseille', postalCode: '13001' },
  { name: 'Bordeaux', postalCode: '33000' },
  { name: 'Toulouse', postalCode: '31000' },
  { name: 'Nice', postalCode: '06000' },
  { name: 'Nantes', postalCode: '44000' },
  { name: 'Montpellier', postalCode: '34000' },
  { name: 'Rennes', postalCode: '35000' }
];

const TITLES = [
  'iPhone 13 Pro 256GB',
  'MacBook Pro M1 2021',
  'PlayStation 5',
  'Canon EOS R6',
  'iPad Air 5',
  'Samsung Galaxy S22',
  'Nintendo Switch OLED',
  'Sony WH-1000XM4',
  'Dell XPS 15',
  'GoPro Hero 11',
  'Apple Watch Series 7',
  'Bose SoundLink Revolve',
  'Logitech MX Master 3',
  'Kindle Paperwhite',
  'Fujifilm X-T4'
];

const DESCRIPTIONS = [
  'Excellent état, fonctionne parfaitement. Vendu avec chargeur et câble d\'origine.',
  'Comme neuf, utilisé seulement quelques fois. Toujours sous garantie.',
  'Bon état général, traces d\'utilisation normales. Tout fonctionne correctement.',
  'État correct, quelques rayures sur le boîtier mais fonctionne très bien.',
  'Neuf sous plastique, jamais ouvert. Facture disponible.',
  'Très bon état, bien entretenu. Accessoires inclus.',
  'Occasion de particulier, en parfait état de marche.',
  'Modèle récent, très peu utilisé. Vendu avec tous les accessoires.'
];

// Utility functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomPrice(): number {
  // Generate random price between 10€ and 1500€
  return randomInt(1000, 150000);
}

function generateImages(): string {
  const imageCount = randomInt(1, 4);
  const images: string[] = [];
  for (let i = 0; i < imageCount; i++) {
    images.push(`https://picsum.photos/seed/${randomInt(1000, 9999)}/800/600.jpg`);
  }
  return JSON.stringify(images);
}

// Clear existing data
console.log('\nClearing existing data...');
db.prepare('DELETE FROM items').run();
db.prepare('DELETE FROM items_fts').run();
console.log('✓ Cleared existing data');

// Generate and insert 15 items
console.log('\nGenerating 15 random items...');
const insertStmt = db.prepare(`
  INSERT INTO items (
    title, description, price_cents, category, condition, status,
    is_featured, city, postal_code, country, delivery_available,
    warranty, created_at, updated_at, published_at, images
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const items: any[] = [];
for (let i = 0; i < 15; i++) {
  const city = randomItem(CITIES);
  const category = randomItem(CATEGORIES);
  const condition = randomItem(CONDITIONS);
  const status = randomItem(STATUSES);
  const isFeatured = Math.random() > 0.8 ? 1 : 0; // 20% chance of being featured
  const deliveryAvailable = Math.random() > 0.3 ? 1 : 0; // 70% chance of delivery available
  const warranty = randomItem(WARRANTIES);
  const priceCents = randomPrice();
  const publishedAt = status === 'active' ? new Date(Date.now() - randomInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString() : null;
  const createdAt = new Date(Date.now() - randomInt(0, 60 * 24 * 60 * 60 * 1000)).toISOString();
  const updatedAt = new Date(Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)).toISOString();

  const item = {
    title: randomItem(TITLES),
    description: randomItem(DESCRIPTIONS),
    price_cents: priceCents,
    category,
    condition,
    status,
    is_featured: isFeatured,
    city: city.name,
    postal_code: city.postalCode,
    country: 'FR',
    delivery_available: deliveryAvailable,
    warranty,
    created_at: createdAt,
    updated_at: updatedAt,
    published_at: publishedAt,
    images: generateImages()
  };

  insertStmt.run(
    item.title,
    item.description,
    item.price_cents,
    item.category,
    item.condition,
    item.status,
    item.is_featured,
    item.city,
    item.postal_code,
    item.country,
    item.delivery_available,
    item.warranty,
    item.created_at,
    item.updated_at,
    item.published_at,
    item.images
  );

  items.push(item);
  console.log(`  ✓ Inserted item ${i + 1}: ${item.title} (${item.price_cents / 100}€)`);
}

// Populate FTS5 index with existing data
console.log('\nPopulating FTS5 index...');
db.prepare('INSERT INTO items_fts(items_fts) VALUES(\'rebuild\')').run();
console.log('✓ FTS5 index populated');

// Verify seed data
const countResult = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
console.log(`\n✅ Seeded ${countResult.count} items successfully!`);

// Show some statistics
const stats = db.prepare(`
  SELECT
    category,
    condition,
    status,
    COUNT(*) as count
  FROM items
  GROUP BY category, condition, status
  ORDER BY count DESC
`).all();

console.log('\nDistribution by category, condition, and status:');
stats.slice(0, 5).forEach((stat: any) => {
  console.log(`  - ${stat.category} / ${stat.condition} / ${stat.status}: ${stat.count}`);
});

// Close database
db.close();

console.log('\nNext steps:');
console.log('  - Run "npm run db:verify" to verify the seed data');
