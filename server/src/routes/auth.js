/* ===== KITOBMARKAZI — API Routes: Auth ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { signToken, adminRequired } = require('../middleware/auth');

/* POST /api/auth/login */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
  }
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } });
});

/* GET /api/auth/me — get current user */
router.get('/me', adminRequired, (req, res) => {
  const user = db.prepare('SELECT id, username, displayName, role, telegramChatId FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

/* PUT /api/auth/password — change password */
router.put('/password', adminRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

/* PUT /api/auth/telegram — set Telegram chat ID for notifications */
router.put('/telegram', adminRequired, (req, res) => {
  const { chatId } = req.body;
  db.prepare('UPDATE users SET telegramChatId = ? WHERE id = ?').run(chatId || null, req.user.id);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('telegram_admin_chat_id', ?)").run(chatId || '');
  res.json({ ok: true });
});

module.exports = router;
