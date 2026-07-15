import { useState, useEffect } from 'react';
import { Word } from '../data/vocabulary';
import { audioPlayer } from '../utils/audioPlayer';
import { storageService } from '../utils/storage';
import { wordImageService } from '../utils/wordImage';
import { Volume2, Heart, Image as ImageIcon, RefreshCw, X } from 'lucide-react';

interface WordCardProps {
  word: Word;
  onFavoriteChange?: (wordId: number, isFavorite: boolean) => void;
}

export function WordCard({ word, onFavoriteChange }: WordCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => storageService.isFavorite(word.id));
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(() => storageService.getSettings().showWordImage);

  useEffect(() => {
    if (showImage) {
      const cached = wordImageService.getImageUrl(word.word, word.meaning);
      if (cached) {
        setImageUrl(cached);
      }
    }
  }, [word.word, word.meaning, showImage]);

  const loadImage = async (forceRegenerate = false) => {
    if (imageLoading) return;
    setImageLoading(true);
    setImageError(false);
    try {
      if (forceRegenerate) {
        wordImageService.clearWordCache(word.word);
      }
      const url = await wordImageService.generateImage(word.word, word.meaning, forceRegenerate);
      if (url) {
        setImageUrl(url);
      } else {
        setImageError(true);
      }
    } catch (error) {
      console.error('加载图片失败:', error);
      setImageError(true);
    } finally {
      setImageLoading(false);
    }
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await audioPlayer.speakWord(word.word, { rate: settings.rate, lang: settings.voice });
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 font-serif">
              {word.word}
            </h3>
            <span className="text-sm text-indigo-600 font-mono">
              {word.phonetic}
            </span>
          </div>
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
      
      {/* 单词图片 */}
      {showImage && (
        <div className="mt-3">
          {imageUrl ? (
            <div className="relative group/image">
              <img 
                src={imageUrl} 
                alt={word.word}
                className="w-full h-32 object-cover rounded-lg bg-gray-50"
                onError={() => {
                  setImageUrl(null);
                  setImageError(true);
                }}
              />
              {/* 重新生成按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageError(false);
                  loadImage(true);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover/image:opacity-100 transition-opacity"
                title="重新生成图片"
              >
                <RefreshCw className={`w-4 h-4 ${imageLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : imageLoading ? (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-6 h-6 text-gray-400 animate-pulse" />
              <span className="text-sm text-gray-400">生成图片中...</span>
            </div>
          ) : imageError ? (
            <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg flex flex-col items-center justify-center gap-2 border-2 border-dashed border-indigo-200">
              <span className="text-4xl">{wordImageService.getEmojiForWord(word.meaning)}</span>
              <div className="text-center">
                <p className="text-sm font-medium text-indigo-700">
                  {wordImageService.extractChineseKeyword(word.meaning)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageError(false);
                    loadImage();
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-700 mt-1 underline"
                >
                  点击重试生成配图
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                loadImage();
              }}
              className="w-full h-28 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 transition-colors border-2 border-dashed border-gray-200"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">点击生成配图</span>
            </button>
          )}
        </div>
      )}
      
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