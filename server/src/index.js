/* ===== KITOBMARKAZI — Express Server (Vercel/Supabase) ===== */
try { require('dotenv').config(); } catch(e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ── Debug: log every request ── */
app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

/* ── Health check ── */
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    const result = await db.query('SELECT NOW()');
    res.json({ ok: true, dbTime: result.rows[0].now, env: !!process.env.DATABASE_URL });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ── API Routes ── */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/misc'));
app.use('/api/chat', require('./routes/chat'));

/* ── Telegram Webhook ── */
app.post('/api/webhook/telegram', async (req, res) => {
  res.sendStatus(200);
});

/* ── API 404 catch-all ── */
app.all('/api/:path+', (req, res) => {
  res.status(404).json({ error: 'Route not found', method: req.method, path: req.originalUrl });
});

/* ── Serve static files (local dev only) ── */
if (!process.env.VERCEL) {
  const ROOT = path.join(__dirname, '..', '..');
  app.use(express.static(ROOT));
  app.use('/admin', express.static(path.join(ROOT, 'admin')));
  app.listen(PORT, () => {
    console.log(`\n  🚀 Kitobmarkazi server running at http://localhost:${PORT}`);
  });
}

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
