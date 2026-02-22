const request = require('supertest');
const app = require('../server');

describe('Download Routes', () => {
  describe('GET /api/download/info', () => {
    it('returns download info for all platforms without authentication', async () => {
      const res = await request(app).get('/api/download/info');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.downloads)).toBe(true);
      expect(res.body.downloads.length).toBeGreaterThan(0);
      expect(res.body.latestVersion).toBeDefined();
    });

    it('includes windows, mac, and linux platforms', async () => {
      const res = await request(app).get('/api/download/info');
      const platforms = res.body.downloads.map(d => d.platform);
      expect(platforms).toContain('windows');
      expect(platforms).toContain('mac');
      expect(platforms).toContain('linux');
    });
  });

  describe('GET /api/download/:platform (protected)', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/download/windows');
      expect(res.status).toBe(401);
    });

    it('returns download link for valid platform when authenticated', async () => {
      // Sign up and get a token
      const signup = await request(app).post('/api/auth/signup').send({
        name: 'Download Tester',
        email: `dltest_${Date.now()}@example.com`,
        phone: '+12345678901',
        password: 'Test1234!'
      });
      const token = signup.body.token;

      const res = await request(app)
        .get('/api/download/windows')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.downloadUrl).toBeDefined();
      expect(res.body.platform).toBe('windows');
    });

    it('returns 400 for an invalid platform', async () => {
      const signup = await request(app).post('/api/auth/signup').send({
        name: 'Download Tester2',
        email: `dltest2_${Date.now()}@example.com`,
        phone: '+12345678901',
        password: 'Test1234!'
      });
      const token = signup.body.token;

      const res = await request(app)
        .get('/api/download/amiga')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
