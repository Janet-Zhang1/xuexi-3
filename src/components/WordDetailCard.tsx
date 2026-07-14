import { useState } from 'react';
import { WordWithDetail } from '../data/vocabulary';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { Volume2, Heart, ChevronDown, ChevronUp, BookOpen, Mic } from 'lucide-react';
import { SpeakingPractice } from './SpeakingPractice';

interface WordDetailCardProps {
  word: WordWithDetail;
  onFavoriteChange?: (wordId: number, isFavorite: boolean) => void;
}

export function WordDetailCard({ word, onFavoriteChange }: WordDetailCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(() => storageService.isFavorite(word.id));
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeaking, setShowSpeaking] = useState(false);
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<string | null>(null);

  // 播放单词发音
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

  // 播放句子发音
  const handleSpeakSentence = async (e: React.MouseEvent, text: string, indexKey: string) => {
    e.stopPropagation();
    
    if (playingSentenceIndex === indexKey) return;
    
    setPlayingSentenceIndex(indexKey);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(text, { rate: settings.rate, lang: settings.voice });
    } catch (error) {
      console.error('句子发音失败:', error);
    } finally {
      setPlayingSentenceIndex(null);
    }
  };

  // 从一行文本中提取英文句子
  const extractEnglishSentence = (line: string): string | null => {
    // 去掉中文部分，提取英文
    const englishPart = line.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '').trim();
    if (englishPart.length < 3) return null;
    // 如果是选项（如A. B. C. D.），跳过
    if (/^[A-D]\./.test(englishPart.trim())) return null;
    return englishPart;
  };

  // 切换收藏
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = storageService.toggleFavorite(word.id);
    setIsFavorite(newStatus);
    onFavoriteChange?.(word.id, newStatus);
  };

  // 切换展开状态
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 检查是否有解析内容可显示
  const hasContent = word.content && word.content.split('\n').length > 1;

  // 解析内容显示
  const renderContent = () => {
    if (!word.content) return null;
    
    const lines = word.content.split('\n').slice(1);
    
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        {lines.map((line, index) => {
          const lineKey = `line-${index}`;
          const englishSentence = extractEnglishSentence(line);
          
          // 检测是否是标题行（如【词语辨析】、【经典试题】）
          if (line.startsWith('【')) {
            return (
              <div key={lineKey} className="font-medium text-indigo-700 mt-2 mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {line}
              </div>
            );
          }
          
          // 检测是否是选项行（A. B. C. D.）
          if (/^[A-D]\./.test(line.trim())) {
            return (
              <div key={lineKey} className="text-gray-600 pl-4">
                {line}
              </div>
            );
          }
          
          // 检测是否是例句（包含英文和中文）
          if (englishSentence && line.match(/[\u4e00-\u9fa5]/)) {
            const isPlayingThis = playingSentenceIndex === lineKey;
            return (
              <div key={lineKey} className="group flex items-start gap-2 pl-3 border-l-2 border-indigo-100 py-1">
                <div className="flex-1 text-gray-600">
                  {line}
                </div>
                <button
                  onClick={(e) => handleSpeakSentence(e, englishSentence, lineKey)}
                  className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-200
                             ${isPlayingThis 
                               ? 'bg-indigo-100 text-indigo-600' 
                               : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'}`}
                  title="朗读句子"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingThis ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            );
          }
          
          // 纯英文句子（没有中文翻译）
          if (englishSentence && !line.match(/[\u4e00-\u9fa5]/) && englishSentence.length > 10) {
            const isPlayingThis = playingSentenceIndex === lineKey;
            return (
              <div key={lineKey} className="group flex items-start gap-2 py-1">
                <div className="flex-1 text-gray-600">
                  {line}
                </div>
                <button
                  onClick={(e) => handleSpeakSentence(e, englishSentence, lineKey)}
                  className={`flex-shrink-0 p-1.5 rounded-md transition-all duration-200
                             ${isPlayingThis 
                               ? 'bg-indigo-100 text-indigo-600' 
                               : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100'}`}
                  title="朗读句子"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingThis ? 'animate-pulse' : ''}`} />
                </button>
              </div>
            );
          }
          
          // 其他行（纯中文说明等）
          return (
            <div key={lineKey} className="text-gray-600">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  // 词性标签颜色
  const getPosColor = (pos: string) => {
    const posColors: Record<string, string> = {
      'n': 'bg-blue-100 text-blue-700',
      'v': 'bg-green-100 text-green-700',
      'a.': 'bg-purple-100 text-purple-700',
      'ad.': 'bg-amber-100 text-amber-700',
      'prep': 'bg-rose-100 text-rose-700',
      'conj': 'bg-cyan-100 text-cyan-700',
      'pron': 'bg-indigo-100 text-indigo-700',
      'art': 'bg-gray-100 text-gray-700',
      'num': 'bg-orange-100 text-orange-700',
    };
    return posColors[pos] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border transition-all duration-200 
                    ${isExpanded ? 'border-indigo-300 shadow-md' : 'border-gray-100 hover:shadow-md hover:border-indigo-200'}`}>
      <div className="p-4">
        {/* 头部：单词和操作按钮 */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 font-serif">
                {word.word}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPosColor(word.pos)}`}>
                {word.pos}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {word.definition}
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSpeaking(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-all duration-200"
              aria-label="口语练习"
            >
              <Mic className="w-5 h-5" />
            </button>
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
        
        {/* 展开/收起按钮 */}
        {hasContent ? (
          <button
            onClick={toggleExpand}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起解析
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                查看解析
              </>
            )}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <ChevronDown className="w-4 h-4" />
            暂无解析
          </span>
        )}
      </div>
      
      {/* 解析内容（展开时显示） */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {renderContent()}
        </div>
      )}
      
      {/* 播放指示器 */}
      {isPlaying && (
        <div className="absolute inset-0 bg-indigo-50/30 rounded-xl pointer-events-none">
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      )}
      
      {/* 口语练习模态框 */}
      {showSpeaking && (
        <SpeakingPractice 
          word={word}
          onClose={() => setShowSpeaking(false)}
        />
      )}
    </div>
  );
}