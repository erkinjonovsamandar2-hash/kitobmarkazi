/* ===== KITOBMARKAZI — API Routes: AI Chat Assistant (Gemini - Postgres) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Retrieve Gemini API key from settings or env variables
  const apiKeySetting = await db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get();
  const apiKey = (apiKeySetting ? apiKeySetting.value.trim() : '') || process.env.GEMINI_API_KEY || '';

  if (!apiKey) {
    return res.json({
      choices: [{
        message: {
          role: 'assistant',
          content: "Assalomu alaykum! Men Kitobmarkazi aqlli yordamchisiman. Hozirda mening tizimim to'liq sozlanmagan (Gemini API kaliti kiritilmagan). Admin panel orqali sozlamalardan Gemini API kalitini kiritganingizdan so'ng, men sizga yordam bera olaman!"
        }
      }]
    });
  }

  try {
    const books = await db.prepare(`
      SELECT b.title, b.author, b.price, b.genre, p.name as "publisherName"
      FROM books b
      LEFT JOIN publishers p ON b."publisherSlug" = p.slug
    `).all();

    const bookCatalog = books.map(b => 
      `- "${b.title}" (${b.author}) — ${b.price.toLocaleString('uz-UZ')} so'm [Nashriyot: ${b.publisherName}, Janr: ${b.genre}]`
    ).join('\n');

    const systemPrompt = 
      `Siz Kitobmarkazi platformasining samimiy, aqlli kitob maslahatchisi va do'stona suhbatdoshisiz. ` +
      `Foydalanuvchilarga kitob tanlashda yordam berasiz yoki shunchaki oddiy va samimiy suhbat qurasiz. ` +
      `Faqat o'zbek tilida muloqot qiling.\n\n` +
      `Mavjud kitoblar:\n${bookCatalog}\n\n` +
      `Qoidalar:\n` +
      `1. Doimo qisqa, lo'nda va tabiiy javob bering. Hech qachon juda uzun ma'ruza yoki ro'yxatlar yozmang.\n` +
      `2. Agar foydalanuvchi kitob so'ramasa, kitoblar haqida gapirmang, shunchaki uning suhbatdoshi bo'ling.\n` +
      `3. Faqat ro'yxatdagi kitoblarni tavsiya qiling.\n` +
      `4. Kitob nomlarini doimo **"Kitob Nomi"** (bold va qo'shtirnoq ichida) shaklida aniq yozing.`;

    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const contents = [
      { role: 'user', parts: [{ text: "SYSTEM INSTRUCTIONS: " + systemPrompt }] },
      { role: 'model', parts: [{ text: "Tushunarlu. Men Kitobmarkazi maslahatchisi sifatida yordam berishga tayyorman." }] },
      ...history
    ];

    let response;
    let retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (response.ok) {
          break;
        }

        const errText = await response.text();
        console.warn(`Gemini API attempt ${i + 1} failed:`, errText);

        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return res.status(response.status).json({ error: 'Gemini API query error', message: errText });
        }
      } catch (e) {
        console.warn(`Gemini API attempt ${i + 1} threw error:`, e);
      }

      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    if (!response || !response.ok) {
      return res.status(502).json({ error: 'Gemini API is currently overloaded. Please try again in a few seconds.' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Kechirasiz, xabar shakllantirishda xatolik yuz berdi.";

    res.json({
      choices: [{
        message: { role: 'assistant', content: text }
      }]
    });

  } catch (e) {
    console.error('AI Chat Error:', e);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

module.exports = router;
