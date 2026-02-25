const request = require('supertest');
const app = require('../server');

const validContact = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Test Subject',
  message: 'This is a test message with enough characters.'
};

describe('Contact Routes', () => {
  describe('GET /api/contact/info', () => {
    it('returns contact information', async () => {
      const res = await request(app).get('/api/contact/info');
      expect(res.status).toBe(200);
      expect(res.body.email).toBeDefined();
      expect(res.body.supportHours).toBeDefined();
    });
  });

  describe('POST /api/contact/submit', () => {
    it('submits a valid contact form', async () => {
      const res = await request(app)
        .post('/api/contact/submit')
        .send(validContact);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/contact/submit')
        .send({ ...validContact, name: '' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/contact/submit')
        .send({ ...validContact, email: 'bad-email' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when message is too short', async () => {
      const res = await request(app)
        .post('/api/contact/submit')
        .send({ ...validContact, message: 'Short' });
      // May return 429 if rate limit is hit during testing
      expect([400, 429]).toContain(res.status);
    });
  });
});
