require('dotenv').config();
const Sentry = require('@sentry/node');
const { Logtail } = require('@logtail/node');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const migrate = require('./migrate');
const seed = require('./seed');

// Better Stack logging
const logtail = new Logtail('B5zuBpeRSsy99EbBfkZHHC5w', {
  endpoint: 'https://s2346903.eu-fsn-3.betterstackdata.com',
});

// Global error handlers — send crashes to Better Stack before exiting
process.on('uncaughtException', (err) => {
  logtail.error('Uncaught exception', { error: err.message, stack: err.stack });
  logtail.flush().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logtail.error('Unhandled rejection', { error: message, stack });
  logtail.flush().finally(() => process.exit(1));
});

Sentry.init({
  dsn: 'https://b981b066013dc3b9a0ee1ce86bdc9ef7@o4511162586759168.ingest.us.sentry.io/4511162607927296',
  tracesSampleRate: 1.0,
  integrations: [Sentry.expressIntegration()],
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.set('trust proxy', 1);

// Rate limiting
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, try again later' },
}));

app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
}));

// Request logger — logs every API call to Better Stack
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logtail[level](`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: ms,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent'],
    });
  });
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Serve React frontend
const clientDist = path.join(__dirname, 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Log HTTP errors (4xx/5xx) to Better Stack
app.use((err, req, res, next) => {
  logtail.error('HTTP error', {
    method: req.method,
    path: req.path,
    status: err.status || 500,
    error: err.message,
  });
  next(err);
});

// Sentry error handler — must be before other error handlers
Sentry.setupExpressErrorHandler(app);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await migrate();
    await seed();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`McCulloch Invoice API running on port ${PORT}`);
      logtail.info('Invoice server started', { port: PORT, env: process.env.NODE_ENV || 'development' });
      logtail.flush();
    });
  } catch (err) {
    console.error('Failed to start:', err);
    logtail.error('Failed to start server', { error: err.message });
    logtail.flush().finally(() => process.exit(1));
  }
}

start();
