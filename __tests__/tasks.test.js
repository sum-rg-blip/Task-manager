const request = require('supertest');
const app = require('../server');

describe('Task Manager API', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
  it('GET /tasks returns an array', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  it('POST /tasks creates a task', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Test', description: 'x' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test');
  });
  it('POST /tasks without title returns 400', async () => {
    const res = await request(app).post('/tasks').send({});
    expect(res.status).toBe(400);
  });
  it('DELETE /tasks/:id removes a task', async () => {
    const created = await request(app).post('/tasks').send({ title: 'ToDelete' });
    const res = await request(app).delete(`/tasks/${created.body.id}`);
    expect(res.status).toBe(204);
  });
});
