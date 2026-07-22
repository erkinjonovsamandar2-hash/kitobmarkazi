/* ===== KITOBMARKAZI — Shared Data (Database Driven) ===== */

// Global state objects (populated via API)
var PUBLISHERS = {};
var BOOKS = {};
var COMING_SOON = [];
var COURIERS = {};

var isKMDataLoaded = false;
var isKMDataError = false;

/* The DB's `top` flag is set on well over half the catalogue, which makes the
   "🔥 Top" badge meaningless. Ratings cluster tightly (4.4–4.9), so we badge
   only the highest-rated tier — roughly the top 15% — recomputed from the data
   itself so it stays scarce as the catalogue grows. */
var KM_TOP_MIN_RATING = 4.9;
function computeTopThreshold(){
  var ratings = [];
  Object.keys(BOOKS).forEach(function(pk){
    BOOKS[pk].forEach(function(b){
      var r = Number(b.rating);
      if (!isNaN(r)) ratings.push(r);
    });
  });
  if (ratings.length < 8) return;
  ratings.sort(function(a,b){ return b - a; });
  var idx = Math.max(0, Math.floor(ratings.length * 0.15) - 1);
  KM_TOP_MIN_RATING = ratings[idx];
}
function isTopPick(b){
  return !!(b && b.top && (Number(b.rating) || 0) >= KM_TOP_MIN_RATING);
}

/* HTML-escape any dynamic/DB/user text before injecting via innerHTML (XSS guard) */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

/* ===== Static Configuration & Mapping Data ===== */

