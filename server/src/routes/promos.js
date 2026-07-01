/* ===== KITOBMARKAZI — API Routes: Promo Codes ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* POST /api/promos/validate — public: check if promo code is valid */
router.post('/validate', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND isActive = 1').get(code.toUpperCase());
  if (!promo) return res.json({ valid: false, message: 'Promokod topilmadi' });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.json({ valid: false, message: 'Promokod muddati tugagan' });
  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.json({ valid: false, message: 'Promokod ishlatilgan' });
  if (subtotal && subtotal < promo.minOrder) return res.json({ valid: false, message: `Minimal buyurtma: ${promo.minOrder} so'm` });

  let discount = 0;
  if (promo.type === 'percentage') {
    discount = subtotal ? Math.round(subtotal * promo.value / 100) : 0;
  } else {
    discount = Math.min(promo.value, subtotal || promo.value);
  }
  res.json({ valid: true, type: promo.type, value: promo.value, discount, message: promo.type === 'percentage' ? `${promo.value}% chegirma` : `${promo.value} so'm chegirma` });
});

/* GET /api/promos — admin: list all promo codes */
router.get('/', adminRequired, (req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY createdAt DESC').all();
  res.json(promos);
});

/* POST /api/promos — admin: create promo code */
router.post('/', adminRequired, (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'code and value required' });
  try {
    db.prepare(`INSERT INTO promo_codes (code, type, value, minOrder, maxUses, expiresAt, isActive)
      VALUES (?, ?, ?, ?, ?, ?, 1)`)
      .run(code.toUpperCase(), type || 'percentage', value, minOrder || 0, maxUses || 0, expiresAt || null);
    res.status(201).json({ ok: true, code: code.toUpperCase() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/promos/:code — admin: update promo */
router.put('/:code', adminRequired, (req, res) => {
  const { isActive, value, minOrder, maxUses, expiresAt } = req.body;
  const result = db.prepare(`UPDATE promo_codes SET isActive=COALESCE(?,isActive), value=COALESCE(?,value),
    minOrder=COALESCE(?,minOrder), maxUses=COALESCE(?,maxUses), expiresAt=COALESCE(?,expiresAt) WHERE code=?`)
    .run(isActive !== undefined ? (isActive ? 1 : 0) : null, value, minOrder, maxUses, expiresAt, req.params.code.toUpperCase());
  if (result.changes === 0) return res.status(404).json({ error: 'Promo not found' });
  res.json({ ok: true });
});

/* DELETE /api/promos/:code — admin: delete promo */
router.delete('/:code', adminRequired, (req, res) => {
  const result = db.prepare('DELETE FROM promo_codes WHERE code = ?').run(req.params.code.toUpperCase());
  if (result.changes === 0) return res.status(404).json({ error: 'Promo not found' });
  res.json({ ok: true });
});

module.exports = router;
