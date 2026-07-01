/* ===== KITOBMARKAZI — API Routes: Analytics ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* GET /api/analytics/overview — dashboard stats */
router.get('/overview', adminRequired, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const newOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'new'").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE status != 'cancelled'").get().s;
  const totalBooks = db.prepare("SELECT COUNT(*) as c FROM books").get().c;
  const totalPublishers = db.prepare("SELECT COUNT(*) as c FROM publishers").get().c;

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(createdAt) = ?").get(today).c;
  const todayRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE date(createdAt) = ? AND status != 'cancelled'").get(today).s;

  // This week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE createdAt >= ?").get(weekAgo.toISOString()).c;
  const weekRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as s FROM orders WHERE createdAt >= ? AND status != 'cancelled'").get(weekAgo.toISOString()).s;

  res.json({
    totalOrders, newOrders, totalRevenue, totalBooks, totalPublishers,
    todayOrders, todayRevenue, weekOrders, weekRevenue
  });
});

/* GET /api/analytics/top-books — best selling books */
router.get('/top-books', adminRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT oi.bookId, oi.publisherSlug, oi.title, oi.author, SUM(oi.qty) as totalSold, SUM(oi.price * oi.qty) as totalRevenue
    FROM order_items oi
    JOIN orders o ON oi.orderId = o.id AND o.status != 'cancelled'
    GROUP BY oi.publisherSlug, oi.bookId
    ORDER BY totalSold DESC LIMIT 10
  `).all();
  res.json(rows);
});

/* GET /api/analytics/top-publishers — top publishers by revenue */
router.get('/top-publishers', adminRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT oi.publisherSlug, p.name, SUM(oi.qty) as totalSold, SUM(oi.price * oi.qty) as totalRevenue
    FROM order_items oi
    JOIN orders o ON oi.orderId = o.id AND o.status != 'cancelled'
    LEFT JOIN publishers p ON oi.publisherSlug = p.slug
    GROUP BY oi.publisherSlug
    ORDER BY totalRevenue DESC LIMIT 10
  `).all();
  res.json(rows);
});

/* GET /api/analytics/orders-by-day — daily order chart data */
router.get('/orders-by-day', adminRequired, (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const rows = db.prepare(`
    SELECT date(createdAt) as day, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE createdAt >= datetime('now', '-' || ? || ' days') AND status != 'cancelled'
    GROUP BY date(createdAt) ORDER BY day ASC
  `).all(days);
  res.json(rows);
});

/* GET /api/analytics/by-region — orders by region */
router.get('/by-region', adminRequired, (req, res) => {
  const rows = db.prepare(`
    SELECT region, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders WHERE status != 'cancelled' GROUP BY region ORDER BY orders DESC
  `).all();
  res.json(rows);
});

/* GET /api/analytics/by-status — order status distribution */
router.get('/by-status', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC').all();
  res.json(rows);
});

/* GET /api/analytics/by-payment — payment method distribution */
router.get('/by-payment', adminRequired, (req, res) => {
  const rows = db.prepare("SELECT payMethod, COUNT(*) as count FROM orders WHERE status != 'cancelled' GROUP BY payMethod ORDER BY count DESC").all();
  res.json(rows);
});

module.exports = router;
