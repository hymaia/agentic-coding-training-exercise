#!/usr/bin/env tsx
/**
 * Generate static JSON datastore for Netlify JSON backend mode.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { generateSeedItems } from './lib/seed-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const count = Number(process.env.SEED_COUNT ?? 15);
const seed = Number(process.env.SEED_VALUE ?? 424242);

const outputPath = path.join(__dirname, '..', 'server', 'typescript', 'data', 'items.json');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const generatedAt = new Date().toISOString();
const items = generateSeedItems(count, seed).map((item, index) => ({
  id: index + 1,
  ...item
}));

const payload = {
  generated_at: generatedAt,
  seed,
  count: items.length,
  items
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');

console.log('JSON data generated successfully.');
console.log(`Output: ${outputPath}`);
console.log(`Items: ${items.length}`);
console.log(`Seed: ${seed}`);
