/* Theme C behaviour: the home hero shows a wall of real covers instead of one book.
   Covers come from files the site really has (images/covers/<id>.jpg or <id>-catalog.webp);
   books without a cover file are skipped, so nothing is invented. */
(function () {
  if (!/\/(index\.html)?$/.test(location.pathname)) return;
  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  function probe(url) {
    return new Promise(function (res) { var i = new Image(); i.onload = function () { res(url); }; i.onerror = function () { res(null); }; i.src = url; });
  }
  ready(function () {
    var mount = document.getElementById('heroShowcase');
    if (!mount) return;
    fetch('/api/books?limit=100').then(function (r) { return r.json(); }).then(function (d) {
      var books = d.books || [];
      return Promise.all(books.map(function (b) {
        return probe('images/covers/' + b.id + '.jpg').then(function (u) {
          return u ? { b: b, url: u } : probe('images/covers/' + b.id + '-catalog.webp').then(function (w) { return w ? { b: b, url: w } : null; });
        });
      }));
    }).then(function (list) {
      list = list.filter(Boolean);
      if (list.length < 6) return;                       // too few real covers: keep the single book
      var cols = [[], [], []];
      for (var i = 0; i < 12; i++) cols[i % 3].push(list[i % list.length]);   // repeat real covers to fill the wall
      var html = cols.map(function (c, k) {
        var items = c.concat(c).map(function (x) {
          return '<a href="book.html?pub=' + encodeURIComponent(x.b.publisherSlug) + '&book=' + encodeURIComponent(x.b.id) + '" aria-label="' + x.b.title.replace(/"/g, '&quot;') + '"><img src="' + x.url + '" alt="" loading="lazy"></a>';
        }).join('');
        return '<div class="cw-col cw-' + k + '">' + items + '</div>';
      }).join('');
      mount.innerHTML = '<div class="cwall" aria-label="Kitoblar"><div class="cw-cols">' + html + '</div></div>';
      mount.classList.add('has-wall');
    }).catch(function () {});
  });
})();
