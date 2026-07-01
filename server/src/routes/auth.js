/* ===== KITOBMARKAZI — API Routes: Auth (Postgres/Supabase) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { signToken, adminRequired } = require('../middleware/auth');

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  
  const user = await db.prepare('SELECT * FROM users WHERE username = $1').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
  }
  
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } });
});

/* GET /api/auth/me — get current user */
router.get('/me', adminRequired, async (req, res) => {
  const user = await db.prepare('SELECT id, username, "displayName", role, "telegramChatId" FROM users WHERE id = $1').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/* PUT /api/auth/password — change password */
router.put('/password', adminRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  
  const user = await db.prepare('SELECT * FROM users WHERE id = $1').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.prepare('UPDATE users SET "passwordHash" = $1 WHERE id = $2').run(hash, req.user.id);
  res.json({ ok: true });
});

/* PUT /api/auth/telegram — set Telegram chat ID for notifications */
router.put('/telegram', adminRequired, async (req, res) => {
  const { chatId } = req.body;
  await db.prepare('UPDATE users SET "telegramChatId" = $1 WHERE id = $2').run(chatId || null, req.user.id);
  await db.prepare("INSERT INTO settings (key, value) VALUES ('telegram_admin_chat_id', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value").run(chatId || '');
  res.json({ ok: true });
});

module.exports = router;
