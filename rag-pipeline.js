const fs    = require('fs');
const path  = require('path');
const axios = require('axios');
const { searchSimilarArticles } = require('./search-engine');

const ARTICLES_PATH = path.join(__dirname, 'articles.json');

class RAGSystem {
  constructor() { this.articles = []; this.ready = false; }

  async embedText(text) {
    const res = await axios.post('http://localhost:11434/api/embeddings', {
      model: 'nomic-embed-text', prompt: text
    });
    if (!res.data.embedding) throw new Error('No embedding returned');
    return res.data.embedding;
  }

  async initialize() {
    console.log('[RAG] Memuat articles.json...');
    this.articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
    let needSave = false;
    for (const article of this.articles) {
      if (!article.embedding || article.embedding.length === 0) {
        console.log(`[RAG] Embedding: ${article.title}`);
        try {
          article.embedding = await this.embedText(article.title + '\n' + article.content.slice(0, 500));
          needSave = true;
        } catch (err) {
          console.error(`[RAG] Gagal: ${err.message}`);
          article.embedding = [];
        }
      }
    }
    if (needSave) {
      fs.writeFileSync(ARTICLES_PATH, JSON.stringify(this.articles, null, 2));
      console.log('[RAG] Embedding tersimpan.');
    }
    this.ready = true;
    console.log(`[RAG] Siap — ${this.articles.length} artikel`);
  }

  async searchByText(queryText, topK = 3) {
    if (!this.ready) throw new Error('RAG belum siap');
    const queryEmbedding = await this.embedText(queryText);
    return searchSimilarArticles(queryEmbedding, this.articles, topK);
  }
}

module.exports = RAGSystem;
