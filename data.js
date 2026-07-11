/* ===== KITOBMARKAZI — Shared Data (Database Driven) ===== */

// Global state objects (populated via API)
var PUBLISHERS = {};
var BOOKS = {};
var COMING_SOON = [];
var COURIERS = {};

var isKMDataLoaded = false;

/* ===== Static Configuration & Mapping Data ===== */

const GENRES = {
  roman:    { name:"Roman & nasr",    icon:"📕" },
  klassik:  { name:"Klassika",        icon:"📜" },
  sheriyat: { name:"She'riyat",       icon:"✒️" },
  diniy:    { name:"Diniy-ma'naviy",  icon:"🕌" },
  bolalar:  { name:"Bolalar",         icon:"🧸" },
  biznes:   { name:"Biznes & moliya", icon:"💼" },
  psixologiya:{ name:"Psixologiya",   icon:"🧠" },
  ilmiy:    { name:"Ilmiy & ta'lim",  icon:"🔬" },
  tarix:    { name:"Tarix",           icon:"🏛️" },
  tarjima:  { name:"Tarjima",         icon:"🌍" },
};

const TUMANS = {
  "Toshkent shahri":   ["Yunusobod","Chilonzor","Mirzo Ulug'bek","Yakkasaroy","Shayxontohur","Olmazor","Uchtepa","Sergeli","Yashnobod","Mirobod","Bektemir"],
  "Toshkent viloyati": ["Zangiota","Qibray","Chirchiq","Angren","Bekobod","Yangiyo'l","Ohangaron","Parkent","Bo'ka"],
  "Samarqand":         ["Samarqand sh.","Urgut","Kattaqo'rg'on","Bulung'ur","Jomboy","Payariq","Ishtixon","Oqdaryo"],
  "Buxoro":            ["Buxoro sh.","Jondor","Kogon","G'ijduvon","Vobkent","Romitan","Shofirkon","Olot","Qorako'l"],
  "Namangan":          ["Namangan sh.","Chust","Pop","Uchqo'rg'on","To'raqo'rg'on","Kosonsoy","Norin"],
  "Andijon":           ["Andijon sh.","Asaka","Xonobod","Shahrixon","Marhamat","Baliqchi","Izboskan"],
  "Farg'ona":          ["Farg'ona sh.","Marg'ilon","Qo'qon","Quva","Rishton","Beshariq","Oltiariq"],
  "Qashqadaryo":       ["Qarshi","Shahrisabz","Kitob","G'uzor","Koson","Muborak","Chiroqchi"],
  "Surxondaryo":       ["Termiz","Denov","Sho'rchi","Boysun","Sariosiyo","Jarqo'rg'on"],
  "Xorazm":            ["Urganch","Xiva","Hazorasp","Shovot","Gurlan","Yangiariq","Bog'ot"],
  "Navoiy":            ["Navoiy sh.","Zarafshon","Konimex","Karmana","Nurota","Xatirchi"],
  "Jizzax":            ["Jizzax sh.","Zarbdor","G'allaorol","Do'stlik","Forish","Sharof Rashidov"],
  "Sirdaryo":          ["Guliston","Yangiyer","Sirdaryo","Boyovut","Sayxunobod","Mirzaobod"],
  "Qoraqalpog'iston":  ["Nukus","Xo'jayli","Chimboy","Taxiatosh","Qo'ng'irot","Beruniy","Mo'ynoq"],
};

const COURIERS_BY_REGION = {
  "Toshkent shahri":   ["fargo","bts","emu","starex"],
  "Toshkent viloyati": ["fargo","bts","starex"],
  "Samarqand":         ["fargo","bts","emu"],
  "Buxoro":            ["bts","emu"],
  "Namangan":          ["fargo","bts","emu"],
  "Andijon":           ["bts","emu","starex"],
  "Farg'ona":          ["fargo","bts","emu"],
  "Qashqadaryo":       ["bts","emu"],
  "Surxondaryo":       ["bts","emu"],
  "Xorazm":            ["bts","emu"],
  "Navoiy":            ["bts","emu","starex"],
  "Jizzax":            ["bts","emu"],
  "Sirdaryo":          ["bts","emu"],
  "Qoraqalpog'iston":  ["bts","emu"],
  "_default":          ["bts","emu"],
};

