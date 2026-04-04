require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const migrate = require('./migrate');
const seed = require('./seed');

Sentry.init({
  dsn: 'https://b981b066013dc3b9a0ee1ce86bdc9ef7@o4511162586759168.ingest.us.sentry.io/4511162607927296',
  tracesSampleRate: 1.0,
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
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
