const fs = require('fs');
const path = require('path');

// Hitung cosine similarity antara dua vektor
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Cari artikel paling mirip berdasarkan query embedding
function searchSimilarArticles(queryEmbedding, articles, topK = 3) {
  const scored = articles
    .filter(a => a.embedding && a.embedding.length > 0)
    .map(article => ({
      ...article,
      score: cosineSimilarity(queryEmbedding, article.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = { cosineSimilarity, searchSimilarArticles };
