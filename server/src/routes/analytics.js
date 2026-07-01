/* ===== KITOBMARKAZI — API Routes: Analytics (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/analytics/overview — dashboard stats */
router.get('/overview', adminRequired, async (req, res) => {
  const totalOrders = (await db.prepare("SELECT COUNT(*) as c FROM orders").get()).c;
  const newOrders = (await db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'new'").get()).c;
  const totalRevenue = (await db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE status != 'cancelled'").get()).s;
  const totalBooks = (await db.prepare("SELECT COUNT(*) as c FROM books").get()).c;
  const totalPublishers = (await db.prepare("SELECT COUNT(*) as c FROM publishers").get()).c;

  // Today's stats
  const todayRevenue = (await db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE DATE(\"createdAt\") = CURRENT_DATE AND status != 'cancelled'").get()).s;

  // This week
  const weekOrders = (await db.prepare("SELECT COUNT(*) as c FROM orders WHERE \"createdAt\" >= CURRENT_TIMESTAMP - INTERVAL '7 days'").get()).c;
  const weekRevenue = (await db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE \"createdAt\" >= CURRENT_TIMESTAMP - INTERVAL '7 days' AND status != 'cancelled'").get()).s;

  res.json({
    totalOrders: parseInt(totalOrders),
    newOrders: parseInt(newOrders),
    totalRevenue: parseInt(totalRevenue),
    totalBooks: parseInt(totalBooks),
    totalPublishers: parseInt(totalPublishers),
    todayRevenue: parseInt(todayRevenue),
    weekOrders: parseInt(weekOrders),
    weekRevenue: parseInt(weekRevenue)
  });
});

/* GET /api/analytics/top-books — best selling books */
router.get('/top-books', adminRequired, async (req, res) => {
  const rows = await db.prepare(`
    SELECT oi."bookId", oi."publisherSlug", oi.title, oi.author, SUM(oi.qty) as "totalSold", SUM(oi.price * oi.qty) as "totalRevenue"
    FROM order_items oi
    JOIN orders o ON oi."orderId" = o.id AND o.status != 'cancelled'
    GROUP BY oi."publisherSlug", oi."bookId", oi.title, oi.author
    ORDER BY "totalSold" DESC LIMIT 10
  `).all();
  res.json(rows);
});

/* GET /api/analytics/top-publishers — top publishers by revenue */
router.get('/top-publishers', adminRequired, async (req, res) => {
  const rows = await db.prepare(`
    SELECT oi."publisherSlug", p.name, SUM(oi.qty) as "totalSold", SUM(oi.price * oi.qty) as "totalRevenue"
    FROM order_items oi
    JOIN orders o ON oi."orderId" = o.id AND o.status != 'cancelled'
    LEFT JOIN publishers p ON oi."publisherSlug" = p.slug
    GROUP BY oi."publisherSlug", p.name
    ORDER BY "totalRevenue" DESC LIMIT 10
  `).all();
  res.json(rows);
});

/* GET /api/analytics/orders-by-day — daily order chart data */
router.get('/orders-by-day', adminRequired, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  // Using a simplified interval syntax for security
  const rows = await db.prepare(`
    SELECT DATE("createdAt") as day, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE "createdAt" >= CURRENT_TIMESTAMP - (INTERVAL '1 day' * $1) AND status != 'cancelled'
    GROUP BY DATE("createdAt") ORDER BY day ASC
  `).all(days);
  res.json(rows);
});

/* GET /api/analytics/by-region — orders by region */
router.get('/by-region', adminRequired, async (req, res) => {
  const rows = await db.prepare(`
    SELECT region, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE status != 'cancelled' GROUP BY region ORDER BY orders DESC
  `).all();
  res.json(rows);
});

/* GET /api/analytics/by-status — order status distribution */
router.get('/by-status', adminRequired, async (req, res) => {
  const rows = await db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC').all();
  res.json(rows);
});

/* GET /api/analytics/by-payment — payment method distribution */
router.get('/by-payment', adminRequired, async (req, res) => {
  const rows = await db.prepare('SELECT "payMethod" as "payMethod", COUNT(*) as count FROM orders WHERE status != \'cancelled\' GROUP BY "payMethod" ORDER BY count DESC').all();
  res.json(rows);
});

module.exports = router;
