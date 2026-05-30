import React, { useState, useEffect, useRef } from 'react';
import { Settings2, CheckCircle2, XCircle, Eye, EyeOff, RotateCcw, ChevronRight, Sparkles, Volume2, Loader2, Home, Play, BookOpen, Settings, X, RefreshCw, LogOut, Maximize, Minimize } from 'lucide-react';
import { KANJI_DICT, KANJI_KEYS, KANJI_REGEX, QUIZ_DATA, CHAPTERS, PRACTICE_TYPES } from './data.js';

// API key will be managed via state and localStorage in App component

const getHiraganaVersion = (text) => {
  if (!text) return '';
  const parts = text.split(KANJI_REGEX);
  return parts.map(part => KANJI_DICT[part] || part).join('');
};

const renderWithFurigana = (text, isHint = false) => {
  if (!text) return null;
  const parts = text.split(KANJI_REGEX);
  return parts.map((part, i) => {
    if (KANJI_DICT[part]) {
      return (
        <ruby key={i} className="mx-0.5 leading-none">
          {part}
          <rt className={`text-[0.6em] select-none ${isHint ? 'text-emerald-400/90' : 'text-red-400/80'}`}>{KANJI_DICT[part]}</rt>
        </ruby>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const fetchWithRetry = async (url, options, retries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delays[i]));
    }
  }
};

function createWavFromPcmBase64(base64Str, sampleRate = 24000) {
  const binaryStr = atob(base64Str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const pcmData = new Int16Array(bytes.buffer);
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);
  const writeString = (view, offset, string) => { for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i)); };
  writeString(view, 0, 'RIFF'); view.setUint32(4, 36 + pcmData.length * 2, true); writeString(view, 8, 'WAVE'); writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length * 2, true);
  for (let i = 0; i < pcmData.length; i++) view.setInt16(44 + i * 2, pcmData[i], true);
  return new Blob([view], { type: 'audio/wav' });
}

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particlesArray = [];
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let mouse = { x: null, y: null, radius: 150 };
    const handleMouseMove = (event) => { mouse.x = event.x; mouse.y = event.y; };
    const handleMouseOut = () => { mouse.x = undefined; mouse.y = undefined; };
    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); };
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseout', handleMouseOut); window.addEventListener('resize', handleResize);
    class Particle {
      constructor(x, y, directionX, directionY, size, color) { this.x = x; this.y = y; this.directionX = directionX; this.directionY = directionY; this.size = size; this.color = color; }
      draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); }
      update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        if (mouse.x !== undefined && mouse.y !== undefined) {
          let dx = mouse.x - this.x; let dy = mouse.y - this.y; let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) { const forceDirectionX = dx / distance; const forceDirectionY = dy / distance; const force = (mouse.radius - distance) / mouse.radius; this.x -= forceDirectionX * force * 5; this.y -= forceDirectionY * force * 5; }
        }
        this.x += this.directionX; this.y += this.directionY; this.draw();
      }
    }
    function init() {
      particlesArray = []; let numberOfParticles = (canvas.height * canvas.width) / 10000;
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1; let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2); let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 1.5) - 0.75; let directionY = (Math.random() * 1.5) - 0.75; let color = '#ffffff';
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }
    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
          if (distance < 12000) { let opacityValue = 1 - (distance / 12000); ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(particlesArray[a].x, particlesArray[a].y); ctx.lineTo(particlesArray[b].x, particlesArray[b].y); ctx.stroke(); }
        }
      }
    }
    function animate() { animationFrameId = requestAnimationFrame(animate); ctx.clearRect(0, 0, innerWidth, innerHeight); for (let i = 0; i < particlesArray.length; i++) particlesArray[i].update(); connect(); }
    init(); animate();
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseout', handleMouseOut); window.removeEventListener('resize', handleResize); cancelAnimationFrame(animationFrameId); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function App() {
  const [screen, setScreen] = useState('home'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);
  
  const [appSettings, setAppSettings] = useState({
    fontSize: 24, 
    textColor: '#f8fafc', 
    bgColor: '#0f172a'    
  });

  const [quizConfig, setQuizConfig] = useState({
    chapter: 'all',
    type: 'all',
    count: 10
  });

  const [showAiModal, setShowAiModal] = useState(false);
  const [themeInput, setThemeInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [currentCustomQuiz, setCurrentCustomQuiz] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState('typing'); 
  
  const [score, setScore] = useState(0);
  const [wrongItems, setWrongItems] = useState([]); 
  
  const [aiData, setAiData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const inputRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenEnabled) {
      setToastMsg("💡 目前環境不支援全螢幕功能，請於正式網站中使用。");
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        setToastMsg("💡 預覽環境受限無法全螢幕，部署為正式網站後即可使用！");
        setTimeout(() => setToastMsg(''), 4000);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(()=>{});
      }
    }
  };

  const generateQuestions = (config) => {
    let pool = QUIZ_DATA;
    if (config.chapter !== 'all') pool = pool.filter(q => q.chapter === config.chapter);
    if (config.type !== 'all') pool = pool.filter(q => q.type === config.type);

    if (pool.length === 0) {
      alert("此設定組合下沒有題目，將為您切換為全範圍。");
      pool = QUIZ_DATA;
    }

    let shuffledPool = shuffleArray(pool);
    let selectedQuestions = [];

    for (let i = 0; i < config.count; i++) {
      if (i < shuffledPool.length) {
        selectedQuestions.push(shuffledPool[i]);
      } else {
        selectedQuestions.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    return selectedQuestions;
  };

  const startQuiz = (config = quizConfig, isReview = false, customQuestions = null) => {
    let newQuestions = [];
    if (customQuestions) {
      newQuestions = customQuestions;
      setCurrentCustomQuiz(customQuestions);
    } else if (isReview) {
      newQuestions = shuffleArray(wrongItems);
    } else {
      newQuestions = generateQuestions(config);
      setCurrentCustomQuiz(null);
    }
    
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setUserInput('');
    setScore(0);
    setWrongItems(isReview ? [] : []); 
    setStatus('typing');
    setAiData(null);
    setShowHint(false);
    setScreen('quiz');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const currentQuestion = questions[currentIndex];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      checkAnswer();
    }
  };

  const checkAnswer = () => {
    if (!currentQuestion || status !== 'typing') return;
    
    const trimmedInput = userInput.trim().replace(/\s+/g, '');
    const normalizeStr = (str) => str.replace(/[\s　。、？！?!]/g, '');
    
    const expandedAnswers = new Set();
    currentQuestion.ja.forEach(ans => {
      expandedAnswers.add(normalizeStr(ans));
      const hira = getHiraganaVersion(ans);
      expandedAnswers.add(normalizeStr(hira));
    });

    const isCorrect = Array.from(expandedAnswers).some(
      ans => ans === normalizeStr(trimmedInput)
    );

    if (isCorrect) {
      setStatus('correct');
      setScore(s => s + 1);
      setTimeout(() => nextQuestion(), 800);
    } else {
      setStatus('incorrect');
      if (!wrongItems.find(item => item.id === currentQuestion.id)) {
        setWrongItems(prev => [...prev, currentQuestion]);
      }
      setTimeout(() => {
        setStatus('typing');
        inputRef.current?.focus();
      }, 1000);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setUserInput('');
      setStatus('typing');
      setAiData(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setScreen('result');
    }
  };

  const playAudio = async (text) => {
    if (!apiKey) {
      setToastMsg("💡 請先至設定(右上角齒輪)輸入您的 Gemini API Key");
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    setIsTtsLoading(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `Say in a clear, natural Japanese accent: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
      };
      const result = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const base64Data = result?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Data) {
        const blob = createWavFromPcmBase64(base64Data, 24000);
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (e) { console.error("TTS Failed:", e); } finally { setIsTtsLoading(false); }
  };

  const fetchAIInsights = async () => {
    if (!currentQuestion || aiData || isAiLoading) return;
    if (!apiKey) {
      setToastMsg("💡 請先至設定(右上角齒輪)輸入您的 Gemini API Key");
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    setIsAiLoading(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const prompt = `你是一個專業的日文老師。請針對這個日文內容：'${currentQuestion.ja[0]}' (${currentQuestion.zh})，提供：1. 簡短的語感、用法解析或背誦提示（50字以內）。2. 兩個實用的生活例句。`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              explanation: { type: "STRING" },
              examples: { type: "ARRAY", items: { type: "OBJECT", properties: { ja: { type: "STRING" }, kana: { type: "STRING" }, zh: { type: "STRING" } } } }
            }
          }
        }
      };
      const result = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) setAiData(JSON.parse(text));
    } catch (e) { console.error("AI Failed:", e); } finally { setIsAiLoading(false); }
  };

  const handleGenerateAiQuiz = async () => {
    if (!themeInput.trim()) return;
    if (!apiKey) {
      setToastMsg("💡 請先至設定(右上角齒輪)輸入您的 Gemini API Key");
      setTimeout(() => setToastMsg(''), 4000);
      return;
    }
    setIsAiGenerating(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: `你是一位專業的日語教師。請為學生產生一組關於情境：「${themeInput}」的日文打字測驗，共 8 題。程度適合 N5~N4 初學者，混合單字與實用短句。` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "NUMBER", description: "隨機不重複的數字 ID" },
                chapter: { type: "STRING", description: "固定填入 'AI'" },
                type: { type: "STRING", description: "填入 'vocab' 或 'sentence'" },
                zh: { type: "STRING", description: "繁體中文題目(翻譯)" },
                ja: { type: "ARRAY", items: { type: "STRING" }, description: "日文答案陣列，必須包含漢字寫法與純平假名寫法" }
              },
              required: ["id", "chapter", "type", "zh", "ja"]
            }
          }
        }
      };
      const result = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const aiQuestions = JSON.parse(text);
        startQuiz(null, false, aiQuestions);
        setShowAiModal(false);
        setThemeInput('');
      }
    } catch (e) {
      console.error("AI Quiz Gen Failed:", e);
      setToastMsg("💡 題庫生成失敗，請稍後再試。");
      setTimeout(() => setToastMsg(''), 3000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const renderSettingsModal = () => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative" style={{ color: '#1f2937' }}>
        <button onClick={() => setIsSettingsOpen(false)} className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20} /> 介面設定</h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
              <span>Gemini API Key</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline text-xs">取得金鑰</a>
            </label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" 
              placeholder="輸入您的 API Key..." 
            />
            <p className="text-xs text-gray-400 mt-2">*金鑰僅保存在您的本機瀏覽器，不會上傳至任何伺服器。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">字體大小 ({appSettings.fontSize}px)</label>
            <input type="range" min="16" max="48" step="2" value={appSettings.fontSize} onChange={(e) => setAppSettings(s => ({ ...s, fontSize: Number(e.target.value) }))} className="w-full accent-emerald-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">文字顏色 (色碼)</label>
            <div className="flex items-center gap-3">
              <input type="color" value={appSettings.textColor} onChange={(e) => setAppSettings(s => ({ ...s, textColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
              <input type="text" value={appSettings.textColor} onChange={(e) => setAppSettings(s => ({ ...s, textColor: e.target.value }))} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" placeholder="#1f2937" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">背景顏色 (色碼)</label>
            <div className="flex items-center gap-3">
              <input type="color" value={appSettings.bgColor} onChange={(e) => setAppSettings(s => ({ ...s, bgColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
              <input type="text" value={appSettings.bgColor} onChange={(e) => setAppSettings(s => ({ ...s, bgColor: e.target.value }))} className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm" placeholder="#f5f5f4" />
            </div>
            <p className="text-xs text-gray-400 mt-2">*建議使用深色背景，才能看清楚動態白色線條特效喔！</p>
          </div>
        </div>
        <button onClick={() => setIsSettingsOpen(false)} className="mt-6 w-full bg-gray-900 text-white py-2 rounded-xl font-medium hover:bg-gray-800">完成</button>
      </div>
    </div>
  );

  return (
    <div 
      className="min-h-screen font-sans transition-colors duration-300 flex flex-col items-center py-8 px-4 relative z-10"
      style={{ backgroundColor: appSettings.bgColor, color: appSettings.textColor }}
    >
      <ParticleBackground />

      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-[100] animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          {toastMsg}
        </div>
      )}

      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95" style={{ color: '#1f2937' }}>
            <h3 className="text-xl font-bold mb-2">確定要退出嗎？</h3>
            <p className="text-gray-500 mb-6">目前的測驗進度將不會被保留。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">繼續測驗</button>
              <button onClick={() => { setShowQuitConfirm(false); setScreen('home'); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-200">確定退出</button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={toggleFullScreen}
        className="fixed left-6 top-6 z-50 p-2 rounded-full hover:bg-white/20 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
        title={isFullscreen ? "退出全螢幕" : "進入全螢幕"}
      >
        {isFullscreen ? <Minimize size={26} /> : <Maximize size={26} />}
      </button>

      {isSettingsOpen && renderSettingsModal()}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95" style={{ color: '#1f2937' }}>
            <button onClick={() => setShowAiModal(false)} className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors" disabled={isAiGenerating}>
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-purple-700">
              <Sparkles size={22} className="text-purple-500"/> AI 情境擴充出題
            </h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">想練習什麼特別的情境？輸入關鍵字，AI 老師馬上為你量身打造專屬打字題庫！</p>
            <input type="text" value={themeInput} onChange={(e) => setThemeInput(e.target.value)} disabled={isAiGenerating} placeholder="例如：居酒屋點餐、動漫必殺技..." className="w-full p-3 border-2 border-purple-100 rounded-xl outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 mb-5 transition-all text-gray-800 font-medium" />
            <button onClick={handleGenerateAiQuiz} disabled={!themeInput.trim() || isAiGenerating} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3.5 rounded-xl font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2 disabled:opacity-60 shadow-lg shadow-purple-200">
              {isAiGenerating ? <><Loader2 className="animate-spin" size={18}/> 題庫生成中...</> : <><Sparkles size={18}/> 開始生成並測驗</>}
            </button>
          </div>
        </div>
      )}

      {screen === 'home' && (
        <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in-95 duration-500 relative z-10 gap-12 py-10">
          <div className="bg-white/10 backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl text-center relative overflow-hidden">
            <button onClick={() => setIsSettingsOpen(true)} className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/20 transition-colors"><Settings size={24} /></button>
            <div className="w-20 h-20 bg-emerald-400 text-white rounded-2xl mx-auto flex items-center justify-center mb-6 rotate-3 shadow-lg"><BookOpen size={40} /></div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 tracking-tight">日語打字練習系統</h1>
            <p className="font-medium mb-10 text-lg opacity-80">專屬伊布的日語筆記特訓，從單字到句型完全制霸</p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button onClick={() => setScreen('config')} className="group flex flex-col items-center p-6 bg-white/95 border-2 border-emerald-100 hover:border-emerald-400 rounded-2xl transition-all hover:-translate-y-1 text-gray-800">
                <Play className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" size={32} />
                <h3 className="text-xl font-bold text-emerald-800 mb-1">開始自訂測驗</h3>
                <p className="text-emerald-600/80 text-sm">選擇章節、題型與題數</p>
              </button>
              <button onClick={() => setShowAiModal(true)} className="group flex flex-col items-center p-6 bg-white/95 border-2 border-purple-100 hover:border-purple-400 rounded-2xl transition-all hover:-translate-y-1 relative overflow-hidden text-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-50 pointer-events-none"></div>
                <Sparkles className="text-purple-500 mb-3 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 relative z-10" size={32} />
                <h3 className="text-xl font-bold text-purple-800 mb-1 relative z-10">✨ AI 智能情境特訓</h3>
                <p className="text-purple-600/80 text-sm relative z-10">自訂情境，AI 即時為你擴充出題</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'config' && (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 relative z-10" style={{ color: '#1f2937' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Settings2 className="text-emerald-500"/> 測驗設定</h2>
            <button onClick={() => setScreen('home')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
          </div>
          <div className="space-y-6 text-left">
            <div>
              <label className="block font-semibold mb-2">選擇章節</label>
              <select value={quizConfig.chapter} onChange={e => setQuizConfig({...quizConfig, chapter: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none">
                {CHAPTERS.map(ch => <option key={ch.id} value={ch.id} disabled={ch.id === 'divider'}>{ch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2">題型偏好</label>
              <select value={quizConfig.type} onChange={e => setQuizConfig({...quizConfig, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none">
                {PRACTICE_TYPES.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-2 flex justify-between">
                <span>測驗題數</span>
                <span className="text-emerald-600 font-bold">{quizConfig.count} 題</span>
              </label>
              <input type="range" min="5" max="30" step="1" value={quizConfig.count} onChange={e => setQuizConfig({...quizConfig, count: Number(e.target.value)})} className="w-full accent-emerald-500" />
              <p className="text-xs text-gray-400 mt-2">*若選取題數大於庫存數量，題目將會在保證跑完一輪後隨機重複。</p>
            </div>
            <button onClick={() => startQuiz(quizConfig)} className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg flex justify-center items-center gap-2 shadow-lg shadow-emerald-200 transition-transform active:scale-95">
              <Play fill="currentColor" size={20}/> 進入測驗
            </button>
          </div>
        </div>
      )}

      {screen === 'quiz' && currentQuestion && (
        <div className="w-full max-w-2xl w-full flex flex-col gap-4 animate-in fade-in relative z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm p-4 flex justify-between items-center border border-white/20" style={{ color: '#1f2937' }}>
            <button onClick={() => setShowQuitConfirm(true)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"><LogOut size={16} /> 退出測驗</button>
            <div className="font-bold bg-gray-100 px-4 py-1.5 rounded-full text-sm tracking-widest flex items-center gap-2">
              {currentQuestion.chapter === 'AI' && <Sparkles size={14} className="text-purple-500"/>}
              {currentIndex + 1} / {questions.length}
            </div>
            <button onClick={() => setShowHint(!showHint)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${showHint ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {showHint ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20" style={{ color: '#1f2937' }}>
            <div className="h-1.5 bg-gray-200 w-full">
              <div className={`h-full transition-all duration-300 ease-out ${currentQuestion.chapter === 'AI' ? 'bg-purple-400' : 'bg-emerald-400'}`} style={{ width: `${(currentIndex / questions.length) * 100}%` }} />
            </div>
            <div className="p-6 sm:p-10">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 mb-4">
                  {currentQuestion.chapter === 'AI' ? '✨ AI 專屬客製' : currentQuestion.type === 'vocab' ? '📝 單字' : currentQuestion.type === 'katakana' ? '🇺🇸 外來語' : currentQuestion.type === 'grammar' ? '📖 文法' : '💬 句型'}
                </span>
                <h2 className="font-bold mb-4 tracking-wide" style={{ fontSize: `${appSettings.fontSize}px` }}>{currentQuestion.zh}</h2>
                <div className={`transition-all duration-300 overflow-hidden ${showHint ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className={`text-lg inline-block px-6 py-2 rounded-xl border ${currentQuestion.chapter === 'AI' ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                      {renderWithFurigana(currentQuestion.ja[0], true)}
                      {currentQuestion.ja.length > 1 && <span className={`text-sm ml-2 ${currentQuestion.chapter === 'AI' ? 'text-purple-400' : 'text-emerald-400'}`}>({renderWithFurigana(currentQuestion.ja[1], true)})</span>}
                    </div>
                    <button onClick={() => playAudio(currentQuestion.ja[0])} disabled={isTtsLoading} className={`p-2 rounded-full transition-colors disabled:opacity-50 ${currentQuestion.chapter === 'AI' ? 'hover:bg-purple-50 text-purple-600' : 'hover:bg-emerald-50 text-emerald-600'}`} title="語音朗讀">
                      {isTtsLoading ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative max-w-md mx-auto">
                <input ref={inputRef} type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown} disabled={status === 'correct'} placeholder="輸入日文 (假名/漢字)..." className={`w-full text-center text-xl sm:text-2xl p-4 rounded-xl border-2 outline-none transition-all text-gray-800 ${status === 'typing' && currentQuestion.chapter === 'AI' ? 'border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 bg-white' : ''} ${status === 'typing' && currentQuestion.chapter !== 'AI' ? 'border-gray-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 bg-white' : ''} ${status === 'correct' ? 'border-green-400 bg-green-50 text-green-700' : ''} ${status === 'incorrect' ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : ''}`} />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {status === 'correct' && <CheckCircle2 className="text-green-500" size={28} />}
                  {status === 'incorrect' && <XCircle className="text-red-500" size={28} />}
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-gray-100 max-w-md mx-auto">
                {!aiData && !isAiLoading && (
                  <button onClick={fetchAIInsights} className="w-full py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-700 font-medium hover:bg-emerald-100 transition-colors flex justify-center items-center gap-2"><Sparkles size={18} /> 呼叫 AI 老師：語感解析與例句</button>
                )}
                {isAiLoading && (
                  <div className="w-full py-4 text-center text-emerald-500 flex justify-center items-center gap-2"><Loader2 className="animate-spin" size={20} /> AI 老師撰寫中...</div>
                )}
                {aiData && (
                  <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm text-left text-gray-800">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-2 mb-2"><Sparkles size={18} className="text-emerald-500"/> AI 老師解析</h4>
                    <p className="text-sm mb-4 leading-relaxed">{aiData.explanation}</p>
                    <div className="space-y-3">
                      {aiData.examples.map((ex, i) => (
                        <div key={i} className="bg-stone-50 rounded-lg p-3 text-sm relative group">
                          <div className="pr-8">
                            <p className="font-medium">{ex.ja}</p><p className="text-emerald-600 text-xs mt-0.5">{ex.kana}</p><p className="text-gray-500 mt-1">{ex.zh}</p>
                          </div>
                          <button onClick={() => playAudio(ex.ja)} disabled={isTtsLoading} className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-stone-200 text-emerald-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">{isTtsLoading ? <Loader2 className="animate-spin" size={16} /> : <Volume2 size={16} />}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'result' && (
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 animate-in fade-in slide-in-from-bottom-4 relative z-10" style={{ color: '#1f2937' }}>
          <div className={`p-8 sm:p-12 text-center text-white ${currentCustomQuiz ? 'bg-purple-600' : 'bg-emerald-500'}`}>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"><CheckCircle2 size={48} className="text-white" /></div>
            <h2 className="text-3xl font-bold mb-2">測驗完成！</h2>
            <div className="text-5xl font-black mt-6 tracking-tighter">{score} <span className={`text-2xl ${currentCustomQuiz ? 'text-purple-200' : 'text-emerald-200'}`}>/ {questions.length}</span></div>
            <p className={`mt-2 font-medium ${currentCustomQuiz ? 'text-purple-100' : 'text-emerald-100'}`}>總體正確率: {Math.round((score / questions.length) * 100)}%</p>
          </div>
          <div className="p-6 sm:p-8">
            {wrongItems.length > 0 ? (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2"><BookOpen size={20}/> 錯題回顧 ({wrongItems.length} 題)</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {wrongItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-xl">
                      <span className="font-medium">{item.zh}</span><span className="text-red-600 font-bold">{renderWithFurigana(item.ja[0], false)}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => startQuiz(null, true)} className="w-full mt-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-colors">開始錯題訂正測驗</button>
              </div>
            ) : (
              <div className={`py-8 text-center font-bold text-lg ${currentCustomQuiz ? 'text-purple-600' : 'text-emerald-600'}`}>🎉 太厲害了！全對完美通關！</div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <button onClick={() => setScreen('home')} className="py-3 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"><Home size={18}/> 回到首頁</button>
              <button onClick={() => startQuiz(quizConfig, false, currentCustomQuiz)} className={`py-3 flex items-center justify-center gap-2 text-white font-bold rounded-xl transition-colors shadow-lg ${currentCustomQuiz ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}><RotateCcw size={18}/> 相同設定再測</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}