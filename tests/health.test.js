const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('GET /api/health returns 200 with service info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('EzClippin API');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/health uses CSP that allows existing inline scripts and handlers', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'];

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("script-src-attr 'unsafe-inline'");
  });
});