const COURIER_TUMAN_OVERRIDE = {
  "Buxoro|Jondor":         ["bts","emu"],
  "Buxoro|Olot":           ["emu"],
  "Buxoro|Qorako'l":       ["bts","emu"],
  "Toshkent shahri|Sergeli":["fargo","bts","emu","starex"],
  "Xorazm|Mo'ynoq":        ["emu"],
};

const QUIZ = [
  {
    q: "Hozir kayfiyatingiz qanday?",
    icon: "🌤️",
    options: [
      { label: "Tinch va o'ychan", emoji: "🍃", genres: ["sheriyat","klassik","diniy"] },
      { label: "Energiya va ilhom izlayapman", emoji: "⚡", genres: ["biznes","psixologiya"] },
      { label: "Sarguzasht va qiziqish", emoji: "🚀", genres: ["roman","tarjima","bolalar"] },
      { label: "Bilim va tushunish", emoji: "🔍", genres: ["ilmiy","tarix"] },
    ],
  },
  {
    q: "O'zingizni qanday ta'riflaysiz?",
    icon: "🧭",
    options: [
      { label: "Xayolparast, ijodkor", emoji: "🎨", genres: ["sheriyat","roman","klassik"] },
      { label: "Maqsadli, intiluvchan", emoji: "🎯", genres: ["biznes","psixologiya"] },
      { label: "Qiziquvchan, tahlilchi", emoji: "🧠", genres: ["ilmiy","tarix","tarjima"] },
      { label: "Mehribon, ma'naviyatli", emoji: "🤲", genres: ["diniy","klassik"] },
    ],
  },
  {
    q: "Qaysi mavzu sizni ko'proq qiziqtiradi?",
    icon: "📚",
    options: [
      { label: "Inson ruhiyati va o'sish", emoji: "🌱", genres: ["psixologiya","diniy"] },
      { label: "Tarix va madaniyat", emoji: "🏛️", genres: ["tarix","klassik"] },
      { label: "Biznes va muvaffaqiyat", emoji: "💼", genres: ["biznes"] },
      { label: "Hikoya va badiiyat", emoji: "📖", genres: ["roman","tarjima","sheriyat"] },
    ],
  },
  {
    q: "Kitobdan nimani kutasiz?",
    icon: "✨",
    options: [
      { label: "Tinchlanish va dam", emoji: "☕", genres: ["sheriyat","roman","bolalar"] },
      { label: "Yangi ko'nikma va bilim", emoji: "🛠️", genres: ["biznes","psixologiya","ilmiy"] },
      { label: "Ma'naviy ozuqa", emoji: "🕯️", genres: ["diniy","klassik"] },
      { label: "Dunyoqarashni kengaytirish", emoji: "🌍", genres: ["tarix","tarjima","ilmiy"] },
    ],
  },
];

const QUIZ_PROFILES = {
  sheriyat:   { title:"Nozik ruhli kitobxon", desc:"Siz so'z go'zalligi va his-tuyg'ularni qadrlaysiz. She'riyat va badiiy nasr sizga ruhiy oziq beradi." },
  klassik:    { title:"Mumtoz did egasi", desc:"Sizni asrlar sinovidan o'tgan asarlar o'ziga tortadi. Klassika qalbingizga yaqin." },
  roman:      { title:"Hikoya sevuvchi", desc:"Siz voqealar, qahramonlar va sarguzashtlar olamiga sho'ng'ishni yoqtirasiz." },
  diniy:      { title:"Ma'naviyat izlovchi", desc:"Sizga ichki tinchlik va ma'naviy yetuklik muhim. Diniy-ma'naviy asarlar yo'lingizni yoritadi." },
  bolalar:    { title:"Yosh qalb", desc:"Soddalik va samimiyat sizga yoqadi — bu ajoyib xususiyat!" },
  biznes:     { title:"Intiluvchi strateg", desc:"Siz o'sish, muvaffaqiyat va natijaga yo'naltirilgansiz. Biznes adabiyoti sizni ilhomlantiradi." },
  psixologiya:{ title:"O'zini izlovchi", desc:"Inson ruhiyati va shaxsiy rivojlanish sizni qiziqtiradi. Bilim — o'zgarishning kaliti." },
  ilmiy:      { title:"Qiziquvchan tadqiqotchi", desc:"Siz dunyoni anglashga, sabab-oqibatni tushunishga intilasiz." },
  tarix:      { title:"O'tmish bilimdoni", desc:"Sizni tarix, madaniyat va insoniyat yo'li qiziqtiradi." },
  tarjima:    { title:"Dunyo kashshofi", desc:"Siz turli madaniyatlar va jahon adabiyotiga ochiqsiz." },
};

