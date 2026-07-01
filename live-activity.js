/* ===== KITOBMARKAZI — Live Activity Layer (Social Proof) ===== */
(function() {
  const NAMES = ["Alisher", "Sardor", "Otabek", "Madina", "Shahnoza", "Jasur", "Zilola", "Aziz", "Dilshod", "Nilufar", "Rustam", "Bekzod", "Kamola", "Nozima"];
  const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Qarshi", "Nukus", "Xiva", "Guliston", "Jizzax", "Navoiy", "Termiz"];
  
  function createActivityPopup(data) {
    const existing = document.getElementById('live-activity');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'live-activity';
    popup.className = 'live-activity';
    
    popup.innerHTML = `
      <div class="la-icon">🛒</div>
      <div class="la-content">
        <div class="la-user"><b>${data.name}</b> (${data.city})</div>
        <div class="la-text">"${data.book}" kitobini sotib oldi</div>
        <div class="la-time">${data.time} avval</div>
      </div>
      <button class="la-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('show'), 100);
    
    // Auto remove after 6 seconds
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 500);
    }, 6000);
  }

  function pickRandomActivity() {
    // If we have BOOKS loaded, pick a random one
    if (!window.BOOKS || Object.keys(BOOKS).length === 0) return;
    
    const all = allBooksFlat();
    if (all.length === 0) return;
    
    const book = all[Math.floor(Math.random() * all.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const times = ["hozirgina", "2 daqiqa", "5 daqiqa", "12 daqiqa", "24 daqiqa"];
    const time = times[Math.floor(Math.random() * times.length)];

    createActivityPopup({
      name: name,
      city: city,
      book: book.b.title,
      time: time
    });
  }

  // Initial delay
  setTimeout(() => {
    // Check every 45-90 seconds
    function loop() {
      if (document.visibilityState === 'visible') {
        pickRandomActivity();
      }
      const next = 45000 + Math.random() * 45000;
      setTimeout(loop, next);
    }
    loop();
  }, 10000); // Wait 10s after load
})();
