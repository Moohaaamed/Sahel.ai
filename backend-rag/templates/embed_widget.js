(function() {
  var SLUG = "{{ slug }}";
  var WS_URL = "{{ ws_url }}";
  var API_URL = "{{ api_url }}";

  var containerId = "sahel-widget-container";
  if (document.getElementById(containerId)) return;

  var container = document.createElement("div");
  container.id = containerId;
  container.innerHTML =
    '<style>' +
    '#sahel-widget-btn{' +
      'position:fixed;bottom:20px;right:20px;z-index:999999;' +
      'width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;' +
      'background:#E8604C;color:#fff;font-size:24px;' +
      'box-shadow:0 4px 20px rgba(232,96,76,0.4);' +
      'transition:transform .2s,box-shadow .2s;' +
      'display:flex;align-items:center;justify-content:center;' +
    '}' +
    '#sahel-widget-btn:hover{transform:scale(1.05);box-shadow:0 6px 24px rgba(232,96,76,0.5)}' +
    '#sahel-widget-popup{' +
      'position:fixed;bottom:88px;right:20px;z-index:999998;' +
      'width:360px;max-width:calc(100vw-40px);height:520px;max-height:calc(100vh-120px);' +
      'background:#1a1a2e;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.3);' +
      'display:none;flex-direction:column;overflow:hidden;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'color:#e8e8e8;font-size:14px;line-height:1.5;' +
      'border:1px solid rgba(255,255,255,0.08);' +
    '}' +
    '#sahel-widget-popup.open{display:flex}' +
    '#sahel-widget-header{' +
      'background:#E8604C;padding:14px 16px;display:flex;align-items:center;gap:10px;' +
    '}' +
    '#sahel-widget-header h3{color:#fff;font-size:15px;font-weight:600;margin:0;flex:1}' +
    '#sahel-widget-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;line-height:1}' +
    '#sahel-widget-messages{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}' +
    '#sahel-widget-messages::-webkit-scrollbar{width:4px}' +
    '#sahel-widget-messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:2px}' +
    '.sw-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;animation:fadeIn .2s}' +
    '.sw-user{background:#E8604C;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}' +
    '.sw-bot{background:rgba(255,255,255,0.08);color:#e8e8e8;align-self:flex-start;border-bottom-left-radius:4px}' +
    '.sw-typing{display:flex;gap:4px;padding:10px 14px;background:rgba(255,255,255,0.08);border-radius:12px;align-self:flex-start}' +
    '.sw-typing span{width:6px;height:6px;background:#888;border-radius:50%;animation:typing 1.2s infinite}' +
    '.sw-typing span:nth-child(2){animation-delay:.2s}' +
    '.sw-typing span:nth-child(3){animation-delay:.4s}' +
    '@keyframes typing{0%,60%,100%{opacity:.3}30%{opacity:1}}' +
    '@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
    '#sahel-widget-input-wrap{display:flex;padding:10px 12px;gap:8px;border-top:1px solid rgba(255,255,255,0.08)}' +
    '#sahel-widget-input{' +
      'flex:1;border:1px solid rgba(255,255,255,0.12);border-radius:10px;' +
      'padding:10px 14px;font-size:13px;background:rgba(255,255,255,0.06);' +
      'color:#e8e8e8;outline:none;' +
    '}' +
    '#sahel-widget-input:focus{border-color:#E8604C}' +
    '#sahel-widget-input::placeholder{color:#666}' +
    '#sahel-widget-send{' +
      'background:#E8604C;color:#fff;border:none;border-radius:10px;' +
      'width:42px;height:42px;cursor:pointer;font-size:18px;display:flex;' +
      'align-items:center;justify-content:center;flex-shrink:0;' +
      'transition:background .2s;' +
    '}' +
    '#sahel-widget-send:hover{background:#D04A38}' +
    '#sahel-widget-send:disabled{opacity:.4;cursor:not-allowed}' +
    '@media(max-width:480px){' +
      '#sahel-widget-popup{right:10px;left:10px;width:auto;height:70vh;bottom:80px}' +
    '}' +
    '</style>' +
    '<button id="sahel-widget-btn" aria-label="Chat">💬</button>' +
    '<div id="sahel-widget-popup">' +
      '<div id="sahel-widget-header">' +
        '<h3>{{ business_name }}</h3>' +
        '<button id="sahel-widget-close">&times;</button>' +
      '</div>' +
      '<div id="sahel-widget-messages">' +
        '<div class="sw-msg sw-bot">{{ greeting }}</div>' +
      '</div>' +
      '<div id="sahel-widget-input-wrap">' +
        '<input id="sahel-widget-input" type="text" placeholder="{{ placeholder }}" />' +
        '<button id="sahel-widget-send">&#10148;</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(container);

  var btn = document.getElementById("sahel-widget-btn");
  var popup = document.getElementById("sahel-widget-popup");
  var close = document.getElementById("sahel-widget-close");
  var messages = document.getElementById("sahel-widget-messages");
  var input = document.getElementById("sahel-widget-input");
  var send = document.getElementById("sahel-widget-send");

  var ws = null;
  var isOpen = false;
  var isStreaming = false;
  var convId = null;

  function addMsg(text, role) {
    var div = document.createElement("div");
    div.className = "sw-msg " + (role === "user" ? "sw-user" : "sw-bot");
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement("div");
    div.className = "sw-typing";
    div.id = "sw-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById("sw-typing-indicator");
    if (el) el.remove();
  }

  function connectWs() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    try {
      ws = new WebSocket(WS_URL + "?business_slug=" + encodeURIComponent(SLUG));
      ws.onmessage = function(e) {
        hideTyping();
        isStreaming = true;
        var lastMsg = messages.lastElementChild;
        if (lastMsg && lastMsg.classList.contains("sw-bot") && lastMsg.dataset.streaming) {
          lastMsg.textContent += e.data;
        } else {
          var div = document.createElement("div");
          div.className = "sw-msg sw-bot";
          div.dataset.streaming = "1";
          div.textContent = e.data;
          messages.appendChild(div);
        }
        messages.scrollTop = messages.scrollHeight;
      };
      ws.onerror = function() {};
      ws.onclose = function() { ws = null; };
    } catch(e) {}
  }

  function sendMessage(text) {
    if (!text.trim() || isStreaming) return;
    if (!ws || ws.readyState !== WebSocket.OPEN) connectWs();
    addMsg(text, "user");
    input.value = "";
    showTyping();
    isStreaming = true;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: text, rag: true }));
    }
    setTimeout(function() {
      hideTyping();
      isStreaming = false;
      var streamingMsg = messages.querySelector('[data-streaming]');
      if (streamingMsg) delete streamingMsg.dataset.streaming;
    }, 10000);
  }

  btn.onclick = function() {
    isOpen = !isOpen;
    popup.classList.toggle("open", isOpen);
    btn.textContent = isOpen ? "\u00d7" : "\ud83d\udcac";
    btn.style.background = isOpen ? "#666" : "#E8604C";
    if (isOpen) {
      connectWs();
      input.focus();
    } else {
      if (ws) { ws.close(); ws = null; }
    }
  };

  close.onclick = function() { btn.click(); };

  send.onclick = function() { sendMessage(input.value); };
  input.onkeydown = function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
  };
})();
