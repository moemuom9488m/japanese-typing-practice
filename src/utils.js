import { KANJI_DICT, KANJI_REGEX } from './data.js';

export const getHiraganaVersion = (text) => {
  if (!text) return '';
  const parts = text.split(KANJI_REGEX);
  return parts.map(part => KANJI_DICT[part] || part).join('');
};

export const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errText = await response.text();
        const err = new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
        err.status = response.status;
        throw err;
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1 || (error.status && error.status >= 400 && error.status < 500 && error.status !== 429)) {
        throw error;
      }
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

export const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
