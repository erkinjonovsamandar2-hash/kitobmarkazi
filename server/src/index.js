/* ===== KITOBMARKAZI — Express Server (Vercel/Supabase) ===== */
try { require('dotenv').config(); } catch(e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const optional = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID', 'GEMINI_API_KEY'];
  
  console.log('\n🔍 Environment Check:');
  console.log('────────────────────────────────────────');
  
  let hasMissingRequired = false;
  required.forEach(key => {
    if (!process.env[key]) {
      console.log(`  ❌ ${key.padEnd(25)} [MISSING]`);
      hasMissingRequired = true;
    } else {
      console.log(`  ✅ ${key.padEnd(25)} [OK]`);
    }
  });

  optional.forEach(key => {
    if (!process.env[key]) {
      console.log(`  ⚠️  ${key.padEnd(25)} [NOT SET]`);
    } else {
      console.log(`  ✅ ${key.padEnd(25)} [OK]`);
    }
  });
  console.log('────────────────────────────────────────\n');

  if (hasMissingRequired) {
    console.error('FATAL: Missing required environment variables. Application cannot start.\n');
    process.exit(1);
  }
}

validateEnv();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

/* ── Debug filesystem ── */
app.get('/api/debug-files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  function listFiles(dir, depth = 0) {
    if (depth > 3) return [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let results = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '.git') {
            results.push({ name: entry.name, type: 'dir' });
          } else {
            results.push({ name: entry.name, type: 'dir', children: listFiles(fullPath, depth + 1) });
          }
        } else {
          results.push({ name: entry.name, type: 'file', size: fs.statSync(fullPath).size });
        }
      }
      return results;
    } catch(e) {
      return [{ error: e.message }];
    }
  }

  res.json({
    cwd: process.cwd(),
    __dirname: __dirname,
    cwdFiles: listFiles(process.cwd()),
    dirnameFiles: listFiles(__dirname)
  });
});

app.get('/api/debug-sqlite', (req, res) => {
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');
  
  const p = path.join(process.cwd(), 'server', 'data', 'kitobmarkazi.db');
  const exists = fs.existsSync(p);
  let status = 'unknown';
  let err = null;
  
  try {
    const dbInstance = new Database(p, { readonly: true });
    status = 'opened successfully';
    const row = dbInstance.prepare("SELECT datetime('now')").get();
    status = `queried successfully: ${JSON.stringify(row)}`;
    dbInstance.close();
  } catch(e) {
    status = 'failed';
    err = { message: e.message, stack: e.stack, code: e.code };
  }
  
  res.json({
    path: p,
    exists,
    status,
    error: err
  });
});

/* ── Health check ── */
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./db');
    const result = await db.query('SELECT NOW()');
    res.json({ ok: true, dbTime: result.rows[0].now });
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
app.use('/api/couriers', require('./routes/couriers'));
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
  
  const cleanRoutes = {
    '/qidirish': 'search.html',
    '/kitob': 'book.html',
    '/nashriyotlar': 'publishers.html',
    '/nashriyot': 'publisher.html',
    '/savat': 'cart.html',
    '/sevimlilar': 'wishlist.html',
    '/kuzatish': 'track.html',
    '/tavsiyalar': 'tavsiya.html',
    '/biz-haqimizda': 'about.html',
    '/aloqa': 'contact.html',
    '/faq': 'faq.html',
    '/shartlar': 'terms.html',
    '/oferta': 'offer.html',
    '/buyurtma': 'order.html'
  };

  Object.entries(cleanRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => res.sendFile(path.join(ROOT, file)));
  });

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
