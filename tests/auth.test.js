const request = require('supertest');
const app = require('../server');

const validUser = {
  name: 'Test User',
  email: `testuser_${Date.now()}@example.com`,
  password: 'Test1234!'
};

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('creates a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/signup').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.subscription).toBe('free');
      expect(res.body.user.password).toBeUndefined();
    });

    it('returns 409 when email already registered', async () => {
      const dupUser = { ...validUser, email: `dup_${Date.now()}@example.com` };
      await request(app).post('/api/auth/signup').send(dupUser);
      const res = await request(app).post('/api/auth/signup').send(dupUser);
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, name: '', email: `noname_${Date.now()}@example.com` });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...validUser, email: `weakpw_${Date.now()}@example.com`, password: 'weak' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    let loginEmail;

    beforeAll(async () => {
      loginEmail = `login_${Date.now()}@example.com`;
      await request(app).post('/api/auth/signup').send({ ...validUser, email: loginEmail });
    });

    it('logs in a registered user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(loginEmail);
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: loginEmail, password: 'WrongPass1!' });
      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: validUser.password });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('returns profile for authenticated user', async () => {
      const profileUser = { ...validUser, email: `profile_${Date.now()}@example.com` };
      const signup = await request(app).post('/api/auth/signup').send(profileUser);
      const token = signup.body.token;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(profileUser.email);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });
});
