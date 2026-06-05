const express   = require('express');
const axios     = require('axios');
const router    = express.Router();
const RAGSystem = require('../rag-pipeline');

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL      = 'mistral';
const BASE_SYSTEM =
  'Kamu adalah asisten sejarah ahli Kompleks Candi Muaro Jambi (KCBN). ' +
  'Jawab dalam Bahasa Indonesia yang akademis tapi mudah dipahami. ' +
  'Gunakan HANYA informasi dari konteks artikel yang diberikan. ' +
  'Jika tidak ada dalam konteks, katakan "Informasi ini tidak tersedia dalam basis data saya." ' +
  'Sertakan nama artikel sumber di akhir jawaban dalam format: Sumber: [nama artikel].';

const rag = new RAGSystem();
let ragReady = false;

rag.initialize()
  .then(() => { ragReady = true; console.log('[chat.js] RAG siap!'); })
  .catch(err => console.error('[chat.js] RAG gagal init:', err.message));

router.post('/ask', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ status: 'error', answer: 'Format pesan tidak valid.' });
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userQuery   = lastUserMsg?.content || '';

  let systemContent = BASE_SYSTEM;
  let sources       = [];

  if (ragReady && userQuery) {
    try {
      const ragResult = await rag.searchByText(userQuery, 3);
      if (ragResult.length > 0) {
        const context = ragResult
          .map((a, i) => `[Artikel ${i + 1}: ${a.title}]\n${a.content.slice(0, 300)}`)
          .join('\n\n');
        systemContent += `\n\nKonteks dari artikel penelitian:\n\n${context}`;
        sources = ragResult.map(a => ({ id: a.id, title: a.title, score: a.score }));
      }
    } catch (err) {
      console.warn('[chat.js] RAG search gagal:', err.message);
    }
  }

  const fullMessages = [
    { role: 'system', content: systemContent },
    ...messages
  ];

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: MODEL, messages: fullMessages, stream: false
    });
    const answer = response.data.message?.content;
    if (!answer) throw new Error('Respons kosong dari Ollama');
    res.json({ status: 'success', answer, sources });
  } catch (err) {
    const isOffline = err.code === 'ECONNREFUSED';
    res.status(isOffline ? 503 : 500).json({
      status: 'error',
      answer: isOffline ? 'Ollama tidak berjalan.' : 'Error: ' + err.message
    });
  }
});

module.exports = router;
