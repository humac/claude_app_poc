import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { userDb, assetDb } from './database.js';
import { generateToken } from './auth.js';
import request from 'supertest';
import express from 'express';
import { authenticate, authorize } from './auth.js';
import { setupTestDb } from './test-db-helper.js';

const { dbPath, cleanup } = setupTestDb('reports-authorization');

// Create minimal express app with the report endpoints for testing
const app = express();
app.use(express.json());

// Mock report endpoints with authorization
app.get('/api/reports/statistics-enhanced', authenticate, authorize('admin', 'manager', 'coordinator'), async (req, res) => {
  res.json({ success: true, data: { activityByDay: [], actionBreakdown: [], topUsers: [] } });
});

app.get('/api/reports/compliance', authenticate, authorize('admin', 'manager', 'coordinator'), async (req, res) => {
  res.json({ success: true, data: { score: 85, overdueAttestations: 0 } });
});

app.get('/api/reports/trends', authenticate, authorize('admin', 'manager', 'coordinator'), async (req, res) => {
  res.json({ success: true, data: { assetGrowth: [], statusChanges: [] } });
});

describe('Reports Authorization', () => {
  let adminUser, managerUser, employeeUser, coordinatorUser;
  let adminToken, managerToken, employeeToken, coordinatorToken;
  let timestamp;

  beforeAll(async () => {
    cleanup();
    process.env.DB_PATH = dbPath;
    // Initialize database
    await assetDb.init();

    // Use timestamp to ensure unique test data
    timestamp = Date.now();

    // Create test users with unique emails and fetch them back
    await userDb.create({
      email: `admin-reports-${timestamp}@test.com`,
      name: 'Admin User',
      password_hash: 'dummy-hash',
      role: 'admin'
    });
    adminUser = await userDb.getByEmail(`admin-reports-${timestamp}@test.com`);
    adminToken = generateToken(adminUser);

    await userDb.create({
      email: `manager-reports-${timestamp}@test.com`,
      name: 'Manager User',
      password_hash: 'dummy-hash',
      role: 'manager'
    });
    managerUser = await userDb.getByEmail(`manager-reports-${timestamp}@test.com`);
    managerToken = generateToken(managerUser);

    await userDb.create({
      email: `employee-reports-${timestamp}@test.com`,
      name: 'Employee User',
      password_hash: 'dummy-hash',
      role: 'employee'
    });
    employeeUser = await userDb.getByEmail(`employee-reports-${timestamp}@test.com`);
    employeeToken = generateToken(employeeUser);

    await userDb.create({
      email: `coord-reports-${timestamp}@test.com`,
      name: 'Coordinator User',
      password_hash: 'dummy-hash',
      role: 'coordinator'
    });
    coordinatorUser = await userDb.getByEmail(`coord-reports-${timestamp}@test.com`);
    coordinatorToken = generateToken(coordinatorUser);
  });

  afterAll(async () => {
    cleanup();
    // Clean up test users
    try {
      if (adminUser?.id) await userDb.delete(adminUser.id);
      if (managerUser?.id) await userDb.delete(managerUser.id);
      if (employeeUser?.id) await userDb.delete(employeeUser.id);
      if (coordinatorUser?.id) await userDb.delete(coordinatorUser.id);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/reports/statistics-enhanced', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/reports/statistics-enhanced?period=30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access', async () => {
      const response = await request(app)
        .get('/api/reports/statistics-enhanced?period=30')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow attestation coordinator access', async () => {
      const response = await request(app)
        .get('/api/reports/statistics-enhanced?period=30')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/reports/statistics-enhanced?period=30')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/reports/statistics-enhanced?period=30');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/compliance', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/reports/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access', async () => {
      const response = await request(app)
        .get('/api/reports/compliance')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow attestation coordinator access', async () => {
      const response = await request(app)
        .get('/api/reports/compliance')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/reports/compliance')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/reports/compliance');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reports/trends', () => {
    it('should allow admin access', async () => {
      const response = await request(app)
        .get('/api/reports/trends?period=30')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow manager access', async () => {
      const response = await request(app)
        .get('/api/reports/trends?period=30')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should allow attestation coordinator access', async () => {
      const response = await request(app)
        .get('/api/reports/trends?period=30')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny employee access with 403', async () => {
      const response = await request(app)
        .get('/api/reports/trends?period=30')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should deny unauthenticated access', async () => {
      const response = await request(app)
        .get('/api/reports/trends?period=30');

      expect(response.status).toBe(401);
    });
  });
});
