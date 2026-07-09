/* ===== KITOBMARKAZI — API Routes: Couriers ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/couriers?region=Toshkent&tuman=Mirzo%20Ulug'bek
 * Returns available couriers for a given region + tuman.
 * Logic: check tuman override first, then region mapping, then default.
 */
router.get('/', async (req, res) => {
  const { region, tuman } = req.query;

  try {
    if (!region || !tuman) {
      const all = await db.query(
        `SELECT slug, name, color, description, price FROM couriers ORDER BY name`
      );
      return res.json(all.rows);
    }
    // 1. Check tuman-specific overrides first
    const overrides = await db.query(
      `SELECT c.slug, c.name, c.color, c.description, c.price
       FROM courier_tuman_overrides o
       JOIN couriers c ON o."courierSlug" = c.slug
       WHERE o.region = $1 AND o.tuman = $2`,
      [region, tuman]
    );

    if (overrides.rows.length > 0) {
      return res.json(overrides.rows);
    }

    // 2. Fall back to region-level couriers
    const regional = await db.query(
      `SELECT c.slug, c.name, c.color, c.description, c.price
       FROM courier_regions cr
       JOIN couriers c ON cr."courierSlug" = c.slug
       WHERE cr.region = $1`,
      [region]
    );

    if (regional.rows.length > 0) {
      return res.json(regional.rows);
    }

    // 3. Fall back to all couriers (default)
    const all = await db.query(
      `SELECT slug, name, color, description, price FROM couriers ORDER BY name`
    );
    res.json(all.rows);

  } catch (e) {
    console.error('Courier fetch error:', e);
    res.status(500).json({ error: 'Kuryerlarni yuklashda xatolik' });
  }
});

module.exports = router;
