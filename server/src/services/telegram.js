/* ===== KITOBMARKAZI — Telegram Notification Service ===== */
const db = require('../db');

function getSettings() {
  const botToken = (db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get() || {}).value || '';
  const chatId = (db.prepare("SELECT value FROM settings WHERE key = 'telegram_admin_chat_id'").get() || {}).value || '';
  return { botToken, chatId };
}

async function sendTelegram(text) {
  const { botToken, chatId } = getSettings();
  if (!botToken || !chatId) return; // Not configured

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('Telegram notification failed:', e.message);
  }
}

function notifyNewOrder(order) {
  const payNames = { payme: 'Payme', click: 'Click', uzum: 'Uzum' };
  const itemLines = (order.items || []).map(it => `  📖 ${it.title} × ${it.qty}`).join('\n');

  const text =
    `🛒 <b>Yangi buyurtma!</b>\n\n` +
    `📋 <b>${order.orderNumber}</b>\n` +
    `👤 ${order.customerName}\n` +
    `📞 ${order.customerPhone}\n` +
    `📍 ${order.tuman}, ${order.region}\n\n` +
    `<b>Kitoblar:</b>\n${itemLines}\n\n` +
    `💳 ${payNames[order.payMethod] || order.payMethod}\n` +
    `💰 <b>${(order.total || 0).toLocaleString('uz-UZ')} so'm</b>`;

  sendTelegram(text);
}

function notifyOrderStatus(orderNumber, status) {
  const statusNames = {
    confirmed: '✅ Tasdiqlandi',
    processing: '📦 Tayyorlanmoqda',
    shipped: '🚚 Yo\'lda',
    delivered: '🎉 Yetkazildi',
    cancelled: '❌ Bekor qilindi'
  };
  sendTelegram(`📋 <b>${orderNumber}</b> — ${statusNames[status] || status}`);
}

module.exports = { sendTelegram, notifyNewOrder, notifyOrderStatus };
