
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ParticleEngine } from './components/ParticleSystem';
import HandDetector from './components/HandDetector';
import { ParticleTheme, ThemeStyle, GestureState, AudioData } from './types';
import { THEMES, DEFAULT_THEME } from './constants';
import { getAITheme } from './services/geminiService';
import { Sparkles, Wind, MousePointer2, Waves, Zap, Leaf, BrainCircuit, Search, HelpCircle, X, Mic, MicOff, Music } from 'lucide-react';

const App: React.FC = () => {
  const [theme, setTheme] = useState<ParticleTheme>(DEFAULT_THEME);
  const [gestureState, setGestureState] = useState<GestureState>({ isDetected: false, points: [] });
  const [audioData, setAudioData] = useState<AudioData>({ volume: 0, bass: 0, mid: 0, treble: 0 });
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const initAudio = async () => {
    try {
      if (isAudioEnabled) {
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        setIsAudioEnabled(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      setIsAudioEnabled(true);
    } catch (err) {
      console.error("Audio initialization failed:", err);
    }
  };

  const updateAudioData = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Process bands
    let bass = 0, mid = 0, treble = 0, total = 0;
    const len = dataArray.length;
    
    for (let i = 0; i < len; i++) {
      const val = dataArray[i] / 255.0;
      total += val;
      if (i < len * 0.2) bass += val;
      else if (i < len * 0.6) mid += val;
      else treble += val;
    }
    
    setAudioData({
      volume: total / len,
      bass: bass / (len * 0.2),
      mid: mid / (len * 0.4),
      treble: treble / (len * 0.4)
    });
  };

  // 初始化并处理窗口缩放
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (engineRef.current) {
        engineRef.current.resize(canvas.width, canvas.height);
      } else {
        engineRef.current = new ParticleEngine(canvas.width, canvas.height, theme);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // 当主题更改时重新初始化引擎
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.init(theme);
    }
  }, [theme]);

  // 动画循环
  const animate = useCallback(() => {
    if (isAudioEnabled) updateAudioData();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && engineRef.current) {
      engineRef.current.updateAndDraw(ctx, theme, gestureState.points, audioData);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [theme, gestureState, audioData, isAudioEnabled]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const handleAiTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsProcessingAI(true);
    const aiConfig = await getAITheme(aiPrompt);
    if (Object.keys(aiConfig).length > 0) {
      setTheme({ ...theme, ...aiConfig, name: `AI意境: ${aiPrompt}` });
    }
    setIsProcessingAI(false);
    setAiPrompt('');
  };

  const themeIcons: Record<string, React.ReactNode> = {
    [ThemeStyle.COSMIC]: <Sparkles className="w-5 h-5" />,
    [ThemeStyle.FIRE]: <Zap className="w-5 h-5" />,
    [ThemeStyle.OCEAN]: <Waves className="w-5 h-5" />,
    [ThemeStyle.NEON]: <Wind className="w-5 h-5" />,
    [ThemeStyle.ZEN]: <Leaf className="w-5 h-5" />
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none text-white font-sans">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-none" />

      {/* 手势交互提示 */}
      {!gestureState.isDetected && showUI && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-indigo-400 text-3xl font-light tracking-[0.4em] mb-4 animate-pulse">
            指尖引导星辰
          </p>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">
            {isAudioEnabled ? "已开启音频感应" : "点击麦克风开启律动模式"}
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-ping delay-150" />
            <div className="w-3 h-3 rounded-full bg-pink-500 animate-ping delay-300" />
          </div>
        </div>
      )}

      {/* 帮助弹窗 */}
      {showHelp && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-indigo-500" />
              交互演练
            </h2>
            <div className="space-y-6 text-zinc-300">
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Music className="w-8 h-8 text-pink-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white">音乐共鸣</h3>
                  <p className="text-sm">开启麦克风，粒子将随节奏闪烁跳跃。低音掌控大小，高音掌控抖动。</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Sparkles className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white">高敏追踪</h3>
                  <p className="text-sm">系统精准锁定指尖，尝试快速划过屏幕，感受引力波带来的粒子爆发。</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <BrainCircuit className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-white">AI 创造力</h3>
                  <p className="text-sm">尝试输入“梦幻极光”或“深渊余烬”，Gemini 会调整所有物理参数来匹配您的想象。</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-bold transition-all shadow-lg"
            >
              进入艺术空间
            </button>
          </div>
        </div>
      )}

      {/* 主 UI 界面 */}
      {showUI && (
        <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
          {/* 顶部标题栏 */}
          <header className="flex justify-between items-start pointer-events-auto">
            <div className="group cursor-default">
              <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent italic tracking-tighter transition-all group-hover:tracking-normal">
                STAR DANCE
              </h1>
              <p className="text-zinc-500 text-[10px] tracking-[0.5em] mt-2 font-bold uppercase">Dynamic Neural Particle Fabric</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 音频可视化小窗 */}
              {isAudioEnabled && (
                <div className="bg-zinc-900/50 backdrop-blur-xl h-10 px-4 rounded-full border border-zinc-800 flex items-center gap-1">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(10, (i % 2 === 0 ? audioData.bass : audioData.mid) * 100 * (0.5 + Math.random()))}%` }}
                    />
                  ))}
                </div>
              )}

              <div className="bg-zinc-900/50 backdrop-blur-xl p-2 rounded-full border border-zinc-800 flex items-center gap-4 px-6 shadow-2xl">
                <button 
                  onClick={initAudio}
                  className={`flex items-center gap-2 transition-colors ${isAudioEnabled ? 'text-pink-500' : 'text-zinc-500 hover:text-white'}`}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span className="text-[10px] font-bold tracking-tighter uppercase">{isAudioEnabled ? '律动激活' : '律动关闭'}</span>
                </button>
                <div className="w-px h-4 bg-zinc-800" />
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${gestureState.isDetected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 opacity-50'}`} />
                  <span className="text-[10px] font-bold text-zinc-400 tracking-tighter uppercase whitespace-nowrap">{theme.name}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowHelp(true)}
                className="bg-zinc-900/50 backdrop-blur-xl p-3 rounded-full border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* 底部控制栏 */}
          <footer className="flex flex-col md:flex-row gap-6 items-end pointer-events-auto w-full">
            
            {/* AI 意境生成器 */}
            <div className="w-full md:w-96 bg-zinc-900/80 backdrop-blur-3xl rounded-3xl p-5 border border-zinc-800/50 shadow-2xl transition-all hover:border-indigo-500/30">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Gemini AI 指挥官</span>
              </div>
              <form onSubmit={handleAiTheme} className="relative group">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="输入意境（如: '寂静深海'）"
                  className="w-full bg-black/50 border border-zinc-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
                />
                <button
                  disabled={isProcessingAI}
                  className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isProcessingAI ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-white" />
                  )}
                </button>
              </form>
            </div>

            {/* 预设主题列表 */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar flex-1 justify-end">
              {(Object.keys(THEMES) as ThemeStyle[]).map((tName) => (
                <button
                  key={tName}
                  onClick={() => setTheme(THEMES[tName])}
                  className={`flex flex-col items-center justify-center p-4 min-w-[100px] rounded-3xl border transition-all duration-500 ${
                    theme.name === tName 
                      ? 'bg-white text-black border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                      : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/50 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <div className={`${theme.name === tName ? 'animate-bounce' : ''}`}>
                    {themeIcons[tName]}
                  </div>
                  <span className="text-[10px] font-black mt-3 tracking-tighter uppercase">
                    {tName}
                  </span>
                </button>
              ))}
            </div>
          </footer>
        </div>
      )}

      {/* UI 切换按钮 */}
      <button 
        onClick={() => setShowUI(!showUI)}
        className="fixed top-8 right-8 z-[60] p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white transition-all hover:scale-110 active:scale-95"
        title={showUI ? "隐藏 UI" : "显示 UI"}
      >
        <MousePointer2 className="w-5 h-5" />
      </button>

      {/* 手势检测器 */}
      <HandDetector onStateChange={setGestureState} />

      {/* 动态暗角 */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle_at_center, transparent 0%, rgba(0,0,0,${0.6 + audioData.volume * 0.4}) 100%)`,
          opacity: showUI ? 1 : 0.4
        }} 
      />
    </div>
  );
};

export default App;
