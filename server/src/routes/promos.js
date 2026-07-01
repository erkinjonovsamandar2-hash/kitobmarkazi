/* ===== KITOBMARKAZI — API Routes: Promo Codes (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

/* POST /api/promos/validate — public: check if promo code is valid */
router.post('/validate', async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  
  const promo = await db.prepare('SELECT * FROM promo_codes WHERE code = $1 AND "isActive" = 1').get(code.toUpperCase());
  
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
router.get('/', adminRequired, async (req, res) => {
  const promos = await db.prepare('SELECT * FROM promo_codes ORDER BY "createdAt" DESC').all();
  res.json(promos);
});

/* POST /api/promos — admin: create promo code */
router.post('/', adminRequired, async (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'code and value required' });
  try {
    await db.prepare(`INSERT INTO promo_codes (code, type, value, "minOrder", "maxUses", "expiresAt", "isActive")
      VALUES ($1, $2, $3, $4, $5, $6, 1)`)
      .run(code.toUpperCase(), type || 'percentage', value, minOrder || 0, maxUses || 0, expiresAt || null);
    res.status(201).json({ ok: true, code: code.toUpperCase() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* PUT /api/promos/:code — admin: update promo */
router.put('/:code', adminRequired, async (req, res) => {
  const { isActive, value, minOrder, maxUses, expiresAt } = req.body;
  const result = await db.prepare(`UPDATE promo_codes SET "isActive"=COALESCE($1,"isActive"), value=COALESCE($2,value),
    "minOrder"=COALESCE($3,"minOrder"), "maxUses"=COALESCE($4,"maxUses"), "expiresAt"=COALESCE($5,"expiresAt") WHERE code=$6`)
    .run(isActive !== undefined ? (isActive ? 1 : 0) : null, value, minOrder, maxUses, expiresAt, req.params.code.toUpperCase());
  
  if (result.changes === 0) return res.status(404).json({ error: 'Promo not found' });
  res.json({ ok: true });
});

/* DELETE /api/promos/:code — admin: delete promo */
router.delete('/:code', adminRequired, async (req, res) => {
  const result = await db.prepare('DELETE FROM promo_codes WHERE code = $1').run(req.params.code.toUpperCase());
  if (result.changes === 0) return res.status(404).json({ error: 'Promo not found' });
  res.json({ ok: true });
});

module.exports = router;
