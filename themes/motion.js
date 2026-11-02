/* Quiet motion kit (idea 5) for demo options A and D.
   1. cover glides from the card to the book page (cross-document view transition)
   2. on phones, "added to cart" opens a bottom sheet with the cart instead of a toast
   3. on desktop the toast carries a "Savatga o'tish" link (added once) */
(function () {
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. shared cover between list card and book page ---- */
  var last = null;
  document.addEventListener('pointerdown', function (e) {
    var c = e.target.closest && e.target.closest('.book, .bs-card');
    last = c ? (c.querySelector('.physical-book') || c) : null;
  }, { passive: true });
  window.addEventListener('pageswap', function (e) {
    if (e.viewTransition && last) last.style.viewTransitionName = 'bkcover';
  });
  window.addEventListener('pagereveal', function (e) {
    var el = document.querySelector('.bk-cover');
    if (e.viewTransition && el) el.style.viewTransitionName = 'bkcover';
  });

  /* ---- 2/3. add-to-cart feedback ---- */
  function money(n) { return (typeof window.money === 'function') ? window.money(n) : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + " so'm"; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var sheet, backdrop, timer;
  function closeSheet() {
    clearTimeout(timer);
    if (sheet) sheet.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }
  function openSheet() {
    var items = [];
    try { items = cartItemsDetailed(); } catch (e) {}
    if (!items.length) return false;
    if (!sheet) {
      backdrop = document.createElement('div'); backdrop.className = 'kmm-backdrop'; backdrop.addEventListener('click', closeSheet);
      sheet = document.createElement('div'); sheet.className = 'kmm-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Savat');
      document.body.appendChild(backdrop); document.body.appendChild(sheet);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    }
    var total = 0, n = 0;
    var rows = items.map(function (it) {
      var b = it.book || {}; total += it.sum || 0; n += it.qty;
      return '<li><b>' + esc(b.title || 'Kitob') + '</b><span>' + it.qty + ' × ' + money(b.price || 0) + '</span><em>' + money(it.sum || 0) + '</em></li>';
    }).join('');
    sheet.innerHTML = '<i class="kmm-grip"></i><div class="kmm-h">✓ Savatga qo\'shildi <span>' + n + ' ta kitob</span></div><ul>' + rows + '</ul>' +
      '<div class="kmm-t"><span>Jami (yetkazib berishsiz)</span><b>' + money(total) + '</b></div>' +
      '<div class="kmm-b"><button type="button" class="kmm-ghost">Davom etish</button><a href="cart.html" class="kmm-go">Buyurtmaga o\'tish</a></div>';
    sheet.querySelector('.kmm-ghost').addEventListener('click', closeSheet);
    requestAnimationFrame(function () { sheet.classList.add('open'); backdrop.classList.add('open'); });
    clearTimeout(timer); timer = setTimeout(closeSheet, 6000);
    return true;
  }

  ready(function () {
    if (typeof window.toast !== 'function' || window.toast.__kmm) return;
    var orig = window.toast;
    window.toast = function (msg, type) {
      var added = /savatga qo'shildi/i.test(String(msg)) && type !== 'error';
      if (added && window.matchMedia('(max-width: 700px)').matches && openSheet()) return;
      orig.apply(this, arguments);
      if (added) {
        var t = document.getElementById('km-toast');
        if (t && !t.querySelector('a')) {
          t.insertAdjacentHTML('beforeend', '<a href="cart.html" style="color:#72C8A7;font-weight:800;margin-left:8px;white-space:nowrap">Savatga o‘tish →</a>');
          t.style.pointerEvents = 'auto';
          clearTimeout(window._kmToastT);
          window._kmToastT = setTimeout(function () { t.style.opacity = '0'; t.style.pointerEvents = 'none'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 4500);
        }
      }
    };
    window.toast.__kmm = 1;
  });
})();
