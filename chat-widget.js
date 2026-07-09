/* ===== KITOBMARKAZI — Floating AI Chat Widget ===== */
(function() {
  // Prevent duplicate initialization
  if (window.__kmChatWidgetInitialized) return;
  window.__kmChatWidgetInitialized = true;

  // Insert styles
  var style = document.createElement('style');
  style.innerHTML = `
    .km-chat-btn {
      all: initial;
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9e75, #136a4e);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(29, 158, 117, 0.4);
      cursor: pointer;
      z-index: 2147483647 !important;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: none;
      padding: 0;
      pointer-events: auto !important;
      isolation: isolate;
      font-family: sans-serif;
    }
    .km-chat-btn:hover {
      transform: scale(1.1) translateY(-3px);
      box-shadow: 0 6px 24px rgba(29, 158, 117, 0.5);
    }
    .km-chat-btn svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
    }
    .km-chat-btn .km-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #E2556F;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 10px;
      border: 2px solid #fff;
    }
    
    .km-chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 520px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.12);
      border: 1px solid rgba(228, 232, 231, 0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 99999;
      transform: scale(0.9) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .km-chat-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    
    .km-chat-header {
      background: linear-gradient(135deg, #13294A, #1d9e75);
      padding: 16px 20px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .km-chat-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .km-chat-avatar {
      font-size: 24px;
    }
    .km-chat-title {
      font-weight: 700;
      font-size: 14.5px;
      letter-spacing: -0.01em;
      margin: 0;
    }
    .km-chat-subtitle {
      font-size: 11px;
      color: rgba(255,255,255,0.7);
      margin: 2px 0 0 0;
    }
    .km-chat-close {
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      transition: color 0.2s;
      background: transparent;
      border: none;
      padding: 4px;
      font-size: 20px;
      line-height: 1;
    }
    .km-chat-close:hover {
      color: #fff;
    }
    
    .km-chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #F7F9F8;
    }
    .km-chat-body::-webkit-scrollbar {
      width: 5px;
    }
    .km-chat-body::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.02);
    }
    .km-chat-body::-webkit-scrollbar-thumb {
      background: rgba(29, 158, 117, 0.3);
      border-radius: 10px;
    }
    .km-chat-body::-webkit-scrollbar-thumb:hover {
      background: rgba(29, 158, 117, 0.6);
    }

    .km-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      font-family: 'Manrope', sans-serif;
      position: relative;
      animation: km-fade-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
    }
    .km-msg.user {
      align-self: flex-end;
      background: #1d9e75;
      color: #fff;
      border-bottom-right-radius: 2px;
      box-shadow: 0 2px 6px rgba(29, 158, 117, 0.2);
      transform: translateX(10px);
    }
    .km-msg.assistant {
      align-self: flex-start;
      background: #fff;
      color: #13294A;
      border-bottom-left-radius: 2px;
      border: 1px solid rgba(228, 232, 231, 0.7);
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      transform: translateX(-10px);
    }
    @keyframes km-fade-slide {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    .km-msg-time {
      font-size: 9.5px;
      color: rgba(255,255,255,0.7);
      margin-top: 4px;
      display: block;
      text-align: right;
    }
    .km-msg.assistant .km-msg-time {
      color: #8C9BA5;
    }
    
    .km-msg p {
      margin: 0 0 6px 0;
    }
    .km-msg p:last-child {
      margin: 0;
    }
    .km-msg ul, .km-msg ol {
      margin: 6px 0;
      padding-left: 18px;
    }
    
    .km-chat-loading {
      align-self: flex-start;
      background: #fff;
      padding: 12px 16px;
      border-radius: 14px;
      border-bottom-left-radius: 2px;
      border: 1px solid rgba(228, 232, 231, 0.7);
      display: none;
      align-items: center;
      gap: 5px;
    }
    .km-dot {
      width: 6px;
      height: 6px;
      background: #1d9e75;
      border-radius: 50%;
      animation: km-bounce 1.4s infinite ease-in-out both;
    }
    .km-dot:nth-child(1) { animation-delay: -0.32s; }
    .km-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes km-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
    
    .km-chat-footer {
      padding: 12px 16px;
      background: #fff;
      border-top: 1px solid #E4E8E7;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .km-chat-input {
      flex: 1;
      border: 1.5px solid #DDE3E1;
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;
      background: #F7F9F8;
    }
    .km-chat-input:focus {
      border-color: #1d9e75;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(29, 158, 117, 0.12);
    }
    .km-chat-send {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #1d9e75;
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .km-chat-send:hover {
      background: #136a4e;
    }
    .km-chat-send svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    
    @media(max-width: 480px) {
      .km-chat-window {
        width: calc(100% - 32px);
        height: 460px;
        bottom: 84px;
        right: 16px;
      }
      .km-chat-btn {
        bottom: 16px;
        right: 16px;
        width: 54px;
        height: 54px;
      }
    }

    /* Recommended books list and cards in chat */
    .km-chat-books-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
      margin-bottom: 8px;
      width: 100%;
      align-self: flex-start;
      animation: km-fade-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .km-chat-book-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      border: 1px solid rgba(228, 232, 231, 0.9);
      border-radius: 12px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
      width: 100%;
      box-sizing: border-box;
    }
    .km-chat-book-card:hover {
      border-color: #1d9e75;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(29, 158, 117, 0.12);
    }
    .km-chat-book-cover {
      width: 52px;
      height: 70px;
      border-radius: 4px;
      position: relative;
      flex-shrink: 0;
      box-shadow: 2px 2px 6px rgba(0,0,0,0.15), -1px 0px 1px rgba(255,255,255,0.2) inset;
      overflow: hidden;
    }
    /* 3D book spine overlay shadow */
    .km-chat-book-cover::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%);
      z-index: 5;
    }
    /* Page edge gold line or overlay on the right */
    .km-chat-book-cover::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 2px;
      height: 100%;
      background: rgba(0,0,0,0.05);
      z-index: 5;
    }
    .km-chat-book-cover .cv-pub,
    .km-chat-book-cover .cv-mid {
      display: none !important;
    }
    .km-chat-book-info {
      flex: 1;
      min-width: 0;
      text-align: left;
    }
    .km-chat-book-title {
      font-size: 13px;
      font-weight: 700;
      color: #13294A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .km-chat-book-author {
      font-size: 11px;
      color: #5C6B84;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .km-chat-book-price {
      font-size: 12px;
      font-weight: 800;
      color: #1d9e75;
    }
    .km-chat-book-buy {
      font-family: 'Manrope', sans-serif;
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      background: #1d9e75;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      text-align: center;
      outline: none;
    }
    .km-chat-book-buy:hover {
      background: #136a4e;
    }

    /* Avatar and Status indicator in header */
    .km-chat-avatar-container {
      position: relative;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
    }
    .km-chat-avatar-gradient {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #1d9e75, #ffd700);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      box-shadow: 0 2px 10px rgba(29, 158, 117, 0.3);
    }
    .km-chat-avatar-gradient svg {
      width: 18px;
      height: 18px;
    }
    .km-chat-status-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 10px;
      height: 10px;
      background-color: #2ecc71;
      border: 2px solid #13294A;
      border-radius: 50%;
      animation: km-pulse-glow 1.5s infinite alternate;
    }
    @keyframes km-pulse-glow {
      0% { box-shadow: 0 0 0 0px rgba(46, 204, 113, 0.7); }
      100% { box-shadow: 0 0 0 4px rgba(46, 204, 113, 0); }
    }
    .km-chat-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .km-chat-action-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.75);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s, transform 0.2s;
    }
    .km-chat-action-btn:hover {
      color: #ffffff;
      transform: scale(1.1);
    }
    .km-chat-action-btn svg {
      width: 18px;
      height: 18px;
      stroke: currentColor;
    }

    /* Suggestion Chips Container & Buttons */
    .km-chat-chips {
      display: none;
      flex-wrap: nowrap;
      gap: 6px;
      padding: 8px 16px;
      background: #F7F9F8;
      border-top: 1px solid rgba(228, 232, 231, 0.5);
      overflow-x: auto;
      scrollbar-width: none; /* Firefox */
    }
    .km-chat-chips::-webkit-scrollbar {
      display: none; /* Safari & Chrome */
    }
    .km-chip {
      font-family: 'Manrope', sans-serif;
      font-size: 11.5px;
      font-weight: 600;
      color: #13294A;
      background: #ffffff;
      border: 1px solid #E4E8E7;
      border-radius: 16px;
      padding: 6px 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      flex-shrink: 0;
    }
    .km-chip:hover {
      border-color: #1d9e75;
      color: #1d9e75;
      background: rgba(29, 158, 117, 0.04);
      transform: translateY(-1px);
    }

  `;
  document.head.appendChild(style);

  // HTML Structure - use <button> for reliable click handling
  var btnEl = document.createElement('button');
  btnEl.className = 'km-chat-btn';
  btnEl.id = 'kmChatBtn';
  btnEl.setAttribute('type', 'button');
  btnEl.setAttribute('aria-label', 'Chat');
  btnEl.innerHTML = `<svg viewBox="0 0 24 24" style="pointer-events:none"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>`;
  document.body.appendChild(btnEl);

  var windowEl = document.createElement('div');
  windowEl.className = 'km-chat-window';
  windowEl.id = 'kmChatWindow';
  windowEl.innerHTML = `
    <div class="km-chat-header">
      <div class="km-chat-title-wrap">
        <div class="km-chat-avatar-container">
          <div class="km-chat-avatar-gradient">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div class="km-chat-status-dot"></div>
        </div>
        <div>
          <h4 class="km-chat-title">Kitob Maslahatchisi</h4>
          <p class="km-chat-subtitle">Sun'iy intellekt yordamchisi</p>
        </div>
      </div>
      <div class="km-chat-header-actions">
        <button class="km-chat-action-btn" id="kmChatClear" type="button" title="Tarixni tozalash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
        <button class="km-chat-close" id="kmChatClose" type="button" title="Yopish">&times;</button>
      </div>
    </div>
    
    <div class="km-chat-body" id="kmChatBody">
      <div class="km-msg assistant">
        <p>Assalomu alaykum! Men sizga Kitobmarkazi kutubxonasidan eng yaxshi kitoblarni tanlashda yordam beraman. Qanday kitoblar sizni qiziqtiradi?</p>
      </div>
    </div>
    
    <div class="km-chat-loading" id="kmChatLoading">
      <div class="km-dot"></div>
      <div class="km-dot"></div>
      <div class="km-dot"></div>
    </div>

    <div class="km-chat-chips" id="kmChatChips"></div>
    
    <div class="km-chat-footer">
      <input type="text" class="km-chat-input" id="kmChatInput" placeholder="Savolingizni yozing...">
      <button class="km-chat-send" id="kmChatSend" type="button">
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(windowEl);

  // Elements
  var chatBtn = document.getElementById('kmChatBtn');
  var chatWindow = document.getElementById('kmChatWindow');
  var chatClose = document.getElementById('kmChatClose');
  var chatBody = document.getElementById('kmChatBody');
  var chatInput = document.getElementById('kmChatInput');
  var chatSend = document.getElementById('kmChatSend');
  var chatLoading = document.getElementById('kmChatLoading');

  // Suggestion Chips Element
  var chatChips = document.getElementById('kmChatChips');

  function showChips(chipTexts) {
    chatChips.innerHTML = '';
    if (!chipTexts || chipTexts.length === 0) {
      chatChips.style.display = 'none';
      return;
    }
    chatChips.style.display = 'flex';
    chipTexts.forEach(function(text) {
      var chip = document.createElement('button');
      chip.className = 'km-chip';
      chip.type = 'button';
      chip.textContent = text;
      chip.addEventListener('click', function() {
        chatInput.value = text;
        handleSend();
        showChips([]);
      });
      chatChips.appendChild(chip);
    });
    scrollToBottom();
  }

  // Load chat history from localStorage
  var messages = [];
  try {
    var stored = localStorage.getItem('km_chat_history');
    if (stored) {
      messages = JSON.parse(stored);
      renderHistory();
    } else {
      setTimeout(function() {
        showChips([
          "📚 Eng mashhur kitoblar",
          "💡 Foydali odatlar haqida",
          "🚀 Biznes va muvaffaqiyat",
          "📍 Buyurtmani kuzatish"
        ]);
      }, 300);
    }
  } catch (e) {
    console.error('Failed to load chat history', e);
  }

  // Clear History Button
  var chatClear = document.getElementById('kmChatClear');
  if (chatClear) {
    chatClear.onclick = function() {
      if (confirm("Haqiqatan ham barcha suhbatlar tarixini tozalaysizmi?")) {
        messages = [];
        localStorage.removeItem('km_chat_history');
        renderHistory();
        showChips([
          "📚 Eng mashhur kitoblar",
          "💡 Foydali odatlar haqida",
          "🚀 Biznes va muvaffaqiyat",
          "📍 Buyurtmani kuzatish"
        ]);
      }
    };
  }

  // Toggle Window - exposed globally
  window.__kmToggleChat = function() {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      chatInput.focus();
      scrollToBottom();
    }
  };

  chatBtn.addEventListener('mousedown', function(e) {
    e.preventDefault();
    window.__kmToggleChat();
  });
  chatClose.onclick = function() {
    chatWindow.classList.remove('open');
  };

  console.log('[KM Chat] Widget initialized, button:', chatBtn);

  // Send Event
  function handleSend() {
    var text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    
    // Add user message
    addMessage('user', text);
    messages.push({ role: 'user', content: text });
    saveHistory();

    // Check special action chips for direct navigation
    if (text === "🛒 Savatga o'tish") {
      chatLoading.style.display = 'flex';
      setTimeout(function() {
        chatLoading.style.display = 'none';
        addMessage('assistant', "Sizni Savat sahifasiga yo'naltirmoqdaman...");
        setTimeout(function() {
          window.location.href = 'cart.html';
        }, 800);
      }, 400);
      return;
    }

    if (text === "📍 Buyurtmani kuzatish") {
      chatLoading.style.display = 'flex';
      setTimeout(function() {
        chatLoading.style.display = 'none';
        addMessage('assistant', "Buyurtmani kuzatish sahifasiga yo'naltirmoqdaman...");
        setTimeout(function() {
          window.location.href = 'track.html';
        }, 800);
      }, 400);
      return;
    }

    // Show loading
    chatLoading.style.display = 'flex';
    scrollToBottom();
    showChips([]);

    // Call API
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      chatLoading.style.display = 'none';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        var reply = data.choices[0].message.content;
        addMessage('assistant', reply);
        messages.push({ role: 'assistant', content: reply });
        saveHistory();

        // Show followup action chips
        showChips([
          "🔄 Boshqa tavsiyalar",
          "🛒 Savatga o'tish",
          "✨ Rahmat, tushunarli"
        ]);
      } else {
        addMessage('assistant', "Kechirasiz, javob olishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
        showChips(["🔄 Qaytadan urinish"]);
      }
      scrollToBottom();
    })
    .catch(function(err) {
      console.error(err);
      chatLoading.style.display = 'none';
      addMessage('assistant', "Tarmoq xatoligi yuz berdi. Internet aloqasini tekshiring.");
      showChips(["🔄 Qaytadan urinish"]);
      scrollToBottom();
    });
  }

  chatSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleSend();
  });

  // Helpers
  function addMessage(sender, text) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'km-msg ' + sender;
    
    var timeStr = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    msgDiv.innerHTML = formatMarkdown(text) + '<span class="km-msg-time">' + timeStr + '</span>';
    chatBody.appendChild(msgDiv);

    if (sender === 'assistant') {
      renderChatBooks(text, chatBody);
    }
  }

  function renderChatBooks(text, container) {
    if (typeof buildSearchIndex !== 'function') return;

    var foundBooks = [];
    var tempText = text.toLowerCase();
    var index = buildSearchIndex().filter(function(it) { return it.type === 'book'; });
    
    // Sort by title length descending to prevent substring false-positives
    index.sort(function(a, b) { return b.title.length - a.title.length; });

    index.forEach(function(item) {
      var titleLower = item.title.toLowerCase();
      var matchIdx = tempText.indexOf(titleLower);
      if (matchIdx !== -1) {
        var bObj = findBook(item.pubKey, item.bookId);
        if (bObj) {
          foundBooks.push({ pubKey: item.pubKey, bookId: item.bookId, book: bObj });
        }
        // Remove from tempText to avoid matching subset titles
        tempText = tempText.slice(0, matchIdx) + " " + tempText.slice(matchIdx + titleLower.length);
      }
    });

    if (foundBooks.length === 0) return;

    var listDiv = document.createElement('div');
    listDiv.className = 'km-chat-books-list';

    foundBooks.forEach(function(item) {
      var pk = item.pubKey;
      var b = item.book;
      var pub = typeof PUBLISHERS !== 'undefined' ? PUBLISHERS[pk] : null;
      var coverHtml = typeof coverHTML === 'function' ? coverHTML(b, pub) : '';
      var priceStr = typeof money === 'function' ? money(b.price) : b.price + ' so\'m';

      var card = document.createElement('div');
      card.className = 'km-chat-book-card';
      
      // Set click event to open in same tab
      card.addEventListener('click', function() {
        window.location.href = 'book.html?pub=' + pk + '&book=' + b.id;
      });

      card.innerHTML = 
        '<div class="km-chat-book-cover" style="background:' + (b.color || '#13294A') + '">' +
          coverHtml +
        '</div>' +
        '<div class="km-chat-book-info">' +
          '<div class="km-chat-book-title">' + b.title + '</div>' +
          '<div class="km-chat-book-author">' + b.author + '</div>' +
          '<div class="km-chat-book-price">' + priceStr + '</div>' +
        '</div>' +
        '<button class="km-chat-book-buy" type="button">' +
          'Savatga' +
        '</button>';

      // Event listener for add to cart button to prevent trigger of parent click
      var buyBtn = card.querySelector('.km-chat-book-buy');
      if (buyBtn) {
        buyBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          if (typeof addAndToast === 'function') {
            addAndToast(pk, b.id);
          }
        });
      }

      listDiv.appendChild(card);
    });

    container.appendChild(listDiv);
  }

  function renderHistory() {
    // Clear dynamic messages (leave only the first greeting message)
    chatBody.innerHTML = `
      <div class="km-msg assistant">
        <p>Assalomu alaykum! Men sizga Kitobmarkazi kutubxonasidan eng yaxshi kitoblarni tanlashda yordam beraman. Qanday kitoblar sizni qiziqtiradi?</p>
      </div>
    `;
    messages.forEach(function(m) {
      addMessage(m.role, m.content);
    });
  }

  function saveHistory() {
    try {
      localStorage.setItem('km_chat_history', JSON.stringify(messages));
    } catch (e) {}
  }

  function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Simple Markdown Parser (Bold, Lists, Paragraphs)
  function formatMarkdown(text) {
    // Escape HTML
    var html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold text (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet lists (- item)
    var lines = html.split('\n');
    var inList = false;
    var result = [];

    lines.forEach(function(line) {
      var trimmed = line.trim();
      if (trimmed.indexOf('- ') === 0 || trimmed.indexOf('* ') === 0) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push('<li>' + trimmed.slice(2) + '</li>');
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        if (trimmed) {
          result.push('<p>' + line + '</p>');
        }
      }
    });

    if (inList) result.push('</ul>');
    return result.join('\n');
  }
})();
