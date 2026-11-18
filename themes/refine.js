/* Quiet feedback: the add-to-cart button confirms itself with a check for ~1.2s. */
(function () {
  var SEL = '.bs-cart,.book-cta-btn,.book-cart-btn,.bk-addcart';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest(SEL);
    if (!b || b.disabled || b.classList.contains('is-added')) return;
    b.classList.add('is-added');
    setTimeout(function () { b.classList.remove('is-added'); }, 1200);
  }, true);
})();
