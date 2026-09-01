const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basit bellek içi konuşma geçmişi (demo amaçlı - production'da kullanıcı bazlı session/DB kullanılmalı)
const conversations = {};

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Geçerli bir "message" alanı gerekli.' });
    }

    if (!conversations[sessionId]) {
      conversations[sessionId] = [];
    }

    conversations[sessionId].push({ role: 'user', content: message });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'Sen web sitesine entegre yardımcı bir yapay zeka asistanısın. Türkçe ve kısa, net cevaplar ver.',
        messages: conversations[sessionId],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API hatası:', errText);
      return res.status(502).json({ error: 'Yapay zeka servisine ulaşılamadı.' });
    }

    const data = await response.json();
    
    if (!data.content || !Array.isArray(data.content)) {
      throw new Error('Geçersiz API yanıtı: content alanı bulunamadı');
    }

    const assistantText = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    
    if (!assistantText) {
      throw new Error('AI yanıtı boş döndü');
    }

    conversations[sessionId].push({ role: 'assistant', content: assistantText });

    // Geçmişin çok büyümesini önlemek için son 20 mesajı tut
    if (conversations[sessionId].length > 20) {
      conversations[sessionId] = conversations[sessionId].slice(-20);
    }

    res.json({ reply: assistantText });
  } catch (err) {
    console.error('Sunucu hatası:', err);
    res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