/* Week's top book (Fallback) */
var WEEK_TOP = { pubKey:"booktopia", bookId:"otkan" };

/* Fallback Books (if API fails or is empty) */
const DEFAULT_BOOKS = [
  { id:"book1", title:"Tanlangan asarlar", author:"Mualliflar jamoasi", price:45000, color:"linear-gradient(150deg,#1A3A5C,#2A5C8A)", rating:4.5, top:false, pages:280, year:2023 },
  { id:"book2", title:"Hikoyalar to'plami", author:"Turli mualliflar",  price:38000, color:"linear-gradient(150deg,#0F6E56,#1D9E75)", rating:4.4, top:false, pages:220, year:2023 },
];

/* ===== Helpers ===== */

function getBooks(key){ return BOOKS[key] || DEFAULT_BOOKS; }
function money(n){ return (n || 0).toLocaleString('uz-UZ') + " so'm"; }

function pubLogoHTML(p, size){
  size = size || 60;
  if (!p) return '';
  
  var initials = '';
  if (p.text) {
    initials = p.text;
  } else if (p.name) {
    var parts = p.name.split(' ');
    if (parts.length >= 2) {
      initials = (parts[0][0] || '') + (parts[1][0] || '');
    } else {
      initials = p.name.substring(0, 2);
    }
  }
  
  initials = initials.toUpperCase();
  
  // Clean up long initials (e.g. "GLOBAL BOOKS" -> "GB", "BEST BOOK" -> "BB")
  if (initials.indexOf(' ') !== -1) {
    var initParts = initials.split(' ');
    initials = (initParts[0][0] || '') + (initParts[1][0] || '');
  } else if (initials.length > 3) {
    initials = initials.substring(0, 2);
  }

  var color = p.color || '#1D9E75';
  var fallbackHtml = '<div class="pub-avatar-fallback" style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:'+color+'10;border:2px solid '+color+';display:'+(p.logo ? 'none' : 'flex')+';align-items:center;justify-content:center;color:'+color+';font-weight:800;font-size:calc('+size+'px * 0.38);letter-spacing:0.02em;font-family:var(--sans);text-transform:uppercase">'+initials+'</div>';
  
  if (p.logo) {
    var imgHtml = '<img class="pub-img" src="'+p.logo+'" alt="'+p.name+'" style="max-width:100%;max-height:100%;object-fit:contain;display:block" onerror="this.style.display=\'none\'; var fb = this.nextElementSibling; if(fb) fb.style.display=\'flex\';">';
    return imgHtml + fallbackHtml;
  }
  
  return fallbackHtml;
}

function findBook(pubKey, bookId){
  var arr = getBooks(pubKey);
  return arr.filter(function(b){return b.id===bookId})[0] || arr[0];
}

function buildSearchIndex(){
  var idx = [];
  Object.keys(BOOKS).forEach(function(pk){
    BOOKS[pk].forEach(function(b){
      idx.push({ type:'book', title:b.title, sub:b.author+' · '+(PUBLISHERS[pk]?PUBLISHERS[pk].name:''), pubKey:pk, bookId:b.id, color:b.color });
    });
  });
  Object.keys(PUBLISHERS).forEach(function(pk){
    var p = PUBLISHERS[pk];
    idx.push({ type:'pub', title:p.name, sub:'Nashriyot · '+(BOOKS[pk]?BOOKS[pk].length:0)+' ta kitob', pubKey:pk });
  });
  return idx;
}

function searchAll(q){
  q = (q || '').trim().toLowerCase();
  if(q.length < 2) return [];
  return buildSearchIndex().filter(function(it){
    return it.title.toLowerCase().indexOf(q) !== -1 || (it.sub && it.sub.toLowerCase().indexOf(q) !== -1);
  }).slice(0, 8);
}

function tumansFor(region){ return TUMANS[region] || []; }

function couriersFor(region, tuman){
  var base = COURIERS_BY_REGION[region] || COURIERS_BY_REGION["_default"];
  if(tuman && COURIER_TUMAN_OVERRIDE[region+"|"+tuman]) return COURIER_TUMAN_OVERRIDE[region+"|"+tuman];
  if(tuman){
    var list = TUMANS[region] || [];
    var i = list.indexOf(tuman);
    if(i > 0 && base.length > 2){
      if(i >= 4) return base.slice(0, Math.max(2, base.length-2));
      return base.slice(0, base.length-1);
    }
  }
  return base;
}

