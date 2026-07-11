import React, { useState } from 'react';
import BookText from 'lucide-react/dist/esm/icons/book-text.js';
import Search from 'lucide-react/dist/esm/icons/search.js';
import Volume2 from 'lucide-react/dist/esm/icons/volume-2.js';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.js';
import Home from 'lucide-react/dist/esm/icons/home.js';
import { getHiraganaVersion } from './utils.js';

export default function VerbDictPage({ verbTableData, playAudio, isTtsLoading, onBack }) {
  const [verbSearchQuery, setVerbSearchQuery] = useState('');

  const filteredVerbs = verbTableData.filter(v =>
    v.baseJa.includes(verbSearchQuery) ||
    v.zh.includes(verbSearchQuery) ||
    getHiraganaVersion(v.baseJa).includes(verbSearchQuery)
  );

  return (
    <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-medium group">
        <Home size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回首頁
      </button>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8" style={{ color: '#1f2937' }}>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-rose-700">
          <BookText size={24} className="text-rose-500" /> 動詞變化字典
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">搜尋日文或中文，快速查閱各種動詞型態。點擊發音按鈕即可聆聽。</p>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={verbSearchQuery}
              onChange={(e) => setVerbSearchQuery(e.target.value)}
              placeholder="輸入關鍵字搜尋... (例如: 寝る, 睡覺)"
              className="w-full pl-10 p-3 border-2 border-rose-100 rounded-xl outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all text-gray-800 font-medium"
            />
          </div>
        </div>

        <div className="overflow-auto custom-scrollbar rounded-xl border border-gray-200 max-h-[50vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">中文意思</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">原形</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">ます形</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">て形</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">た形</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">ない形</th>
                <th className="p-3 border-b border-gray-200 font-semibold text-gray-600">其他</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVerbs.length > 0 ? filteredVerbs.map((verb, idx) => (
                <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                  <td className="p-3 font-medium text-gray-800">{verb.zh}</td>
                  {[
                    { key: '原形', val: verb.forms['原形'] },
                    { key: 'ます形', val: verb.forms['ます形'] },
                    { key: 'て形', val: verb.forms['て形'] },
                    { key: 'た形', val: verb.forms['た形'] },
                    { key: 'ない形', val: verb.forms['ない形'] }
                  ].map(f => (
                    <td key={f.key} className="p-3">
                      {f.val && (
                        <div className="flex items-center gap-1 group">
                          <span>{f.val}</span>
                          <button onClick={() => playAudio(f.val)} disabled={isTtsLoading} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-emerald-600 transition-opacity">
                            <Volume2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-sm text-gray-500">
                    {['意向形', 'ば形', '命令形'].map(key => verb.forms[key] ? `${verb.forms[key]}` : null).filter(Boolean).join(', ')}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">找不到符合的動詞</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 日語動詞活用形說明 */}
        <div className="mt-8 bg-rose-50 border border-rose-200 rounded-xl p-6 text-sm text-gray-700">
          <h4 className="text-rose-800 font-bold text-lg mb-2">📖 日語動詞活用形說明</h4>
          <p className="mb-4 leading-relaxed">
            「未然、連用、終止、連體、假定、命令」是日語文法中動詞、形容詞的活用形（變化型態），用來連接不同的助詞、助動詞或結尾。透過這些變化，詞彙能表達否定、過去、假設等語意。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-rose-100/50">
                <tr>
                  <th className="p-3 border-b border-rose-100 font-semibold whitespace-nowrap">變化形式</th>
                  <th className="p-3 border-b border-rose-100 font-semibold min-w-[200px]">主要功能與意義</th>
                  <th className="p-3 border-b border-rose-100 font-semibold">常見接續的平假名</th>
                  <th className="p-3 border-b border-rose-100 font-semibold whitespace-nowrap">實例 (以「書く」為例)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">未然形</td>
                  <td className="p-3">尚未發生。用於否定、意志、被動、使役。</td>
                  <td className="p-3 font-mono text-emerald-600">ない、う、せる、られる</td>
                  <td className="p-3">書かない、書こう</td>
                </tr>
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">連用形</td>
                  <td className="p-3">連接其他用言或助詞。用於過去式、肯定中止。</td>
                  <td className="p-3 font-mono text-emerald-600">ます、て、た</td>
                  <td className="p-3">書きます、書いて</td>
                </tr>
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">終止形</td>
                  <td className="p-3">結束句子。為字典中的基本型態（辭書形）。</td>
                  <td className="p-3 font-mono text-emerald-600">句尾、終助詞</td>
                  <td className="p-3">書く</td>
                </tr>
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">連體形</td>
                  <td className="p-3">連接「體言」（名詞），用來修飾名詞。</td>
                  <td className="p-3 font-mono text-emerald-600">とき、もの、こと</td>
                  <td className="p-3">書くとき</td>
                </tr>
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">假定形</td>
                  <td className="p-3">表示條件或假設（如果～的話）。</td>
                  <td className="p-3 font-mono text-emerald-600">ば</td>
                  <td className="p-3">書けば</td>
                </tr>
                <tr className="hover:bg-rose-50/50">
                  <td className="p-3 font-bold text-rose-700">命令形</td>
                  <td className="p-3">直接下達命令（快點～）。</td>
                  <td className="p-3 font-mono text-emerald-600">句尾</td>
                  <td className="p-3">書け</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 核心詞性與活用類別 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6 text-sm text-gray-700">
          <h4 className="text-blue-800 font-bold text-lg mb-2">💡 核心詞性與活用類別 (カ變、サ變、形容詞、名詞)</h4>
          <p className="mb-4 leading-relaxed">
            除了常見的動詞（五段、上一段、下一段）外，日語中還有以下幾種核心的詞性與活用類別，它們在接續六大活用形時有著不同的變化規則：
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <span className="font-bold text-blue-700 block mb-1">1. 不規則動詞</span>
              <ul className="list-disc list-inside text-xs space-y-1 text-gray-600">
                <li><span className="font-semibold text-gray-800">カ變動詞</span>：全日語只有「来る（くる）」一個詞。</li>
                <li><span className="font-semibold text-gray-800">サ變動詞</span>：以「する」結尾的動詞（如：勉強する）。</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <span className="font-bold text-blue-700 block mb-1">2. 形容詞</span>
              <ul className="list-disc list-inside text-xs space-y-1 text-gray-600">
                <li><span className="font-semibold text-gray-800">い形容詞</span>：語尾為「い」（如：高い）。</li>
                <li><span className="font-semibold text-gray-800">な形容詞</span>：修飾名詞時加「な」，語尾常接「だ/です」（如：綺麗な）。</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
              <span className="font-bold text-blue-700 block mb-1">3. 名詞</span>
              <ul className="list-disc list-inside text-xs space-y-1 text-gray-600">
                <li>名詞本身不變化，但接續助動詞（如 だ）時的變化與「な形容詞」高度相似。</li>
              </ul>
            </div>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left border-collapse bg-white rounded-lg overflow-hidden shadow-sm text-xs">
              <thead className="bg-blue-100/50">
                <tr>
                  <th className="p-3 border-b border-blue-100 font-semibold whitespace-nowrap">活用形</th>
                  <th className="p-3 border-b border-blue-100 font-semibold text-emerald-700">カ變 (来る)</th>
                  <th className="p-3 border-b border-blue-100 font-semibold text-indigo-700">サ變 (する)</th>
                  <th className="p-3 border-b border-blue-100 font-semibold text-orange-700">い形容詞 (高い)</th>
                  <th className="p-3 border-b border-blue-100 font-semibold text-purple-700">な形容詞 (綺麗)</th>
                  <th className="p-3 border-b border-blue-100 font-semibold text-rose-700">名詞 (學生)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">未然形</td>
                  <td className="p-3">こ(ない)<br/>こよ(う)</td>
                  <td className="p-3">し(ない) / さ(れる)<br/>せ(ず)</td>
                  <td className="p-3">高かろ(う)</td>
                  <td className="p-3">綺麗だろ(う)</td>
                  <td className="p-3">學生だろ(う)</td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">連用形</td>
                  <td className="p-3">き(ます)<br/>き(て / た)</td>
                  <td className="p-3">し(ます)<br/>し(て / た)</td>
                  <td className="p-3">高く(なる)<br/>高かっ(た)</td>
                  <td className="p-3">綺麗で / 綺麗に<br/>綺麗だっ(た)</td>
                  <td className="p-3">學生で / 學生に<br/>學生だっ(た)</td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">終止形</td>
                  <td className="p-3">くる</td>
                  <td className="p-3">する</td>
                  <td className="p-3">高い</td>
                  <td className="p-3">綺麗だ</td>
                  <td className="p-3">學生だ</td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">連體形</td>
                  <td className="p-3">くる(とき)</td>
                  <td className="p-3">する(とき)</td>
                  <td className="p-3">高い(本)</td>
                  <td className="p-3">綺麗な(人)</td>
                  <td className="p-3">學生の(本)<br/>學生な(ので)</td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">假定形</td>
                  <td className="p-3">くれ(ば)</td>
                  <td className="p-3">すれ(ば)</td>
                  <td className="p-3">高けれ(ば)</td>
                  <td className="p-3">綺麗なら(ば)</td>
                  <td className="p-3">學生なら(ば)</td>
                </tr>
                <tr className="hover:bg-blue-50/50">
                  <td className="p-3 font-bold text-blue-700">命令形</td>
                  <td className="p-3">こい</td>
                  <td className="p-3">しろ / せよ</td>
                  <td className="p-3 text-gray-400 italic">(無)</td>
                  <td className="p-3 text-gray-400 italic">(無)</td>
                  <td className="p-3 text-gray-400 italic">(無)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4 text-xs text-yellow-800">
            <span className="font-bold flex items-center gap-1 mb-1"><Sparkles size={14} /> 關鍵學習痛點提示：</span>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li><strong>カ變（来る）的讀音</strong>：未然讀 ko，連用讀 ki，終止/連體讀 kuru，假定讀 kure，命令讀 koi。漢字雖同為「來」，但平假名讀音完全不同，極易混淆。</li>
              <li><strong>な形容詞與名詞的連體形差異</strong>：修飾名詞時，な形容詞用「な」（綺麗な花）；名詞則用「の」（學生の本）。</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
