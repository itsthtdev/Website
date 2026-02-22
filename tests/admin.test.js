const request = require('supertest');
const app = require('../server');

describe('Admin Routes', () => {
  describe('POST /api/admin/login', () => {
    it('logs in with valid admin credentials', async () => {
      const res = await request(app).post('/api/admin/login').send({
        email: 'admin@ezclippin.studio',
        password: 'admin123'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.admin.role).toBe('admin');
    });

    it('returns 401 for wrong admin password', async () => {
      const res = await request(app).post('/api/admin/login').send({
        email: 'admin@ezclippin.studio',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown admin email', async () => {
      const res = await request(app).post('/api/admin/login').send({
        email: 'notadmin@example.com',
        password: 'admin123'
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('returns dashboard data for authenticated admin', async () => {
      const loginRes = await request(app).post('/api/admin/login').send({
        email: 'admin@ezclippin.studio',
        password: 'admin123'
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
      expect(typeof res.body.overview.totalUsers).toBe('number');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
    });

    it('returns 403 when using a regular user token', async () => {
      const signup = await request(app).post('/api/auth/signup').send({
        name: 'Regular User',
        email: `regular_${Date.now()}@example.com`,
        phone: '+12345678901',
        password: 'Test1234!'
      });
      const userToken = signup.body.token;

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns paginated users list for admin', async () => {
      const loginRes = await request(app).post('/api/admin/login').send({
        email: 'admin@ezclippin.studio',
        password: 'admin123'
      });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });
});
