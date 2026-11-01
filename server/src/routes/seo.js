/* ===== KITOBMARKAZI — sitemap.xml (built from the live catalogue) ===== */
const db = require('../db');

const STATIC = ['/', '/qidirish', '/nashriyotlar', '/tavsiyalar', '/biz-haqimizda', '/aloqa', '/faq', '/shartlar', '/oferta'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = async function sitemap(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const base = `${proto}://${host}`;
    const pubs = await db.prepare('SELECT slug FROM publishers').all();
    const books = await db.prepare('SELECT id, "publisherSlug" FROM books').all();
    const urls = [
      ...STATIC.map(p => base + p),
      ...pubs.map(p => `${base}/nashriyot?pub=${encodeURIComponent(p.slug)}`),
      ...books.map(b => `${base}/kitob?pub=${encodeURIComponent(b.publisherSlug)}&book=${encodeURIComponent(b.id)}`)
    ];
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n') + '\n</urlset>\n');
  } catch (e) {
    res.status(500).type('text/plain').send('sitemap unavailable');
  }
};
