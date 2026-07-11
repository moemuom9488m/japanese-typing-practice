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
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragJsonMode, setRagJsonMode] = useState(false);
  const [ragAnswer, setRagAnswer] = useState('');
  const [ragAnswerJson, setRagAnswerJson] = useState(null);
  const [ragSources, setRagSources] = useState([]);
  const [isRagAnswering, setIsRagAnswering] = useState(false);
  const [searchInsights, setSearchInsights] = useState({});
  const [loadingSearchInsightIdx, setLoadingSearchInsightIdx] = useState(null);
  const [quizEmbeddingsData, setQuizEmbeddingsData] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(false);

  useEffect(() => {
    setIsDbLoading(true);
    const dbUrl = `${import.meta.env.BASE_URL}quiz_with_embeddings.json`;
    fetch(dbUrl)
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

  const retrieveTopMatches = async (queryText, topK = 5, minScore = 0.3) => {
    if (!searchExtractor || !queryText.trim() || quizEmbeddingsData.length === 0) return [];
    const output = await searchExtractor(queryText, { pooling: 'mean', normalize: true });
    const userVector = Array.from(output.data);

    const ranked = quizEmbeddingsData
      .map(item => {
        if (!item.embedding) return { ...item, score: 0 };
        return { ...item, score: cosineSimilarity(userVector, item.embedding) };
      })
      .sort((a, b) => b.score - a.score);

    const filtered = ranked.filter(item => item.score >= minScore).slice(0, topK);
    if (filtered.length > 0) return filtered;
    return ranked.slice(0, Math.min(topK, ranked.length));
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchExtractor || !searchQuery.trim() || quizEmbeddingsData.length === 0) return;
    setIsSearching(true);
    setSearchInsights({});
    try {
      const results = await retrieveTopMatches(searchQuery, 5, 0.3);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRagAsk = async (e) => {
    e.preventDefault();
    if (!ragQuestion.trim()) return;
    if (!searchExtractor || quizEmbeddingsData.length === 0) {
      showToast('⚠️ 向量模型或資料庫尚未載入完成，請稍後再試。');
      return;
    }
    if (!apiKey) {
      showToast('💡 請先至設定(右上角齒輪)輸入您的 Gemini API Key');
      return;
    }

    setIsRagAnswering(true);
    setRagAnswer('');
    setRagAnswerJson(null);
    setRagSources([]);

    try {
      const topMatches = await retrieveTopMatches(ragQuestion, 5, 0.25);
      if (topMatches.length === 0) {
        showToast('⚠️ 找不到可用的參考內容，請換個問法。', 3000);
        return;
      }

      const contextBlocks = topMatches
        .map((item, idx) => {
          const jaText = Array.isArray(item.ja) ? item.ja.join(' / ') : item.ja;
          return `[${idx + 1}] 日文: ${jaText}\n中文: ${item.zh}\n類型: ${item.type || 'unknown'}\n章節: ${item.chapter || 'unknown'}\n相似度: ${(item.score * 100).toFixed(1)}%`;
        })
        .join('\n\n');

      const promptTextMode = `你是日文學習助教。請嚴格依據「參考資料」回答問題，不要捏造未出現在參考資料中的詞彙或句子。\n\n問題：${ragQuestion}\n\n參考資料：\n${contextBlocks}\n\n輸出要求：\n1. 使用繁體中文回答。\n2. 先給結論，再補充說明。\n3. 至少在文末用「引用來源：[編號]」標示你主要依據的資料。\n4. 若參考資料不足以回答，請明確說「資料不足」，並說明你還需要哪些資訊。`;

      const promptJsonMode = `你是日文學習助教。請嚴格依據「參考資料」回答問題，不要捏造未出現在參考資料中的詞彙或句子。\n\n問題：${ragQuestion}\n\n參考資料：\n${contextBlocks}\n\n請輸出 JSON，欄位需求：\n- answer: 字串，先給結論再補充說明。\n- key_points: 字串陣列，重點整理（2~5點）。\n- cited_sources: 數字陣列，僅可使用參考資料中的編號。\n- insufficiency: 字串，若資料不足請說明不足之處；若資料足夠請填空字串。`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: ragJsonMode ? promptJsonMode : promptTextMode }] }],
      };

      if (ragJsonMode) {
        if (!textModel.toLowerCase().includes('gemma')) {
          payload.generationConfig = {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                answer: { type: 'STRING' },
                key_points: { type: 'ARRAY', items: { type: 'STRING' } },
                cited_sources: { type: 'ARRAY', items: { type: 'NUMBER' } },
                insufficiency: { type: 'STRING' }
              },
              required: ['answer', 'key_points', 'cited_sources', 'insufficiency']
            }
          };
        } else {
          payload.contents[0].parts[0].text += '\n請務必只輸出純 JSON，不要包含 markdown code block。';
        }
      }

      const result = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('LLM 回傳內容為空');
      }

      if (ragJsonMode) {
        let cleaned = text.trim();
        if (textModel.toLowerCase().includes('gemma')) {
          cleaned = cleaned.replace(/```json\n?|\n?```/g, '').trim();
        }
        const parsed = JSON.parse(cleaned);
        setRagAnswerJson(parsed);
      } else {
        setRagAnswer(text.trim());
      }
      setRagSources(topMatches);
    } catch (err) {
      console.error('RAG answer failed:', err);
      showToast(`💡 RAG 回答失敗：${err.message.substring(0, 60)}...`, 4000);
    } finally {
      setIsRagAnswering(false);
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

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-indigo-700 mb-2">RAG 問答（向量檢索 + LLM）</h3>
          <p className="text-sm text-gray-500 mb-4">先從向量資料庫撈出最相關內容，再讓 AI 依據來源回答。</p>

          <form onSubmit={handleRagAsk} className="space-y-3">
            <textarea
              value={ragQuestion}
              onChange={(e) => setRagQuestion(e.target.value)}
              disabled={isRagAnswering || isExtractorLoading || isDbLoading}
              placeholder="例如：我想去英國旅行，這份題庫裡有哪些相關單字或句子？"
              rows={3}
              className="w-full p-3 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-gray-800 font-medium disabled:bg-gray-100 disabled:text-gray-400 resize-y"
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={ragJsonMode}
                onChange={(e) => setRagJsonMode(e.target.checked)}
                disabled={isRagAnswering}
                className="w-4 h-4 accent-indigo-600"
              />
              使用 JSON 回答模式（方便匯出/報表）
            </label>
            <button
              type="submit"
              disabled={!ragQuestion.trim() || isRagAnswering || isExtractorLoading || isDbLoading || quizEmbeddingsData.length === 0}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-200"
            >
              {isRagAnswering ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isRagAnswering ? 'RAG 回答中...' : '用題庫知識回答'}
            </button>
          </form>

          {(isRagAnswering || ragAnswer) && (
            <div className="mt-4 bg-indigo-50/70 border border-indigo-100 rounded-xl p-4">
              {isRagAnswering ? (
                <div className="text-indigo-600 font-medium flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> 正在檢索與生成答案...
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-indigo-800 mb-2">RAG 回答</h4>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ragAnswer}</p>
                </>
              )}
            </div>
          )}

          {(isRagAnswering || ragAnswerJson) && (
            <div className="mt-4 bg-violet-50/80 border border-violet-100 rounded-xl p-4">
              {isRagAnswering ? (
                <div className="text-violet-600 font-medium flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} /> 正在生成 JSON 結構化答案...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="font-bold text-violet-800">RAG JSON 回答</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(ragAnswerJson, null, 2));
                        showToast('✅ 已複製 JSON 內容');
                      }}
                      className="text-xs bg-violet-100 hover:bg-violet-200 text-violet-700 px-2 py-1 rounded-md transition-colors"
                    >
                      複製 JSON
                    </button>
                  </div>
                  <pre className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words bg-white/80 border border-violet-100 rounded-lg p-3 overflow-x-auto">{JSON.stringify(ragAnswerJson, null, 2)}</pre>
                </>
              )}
            </div>
          )}

          {ragSources.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-2">檢索來源</h4>
              <div className="space-y-2">
                {ragSources.map((item, idx) => (
                  <div key={`rag-source-${idx}`} className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-gray-800">[{idx + 1}] {Array.isArray(item.ja) ? item.ja.join(', ') : item.ja}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-mono">{(item.score * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.zh}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => playAudio(item.ja[0])} disabled={isTtsLoading} className="text-gray-500 hover:text-emerald-600 p-1.5 bg-gray-200 hover:bg-emerald-100 rounded-full transition-colors" title="發音">
                        <Volume2 size={14} />
                      </button>
                      <span className="text-xs text-gray-500">類型: {item.type || 'unknown'} / 章節: {item.chapter || 'unknown'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
