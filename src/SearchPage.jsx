import React, { useState, useEffect } from 'react';
import Search from 'lucide-react/dist/esm/icons/search.js';
import Volume2 from 'lucide-react/dist/esm/icons/volume-2.js';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2.js';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Home from 'lucide-react/dist/esm/icons/home.js';
import { fetchWithRetry, cosineSimilarity } from './utils.js';

export default function SearchPage({ searchExtractor, isExtractorLoading, playAudio, isTtsLoading, apiKey, textModel, showToast, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInsights, setSearchInsights] = useState({});
  const [loadingSearchInsightIdx, setLoadingSearchInsightIdx] = useState(null);
  const [quizEmbeddingsData, setQuizEmbeddingsData] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(false);

  useEffect(() => {
    setIsDbLoading(true);
    // Fetch from the public directory at runtime
    fetch('/japanese-typing-practice/quiz_with_embeddings.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setQuizEmbeddingsData(data);
        setIsDbLoading(false);
      })
      .catch(err => {
        console.error("Failed to load embeddings database:", err);
        showToast("⚠️ 無法載入搜尋資料庫，請重新整理頁面。");
        setIsDbLoading(false);
      });
  }, []);

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchExtractor || !searchQuery.trim() || quizEmbeddingsData.length === 0) return;
    setIsSearching(true);
    setSearchInsights({});
    try {
      const output = await searchExtractor(searchQuery, { pooling: 'mean', normalize: true });
      const userVector = Array.from(output.data);
      const results = quizEmbeddingsData.map(item => {
        if (!item.embedding) return { ...item, score: 0 };
        return { ...item, score: cosineSimilarity(userVector, item.embedding) };
      }).filter(item => item.score > 0.3).sort((a, b) => b.score - a.score).slice(0, 5);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchSearchItemInsight = async (item, idx) => {
    if (!apiKey) {
      showToast("💡 請先至設定(右上角齒輪)輸入您的 Gemini API Key");
      return;
    }
    setLoadingSearchInsightIdx(idx);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${apiKey}`;
      const prompt = `你是一個專業的日文老師。請針對這個日文內容：'${item.ja[0]}' (${item.zh})，提供：1. 簡短的語感、用法解析或背誦提示（50字以內）。2. 兩個實用的生活例句。`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };

      if (!textModel.toLowerCase().includes('gemma')) {
        payload.generationConfig = {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              explanation: { type: "STRING" },
              examples: { type: "ARRAY", items: { type: "OBJECT", properties: { ja: { type: "STRING" }, kana: { type: "STRING" }, zh: { type: "STRING" } } } }
            }
          }
        };
      } else {
        payload.contents[0].parts[0].text += '\n請務必只輸出純 JSON 格式，格式如下：{"explanation": "...", "examples": [{"ja": "...", "kana": "...", "zh": "..."}]}';
      }

      const result = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      let text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        if (textModel.toLowerCase().includes('gemma')) {
          text = text.replace(/```json\n?|\n?```/g, '').trim();
        }
        setSearchInsights(prev => ({ ...prev, [idx]: JSON.parse(text) }));
      }
    } catch (e) {
      console.error("Search AI Insight Failed:", e);
      showToast(`💡 解析失敗：${e.message.substring(0, 50)}...`, 3000);
    } finally {
      setLoadingSearchInsightIdx(null);
    }
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium group">
        <Home size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回首頁
      </button>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8" style={{ color: '#1f2937' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-700 mb-2">
            <Search size={24} className="text-blue-500" /> 智慧語意搜尋
          </h2>
          <div className="text-sm text-gray-500 leading-relaxed space-y-1">
            <p>輸入概念或情境（例如：「出國會搭的交通工具」），AI 會為您找出最相關的詞彙！</p>
            {isDbLoading && <span className="block mt-2 text-blue-500 font-semibold animate-pulse">⏳ 正在載入搜尋資料庫，請稍候... (約 8MB)</span>}
            {isExtractorLoading && <span className="block mt-2 text-amber-500 font-semibold animate-pulse">⏳ 正在載入語意模型引擎，請稍候... (約 30MB)</span>}
          </div>
        </div>

        <form onSubmit={handleSemanticSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching || isExtractorLoading || isDbLoading}
              placeholder={isDbLoading ? "資料庫載入中，請稍候..." : "輸入你想找的語意..."}
              className="flex-1 p-3 border-2 border-blue-100 rounded-xl outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching || isExtractorLoading || isDbLoading || quizEmbeddingsData.length === 0}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 rounded-xl font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-200"
            >
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : '搜尋'}
            </button>
          </div>
        </form>

        <div className="min-h-[200px]">
          {searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg text-gray-800">{Array.isArray(item.ja) ? item.ja.join(', ') : item.ja}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-mono">相似度: {(item.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <span className="text-gray-600 font-medium mb-1">{item.zh}</span>

                  <div className="flex items-center gap-3">
                    <button onClick={() => playAudio(item.ja[0])} disabled={isTtsLoading} className="text-gray-500 hover:text-emerald-600 p-1.5 bg-gray-200 hover:bg-emerald-100 rounded-full transition-colors" title="發音">
                      <Volume2 size={16} />
                    </button>
                    <button onClick={() => fetchSearchItemInsight(item, idx)} disabled={loadingSearchInsightIdx === idx} className="text-gray-500 hover:text-indigo-600 px-2 py-1 bg-gray-200 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1" title="AI 解析">
                      {loadingSearchInsightIdx === idx ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      <span className="text-xs font-medium">解析</span>
                    </button>
                  </div>

                  {searchInsights[idx] && (
                    <div className="mt-2 bg-indigo-50/80 p-3 rounded-lg border border-indigo-100 text-sm animate-in fade-in slide-in-from-top-2">
                      <p className="text-indigo-900 mb-2 leading-relaxed font-medium">{searchInsights[idx].explanation}</p>
                      <div className="space-y-2">
                        {searchInsights[idx].examples.map((ex, i) => (
                          <div key={i} className="pl-3 border-l-2 border-indigo-300">
                            <p className="text-gray-800 font-medium">{ex.ja} <span className="text-xs text-gray-500 font-normal">({ex.kana})</span></p>
                            <p className="text-gray-600 mt-0.5">{ex.zh}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">沒有符合的結果，請試試其他關鍵字</div>
          )}
        </div>
      </div>
    </div>
  );
}
