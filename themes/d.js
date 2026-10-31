/* Theme D behaviours: small UX upgrades that only exist in the demo's option D */
(function () {
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    /* 1. every "added to cart" toast gets a way forward */
    if (typeof window.toast === 'function' && !window.toast.__kmd) {
      var orig = window.toast;
      window.toast = function (msg, type) {
        orig.apply(this, arguments);
        if (/savatga qo'shildi/i.test(String(msg)) && type !== 'error') {
          var t = document.getElementById('km-toast');
          if (t && !t.querySelector('a')) {
            t.insertAdjacentHTML('beforeend', '<a href="cart.html" style="color:#72C8A7;font-weight:800;margin-left:8px;white-space:nowrap">Savatga o‘tish →</a>');
            t.style.pointerEvents = 'auto';
            clearTimeout(window._kmToastT);
            window._kmToastT = setTimeout(function () { t.style.opacity = '0'; t.style.pointerEvents = 'none'; t.style.transform = 'translateX(-50%) translateY(20px)'; }, 4500);
          }
        }
      };
      window.toast.__kmd = 1;
    }
    /* 2. warm the next page when a link or card gets pointer/touch intent */
    var done = {};
    function prefetch(url) {
      try {
        var u = new URL(url, location.href);
        if (u.origin !== location.origin || u.href === location.href || /\.(png|jpe?g|webp|svg|pdf)$/i.test(u.pathname) || u.pathname.indexOf('/api/') === 0 || done[u.href]) return;
        done[u.href] = 1;
        var l = document.createElement('link'); l.rel = 'prefetch'; l.href = u.href; document.head.appendChild(l);
      } catch (e) {}
    }
    function intent(e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (a) return prefetch(a.getAttribute('href'));
      var c = e.target.closest && e.target.closest('.book[onclick]');
      if (c) { var m = /location\.href='([^']+)'/.exec(c.getAttribute('onclick') || ''); if (m) prefetch(m[1]); }
    }
    document.addEventListener('pointerover', intent, { passive: true });
    document.addEventListener('touchstart', intent, { passive: true });
    /* 3. label the floating chat button */
    var tries = 0;
    var iv = setInterval(function () {
      var b = document.getElementById('kmChatBtn');
      if (b && !b.classList.contains('has-label')) {
        b.classList.add('has-label');
        b.setAttribute('aria-label', 'Savol bering');
        b.insertAdjacentHTML('beforeend', '<span class="km-chat-lbl">Savol bering</span>');
        clearInterval(iv);
      } else if (++tries > 40) clearInterval(iv);
    }, 250);
  });
})();