function coverHTML(book, pub){
  var pubName = pub ? (pub.name) : '';
  var designed = '<div class="cv-pat"></div><div class="cv-grad"></div>'+
    '<div class="cv-pub">'+pubName+'</div>'+
    '<div class="cv-mid"><div class="cv-title">'+book.title+'</div><div class="cv-rule"></div><div class="cv-author">'+book.author+'</div></div>';
  var img = '<img class="cv-img" alt="" loading="lazy" '+
    'src="images/covers/'+book.id+'.jpg" '+
    'data-png="images/covers/'+book.id+'.png" '+
    'onerror="if(!this.dataset.t){this.dataset.t=1;this.src=this.dataset.png;}else{this.style.display=\'none\';}">';
  return designed + img;
}

function recommendFor(pubKey, book, limit){
  limit = limit || 4;
  var recs = [], seen = {};
  seen[pubKey+'|'+book.id] = true;
  Object.keys(BOOKS).forEach(function(pk){
    BOOKS[pk].forEach(function(b){
      var key = pk+'|'+b.id;
      if(seen[key]) return;
      if(b.author === book.author){ recs.push({pk:pk,b:b}); seen[key]=true; }
    });
  });
  getBooks(pubKey).forEach(function(b){
    var key = pubKey+'|'+b.id;
    if(seen[key]) return;
    recs.push({pk:pubKey,b:b}); seen[key]=true;
  });
  return recs.slice(0, limit);
}

function bookGenre(pubKey, book){
  // In the dynamic version, the genre is often on the book object itself
  if (book.genre) return book.genre;
  return "roman";
}

function allBooksFlat(){
  var out=[];
  Object.keys(BOOKS).forEach(function(pk){
    BOOKS[pk].forEach(function(b){ out.push({pk:pk, b:b, genre:bookGenre(pk,b)}); });
  });
  return out;
}

