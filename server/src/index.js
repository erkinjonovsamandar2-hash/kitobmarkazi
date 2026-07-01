/* ===== KITOBMARKAZI — Express Server ===== */
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
app.use('/api', require('./routes/misc'));  // settings, coming-soon, couriers, search
app.use('/api/chat', require('./routes/chat'));

/* ── Serve frontend static files ── */
app.use(express.static(path.join(__dirname, '..', '..')));

/* ── Admin panel (served from /admin) ── */
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// SPA fallback for admin
app.get('/admin/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

/* ── Error handler ── */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`\n  🚀 Kitobmarkazi server running at http://localhost:${PORT}`);
  console.log(`  📚 Frontend:  http://localhost:${PORT}`);
  console.log(`  🔧 Admin:     http://localhost:${PORT}/admin`);
  console.log(`  📡 API:       http://localhost:${PORT}/api\n`);
});
