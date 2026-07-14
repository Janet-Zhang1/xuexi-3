import { useState, useEffect } from 'react';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { Play, Pause, Square, Settings, X } from 'lucide-react';

export function TextReader() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(() => storageService.getRate());
  const [showSettings, setShowSettings] = useState(false);

  // 播放文本
  const handlePlay = async () => {
    if (!text.trim()) return;
    
    if (isPaused) {
      speechService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    
    try {
      setIsPlaying(true);
      const voice = storageService.getVoice();
      await speechService.speakText(text, { rate, lang: voice });
    } catch (error) {
      console.error('朗读失败:', error);
    } finally {
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  // 暂停
  const handlePause = () => {
    speechService.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  // 停止
  const handleStop = () => {
    speechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // 语速变化
  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    storageService.setRate(newRate);
  };

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">文本朗读</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-all duration-200 
                     ${showSettings 
                       ? 'text-indigo-600 bg-indigo-50' 
                       : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'}`}
          aria-label="设置"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
      
      {/* 文本输入区 */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="请输入要朗读的英语文本..."
        className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   text-gray-700 placeholder:text-gray-400"
        disabled={isPlaying}
      />
      
      {/* 设置面板 */}
      {showSettings && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">语速调节</label>
            <span className="text-sm text-gray-500">{rate.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>慢速</span>
            <span>正常</span>
            <span>快速</span>
          </div>
        </div>
      )}
      
      {/* 播放控制按钮 */}
      <div className="flex items-center justify-center gap-3 mt-4">
        {!isPlaying && !isPaused ? (
          <button
            onClick={handlePlay}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white 
                       rounded-lg font-medium transition-all duration-200
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            播放
          </button>
        ) : isPaused ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white 
                       rounded-lg font-medium transition-all duration-200
                       hover:bg-indigo-700"
          >
            <Play className="w-4 h-4" />
            继续
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white 
                       rounded-lg font-medium transition-all duration-200
                       hover:bg-amber-600"
          >
            <Pause className="w-4 h-4" />
            暂停
          </button>
        )}
        
        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-500 text-white 
                       rounded-lg font-medium transition-all duration-200
                       hover:bg-gray-600"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        )}
      </div>
      
      {/* 播放状态指示 */}
      {isPlaying && (
        <div className="mt-3 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }}></span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
          <span className="ml-2 text-sm text-indigo-600 font-medium">正在朗读...</span>
        </div>
      )}
    </div>
  );
}