const GENRES = {
  roman:    { name:"Roman & nasr",    icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>' },
  klassik:  { name:"Klassika",        icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
  sheriyat: { name:"She'riyat",       icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' },
  diniy:    { name:"Diniy-ma'naviy",  icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M2 10h20"/><path d="M6 14h12"/></svg>' },
  bolalar:  { name:"Bolalar",         icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>' },
  biznes:   { name:"Biznes & moliya", icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  psixologiya:{ name:"Psixologiya",   icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' },
  ilmiy:    { name:"Ilmiy & ta'lim",  icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>' },
  tarix:    { name:"Tarix",           icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  tarjima:  { name:"Tarjima",         icon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>' },
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
    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    options: [
      { label: "Tinch va o'ychan", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s0 5.3-4 11.5"/><path d="M11 20v-5"/></svg>', genres: ["sheriyat","klassik","diniy"] },
      { label: "Energiya va ilhom izlayapman", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>', genres: ["biznes","psixologiya"] },
      { label: "Sarguzasht va qiziqish", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>', genres: ["roman","tarjima","bolalar"] },
      { label: "Bilim va tushunish", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>', genres: ["ilmiy","tarix"] },
    ],
  },
  {
    q: "O'zingizni qanday ta'riflaysiz?",
    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    options: [
      { label: "Xayolparast, ijodkor", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>', genres: ["sheriyat","roman","klassik"] },
      { label: "Maqsadli, intiluvchan", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', genres: ["biznes","psixologiya"] },
      { label: "Qiziquvchan, tahlilchi", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/><path d="M12 2v4"/><path d="m15.7 4.5-1.2 2"/><path d="m8.3 4.5 1.2 2"/></svg>', genres: ["ilmiy","tarix","tarjima"] },
      { label: "Mehribon, ma'naviyatli", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>', genres: ["diniy","klassik"] },
    ],
  },
  {
    q: "Qaysi mavzu sizni ko'proq qiziqtiradi?",
    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>',
    options: [
      { label: "Inson ruhiyati va o'sish", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>', genres: ["psixologiya","diniy"] },
      { label: "Tarix va madaniyat", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', genres: ["tarix","klassik"] },
      { label: "Biznes va muvaffaqiyat", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', genres: ["biznes"] },
      { label: "Hikoya va badiiyat", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>', genres: ["roman","tarjima","sheriyat"] },
    ],
  },
  {
    q: "Kitobdan nimani kutasiz?",
    icon: '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
    options: [
      { label: "Tinchlanish va dam", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect width="18" height="18" x="3" y="4" rx="2"/><circle cx="12" cy="10" r="2"/><line x1="8" x2="8" y1="2" y2="4"/><line x1="16" x2="16" y1="2" y2="4"/></svg>', genres: ["sheriyat","roman","bolalar"] },
      { label: "Yangi ko'nikma va bilim", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>', genres: ["biznes","psixologiya","ilmiy"] },
      { label: "Ma'naviy ozuqa", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M2 10h20"/><path d="M6 14h12"/></svg>', genres: ["diniy","klassik"] },
      { label: "Dunyoqarashni kengaytirish", emoji: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>', genres: ["tarix","tarjima","ilmiy"] },
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

/* ===== Helpers ===== */

function getBooks(key){ return BOOKS[key] || []; }
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
  // Return the exact match, or null when the id no longer exists — never a
  // silently-wrong fallback book (callers guard for null).
  return arr.filter(function(b){return b.id===bookId})[0] || null;
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
    '<div class="cv-pub">'+esc(pubName)+'</div>'+
    '<div class="cv-mid"><div class="cv-title">'+esc(book.title)+'</div><div class="cv-rule"></div><div class="cv-author">'+esc(book.author)+'</div></div>';
  
  var imgSrc = book.cover || ('images/covers/'+book.id+'.jpg');
  var fallbackPng = book.cover ? '' : 'data-png="images/covers/'+book.id+'.png"';
  var errHandler = book.cover ? "this.style.display='none';" : "if(!this.dataset.t){this.dataset.t=1;this.src=this.dataset.png;}else{this.style.display='none';}";
  
  var img = '<img class="cv-img" alt="" loading="lazy" '+
    'src="'+imgSrc+'" '+
    fallbackPng+' '+
    'onload="this.parentElement&&this.parentElement.classList.add(\'cv-hasimg\')" '+
    'onerror="'+errHandler+'">';
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
  var href = '/kitob?pub='+pk+'&book='+b.id;
  return '<div class="book" role="link" tabindex="0" data-keyactivate="1" aria-label="'+esc(b.title)+' — batafsil" onclick="location.href=\''+href+'\'" style="cursor:pointer">'+
    '<div class="book-cover cover-sm" style="background:'+(b.color || '#13294A')+'">'+
      coverHTML(b,pub)+
      '<button class="wish-btn '+(wished?'on':'')+'" title="Sevimlilar" aria-label="Sevimlilarga qo\'shish" onclick="event.stopPropagation();toggleWish(\''+pk+'\',\''+b.id+'\',this)"><svg class="wish-ic" width="16" height="16" viewBox="0 0 24 24" fill="'+(wished?'currentColor':'none')+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>'+
      (isTopPick(b)?'<div class="bc-badge">'+flameIcon(10)+'Top</div>':'') +
      (b.stock && b.stock < 5 ? '<div class="bc-badge" style="top:auto;bottom:12px;right:12px;background:#ef4444;color:#fff;font-size:8px">Faqat '+b.stock+' dona qoldi</div>' : '')+
    '</div>'+

    '<div class="book-body">'+
      '<div class="book-meta"><div class="book-title">'+esc(b.title)+'</div><div class="book-author">'+esc(b.author)+'</div></div>'+
      '<div class="book-buy">'+
        '<span class="book-price">'+money(b.price)+'</span>'+
        '<button class="book-cta-btn" title="Savatga" aria-label="Savatga qo\'shish" onclick="event.stopPropagation();addAndToast(\''+pk+'\',\''+b.id+'\')">'+cartIcon(18)+'</button>'+
      '</div>'+
    '</div></div>';
}

function cartIcon(size){
  size = size || 18;
  return '<svg class="cart-ic" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
    '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>'+
    '<path d="M2.5 3h2l2.2 11.4a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>'+
    '</svg>';
}

function flameIcon(size){
  size = size || 10;
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'+
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
          genre: b.genre,
          cover: b.cover
        });
      });
      BOOKS = newBooks;
      computeTopThreshold();

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
        
        // Find matching book in BOOKS to get its correct ID, cover, and color
        let bookId = cs.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        let cover = null;
        let color = cs.bg || 'linear-gradient(135deg,#1A3A6B,#2A5C8A)';
        
        // Flatten books database
        const flatBooks = [];
        Object.keys(BOOKS).forEach(k => {
          BOOKS[k].forEach(b => {
            flatBooks.push(b);
          });
        });
        
        const matchedBook = flatBooks.find(b => b.title.toLowerCase() === cs.title.toLowerCase());
        if (matchedBook) {
          bookId = matchedBook.id;
          cover = matchedBook.cover;
          color = matchedBook.color || color;
        }
        
        return {
          id: bookId,
          title: cs.title,
          author: cs.author,
          pubKey: cs.publisherSlug,
          bg: color,
          offsetDays: Math.max(0, diff),
          label: cs.label || 'Tez kunda',
          desc: cs.description,
          cover: cover
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
    isKMDataError = true;
    isKMDataLoaded = true;
    document.dispatchEvent(new CustomEvent('kmDataLoaded'));
  });
})();

// ===== Clean URL routing & link rewriter (Uzbek routes) =====
(function() {
  const URL_MAPPINGS = {
    'index.html': '/',
    'search.html': '/qidirish',
    'book.html': '/kitob',
    'publishers.html': '/nashriyotlar',
    'publisher.html': '/nashriyot',
    'cart.html': '/savat',
    'wishlist.html': '/sevimlilar',
    'track.html': '/kuzatish',
    'tavsiya.html': '/tavsiyalar',
    'about.html': '/biz-haqimizda',
    'contact.html': '/aloqa',
    'faq.html': '/faq',
    'terms.html': '/shartlar',
    'offer.html': '/oferta',
    'order.html': '/buyurtma'
  };

  // 1. Redirect if landing on raw .html page directly
  let path = window.location.pathname;
  let pageName = path.substring(path.lastIndexOf('/') + 1);
  if (URL_MAPPINGS[pageName]) {
    // Avoid double slashes in paths
    let basePath = path.substring(0, path.lastIndexOf('/') + 1);
    let newPath = (basePath + URL_MAPPINGS[pageName]).replace(/\/+/g, '/');
    window.location.replace(newPath + window.location.search + window.location.hash);
    return;
  }

  // 2. Client-side link rewriter
  function makeLinksClean() {
    document.querySelectorAll('a[href]').forEach(a => {
      let href = a.getAttribute('href');
      if (!href) return;
      
      let urlParts = href.split(/[?#]/);
      let page = urlParts[0];
      let queryAndHash = href.substring(page.length);
      
      if (URL_MAPPINGS[page]) {
        a.setAttribute('href', URL_MAPPINGS[page] + queryAndHash);
      }
    });
  }

  // Run on load and whenever dynamic content changes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', makeLinksClean);
  } else {
    makeLinksClean();
  }
  document.addEventListener('kmDataLoaded', makeLinksClean);
})();
