/* ===== KITOBMARKAZI ADMIN — App Logic ===== */
var TOKEN = localStorage.getItem('km_admin_token') || '';
var USER = null;

/* ── API helpers ── */
function api(path, opts) {
  opts = opts || {};
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (TOKEN) opts.headers['Authorization'] = 'Bearer ' + TOKEN;
  return fetch('/api' + path, opts).then(function(r) {
    if (r.status === 401) { logout(); throw new Error('Unauthorized'); }
    return r.json();
  });
}
function money(n) { return (n || 0).toLocaleString('uz-UZ') + " so'm"; }

const GRADIENTS = [
  'linear-gradient(150deg,#1A3A5C,#2A5C8A)', // Navy
  'linear-gradient(150deg,#1D9E75,#5DCAA5)', // Teal
  'linear-gradient(150deg,#D9A93E,#F0CC72)', // Gold
  'linear-gradient(150deg,#7B2CBF,#9D4EDD)', // Purple
  'linear-gradient(150deg,#E2556F,#FF758C)', // Rose
  'linear-gradient(150deg,#2C3E50,#4CA1AF)', // Blue-Grey
  'linear-gradient(150deg,#FF8C00,#FFA500)', // Orange
  'linear-gradient(150deg,#15202E,#2C3E50)', // Dark
  '#1A3A5C', '#1D9E75', '#D9A93E', '#E2556F'
];

function colorPickerHTML(id, current) {
  var h = '<div class="color-picker-grid" id="' + id + '_grid">';
  GRADIENTS.forEach(function(g) {
    var isSel = current === g;
    h += '<div class="cp-item ' + (isSel?'on':'') + '" style="background:' + g + '" data-val="' + g + '" onclick="selectColor(\'' + id + '\', this)"></div>';
  });
  // Custom hex/gradient
  var isCustom = current && !GRADIENTS.includes(current);
  h += '<div class="cp-custom ' + (isCustom?'on':'') + '" title="Boshqa rang" id="' + id + '_custom_btn" onclick="toggleCustomColor(\'' + id + '\')">🎨</div>';
  h += '</div>';
  h += '<div id="' + id + '_custom_wrap" style="margin-top:8px;' + (isCustom?'':'display:none') + '">';
  h += '<input type="text" id="' + id + '_custom_val" value="' + (isCustom?current:'') + '" placeholder="#HEX yoki gradient..." oninput="selectCustomColor(\'' + id + '\', this.value)" style="height:34px;font-size:12px">';
  h += '</div>';
  h += '<input type="hidden" id="' + id + '" value="' + (current || GRADIENTS[0]) + '">';
  return h;
}

function selectColor(id, el) {
  document.querySelectorAll('#' + id + '_grid .cp-item, #' + id + '_grid .cp-custom').forEach(function(x){x.classList.remove('on')});
  el.classList.add('on');
  document.getElementById(id).value = el.getAttribute('data-val');
  document.getElementById(id + '_custom_wrap').style.display = 'none';
}

function toggleCustomColor(id) {
  var wrap = document.getElementById(id + '_custom_wrap');
  var isHidden = wrap.style.display === 'none';
  wrap.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    document.querySelectorAll('#' + id + '_grid .cp-item').forEach(function(x){x.classList.remove('on')});
    document.getElementById(id + '_custom_btn').classList.add('on');
  }
}

function selectCustomColor(id, val) {
  document.getElementById(id).value = val;
}


/* ── Auth ── */
function doLogin() {
  var u = document.getElementById('loginUser').value.trim();
  var p = document.getElementById('loginPass').value;
  fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: p })
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (data.error) { document.getElementById('loginErr').textContent = data.error; return; }
    TOKEN = data.token;
    USER = data.user;
    localStorage.setItem('km_admin_token', TOKEN);
    showDashboard();
  });
}
function logout() { TOKEN = ''; USER = null; localStorage.removeItem('km_admin_token'); location.reload(); }

function showDashboard() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  document.getElementById('topUser').textContent = (USER && USER.displayName) || 'Admin';
  showPage('overview', document.querySelector('.sb-link[data-page=overview]'));
}

/* ── Auto-login if token exists ── */
if (TOKEN) {
  api('/auth/me').then(function(u) { USER = u; showDashboard(); }).catch(function() { TOKEN = ''; });
}

