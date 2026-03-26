import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonDataPath = path.resolve(__dirname, '../../data/items.json');

describe('Items API Integration Tests (JSON backend)', () => {
  let app: Express;
  const previousBackend = process.env.DATA_BACKEND;
  const previousJsonDataPath = process.env.JSON_DATA_PATH;

  beforeAll(async () => {
    process.env.DATA_BACKEND = 'json';
    process.env.JSON_DATA_PATH = jsonDataPath;

    const { createApp } = await import('../../src/infrastructure/http/server.js');
    app = await createApp();
  });

  afterAll(() => {
    if (previousBackend === undefined) {
      delete process.env.DATA_BACKEND;
    } else {
      process.env.DATA_BACKEND = previousBackend;
    }

    if (previousJsonDataPath === undefined) {
      delete process.env.JSON_DATA_PATH;
    } else {
      process.env.JSON_DATA_PATH = previousJsonDataPath;
    }
  });

  it('serves list items from JSON datastore', async () => {
    const response = await request(app).get('/v1/items');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0]).toHaveProperty('id');
  });

  it('serves item detail from JSON datastore', async () => {
    const listResponse = await request(app).get('/v1/items');
    const firstId = listResponse.body.items[0]?.id;

    const response = await request(app).get(`/v1/items/${firstId}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', firstId);
  });

  it('returns 405 for write operations', async () => {
    const payload = {
      title: 'Blocked Write',
      price_cents: 1000,
      condition: 'good'
    };

    const response = await request(app)
      .post('/v1/items')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(405);
    expect(response.body).toHaveProperty('error.code', 'read_only_data_store');
  });
});
