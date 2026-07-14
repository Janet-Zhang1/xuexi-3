import { useState } from 'react';
import { Word } from '../data/vocabulary';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { Volume2, Heart } from 'lucide-react';

interface WordCardProps {
  word: Word;
  onFavoriteChange?: (wordId: number, isFavorite: boolean) => void;
}

export function WordCard({ word, onFavoriteChange }: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => storageService.isFavorite(word.id));

  // 播放发音
  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(word.word, { rate: settings.rate, lang: settings.voice });
    } catch (error) {
      console.error('发音失败:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  // 切换收藏
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = storageService.toggleFavorite(word.id);
    setIsFavorite(newStatus);
    onFavoriteChange?.(word.id, newStatus);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 
                    hover:shadow-md hover:border-indigo-200 transition-all duration-200 
                    cursor-pointer"
         onClick={handleSpeak}>
      <div className="flex items-start justify-between mb-2">
        {/* 单词 */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 font-serif">
            {word.word}
          </h3>
          <p className="text-sm text-indigo-600 font-mono mt-0.5">
            {word.phonetic}
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-lg transition-all duration-200 
                       ${isFavorite 
                         ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' 
                         : 'text-gray-400 hover:text-rose-500 hover:bg-gray-50'}`}
            aria-label={isFavorite ? '取消收藏' : '收藏'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={handleSpeak}
            className={`p-2 rounded-lg transition-all duration-200 
                       ${isPlaying 
                         ? 'text-indigo-600 bg-indigo-100' 
                         : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            aria-label="播放发音"
          >
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* 中文释义 */}
      <p className="text-sm text-gray-600 leading-relaxed">
        {word.meaning}
      </p>
      
      {/* 播放指示器 */}
      {isPlaying && (
        <div className="absolute inset-0 bg-indigo-50/50 rounded-xl pointer-events-none">
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      )}
    </div>
  );
}