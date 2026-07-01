/* ===== KITOBMARKAZI — Express Server (Vercel/Supabase) ===== */
try { require('dotenv').config(); } catch(e) { /* dotenv not needed on Vercel */ }
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ── Health check (debug) ── */
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    const result = await db.query('SELECT NOW()');
    res.json({ ok: true, dbTime: result.rows[0].now, env: !!process.env.DATABASE_URL });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message, stack: e.stack, env: !!process.env.DATABASE_URL });
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
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
