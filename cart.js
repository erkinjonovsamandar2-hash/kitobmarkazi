/* ===== KITOBMARKAZI — Cart (localStorage) ===== */
function getCart(){ try{ return JSON.parse(localStorage.getItem('km_cart')||'[]'); }catch(e){ return []; } }
function saveCart(c){ localStorage.setItem('km_cart', JSON.stringify(c)); updateCartBadge(); }
function addToCart(pubKey, bookId, qty){
  qty = qty || 1;
  var c = getCart();
  var f = c.filter(function(i){return i.pubKey===pubKey && i.bookId===bookId;})[0];
  if(f) f.qty += qty; else c.push({pubKey:pubKey, bookId:bookId, qty:qty});
  saveCart(c);
}
function removeFromCart(pubKey, bookId){
  saveCart(getCart().filter(function(i){return !(i.pubKey===pubKey && i.bookId===bookId);}));
}
function setQty(pubKey, bookId, qty){
  var c = getCart();
  c.forEach(function(i){ if(i.pubKey===pubKey && i.bookId===bookId) i.qty = Math.max(1, qty); });
  saveCart(c);
}
function clearCart(){ saveCart([]); }
function cartCount(){ return getCart().reduce(function(s,i){return s+i.qty;},0); }
function cartItemsDetailed(){
  return getCart().map(function(i){
    var p = PUBLISHERS[i.pubKey];
    var b = findBook(i.pubKey, i.bookId);
    return { pubKey:i.pubKey, bookId:i.bookId, qty:i.qty, pub:p, book:b, sum:b.price*i.qty };
  });
}
function cartTotal(){ return cartItemsDetailed().reduce(function(s,i){return s+i.sum;},0); }
function updateCartBadge(){
  var n = cartCount();
  document.querySelectorAll('.cart-count').forEach(function(e){
    e.textContent = n;
    e.style.display = n>0 ? 'flex' : 'none';
  });
}
/* Toast */
function toast(msg){
  var t = document.getElementById('km-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'km-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#15202E;color:#fff;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.3);z-index:9999;opacity:0;transition:all 0.25s;display:flex;align-items:center;gap:8px';
    document.body.appendChild(t);
  }
  t.innerHTML = '✓ ' + msg;
  requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
  clearTimeout(window._kmToastT);
  window._kmToastT = setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 1800);
}
document.addEventListener('DOMContentLoaded', updateCartBadge);

/* Add to cart + toast (apostrophe-safe helper) */
function addAndToast(pubKey, bookId){
  addToCart(pubKey, bookId, 1);
  var b = findBook(pubKey, bookId);
  toast(b.title + " savatga qo'shildi");
}

/* ===== Wishlist (Sevimlilar) ===== */
function getWishlist(){ try{ return JSON.parse(localStorage.getItem('km_wish')||'[]'); }catch(e){ return []; } }
function saveWishlist(w){ localStorage.setItem('km_wish', JSON.stringify(w)); updateWishlistBadge(); }
function inWishlist(pk,id){ return getWishlist().some(function(i){return i.pubKey===pk && i.bookId===id;}); }
function toggleWishlist(pk,id){
  var w=getWishlist();
  var idx=w.findIndex(function(i){return i.pubKey===pk && i.bookId===id;});
  if(idx>=0){ w.splice(idx,1); saveWishlist(w); return false; }
  w.push({pubKey:pk, bookId:id}); saveWishlist(w); return true;
}
function wishlistCount(){ return getWishlist().length; }
function wishlistDetailed(){
  return getWishlist().map(function(i){
    return { pubKey:i.pubKey, bookId:i.bookId, pub:PUBLISHERS[i.pubKey], book:findBook(i.pubKey,i.bookId) };
  });
}
function updateWishlistBadge(){
  var n=wishlistCount();
  document.querySelectorAll('.wish-count').forEach(function(e){ e.textContent=n; e.style.display=n>0?'flex':'none'; });
}
function toggleWish(pk,id,btn){
  var added=toggleWishlist(pk,id);
  if(btn){
    btn.classList.toggle('on',added);
    var heart = btn.querySelector('svg');
    if(heart){
      if(added) heart.setAttribute('fill', 'currentColor');
      else heart.setAttribute('fill', 'none');
    }
  }
  toast(added?"Sevimlilarga qo'shildi":"Sevimlilardan olib tashlandi");
}
document.addEventListener('DOMContentLoaded', updateWishlistBadge);

