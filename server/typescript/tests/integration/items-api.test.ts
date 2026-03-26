import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/infrastructure/http/server.js';
import type { Express } from 'express';

describe('Items API Integration Tests', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /v1/items', () => {
    it('should return empty list when no items exist', async () => {
      const response = await request(app).get('/v1/items');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should respect default pagination limit', async () => {
      const response = await request(app).get('/v1/items');

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeLessThanOrEqual(20);
    });

    it('should return validation error for invalid limit', async () => {
      const response = await request(app).get('/v1/items?limit=200');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('validation_error');
    });
  });

  describe('POST /v1/items', () => {
    it('should create a new item with valid data', async () => {
      const newItem = {
        title: 'Test Item',
        description: 'Test description',
        price_cents: 10000,
        condition: 'good',
        category: 'Test Category'
      };

      const response = await request(app)
        .post('/v1/items')
        .send(newItem)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newItem.title);
      expect(response.body.price_cents).toBe(newItem.price_cents);
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should return validation error for title too short', async () => {
      const invalidItem = {
        title: 'HP',
        price_cents: 10000,
        condition: 'good'
      };

      const response = await request(app)
        .post('/v1/items')
        .send(invalidItem)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should return validation error for negative price', async () => {
      const invalidItem = {
        title: 'Valid Title',
        price_cents: -100,
        condition: 'good'
      };

      const response = await request(app)
        .post('/v1/items')
        .send(invalidItem)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should apply default values', async () => {
      const minimalItem = {
        title: 'Minimal Item',
        price_cents: 5000,
        condition: 'new'
      };

      const response = await request(app)
        .post('/v1/items')
        .send(minimalItem)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('draft');
      expect(response.body.country).toBe('FR');
      expect(response.body.is_featured).toBe(false);
      expect(response.body.images).toEqual([]);
    });
  });

  describe('GET /v1/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const response = await request(app).get('/v1/items/999999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('not_found');
    });
  });

  describe('PUT /v1/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const updateData = {
        title: 'Updated Title',
        price_cents: 20000,
        condition: 'like_new',
        status: 'active',
        is_featured: false,
        country: 'FR',
        delivery_available: false
      };

      const response = await request(app)
        .put('/v1/items/999999')
        .send(updateData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /v1/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const patchData = {
        title: 'Patched Title'
      };

      const response = await request(app)
        .patch('/v1/items/999999')
        .send(patchData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /v1/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const response = await request(app).delete('/v1/items/999999');

      expect(response.status).toBe(404);
    });
  });
});
