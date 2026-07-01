/* ===== KITOBMARKAZI — Express Server (Vercel/Supabase) ===== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const app = express();
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ── API Routes ── */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/books', require('./routes/books'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/misc'));
app.use('/api/chat', require('./routes/chat'));

/* ── Serve frontend static files ── */
// Note: In Vercel, static files are usually handled by vercel.json, 
// but we keep this for local development.
app.use(express.static(path.join(__dirname, '..', '..')));

/* ── Admin panel (served from /admin) ── */
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ── Start (Only if not running on Vercel) ── */
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  🚀 Kitobmarkazi server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
