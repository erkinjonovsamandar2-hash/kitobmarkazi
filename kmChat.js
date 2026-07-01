/* ===== KITOBMARKAZI — AI Chat Widget ===== */
(function() {
  var history = [];
  var isOpen = false;

  // Create UI
  var chatHtml = `
    <div id="kmChat" class="km-chat">
      <div id="kmChatWindow" class="km-chat-window" style="display:none">
        <div class="km-chat-header">
          <span>📚 Kitob Maslahatchisi</span>
          <button onclick="window.kmChat.toggle()">✕</button>
        </div>
        <div id="kmChatMessages" class="km-chat-messages">
          <div class="msg ai">Assalomu alaykum! Men Kitobmarkazi aqlli yordamchisiman. Sizga qanday kitob topishda yordam bera olaman?</div>
        </div>
        <div class="km-chat-input">
          <input type="text" id="kmChatInput" placeholder="Savolingizni yozing..." onkeydown="if(event.key==='Enter')window.kmChat.send()">
          <button onclick="window.kmChat.send()">➤</button>
        </div>
      </div>
      <div id="kmChatBubble" class="km-chat-bubble" onclick="window.kmChat.toggle()">
        <span>💬</span>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHtml);

  // Styles
  var styles = `
    .km-chat { position: fixed; bottom: 30px; right: 30px; z-index: 9999; font-family: 'Manrope', sans-serif; }
    .km-chat-bubble { width: 60px; height: 60px; background: #1D9E75; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; cursor: pointer; box-shadow: 0 10px 30px rgba(29, 158, 117, 0.4); transition: transform 0.2s; }
    .km-chat-bubble:hover { transform: scale(1.1); }
    .km-chat-window { position: absolute; bottom: 80px; right: 0; width: 350px; height: 500px; background: #fff; border-radius: 20px; box-shadow: 0 15px 50px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; transform-origin: bottom right; animation: kmChatOpen 0.3s ease-out; }
    @keyframes kmChatOpen { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .km-chat-header { background: #1D9E75; color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
    .km-chat-header button { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; opacity: 0.7; }
    .km-chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #f9fafb; }
    .msg { max-width: 85%; padding: 10px 14px; border-radius: 15px; font-size: 14px; line-height: 1.4; }
    .msg.ai { align-self: flex-start; background: #fff; color: #1f2937; border-bottom-left-radius: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .msg.user { align-self: flex-end; background: #1D9E75; color: #fff; border-bottom-right-radius: 2px; }
    .km-chat-input { padding: 15px; background: #fff; border-top: 1px solid #eee; display: flex; gap: 10px; }
    .km-chat-input input { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; outline: none; font-family: inherit; }
    .km-chat-input button { background: #1D9E75; color: #fff; border: none; border-radius: 10px; width: 40px; cursor: pointer; }
    .typing { font-size: 12px; color: #9ca3af; font-style: italic; margin-top: -8px; }
  `;
  var styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  window.kmChat = {
    toggle: function() {
      isOpen = !isOpen;
      document.getElementById('kmChatWindow').style.display = isOpen ? 'flex' : 'none';
      if (isOpen) document.getElementById('kmChatInput').focus();
    },
    send: function() {
      var input = document.getElementById('kmChatInput');
      var text = input.value.trim();
      if (!text) return;

      this.addMessage('user', text);
      input.value = '';

      var msgsDiv = document.getElementById('kmChatMessages');
      var typingDiv = document.createElement('div');
      typingDiv.className = 'typing';
      typingDiv.textContent = 'Maslahatchi javob yozmoqda...';
      msgsDiv.appendChild(typingDiv);
      msgsDiv.scrollTop = msgsDiv.scrollHeight;

      var currentHistory = history.concat([{ role: 'user', content: text }]);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentHistory })
      }).then(r => r.json()).then(data => {
        typingDiv.remove();
        if (data.error) {
          this.addMessage('ai', 'Kechirasiz, xatolik yuz berdi: ' + data.error);
        } else {
          var aiMsg = data.choices[0].message.content;
          this.addMessage('ai', aiMsg);
          history.push({ role: 'user', content: text });
          history.push({ role: 'assistant', content: aiMsg });
          if (history.length > 12) history = history.slice(-12);
        }
      }).catch(() => {
        typingDiv.remove();
        this.addMessage('ai', 'Kechirasiz, server bilan bog\'lanishda xatolik yuz berdi.');
      });
    },

    addMessage: function(role, text) {
      var div = document.createElement('div');
      div.className = 'msg ' + role;
      div.textContent = text;
      var msgsDiv = document.getElementById('kmChatMessages');
      msgsDiv.appendChild(div);
      msgsDiv.scrollTop = msgsDiv.scrollHeight;
    }
  };
})();
