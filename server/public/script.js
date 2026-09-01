const messagesEl = document.getElementById('chat-messages');
const inputEl = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// Basit oturum kimliği (tarayıcı sekmesi bazında)
const sessionId = crypto.randomUUID();

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  inputEl.value = '';
  sendBtn.disabled = true;

  const loadingMsg = addMessage('Yazıyor...', 'bot');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId }),
    });

    const data = await res.json();
    loadingMsg.remove();

    if (!res.ok) {
      addMessage(`Hata: ${data.error || 'Bilinmeyen hata'}`, 'bot');
      return;
    }

    addMessage(data.reply, 'bot');
  } catch (err) {
    loadingMsg.remove();
    addMessage('Bağlantı hatası oluştu. Sunucu çalışıyor mu?', 'bot');
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});
