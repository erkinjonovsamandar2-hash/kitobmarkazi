/* ===== KITOBMARKAZI — API Routes: Orders (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuid } = require('uuid');
const { adminRequired } = require('../middleware/auth');
const { notifyNewOrder } = require('../services/telegram');

/* POST /api/orders — submit new order */
router.post('/', async (req, res) => {
  const { customerName, customerPhone, region, tuman, address, courierSlug, payTime, payMethod, items, promoCode, note } = req.body;

  // Validate required fields
  const errs = [];
  if (!customerName) errs.push('Ism');
  if (!customerPhone) errs.push('Telefon');
  if (!region) errs.push('Viloyat');
  if (!tuman) errs.push('Tuman');
  if (!address) errs.push('Manzil');
  if (!courierSlug) errs.push('Kuryer');
  if (!payTime) errs.push('Yetkazish to\'lovi');
  if (!payMethod) errs.push('To\'lov usuli');
  if (!items || !items.length) errs.push('Kitoblar');
  if (errs.length) return res.status(400).json({ error: 'Iltimos to\'ldiring: ' + errs.join(', '), fields: errs });

  // Calculate totals
  let subtotal = 0;
  const enrichedItems = [];
  for (const it of items) {
    const book = await db.prepare('SELECT * FROM books WHERE "publisherSlug" = $1 AND id = $2').get(it.publisherSlug || it.pubKey, it.bookId || it.id);
    if (!book) continue;
    const lineTotal = book.price * (it.qty || 1);
    subtotal += lineTotal;
    enrichedItems.push({ ...it, publisherSlug: book.publisherSlug, bookId: book.id, title: book.title, author: book.author, price: book.price, qty: it.qty || 1 });
  }

  // Delivery fee
  const courier = await db.prepare('SELECT * FROM couriers WHERE slug = $1').get(courierSlug);
  const deliveryFee = courier ? parseInt((courier.price || '0').replace(/[^0-9]/g, ''), 10) : 0;

  // Promo code
  let discount = 0;
  let appliedPromo = null;
  if (promoCode) {
    const promo = await db.prepare('SELECT * FROM promo_codes WHERE code = $1 AND "isActive" = 1').get(promoCode.toUpperCase());
    if (promo) {
      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        // expired
      } else if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
        // used up
      } else if (subtotal < promo.minOrder) {
        // min order not met
      } else {
        appliedPromo = promo.code;
        if (promo.type === 'percentage') {
          discount = Math.round(subtotal * promo.value / 100);
        } else {
          discount = Math.min(promo.value, subtotal);
        }
        await db.prepare('UPDATE promo_codes SET "usedCount" = "usedCount" + 1 WHERE code = $1').run(promo.code);
      }
    }
  }

  const total = subtotal - discount + (payTime === 'prepaid' ? deliveryFee : 0);

  // Generate order number
  const orderNumber = 'UZ-' + (10000 + Math.floor(Math.random() * 90000));
  const orderId = uuid();

  // Insert order
  await db.prepare(`INSERT INTO orders (id, "orderNumber", "customerName", "customerPhone", region, tuman, address,
    "courierSlug", "payTime", "payMethod", "promoCode", discount, subtotal, "deliveryFee", total, status, note)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'new', $16)`)
    .run(orderId, orderNumber, customerName, customerPhone, region, tuman, address,
      courierSlug, payTime, payMethod, appliedPromo, discount, subtotal, deliveryFee, total, note || null);

  // Insert order items
  const itemPrep = db.prepare('INSERT INTO order_items ("orderId", "publisherSlug", "bookId", title, author, price, qty) VALUES ($1, $2, $3, $4, $5, $6, $7)');
  for (const it of enrichedItems) {
    await itemPrep.run(orderId, it.publisherSlug, it.bookId, it.title, it.author, it.price, it.qty);
  }

  // Send Telegram notification
  notifyNewOrder({ orderNumber, customerName, customerPhone, region, tuman, total, items: enrichedItems, payMethod, courierSlug });

  res.status(201).json({
    ok: true,
    orderNumber,
    orderId,
    subtotal,
    discount,
    deliveryFee,
    total,
    promoApplied: appliedPromo
  });
});

/* GET /api/orders/:id — order status */
router.get('/:id', async (req, res) => {
  const order = await db.prepare('SELECT * FROM orders WHERE "orderNumber" = $1 OR id = $2').get(req.params.id, req.params.id);
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  const items = await db.prepare('SELECT * FROM order_items WHERE "orderId" = $1').all(order.id);
  const courier = order.courierSlug ? await db.prepare('SELECT * FROM couriers WHERE slug = $1').get(order.courierSlug) : null;
  res.json({ ...order, items, courier });
});

/* GET /api/orders — admin: all orders */
router.get('/', adminRequired, async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  let where = '';
  const params = [];
  if (status && status !== 'all') { where = 'WHERE status = $1'; params.push(status); }
  
  const totalRes = await db.prepare(`SELECT COUNT(*) as c FROM orders ${where}`).get(...params);
  const total = parseInt(totalRes.c);
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const orders = await db.prepare(`SELECT * FROM orders ${where} ORDER BY "createdAt" DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`).all(...params, parseInt(limit), offset);
  
  // Attach item count
  const itemCounts = await db.prepare('SELECT "orderId", SUM(qty) as "itemCount" FROM order_items GROUP BY "orderId"').all();
  const countMap = {};
  itemCounts.forEach(r => { countMap[r.orderId] = r.itemCount; });
  orders.forEach(o => { o.itemCount = countMap[o.id] || 0; });
  
  res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

/* PUT /api/orders/:id/status — admin: update order status */
router.put('/:id/status', adminRequired, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  const result = await db.prepare('UPDATE orders SET status = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2 OR "orderNumber" = $3')
    .run(status, req.params.id, req.params.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true, status });
});

/* GET /api/orders/track/:orderNumber — public order tracking */
router.get('/track/:orderNumber', async (req, res) => {
  const order = await db.prepare('SELECT "orderNumber", status, "customerName", "customerPhone", tuman, region, "createdAt", "updatedAt" FROM orders WHERE "orderNumber" = $1').get(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  
  // Mask phone for privacy
  order.customerPhone = order.customerPhone.slice(0, 7) + '***' + order.customerPhone.slice(-2);
  order.customerName = order.customerName.charAt(0) + '***';
  
  res.json(order);
});

module.exports = router;
