/* ===== KITOBMARKAZI — API Routes: AI Chat Assistant (Gemini) ===== */
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Retrieve Gemini API key from settings
  const apiKeySetting = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get();
  const apiKey = apiKeySetting ? apiKeySetting.value.trim() : '';

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
    const books = db.prepare(`
      SELECT b.title, b.author, b.price, b.genre, p.name as publisherName
      FROM books b
      LEFT JOIN publishers p ON b.publisherSlug = p.slug
    `).all();

    const bookCatalog = books.map(b => 
      `- "${b.title}" (${b.author}) — ${b.price.toLocaleString('uz-UZ')} so'm [Nashriyot: ${b.publisherName}, Janr: ${b.genre}]`
    ).join('\n');

    const systemPrompt = 
      `Siz Kitobmarkazi platformasining aqlli kitob maslahatchisisiz. ` +
      `Foydalanuvchilarga kitob tanlashda yordam berasiz. ` +
      `Faqat o'zbek tilida muloqot qiling.\n\n` +
      `Mavjud kitoblar:\n${bookCatalog}\n\n` +
      `Qoidalar:\n1. Faqat ro'yxatdagi kitoblarni tavsiya qiling.\n2. Markdown ishlating.`;

    // Map OpenAI-style messages to Gemini format
    // Gemini expects 'user' or 'model' (assistant) roles.
    const history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add system prompt as the first message or instructions
    const contents = [
      { role: 'user', parts: [{ text: "SYSTEM INSTRUCTIONS: " + systemPrompt }] },
      { role: 'model', parts: [{ text: "Tushunarlu. Men Kitobmarkazi maslahatchisi sifatida yordam berishga tayyorman." }] },
      ...history
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API failed:', errText);
      return res.status(502).json({ error: 'Gemini API xatoligi' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Kechirasiz, xabar shakllantirishda xatolik yuz berdi.";

    // Return in OpenAI-style to maintain compatibility with frontend
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
