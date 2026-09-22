// Task Manager API - DevOps 101 workshop reference app
// Endpoints: GET /health, GET /metrics, GET /tasks, POST /tasks, DELETE /tasks/:id
const express = require('express');
const client = require('prom-client');

const app = express();
app.use(express.json());

const VERSION = process.env.APP_VERSION || '1.0.0';
const PORT = process.env.PORT || 3000;

// ---- Prometheus metrics ----
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    end({ method: req.method, route: req.path });
  });
  next();
});

// ---- In-memory store (swapped for Postgres in the DB lab) ----
let tasks = [
  { id: 1, title: 'Learn Docker', description: 'Containerize the API' },
  { id: 2, title: 'Write pipeline', description: 'GitHub Actions CI/CD' },
];
let nextId = 3;

// ---- Routes ----
app.get('/health', (req, res) => res.json({ status: 'ok', version: VERSION }));

app.get('/tasks', (req, res) => res.json(tasks));

app.post('/tasks', (req, res) => {
  const { title, description } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const task = { id: nextId++, title, description: description || '' };
  tasks.push(task);
  res.status(201).json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  if (tasks.length === before) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Export app for tests; only listen when run directly
if (require.main === module) {
  app.listen(PORT, () => console.log(`Task Manager API v${VERSION} on :${PORT}`));
}
module.exports = app;
