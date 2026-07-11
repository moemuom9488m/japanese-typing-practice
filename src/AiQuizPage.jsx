import React, { useState } from 'react';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2.js';
import Home from 'lucide-react/dist/esm/icons/home.js';

export default function AiQuizPage({ isAiGenerating, onGenerate, onBack }) {
  const [themeInput, setThemeInput] = useState('');

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium group">
        <Home size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回首頁
      </button>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8 sm:p-12" style={{ color: '#1f2937' }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-800 mb-2">✨ AI 智能情境特訓</h2>
          <p className="text-gray-500 leading-relaxed max-w-md mx-auto">
            想練習什麼特別的情境？輸入關鍵字，AI 老師馬上為你量身打造專屬打字題庫！
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">情境主題</label>
            <input
              type="text"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              disabled={isAiGenerating}
              placeholder="例如：居酒屋點餐、動漫必殺技、旅行問路..."
              className="w-full p-4 border-2 border-purple-100 rounded-xl outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 transition-all text-gray-800 font-medium text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && themeInput.trim() && !isAiGenerating) {
                  onGenerate(themeInput);
                }
              }}
            />
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <p className="text-sm text-purple-700 leading-relaxed">
              <span className="font-bold">💡 小提示：</span>越具體的情境描述，AI 生成的題目越實用！例如：「便利商店買東西」比「買東西」更能產出貼近真實生活的練習題。
            </p>
          </div>

          <button
            onClick={() => onGenerate(themeInput)}
            disabled={!themeInput.trim() || isAiGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-60 shadow-lg shadow-purple-200 active:scale-[0.98]"
          >
            {isAiGenerating ? (
              <><Loader2 className="animate-spin" size={20} /> 題庫生成中...</>
            ) : (
              <><Sparkles size={20} /> 開始生成並測驗</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
