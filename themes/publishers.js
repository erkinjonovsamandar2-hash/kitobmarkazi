/* Nashriyotlar page, demo options C/E/F.
   - search box + three honest chips replace the A-Z strip
   - each publisher card gets up to 3 real covers (files the site really has); none found = compact row, nothing invented */
(function () {
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    var grid = document.getElementById('grid'), alpha = document.getElementById('alpha');
    if (!grid || !alpha || typeof window.render !== 'function') return;
    document.documentElement.classList.add('pc-on');

    /* ---- tools: search + chips ---- */
    var q = '', mode = 'all';
    var tools = document.createElement('div');
    tools.className = 'pc-tools';
    tools.innerHTML =
      '<label class="pc-search"><span class="pc-sr">Nashriyot qidirish</span><input type="search" placeholder="Nashriyot qidirish…" autocomplete="off" enterkeyhint="search"></label>' +
      '<div class="pc-chips" role="group" aria-label="Saralash">' +
      '<button type="button" class="pc-chip on" data-m="all" aria-pressed="true">Barchasi</button>' +
      '<button type="button" class="pc-chip" data-m="top" aria-pressed="false">TOP</button>' +
      '<button type="button" class="pc-chip" data-m="most" aria-pressed="false">Eng ko‘p kitob</button></div>';
    grid.parentNode.insertBefore(tools, grid);

    window.filtered = function () {
      var all = window.ALL || [], P = window.PUBLISHERS || {}, C = window.counts || {};
      var s = q.trim().toLowerCase();
      var l = all.filter(function (k) {
        var p = P[k]; if (!p) return false;
        if (s && (p.name || '').toLowerCase().indexOf(s) < 0) return false;
        return mode === 'top' ? !!p.first : true;
      });
      if (mode === 'most') l = l.slice().sort(function (a, b) { return (C[b] || 0) - (C[a] || 0); });
      return l;
    };
    function redraw() { window.curPage = 1; window.render(); }
    var t;
    tools.querySelector('input').addEventListener('input', function (e) { q = e.target.value; clearTimeout(t); t = setTimeout(redraw, 120); });
    tools.querySelector('.pc-chips').addEventListener('click', function (e) {
      var b = e.target.closest('.pc-chip'); if (!b) return;
      mode = b.getAttribute('data-m');
      tools.querySelectorAll('.pc-chip').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      redraw();
    });

    /* ---- covers per publisher ---- */
    var byPub = null, probed = {};
    function probe(url) {
      if (probed[url] !== undefined) return probed[url];
      return (probed[url] = new Promise(function (res) { var i = new Image(); i.onload = function () { res(url); }; i.onerror = function () { res(null); }; i.src = url; }));
    }
    function cover(b) {
      return probe('images/covers/' + b.id + '.jpg').then(function (u) { return u || probe('images/covers/' + b.id + '-catalog.webp'); });
    }
    function load() {
      if (byPub) return Promise.resolve(byPub);
      return fetch('/api/books?limit=100').then(function (r) { return r.json(); }).then(function (d) {
        byPub = {};
        (d.books || []).forEach(function (b) { (byPub[b.publisherSlug] = byPub[b.publisherSlug] || []).push(b); });
        return byPub;
      }).catch(function () { byPub = {}; return byPub; });
    }
    function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function enhance(card) {
      if (card.getAttribute('data-pc')) return;
      card.setAttribute('data-pc', '1');
      var slug = (/pub=([^&]+)/.exec(card.getAttribute('href') || '') || [])[1];
      if (!slug) return;
      slug = decodeURIComponent(slug);
      load().then(function (m) {
        var all = m[slug] || [], list = all.slice(0, 9), found = [];
        return list.reduce(function (p, b) {
          return p.then(function () {
            if (found.length >= 3) return;
            return cover(b).then(function (u) { if (u) found.push({ u: u, b: b }); });
          });
        }, Promise.resolve()).then(function () {
          /* books with no cover file: draw the same gradient cover the book page shows (title + author) */
          all.forEach(function (b) {
            if (found.length >= 3) return;
            if (!found.some(function (x) { return x.b === b; })) found.push({ b: b, drawn: true });
          });
          return found;
        });
      }).then(function (found) {
        if (found.length < 2 || !card.isConnected) return;
        var strip = document.createElement('div');
        strip.className = 'pc-covers'; strip.setAttribute('aria-hidden', 'true');
        strip.innerHTML = found.map(function (x) {
          if (x.drawn) return '<span class="pc-drawn" style="background:' + esc(x.b.color || '#1A3A5C') + '"><b>' + esc(x.b.title) + '</b><i>' + esc(x.b.author || '') + '</i></span>';
          return '<img src="' + x.u + '" alt="" width="120" height="180" loading="lazy">';
        }).join('');
        var go = document.createElement('span');
        go.className = 'pc-go'; go.textContent = 'Kitoblarini ko‘rish →';
        card.appendChild(strip); card.appendChild(go);
        card.classList.add('has-covers');
      });
    }
    function scan() { grid.querySelectorAll('.pcard').forEach(enhance); }
    new MutationObserver(scan).observe(grid, { childList: true });
    scan();
  });
})();