function bookCardHTML(pk, b){
  var pub = PUBLISHERS[pk];
  var wished = (typeof inWishlist==='function' && inWishlist(pk,b.id));
  var href = 'book.html?pub='+pk+'&book='+b.id;
  return '<div class="book" onclick="location.href=\''+href+'\'" style="cursor:pointer">'+
    '<div class="book-cover cover-sm" style="background:'+(b.color || '#13294A')+'">'+
      coverHTML(b,pub)+
      (b.top?'<div class="bc-badge">🔥 Top</div>':'')+
      (b.stock && b.stock < 5 ? '<div class="bc-badge" style="top:auto;bottom:12px;right:12px;background:#ef4444;color:#fff;font-size:8px">Faqat '+b.stock+' dona qoldi</div>' : '')+
    '</div>'+


    '<div class="book-body"><div class="book-title">'+b.title+'</div><div class="book-author">'+b.author+'</div>'+
    '<div class="book-foot">'+
      '<span class="book-price">'+money(b.price)+'</span>'+
      '<div class="book-actions">'+
        '<button class="wish-btn-inline '+(wished?'on':'')+'" title="Sevimlilar" onclick="event.stopPropagation();toggleWish(\''+pk+'\',\''+b.id+'\',this)"><svg class="wish-ic" width="16" height="16" viewBox="0 0 24 24" fill="'+(wished?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>' +
        '<button class="book-cart-btn" title="Savatga" onclick="event.stopPropagation();addAndToast(\''+pk+'\',\''+b.id+'\')">'+cartIcon(18)+'</button>'+
      '</div>'+
    '</div></div></div>';
}

function cartIcon(size){
  size = size || 18;
  return '<svg class="cart-ic" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>'+
    '<path d="M2.5 3h2l2.2 11.4a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>'+
    '</svg>';
}

function quizRecommend(genreScores, limit){
  limit = limit || 6;
  var ranked = Object.keys(genreScores).sort(function(a,b){return (genreScores[b]||0)-(genreScores[a]||0);});
  var topGenres = ranked.filter(function(g){return genreScores[g]>0;});
  var primary = topGenres.slice(0,3);
  var all = allBooksFlat();
  var scored = all.map(function(x){
    var gScore = genreScores[x.genre] || 0;
    var rank = primary.indexOf(x.genre);
    var bonus = rank===0?3:(rank===1?2:(rank===2?1:0));
    var score = gScore*2 + bonus + (x.b.rating||4.5) + (x.b.top?0.5:0);
    return { x:x, score:score, match:gScore>0 };
  });
  scored = scored.filter(function(s){return s.match;});
  scored.sort(function(a,b){return b.score-a.score;});
  var picked=[], pubCount={};
  for(var i=0;i<scored.length && picked.length<limit;i++){
    var pk=scored[i].x.pk;
    if((pubCount[pk]||0)>=2) continue;
    pubCount[pk]=(pubCount[pk]||0)+1;
    picked.push(scored[i].x);
  }
  if(picked.length<limit){
    for(var j=0;j<scored.length && picked.length<limit;j++){
      if(picked.indexOf(scored[j].x)===-1) picked.push(scored[j].x);
    }
  }
  return { books:picked, topGenres:primary };
}

function bookImages(bookId){
  // This could also be fetched from an API in the future
  return [];
}

/* ===== API Dynamic Loading ===== */

(function loadKMData() {
  const API_BASE = '';
  Promise.all([
    fetch(API_BASE + '/api/publishers').then(r => r.ok ? r.json() : null),
    fetch(API_BASE + '/api/books?limit=500').then(r => r.ok ? r.json() : null),
    fetch(API_BASE + '/api/coming-soon').then(r => r.ok ? r.json() : null),
    fetch(API_BASE + '/api/couriers').then(r => r.ok ? r.json() : null)
  ]).then(results => {
    const apiPubs = results[0];
    const apiBooksData = results[1];
    const apiCS = results[2];
    const apiCouriers = results[3];

    if (apiPubs && apiPubs.length > 0) {
      const newPubs = {};
      apiPubs.forEach(p => {
        newPubs[p.slug] = {
          name: p.name,
          logo: p.logo,
          text: p.logoText,
          color: p.logoColor,
          founded: p.founded,
          city: p.city,
          desc: p.description,
          first: p.isTop === 1
        };
      });
      PUBLISHERS = newPubs;
    }

    if (apiBooksData && apiBooksData.books && apiBooksData.books.length > 0) {
      const newBooks = {};
      apiBooksData.books.forEach(b => {
        if (!newBooks[b.publisherSlug]) newBooks[b.publisherSlug] = [];
        newBooks[b.publisherSlug].push({
          id: b.id,
          title: b.title,
          author: b.author,
          price: b.price,
          color: b.color || 'linear-gradient(150deg,#1A3A5C,#2A5C8A)',
          rating: b.rating,
          top: b.isTop === 1,
          pages: b.pages,
          year: b.year,
          genre: b.genre
        });
      });
      BOOKS = newBooks;
      
      // Update WEEK_TOP if any top book is found
      const flat = allBooksFlat();
      const topBook = flat.find(x => x.b.top);
      if (topBook) {
        WEEK_TOP = { pubKey: topBook.pk, bookId: topBook.b.id };
      }
    }

    if (apiCS && apiCS.length > 0) {
      COMING_SOON = apiCS.map(cs => {
        let diff = 0;
        if (cs.releaseDate) {
          const rel = new Date(cs.releaseDate);
          const now = new Date();
          now.setHours(0,0,0,0);
          diff = Math.ceil((rel.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        return {
          title: cs.title,
          author: cs.author,
          pubKey: cs.publisherSlug,
          bg: cs.bg || 'linear-gradient(135deg,#1A3A6B,#2A5C8A)',
          offsetDays: Math.max(0, diff),
          label: cs.label || 'Tez kunda',
          desc: cs.description
        };
      });
    }

    if (apiCouriers && apiCouriers.length > 0) {
      const newCouriers = {};
      apiCouriers.forEach(c => {
        newCouriers[c.slug] = {
          name: c.name,
          color: c.color,
          desc: c.description,
          price: c.price
        };
      });
      COURIERS = newCouriers;
    }

    isKMDataLoaded = true;
    document.dispatchEvent(new CustomEvent('kmDataLoaded'));
    console.log('✅ Kitobmarkazi dynamic data synchronized');
  }).catch(err => {
    console.warn('⚠️ API Sync failed, using fallback data:', err);
    isKMDataLoaded = true;
    document.dispatchEvent(new CustomEvent('kmDataLoaded'));
  });
})();
