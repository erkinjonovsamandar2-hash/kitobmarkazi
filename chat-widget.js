/* ===== KITOBMARKAZI — Floating AI Chat Widget ===== */
(function() {
  // Prevent duplicate initialization
  if (window.__kmChatWidgetInitialized) return;
  window.__kmChatWidgetInitialized = true;

  // Insert styles
  var style = document.createElement('style');
  style.innerHTML = `
    .km-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
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
      z-index: 99999;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255,255,255,0.1);
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
    .km-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      font-family: 'Manrope', sans-serif;
    }
    .km-msg.user {
      align-self: flex-end;
      background: #1d9e75;
      color: #fff;
      border-bottom-right-radius: 2px;
      box-shadow: 0 2px 6px rgba(29, 158, 117, 0.2);
    }
    .km-msg.assistant {
      align-self: flex-start;
      background: #fff;
      color: #13294A;
      border-bottom-left-radius: 2px;
      border: 1px solid rgba(228, 232, 231, 0.7);
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
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
  `;
  document.head.appendChild(style);

  // HTML Structure - append directly to body to avoid wrapper blocking clicks
  var btnEl = document.createElement('div');
  btnEl.className = 'km-chat-btn';
  btnEl.id = 'kmChatBtn';
  btnEl.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
    </svg>
  `;
  document.body.appendChild(btnEl);

  var windowEl = document.createElement('div');
  windowEl.className = 'km-chat-window';
  windowEl.id = 'kmChatWindow';
  windowEl.innerHTML = `
    <div class="km-chat-header">
      <div class="km-chat-title-wrap">
        <span class="km-chat-avatar">🤖</span>
        <div>
          <h4 class="km-chat-title">Kitob Maslahatchisi</h4>
          <p class="km-chat-subtitle">Sun'iy intellekt yordamchisi</p>
        </div>
      </div>
      <button class="km-chat-close" id="kmChatClose">&times;</button>
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
    
    <div class="km-chat-footer">
      <input type="text" class="km-chat-input" id="kmChatInput" placeholder="Savolingizni yozing...">
      <button class="km-chat-send" id="kmChatSend">
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

  // Load chat history from localStorage
  var messages = [];
  try {
    var stored = localStorage.getItem('km_chat_history');
    if (stored) {
      messages = JSON.parse(stored);
      renderHistory();
    }
  } catch (e) {
    console.error('Failed to load chat history', e);
  }

  // Toggle Window - exposed globally
  window.__kmToggleChat = function() {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      chatInput.focus();
      scrollToBottom();
    }
  };

  chatBtn.onclick = window.__kmToggleChat;
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

    // Show loading
    chatLoading.style.display = 'flex';
    scrollToBottom();

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
      } else {
        addMessage('assistant', "Kechirasiz, javob olishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
      }
      scrollToBottom();
    })
    .catch(function(err) {
      console.error(err);
      chatLoading.style.display = 'none';
      addMessage('assistant', "Tarmoq xatoligi yuz berdi. Internet aloqasini tekshiring.");
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
    msgDiv.innerHTML = formatMarkdown(text);
    chatBody.appendChild(msgDiv);
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
