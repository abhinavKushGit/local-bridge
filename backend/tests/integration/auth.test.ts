import request from 'supertest';
import app from '../../src/app';

describe('POST /api/v1/auth/send-otp', () => {
  it('rejects invalid phone format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '12345' });
    expect([400, 422]).toContain(res.status);
  });

  it('returns non-200 without phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({});
    expect(res.status).not.toBe(200);
  });
});
