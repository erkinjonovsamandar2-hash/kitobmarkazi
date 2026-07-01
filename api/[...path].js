// Minimal test to find what crashes
module.exports = (req, res) => {
  try {
    require('express');
    require('cors');
    require('pg');
    require('bcryptjs');
    require('jsonwebtoken');
    require('uuid');
    res.json({ ok: true, msg: 'All deps loaded' });
  } catch(e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: e.message, stack: e.stack }));
  }
};
