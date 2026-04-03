import request from 'supertest';
import app from '../../src/app';

describe('GET /api/v1/feed', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/feed');
    expect(res.status).toBe(401);
  });
});