/* ── Page router ── */
function showPage(page, el) {
  document.querySelectorAll('.sb-link').forEach(function(l) { l.classList.remove('on'); });
  if (el) el.classList.add('on');
  var titles = { overview: 'Umumiy ko\'rinish', orders: 'Buyurtmalar', books: 'Kitoblar', publishers: 'Nashriyotlar', reviews: 'Fikr-mulohazalar', promos: 'Promokodlar', coming: 'Tez kunda', settings: 'Sozlamalar' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  var c = document.getElementById('content');
  c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light)">Yuklanmoqda...</div>';
  if (page === 'overview') loadOverview();
  else if (page === 'orders') loadOrders();
  else if (page === 'books') loadBooks();
  else if (page === 'publishers') loadPublishers();
  else if (page === 'reviews') loadReviewsPage();
  else if (page === 'promos') loadPromos();
  else if (page === 'coming') loadComingSoon();
  else if (page === 'settings') loadSettings();
}

/* ── COMING SOON ── */
function loadComingSoon() {
  api('/coming-soon').then(function(items) {
    var h = '<div class="card-title"><span>⏳ Tez kunda e\'lonlari</span><button class="btn-sm btn-teal" onclick="showComingForm()">+ Yangi e\'lon</button></div>';
    if (!items.length) {
      h += '<div class="card" style="text-align:center;padding:30px;color:var(--light)">Hozircha e\'lon yo\'q</div>';
    } else {
      h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Sarlavha</th><th>Muallif</th><th>Nashriyot</th><th>Muddati</th><th></th></tr>';
      items.forEach(function(it) {
        var days = 0;
        if (it.releaseDate) {
          var rel = new Date(it.releaseDate);
          var now = new Date();
          now.setHours(0,0,0,0);
          days = Math.ceil((rel.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        h += '<tr><td><b>' + it.title + '</b></td><td>' + it.author + '</td><td>' + (it.publisherName||it.publisherSlug) + '</td><td>' + Math.max(0, days) + ' kun</td>' +
          '<td><button class="btn-sm btn-danger" onclick="deleteComing(\'' + it.id + '\')">🗑</button></td></tr>';
      });
      h += '</table></div>';
    }
    document.getElementById('content').innerHTML = h;
  });
}

function showComingForm() {
  api('/publishers').then(function(pubs) {
    var opts = pubs.map(function(p) { return '<option value="' + p.slug + '">' + p.name + '</option>'; }).join('');
    var today = new Date().toISOString().split('T')[0];
    var html = '<div class="modal-bg" onclick="if(event.target===this)this.remove()"><div class="modal"><h3>Yangi "Tez kunda" e\'loni</h3>' +
      '<div class="field"><label>Nashriyot</label><select id="cPub">' + opts + '</select></div>' +
      '<div class="frow"><div class="field"><label>Sarlavha</label><input type="text" id="cTitle" placeholder="Atom odatlar"></div>' +
      '<div class="field"><label>Muallif</label><input type="text" id="cAuthor" placeholder="James Clear"></div></div>' +
      '<div class="field"><label>Tavsif</label><textarea id="cDesc" rows="3"></textarea></div>' +
      '<div class="frow"><div class="field"><label>Sana (Reliz sanasi)</label><input type="date" id="cDate" value="' + today + '"></div>' +
      '<div class="field"><label>Yorliq</label><input type="text" id="cLabel" value="Tez kunda"></div></div>' +
      '<div class="field"><label>Fon rangi / Gradient</label>' + colorPickerHTML('cBg', 'linear-gradient(150deg,#1A3A5C,#2A5C8A)') + '</div>' +
      '<button class="btn-primary" onclick="saveComing()">Saqlash</button></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  });
}

function saveComing() {
  var data = {
    publisherSlug: document.getElementById('cPub').value,
    title: document.getElementById('cTitle').value.trim(),
    author: document.getElementById('cAuthor').value.trim(),
    description: document.getElementById('cDesc').value.trim(),
    releaseDate: document.getElementById('cDate').value,
    label: document.getElementById('cLabel').value.trim(),
    bg: document.getElementById('cBg').value.trim()
  };
  if (!data.title || !data.author) { alert('Sarlavha va muallifni kiriting'); return; }
  api('/coming-soon', { method: 'POST', body: JSON.stringify(data) }).then(function() {
    document.querySelector('.modal-bg').remove();
    loadComingSoon();
  });
}


function deleteComing(id) {
  if (!confirm('Ushbu e\'lonni o\'chirmoqchimisiz?')) return;
  api('/coming-soon/' + id, { method: 'DELETE' }).then(function() { loadComingSoon(); });
}



/* ── OVERVIEW ── */
function loadOverview() {
  api('/analytics/overview').then(function(d) {
    var h = '<div class="stat-grid">' +
      stat('Jami buyurtmalar', d.totalOrders, 'Yangi: ' + d.newOrders, '') +
      stat('Jami daromad', money(d.totalRevenue), 'Bugun: ' + money(d.todayRevenue), 'teal') +
      stat('Kitoblar', d.totalBooks, d.totalPublishers + ' ta nashriyot', '') +
      stat('Bu hafta', d.weekOrders + ' ta', money(d.weekRevenue), 'gold') +
    '</div>';

    // Chart container card
    h += '<div class="card"><div class="card-title">Oxirgi 15 kunlik savdo dinamikasi</div>' +
      '<div style="position:relative;height:260px"><canvas id="salesChart"></canvas></div></div>';

    // Orders by status
    api('/analytics/by-status').then(function(statuses) {
      h += '<div class="card"><div class="card-title">Buyurtma holatlari</div><div style="display:flex;gap:10px;flex-wrap:wrap">';
      statuses.forEach(function(s) {
        h += '<span class="badge badge-' + s.status + '">' + statusLabel(s.status) + ': ' + s.count + '</span>';
      });
      h += '</div></div>';

      api('/analytics/by-region').then(function(regions) {
        h += '<div class="card"><div class="card-title">Viloyatlar bo\'yicha</div><table class="tbl"><tr><th>Viloyat</th><th>Buyurtmalar</th><th>Daromad</th></tr>';
        regions.forEach(function(r) { h += '<tr><td>' + r.region + '</td><td>' + r.orders + '</td><td>' + money(r.revenue) + '</td></tr>'; });
        h += '</table></div>';
        
        document.getElementById('content').innerHTML = h;

        // Render Chart.js line chart
        api('/analytics/orders-by-day?days=15').then(function(chartData) {
          var canvas = document.getElementById('salesChart');
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          
          var labels = chartData.map(function(item) { return item.day.slice(5); }); // MM-DD
          var orderCounts = chartData.map(function(item) { return item.orders; });
          var revenues = chartData.map(function(item) { return item.revenue; });

          new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [
                {
                  label: "Daromad (so'm)",
                  data: revenues,
                  borderColor: '#1D9E75',
                  backgroundColor: 'rgba(29, 158, 117, 0.08)',
                  borderWidth: 3,
                  tension: 0.35,
                  fill: true,
                  yAxisID: 'yRev'
                },
                {
                  label: "Buyurtmalar soni",
                  data: orderCounts,
                  borderColor: '#D9A93E',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  tension: 0.35,
                  yAxisID: 'yOrd'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Manrope' } } }
              },
              scales: {
                yRev: {
                  type: 'linear',
                  position: 'left',
                  grid: { color: 'rgba(0,0,0,0.04)' },
                  ticks: {
                    font: { family: 'Manrope' },
                    callback: function(val) {
                      return val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : val >= 1000 ? (val/1000) + 'k' : val;
                    }
                  }
                },
                yOrd: {
                  type: 'linear',
                  position: 'right',
                  grid: { drawOnChartArea: false },
                  ticks: { font: { family: 'Manrope' }, stepSize: 1 }
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { family: 'Manrope', size: 11 } }
                }
              }
            }
          });
        });
      });
    });
  });
}
function stat(label, val, sub, cls) {
  return '<div class="stat ' + (cls||'') + '"><div class="stat-label">' + label + '</div><div class="stat-val">' + val + '</div><div class="stat-sub">' + (sub||'') + '</div></div>';
}
function statusLabel(s) {
  var m = { 'new': 'Yangi', confirmed: 'Tasdiqlangan', processing: 'Tayyorlanmoqda', shipped: 'Yo\'lda', delivered: 'Yetkazildi', cancelled: 'Bekor' };
  return m[s] || s;
}

/* ── ORDERS ── */
function loadOrders(status) {
  var qs = status && status !== 'all' ? '?status=' + status : '';
  api('/orders' + qs).then(function(d) {
    var h = '<div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">';
    ['all','new','confirmed','processing','shipped','delivered','cancelled'].forEach(function(s) {
      h += '<button class="btn-sm ' + ((!status && s==='all' || status===s) ? 'btn-teal' : 'btn-ghost') + '" onclick="loadOrders(\'' + s + '\')">' + (s==='all'?'Barchasi':statusLabel(s)) + '</button>';
    });
    h += '</div>';

    if (!d.orders || d.orders.length === 0) {
      h += '<div class="card" style="text-align:center;padding:40px;color:var(--light)">Hozircha buyurtma yo\'q</div>';
    } else {
      h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>#</th><th>Mijoz</th><th>Viloyat</th><th>Jami</th><th>Holat</th><th>Sana</th><th></th></tr>';
      d.orders.forEach(function(o) {
        h += '<tr><td><b>' + o.orderNumber + '</b></td><td>' + o.customerName + '<br><span style="font-size:12px;color:var(--light)">' + o.customerPhone + '</span></td>' +
          '<td>' + o.tuman + ', ' + o.region + '</td><td><b>' + money(o.total) + '</b></td>' +
          '<td><span class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</span></td>' +
          '<td style="font-size:12px;color:var(--light)">' + (o.createdAt||'').slice(0,16).replace('T',' ') + '</td>' +
          '<td><button class="btn-sm btn-ghost" onclick="viewOrder(\'' + o.id + '\')">Ko\'rish</button></td></tr>';
      });
      h += '</table></div>';
    }
    document.getElementById('content').innerHTML = h;
  });
}

function viewOrder(id) {
  api('/orders/' + id).then(function(o) {
    var items = (o.items||[]).map(function(it) {
      return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--bg)">' +
        '<div><div style="font-weight:600;font-size:14px">' + it.title + '</div><div style="font-size:12px;color:var(--light)">' + it.author + '</div></div>' +
        '<div style="text-align:right"><div>' + it.qty + ' x ' + (it.price/1000).toFixed(1) + 'k</div><div style="font-weight:700">' + money(it.price * it.qty) + '</div></div></div>';
    }).join('');

    var statusOpts = ['new','confirmed','processing','shipped','delivered','cancelled'].map(function(s) {
      return '<option value="' + s + '"' + (o.status===s?' selected':'') + '>' + statusLabel(s) + '</option>';
    }).join('');

    var html = '<div class="modal-bg" onclick="if(event.target===this)this.remove()"><div class="modal" style="max-width:500px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<div><div class="badge badge-' + o.status + '">' + statusLabel(o.status) + '</div><h3 style="margin:8px 0 0">' + o.orderNumber + '</h3></div>' +
      '<div style="text-align:right;font-size:13px;color:var(--light)">' + (o.createdAt||'').slice(0,16).replace('T',' ') + '</div></div>' +
      
      '<div class="card" style="padding:16px;background:var(--bg);box-shadow:none;margin-bottom:18px">' +
      '<label>Mijoz va Manzil</label>' +
      '<div style="font-weight:700;font-size:16px;margin-bottom:4px">' + o.customerName + '</div>' +
      '<div style="font-weight:600;color:var(--teal);margin-bottom:10px">' + o.customerPhone + '</div>' +
      '<div style="font-size:13px;line-height:1.4">' + o.region + ', ' + o.tuman + '<br>' + o.address + '</div></div>' +
      
      '<label style="margin-bottom:10px">Buyurtma tarkibi</label>' +
      '<div style="margin-bottom:20px">' + items + '</div>' +
      
      '<div style="display:flex;justify-content:space-between;font-size:18px;margin-bottom:24px"><span>Jami:</span><b>' + money(o.total) + '</b></div>' +
      
      '<div class="frow" style="align-items:end"><div class="field" style="margin:0"><label>Holatni o\'zgartirish</label><select id="modalStatus" style="height:44px">' + statusOpts + '</select></div>' +
      '<button class="btn-primary" style="height:44px" onclick="updateStatus(\'' + (o.id || o.orderNumber) + '\')">Saqlash</button></div>' +
      '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  });
}


function updateStatus(id) {
  var status = document.getElementById('modalStatus').value;
  api('/orders/' + id + '/status', { method: 'PUT', body: JSON.stringify({ status: status }) }).then(function() {
    document.querySelector('.modal-bg').remove();
    loadOrders();
  });
}

/* ── BOOKS ── */
var curBookSearch = '';
function loadBooks() {
  var qs = curBookSearch ? '?limit=200&q=' + encodeURIComponent(curBookSearch) : '?limit=200';
  api('/books' + qs).then(function(d) {
    var h = '<div class="card-title"><span>📖 ' + d.total + ' ta kitob</span>' +
      '<div style="display:flex;gap:8px"><input type="text" id="bSearch" class="search-input" placeholder="Qidirish..." value="' + curBookSearch + '">' +
      '<button class="btn-sm btn-teal" onclick="showBookForm()">+ Yangi kitob</button></div></div>';

    h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Nomi</th><th>Muallif</th><th>Nashriyot</th><th>Narx</th><th>Janr</th><th></th></tr>';
    (d.books||[]).forEach(function(b) {
      h += '<tr><td><b>' + b.title + '</b>' + (b.isTop?' <span style="color:var(--gold)">★</span>':'') + '</td><td>' + b.author + '</td><td>' + (b.publisherName||b.publisherSlug) + '</td>' +
        '<td>' + money(b.price) + '</td><td>' + (b.genre||'') + '</td>' +
        '<td><div style="display:flex;gap:4px"><button class="btn-sm btn-ghost" onclick="showBookForm(\'' + b.publisherSlug + '\',\'' + b.id + '\')">✏️</button>' +
        '<button class="btn-sm btn-danger" onclick="deleteBook(\'' + b.publisherSlug + '\',\'' + b.id + '\')">🗑</button></div></td></tr>';
    });
    h += '</table></div>';
    document.getElementById('content').innerHTML = h;
    document.getElementById('bSearch').addEventListener('keydown', function(e) { if(e.key==='Enter') { curBookSearch=this.value.trim(); loadBooks(); } });
  });
}

function showBookForm(pub, id) {
  Promise.all([
    api('/publishers'),
    id ? api('/books/' + pub + '/' + id) : Promise.resolve(null)
  ]).then(function(results) {
    var pubs = results[0];
    var b = results[1] || {};
    var isEdit = !!b.id;
    
    var pubOpts = pubs.map(function(p) { return '<option value="' + p.slug + '"' + (b.publisherSlug===p.slug?' selected':'') + '>' + p.name + '</option>'; }).join('');
    var genres = ['roman','klassik','biznes','psixologiya','diniy','bolalar','sheriyat','ilmiy','tarix','tarjima'];
    var genOpts = genres.map(function(g) { return '<option value="' + g + '"' + (b.genre===g?' selected':'') + '>' + g.charAt(0).toUpperCase()+g.slice(1) + '</option>'; }).join('');

    var html = '<div class="modal-bg" onclick="if(event.target===this)this.remove()"><div class="modal"><h3>' + (isEdit ? 'Kitobni tahrirlash' : 'Yangi kitob qo\'shish') + '</h3>' +
      '<div class="frow"><div class="field"><label>ID (lotin, bo\'shsiz)</label><input type="text" id="bId" value="' + (b.id||'') + '" ' + (isEdit?'disabled':'') + ' placeholder="atom"></div>' +
      '<div class="field"><label>Nashriyot</label><select id="bPub" ' + (isEdit?'disabled':'') + '>' + pubOpts + '</select></div></div>' +
      '<div class="frow"><div class="field"><label>Nomi</label><input type="text" id="bTitle" value="' + (b.title||'') + '" placeholder="Kitob nomi"></div>' +
      '<div class="field"><label>Muallif</label><input type="text" id="bAuthor" value="' + (b.author||'') + '" placeholder="Muallif"></div></div>' +
      '<div class="frow"><div class="field"><label>Narx (so\'m)</label><input type="number" id="bPrice" value="' + (b.price||'') + '"></div>' +
      '<div class="field"><label>Sahifalar</label><input type="number" id="bPages" value="' + (b.pages||'') + '"></div></div>' +
      '<div class="frow"><div class="field"><label>Yil</label><input type="number" id="bYear" value="' + (b.year||2025) + '"></div>' +
      '<div class="field"><label>Janr</label><select id="bGenre">' + genOpts + '</select></div></div>' +
      '<div class="frow"><div class="field"><label>Reyting (0-5)</label><input type="number" id="bRating" value="' + (b.rating||4.5) + '" step="0.1"></div>' +
      '<div class="field" style="display:flex;align-items:center;padding-top:25px"><label style="margin:0"><input type="checkbox" id="bTop" ' + (b.isTop?'checked':'') + '> TOP kitob</label></div></div>' +
      '<div class="field"><label>Muqova foni / Gradient</label>' + colorPickerHTML('bColor', b.color || 'linear-gradient(150deg,#1A3A5C,#2A5C8A)') + '</div>' +
      '<div class="field"><label>Tavsif</label><textarea id="bDesc" rows="3">' + (b.description||'') + '</textarea></div>' +
      '<button class="btn-primary" onclick="saveBook(\'' + (isEdit?b.publisherSlug:'') + '\',\'' + (isEdit?b.id:'') + '\')">Saqlash</button></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  });
}

function saveBook(oldPub, oldId) {
  var data = {
    id: document.getElementById('bId').value.trim(),
    publisherSlug: document.getElementById('bPub').value,
    title: document.getElementById('bTitle').value.trim(),
    author: document.getElementById('bAuthor').value.trim(),
    price: parseInt(document.getElementById('bPrice').value),
    pages: parseInt(document.getElementById('bPages').value) || null,
    year: parseInt(document.getElementById('bYear').value) || 2025,
    genre: document.getElementById('bGenre').value,
    rating: parseFloat(document.getElementById('bRating').value) || 4.5,
    isTop: document.getElementById('bTop').checked,
    color: document.getElementById('bColor').value,
    description: document.getElementById('bDesc').value.trim()
  };

  if (!data.id || !data.title || !data.author || !data.price) { alert('Barcha maydonlarni to\'ldiring'); return; }
  
  var method = oldId ? 'PUT' : 'POST';
  var path = oldId ? '/books/' + oldPub + '/' + oldId : '/books';

  api(path, { method: method, body: JSON.stringify(data) }).then(function(r) {
    if (r.error) { alert(r.error); return; }
    document.querySelector('.modal-bg').remove();
    loadBooks();
  });
}


function deleteBook(pub, id) {
  if (!confirm('Bu kitobni o\'chirmoqchimisiz?')) return;
  api('/books/' + pub + '/' + id, { method: 'DELETE' }).then(function() { loadBooks(); });
}

/* ── PUBLISHERS ── */
function loadPublishers() {
  api('/publishers').then(function(pubs) {
    var h = '<div class="card-title"><span>🏢 ' + pubs.length + ' ta nashriyot</span><button class="btn-sm btn-teal" onclick="showPublisherForm()">+ Yangi nashriyot</button></div>';
    h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Nomi</th><th>Shahar</th><th>Asos solingan</th><th>Kitoblar</th><th></th></tr>';
    pubs.forEach(function(p) {
      h += '<tr><td><b>' + p.name + '</b><br><span style="font-size:11px;color:var(--light)">' + p.slug + '</span></td>' +
        '<td>' + (p.city||'') + '</td><td>' + (p.founded||'') + '</td><td>' + (p.bookCount||0) + '</td>' +
        '<td><div style="display:flex;gap:4px"><button class="btn-sm btn-ghost" onclick="showPublisherForm(\'' + p.slug + '\')">✏️</button>' +
        '<button class="btn-sm btn-danger" onclick="deletePublisher(\'' + p.slug + '\')">🗑</button></div></td></tr>';
    });
    h += '</table></div>';
    document.getElementById('content').innerHTML = h;
  });
}

function showPublisherForm(slug) {
  if (slug) {
    api('/publishers/' + slug).then(renderForm);
  } else {
    renderForm({});
  }

  function renderForm(p) {
    var isEdit = !!p.slug;
    var html = '<div class="modal-bg" onclick="if(event.target===this)this.remove()"><div class="modal"><h3>' + (isEdit ? 'Nashriyotni tahrirlash' : 'Yangi nashriyot') + '</h3>' +
      '<div class="frow"><div class="field"><label>Slug (lotin, bo\'shsiz)</label><input type="text" id="pSlug" value="' + (p.slug||'') + '" ' + (isEdit?'disabled':'') + ' placeholder="booktopia"></div>' +
      '<div class="field"><label>Nomi</label><input type="text" id="pName" value="' + (p.name||'') + '" placeholder="Nashriyot nomi"></div></div>' +
      '<div class="field"><label>Tavsif</label><textarea id="pDesc" rows="3">' + (p.desc||'') + '</textarea></div>' +
      '<div class="frow"><div class="field"><label>Shahar</label><input type="text" id="pCity" value="' + (p.city||'') + '"></div>' +
      '<div class="field"><label>Asos solingan (yil)</label><input type="number" id="pFounded" value="' + (p.founded||2020) + '"></div></div>' +
      '<div class="frow"><div class="field"><label>Logo (URL)</label><input type="text" id="pLogo" value="' + (p.logo||'') + '"></div>' +
      '<div class="field"><label>Nashriyot rangi</label>' + colorPickerHTML('pColor', p.color || '#13294A') + '</div></div>' +
      '<button class="btn-primary" onclick="savePublisher(\'' + (p.slug||'') + '\')">Saqlash</button></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  }
}

function savePublisher(oldSlug) {
  var data = {
    slug: document.getElementById('pSlug').value.trim(),
    name: document.getElementById('pName').value.trim(),
    desc: document.getElementById('pDesc').value.trim(),
    city: document.getElementById('pCity').value.trim(),
    founded: parseInt(document.getElementById('pFounded').value),
    logo: document.getElementById('pLogo').value.trim(),
    color: document.getElementById('pColor').value
  };
  if (!data.slug || !data.name) { alert('Slug va nomni kiriting'); return; }
  
  var method = oldSlug ? 'PUT' : 'POST';
  var path = oldSlug ? '/publishers/' + oldSlug : '/publishers';
  
  api(path, { method: method, body: JSON.stringify(data) }).then(function(r) {
    if (r.error) { alert(r.error); return; }
    document.querySelector('.modal-bg').remove();
    loadPublishers();
  });
}

function deletePublisher(slug) {
  if (!confirm('Ushbu nashriyotni o\'chirmoqchimisiz? Barcha unga tegishli kitoblar ham o\'chadi!')) return;
  api('/publishers/' + slug, { method: 'DELETE' }).then(function() { loadPublishers(); });
}


/* ── PROMOS ── */
function loadPromos() {
  api('/promos').then(function(promos) {
    var h = '<div class="card-title"><span>🎁 Promokodlar</span><button class="btn-sm btn-teal" onclick="showPromoForm()">+ Yangi promokod</button></div>';
    if (!promos.length) {
      h += '<div class="card" style="text-align:center;padding:30px;color:var(--light)">Hozircha promokod yo\'q</div>';
    } else {
      h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Kod</th><th>Turi</th><th>Qiymati</th><th>Ishlatilgan</th><th>Holat</th><th></th></tr>';
      promos.forEach(function(p) {
        h += '<tr><td><b>' + p.code + '</b></td><td>' + (p.type==='percentage'?'Foiz':'Summa') + '</td>' +
          '<td>' + (p.type==='percentage'? p.value+'%' : money(p.value)) + '</td>' +
          '<td>' + p.usedCount + (p.maxUses ? '/' + p.maxUses : '') + '</td>' +
          '<td>' + (p.isActive ? '<span class="badge badge-new">Faol</span>' : '<span class="badge badge-cancelled">O\'chirilgan</span>') + '</td>' +
          '<td><button class="btn-sm btn-danger" onclick="deletePromo(\'' + p.code + '\')">🗑</button></td></tr>';
      });
      h += '</table></div>';
    }
    document.getElementById('content').innerHTML = h;
  });
}

function showPromoForm() {
  var html = '<div class="modal-bg" onclick="if(event.target===this)this.remove()"><div class="modal"><h3>Yangi promokod</h3>' +
    '<div class="frow"><div class="field"><label>Kod</label><input type="text" id="pCode" placeholder="KITOB10" style="text-transform:uppercase"></div>' +
    '<div class="field"><label>Turi</label><select id="pType"><option value="percentage">Foiz (%)</option><option value="fixed">Qat\'iy summa</option></select></div></div>' +
    '<div class="frow"><div class="field"><label>Qiymati</label><input type="number" id="pValue" placeholder="10"></div>' +
    '<div class="field"><label>Minimal buyurtma (so\'m)</label><input type="number" id="pMin" value="0"></div></div>' +
    '<div class="frow"><div class="field"><label>Max ishlatish (0=cheksiz)</label><input type="number" id="pMax" value="0"></div>' +
    '<div class="field"><label>Muddati</label><input type="date" id="pExpiry"></div></div>' +
    '<button class="btn-primary" onclick="savePromo()">Saqlash</button></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function savePromo() {
  var data = {
    code: document.getElementById('pCode').value.trim(),
    type: document.getElementById('pType').value,
    value: parseFloat(document.getElementById('pValue').value),
    minOrder: parseInt(document.getElementById('pMin').value) || 0,
    maxUses: parseInt(document.getElementById('pMax').value) || 0,
    expiresAt: document.getElementById('pExpiry').value || null
  };
  if (!data.code || !data.value) { alert('Kod va qiymatni kiriting'); return; }
  api('/promos', { method: 'POST', body: JSON.stringify(data) }).then(function(r) {
    if (r.error) { alert(r.error); return; }
    document.querySelector('.modal-bg').remove();
    loadPromos();
  });
}

function deletePromo(code) {
  if (!confirm('Promokodni o\'chirmoqchimisiz?')) return;
  api('/promos/' + code, { method: 'DELETE' }).then(function() { loadPromos(); });
}

/* ── SETTINGS ── */
function loadSettings() {
  api('/settings').then(function(s) {
    var h = '<div class="card"><div class="card-title">Telegram bildirishnomalar</div>' +
      '<p style="font-size:13px;color:var(--light);margin-bottom:16px">Yangi buyurtma kelganda Telegram orqali xabar olish uchun bot token va chat ID kiriting.</p>' +
      '<div class="frow"><div class="field"><label>Bot Token</label><input type="text" id="sTgToken" value="' + (s.telegram_bot_token||'') + '" placeholder="123456:ABC-DEF..."></div>' +
      '<div class="field"><label>Admin Chat ID</label><input type="text" id="sTgChat" value="' + (s.telegram_admin_chat_id||'') + '" placeholder="123456789"></div></div>' +
      '<button class="btn-sm btn-teal" onclick="saveSettings()">Saqlash</button>' +
      '</div>' +
      '<div class="card"><div class="card-title">AI Maslahatchi sozlamalari</div>' +
      '<p style="font-size:13px;color:var(--light);margin-bottom:16px">Floating Chatbot (Kitob Maslahatchisi) uchun AI API kalitlarini kiriting.</p>' +
      '<div class="field"><label>Google Gemini API Key (Tavsiya etiladi)</label><input type="password" id="sGeminiKey" value="' + (s.gemini_api_key||'') + '" placeholder="AIza..."></div>' +
      '<div class="field"><label>OpenAI API Key (Muqobil)</label><input type="password" id="sOpenAiKey" value="' + (s.openai_api_key||'') + '" placeholder="sk-proj-..."></div>' +
      '<button class="btn-sm btn-teal" onclick="saveSettings()">Saqlash</button>' +
      '</div>' +
      '<div class="card"><div class="card-title">Parol o\'zgartirish</div>' +
      '<div class="frow"><div class="field"><label>Joriy parol</label><input type="password" id="sCurPass"></div>' +
      '<div class="field"><label>Yangi parol</label><input type="password" id="sNewPass"></div></div>' +
      '<button class="btn-sm btn-teal" onclick="changePass()">Parolni o\'zgartirish</button></div>';
    document.getElementById('content').innerHTML = h;
  });
}

function saveSettings() {
  api('/settings', { method: 'PUT', body: JSON.stringify({
    telegram_bot_token: document.getElementById('sTgToken').value.trim(),
    telegram_admin_chat_id: document.getElementById('sTgChat').value.trim(),
    gemini_api_key: document.getElementById('sGeminiKey').value.trim(),
    openai_api_key: document.getElementById('sOpenAiKey').value.trim()
  })}).then(function() { alert('Saqlandi!'); });
}

function changePass() {
  var cur = document.getElementById('sCurPass').value;
  var nw = document.getElementById('sNewPass').value;
  if (!cur || !nw) { alert('Ikkala maydonni ham to\'ldiring'); return; }
  api('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) })
    .then(function(r) { if (r.error) alert(r.error); else alert('Parol o\'zgartirildi!'); });
}

/* ── REVIEWS ── */
function loadReviewsPage() {
  api('/books/admin/all-reviews').then(function(data) {
    var h = '<div class="card-title"><span>💬 Fikr-mulohazalar boshqaruvi</span></div>';
    if (!data.length) {
      h += '<div class="card" style="text-align:center;padding:40px;color:var(--light)">Hozircha fikrlar yo\'q.</div>';
    } else {
      h += '<div class="card" style="padding:0;overflow-x:auto"><table class="tbl"><tr><th>Kitob</th><th>Mijoz</th><th>Baho</th><th>Fikr</th><th>Sana</th><th></th></tr>';
      data.forEach(function(r) {
        h += '<tr><td><b>' + (r.bookTitle||'ID: '+r.bookId) + '</b></td><td>' + r.customerName + '</td>' +
          '<td><span style="color:var(--gold)">' + '★'.repeat(r.rating) + '</span></td>' +
          '<td style="max-width:300px;font-size:13px;color:var(--mid)">' + r.comment + '</td>' +
          '<td style="font-size:12px;color:var(--light)">' + new Date(r.createdAt).toLocaleDateString() + '</td>' +
          '<td><button class="btn-sm btn-danger" onclick="deleteAdminReview(' + r.id + ')">🗑</button></td></tr>';
      });
      h += '</table></div>';
    }
    document.getElementById('content').innerHTML = h;
  });
}

function deleteAdminReview(id) {
  if (!confirm('Ushbu fikrni o\'chirishni xohlaysizmi?')) return;
  api('/books/admin/reviews/' + id, { method: 'DELETE' }).then(function() { loadReviewsPage(); });
}

