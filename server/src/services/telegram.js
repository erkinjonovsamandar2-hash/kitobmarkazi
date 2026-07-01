/* ===== KITOBMARKAZI — Telegram Notification Service (Postgres) ===== */
const db = require('../db');

async function getSettings() {
  const botTokenRow = await db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
  const chatIdRow = await db.prepare("SELECT value FROM settings WHERE key = 'telegram_admin_chat_id'").get();
  return { 
    botToken: botTokenRow ? botTokenRow.value : '', 
    chatId: chatIdRow ? chatIdRow.value : '' 
  };
}

async function sendTelegram(text) {
  const { botToken, chatId } = await getSettings();
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

async function notifyNewOrder(order) {
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

  await sendTelegram(text);
}

async function notifyOrderStatus(orderNumber, status) {
  const statusNames = {
    confirmed: '✅ Tasdiqlandi',
    processing: '📦 Tayyorlanmoqda',
    shipped: '🚚 Yo\'lda',
    delivered: '🎉 Yetkazildi',
    cancelled: '❌ Bekor qilindi'
  };
  await sendTelegram(`📋 <b>${orderNumber}</b> — ${statusNames[status] || status}`);
}

module.exports = { sendTelegram, notifyNewOrder, notifyOrderStatus };