/* ===== Scroll reveal (lightweight, all pages) ===== */
(function(){
  function initReveal(){
    var els = document.querySelectorAll('.reveal');
    if(!els.length) return;
    if(!('IntersectionObserver' in window)){
      els.forEach(function(e){e.classList.add('in');});
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
    els.forEach(function(e){ io.observe(e); });
  }
  if(document.readyState!=='loading') initReveal();
  else document.addEventListener('DOMContentLoaded', initReveal);
})();

/* ===== Mobile hamburger menu (auto-built on all pages) ===== */
(function(){
  function buildMobileNav(){
    var nav = document.querySelector('nav.nav');
    if(!nav) return;
    var links = nav.querySelector('.nav-links');
    // Build link set: from .nav-links if present, else a sensible default
    var items = [];
    if(links){
      links.querySelectorAll('a').forEach(function(a){ items.push({href:a.getAttribute('href'), text:a.textContent.trim()}); });
    } else {
      items = [
        {href:'index.html', text:'Bosh sahifa'},
        {href:'publishers.html', text:'Nashriyotlar'},
        {href:'search.html', text:'Kitoblar'},
        {href:'about.html', text:'Biz haqimizda'}
      ];
    }
    // extra useful links
    items.push({href:'wishlist.html', text:'❤ Sevimlilar'});
    items.push({href:'cart.html', text:'🛒 Savatcha'});

    // Burger button (insert at end of nav)
    var burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label','Menyu');
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);

    // Backdrop + panel
    var backdrop = document.createElement('div'); backdrop.className='nav-backdrop';
    var panel = document.createElement('div'); panel.className='nav-mobile';
    var linkHTML = items.map(function(it){ return '<a href="'+it.href+'">'+it.text+'</a>'; }).join('');
    panel.innerHTML = '<div class="nm-top">KITOB<span>MARKAZI</span></div>'+
                      '<button class="nav-mobile-close" aria-label="Yopish">&times;</button>'+ linkHTML;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    function open(){ panel.classList.add('open'); backdrop.classList.add('open'); burger.classList.add('open'); document.body.style.overflow='hidden'; }
    function close(){ panel.classList.remove('open'); backdrop.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow=''; }
    burger.addEventListener('click', function(){ panel.classList.contains('open')?close():open(); });
    backdrop.addEventListener('click', close);
    panel.querySelector('.nav-mobile-close').addEventListener('click', close);
  }
  if(document.readyState!=='loading') buildMobileNav();
  else document.addEventListener('DOMContentLoaded', buildMobileNav);
})();


/* ===== Back to top button ===== */
(function(){
  function initBackToTop(){
    var btn = document.createElement('button');
    btn.id = 'km-back-to-top';
    btn.innerHTML = '↑'; // UPWARDS ARROW emoji
    btn.style.cssText = 'position:fixed;bottom:85px;right:24px;width:44px;height:44px;border-radius:50%;background:#1D9E75;color:#fff;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;font-size:18px;font-weight:bold;z-index:999;display:none;align-items:center;justify-content:center;transition:all 0.2s;opacity:0.9;outline:none';
    btn.addEventListener('mouseenter', function(){ btn.style.transform='translateY(-3px)'; btn.style.background='#15805d'; });
    btn.addEventListener('mouseleave', function(){ btn.style.transform='translateY(0)'; btn.style.background='#1D9E75'; });
    btn.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); });
    document.body.appendChild(btn);

    window.addEventListener('scroll', function(){
      if(window.scrollY > 400){
        btn.style.display = 'flex';
      } else {
        btn.style.display = 'none';
      }
    });
  }
  if(document.readyState!=='loading') initBackToTop();
  else document.addEventListener('DOMContentLoaded', initBackToTop);
})();

/* ===== Dynamic Lucide Icons Loader ===== */
function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}
document.addEventListener('DOMContentLoaded', refreshIcons);
window.refreshIcons = refreshIcons;
