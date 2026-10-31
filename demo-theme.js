/* ===== KITOBMARKAZI — Design demo layer =====
   Inert unless a demo is switched on (?theme=a|b|c|current or a stored choice).
   When on it (1) loads a theme stylesheet over the real site, (2) shows a small
   switcher bar, and (3) keeps the demo SAFE: no real orders, reviews or customer
   data are ever written — those calls are answered locally. Everything else
   (catalogue, search, cart, wishlist, promo check, couriers, chat) is the real site. */
(function () {
  'use strict';
  var KEY = 'kmd_theme', EMB = 'kmd_embed', ORD = 'kmd_orders';
  var THEMES = {
    a: { name: 'A · Toza', fonts: 'family=Manrope:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900' },
    b: { name: 'B · Imprint', fonts: 'family=Source+Serif+4:opsz,wght@8..60,600;8..60,700;8..60,800&family=Golos+Text:wght@400;500;600;700;800' },
    c: { name: 'C · Lapis', fonts: 'family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Golos+Text:wght@400;500;600;700;800' }
  };

  function store(get, k, v) {
    try { if (v === undefined) return get ? localStorage.getItem(k) : null; v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; }

  var q = new URLSearchParams(location.search);
  var fromUrl = q.get('theme');
  if (fromUrl) store(true, KEY, fromUrl);
  if (q.get('embed') === '1') ss(EMB, '1');
  var theme = store(true, KEY);
  if (!theme) return;                       // demo not activated: the site is untouched
  var embed = ss(EMB) === '1';
  var root = document.documentElement;
  root.setAttribute('data-km-theme', theme);

  /* ---------- theme stylesheet + fonts ---------- */
  function addLink(href, rel) { var l = document.createElement('link'); l.rel = rel || 'stylesheet'; l.href = href; document.head.appendChild(l); return l; }
  if (THEMES[theme]) {
    addLink('https://fonts.googleapis.com/css2?' + THEMES[theme].fonts + '&display=swap');
    addLink('/themes/' + theme + '.css');
  }

  /* ---------- safe demo: answer writes locally ---------- */
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  function json(status, body) { return Promise.resolve(new Response(JSON.stringify(body), { status: status, headers: { 'Content-Type': 'application/json' } })); }
  function orders() { try { return JSON.parse(store(true, ORD) || '{}'); } catch (e) { return {}; } }
  function say(msg) { try { if (typeof toast === 'function') toast(msg); } catch (e) {} }

  if (realFetch) window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var path = '';
    try { path = new URL(url, location.href).pathname; } catch (e) {}
    var body = {};
    try { body = JSON.parse((init && init.body) || '{}'); } catch (e) {}

    if (method === 'POST' && /^\/api\/orders\/?$/.test(path)) {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', n = '';
      for (var i = 0; i < 6; i++) n += chars.charAt(Math.floor(Math.random() * chars.length));
      var num = 'DEMO-' + n;
      var subtotal = 0, fee = 0;
      try { subtotal = typeof cartTotal === 'function' ? cartTotal() : 0; } catch (e) {}
      try { fee = body.payTime === 'prepaid' && typeof courierFee === 'function' ? (courierFee(body.courierSlug) || 0) : 0; } catch (e) {}
      var all = orders();
      all[num] = { createdAt: new Date().toISOString(), customerName: body.customerName || 'Demo', customerPhone: body.customerPhone || '+998900000000', region: body.region, tuman: body.tuman };
      store(true, ORD, JSON.stringify(all));
      return json(201, { ok: true, orderNumber: num, orderId: 'demo-' + n, subtotal: subtotal, discount: 0, deliveryFee: fee, total: subtotal + fee, promoApplied: null });
    }
    var tr = /^\/api\/orders\/track\/(DEMO-[A-Z0-9]+)$/i.exec(path);
    if (method === 'GET' && tr) {
      var o = orders()[tr[1].toUpperCase()];
      if (!o) return json(404, { error: 'Buyurtma topilmadi' });
      var sec = (Date.now() - new Date(o.createdAt).getTime()) / 1000;   // demo: status advances every 15s
      var st = sec < 15 ? 'new' : sec < 30 ? 'confirmed' : sec < 45 ? 'processing' : sec < 60 ? 'shipped' : 'delivered';
      var ph = o.customerPhone || '';
      return json(200, { orderNumber: tr[1].toUpperCase(), status: st, customerName: (o.customerName || 'D').charAt(0) + '***', customerPhone: ph.slice(0, 7) + '***' + ph.slice(-2), tuman: o.tuman, region: o.region, createdAt: o.createdAt, updatedAt: new Date().toISOString() });
    }
    if (method === 'POST' && /^\/api\/books\/[^/]+\/reviews\/?$/.test(path)) {
      say('Demo rejimi: fikr saqlanmaydi');
      return json(201, { ok: true, demo: true });
    }
    if (method !== 'GET' && method !== 'HEAD' && /^\/api\//.test(path) && !/^\/api\/(chat|promos\/validate)\/?$/.test(path)) {
      return json(200, { ok: true, demo: true });   // any other write: acknowledged, never stored
    }
    return realFetch(input, init);
  };

  /* ---------- switcher bar ---------- */
  function bar() {
    if (embed || document.getElementById('kmd-bar')) return;
    var css = document.createElement('style');
    css.textContent =
      '#kmd-bar{font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;background:#15171c;color:#e9eaee;display:flex;align-items:center;gap:6px;padding:7px 12px;position:relative;z-index:300;overflow-x:auto;scrollbar-width:none;white-space:nowrap}' +
      '#kmd-bar::-webkit-scrollbar{display:none}' +
      '#kmd-bar b{letter-spacing:.06em;font-size:11px;color:#9aa0ad;margin-right:4px}' +
      '#kmd-bar button,#kmd-bar a{font:inherit;color:#e9eaee;background:transparent;border:1.5px solid #3a3e48;border-radius:8px;padding:7px 12px;min-height:34px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;transition:background .15s,border-color .15s}' +
      '#kmd-bar button:hover,#kmd-bar a:hover{background:#262a33}' +
      '#kmd-bar button[aria-pressed=true]{background:#fff;color:#15171c;border-color:#fff}' +
      '#kmd-bar :focus-visible{outline:3px solid #7aa2ff;outline-offset:2px}' +
      '#kmd-bar .kmd-note{margin-left:auto;color:#9aa0ad;font-weight:500;padding-left:12px}' +
      '@media (max-width:760px){#kmd-bar .kmd-note{display:none}}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'kmd-bar'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Dizayn demosi');
    var html = '<b>DEMO</b>';
    [['current', 'Hozirgi sayt']].concat(Object.keys(THEMES).map(function (k) { return [k, THEMES[k].name]; })).forEach(function (t) {
      html += '<button type="button" data-t="' + t[0] + '" aria-pressed="' + (t[0] === theme) + '">' + t[1] + '</button>';
    });
    html += '<a href="/ui-options/index.html">Taqqoslash</a><span class="kmd-note">Sinov rejimi: buyurtma va fikrlar yuborilmaydi</span>';
    d.innerHTML = html;
    d.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-t]');
      if (!b) return;
      store(true, KEY, b.getAttribute('data-t'));
      var u = new URL(location.href); u.searchParams.delete('theme'); location.href = u.toString();
    });
    document.body.insertBefore(d, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
})();
