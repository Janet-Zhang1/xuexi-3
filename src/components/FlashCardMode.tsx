import { useState, useEffect } from 'react';
import { parsedVocabularyManager, WordWithDetail } from '../data/vocabulary';
import { learningService } from '../services/learningService';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { WordLearningRecord, masteryLevelConfig } from '../types/learning';
import { 
  Volume2, Check, X, 
  ThumbsUp, ThumbsDown, Minus, BarChart3, XCircle
} from 'lucide-react';

interface FlashCardProps {
  word: WordWithDetail;
  record: WordLearningRecord;
  onAnswer: (wordId: number, quality: number) => void;
  onNext: () => void;
}

function FlashCard({ word, record, onAnswer, onNext }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);

  // 3秒倒计时
  useEffect(() => {
    if (!showAnswer && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showAnswer, countdown]);

  // 播放发音
  const handleSpeak = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(word.word, { rate: settings.rate, lang: settings.voice });
    } finally {
      setIsPlaying(false);
    }
  };

  // 显示答案
  const handleShowAnswer = () => {
    setShowAnswer(true);
    setIsFlipped(true);
  };

  // 回答
  const handleAnswer = (quality: number) => {
    onAnswer(word.id, quality);
    setIsFlipped(false);
    setShowAnswer(false);
    setCountdown(3);
  };

  // 获取掌握状态标签
  const masteryLabel = masteryLevelConfig[record.masteryLevel];
  
  // 掌握状态对应的class（避免Tailwind动态class问题）
  const masteryClassMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700'
  };
  const masteryClass = masteryClassMap[masteryLabel.color] || masteryClassMap.gray;

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* 掌握状态标签 */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-sm px-2 py-1 rounded-full ${masteryClass}`}>
          {masteryLabel.icon} {masteryLabel.label}
        </span>
        <span className="text-sm text-gray-400">
          正确 {record.correctCount} / 错误 {record.wrongCount}
        </span>
      </div>

      {/* 卡片 */}
      <div 
        className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden
                   ${isFlipped ? 'border-indigo-300' : 'border-gray-200'}
                   min-h-[280px]`}
      >
        {/* 正面 - 单词 */}
        <div className={`absolute inset-0 p-6 transition-all duration-300 ${isFlipped ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              {word.word}
            </h2>
            <span className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full mb-4">
              {word.pos}
            </span>
            
            {/* 发音按钮 */}
            <button
              onClick={handleSpeak}
              disabled={isPlaying}
              className={`p-3 rounded-full transition-all duration-200
                         ${isPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              <Volume2 className="w-6 h-6" />
            </button>
            
            {/* 倒计时 */}
            {!showAnswer && countdown > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400 mb-1">思考时间</p>
                <span className="text-4xl font-bold text-indigo-600">{countdown}</span>
              </div>
            )}
            
            {/* 显示答案按钮 */}
            {countdown === 0 && !showAnswer && (
              <button
                onClick={handleShowAnswer}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                显示答案
              </button>
            )}
          </div>
        </div>

        {/* 背面 - 答案 */}
        <div className={`absolute inset-0 p-6 transition-all duration-300 ${isFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="flex flex-col h-full">
            {/* 单词和发音 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-serif font-bold text-gray-900">{word.word}</h3>
              <button
                onClick={handleSpeak}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            
            {/* 释义 */}
            <p className="text-gray-700 mb-4">{word.definition}</p>
            
            {/* 例句（如果有） */}
            {word.content && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 max-h-20 overflow-y-auto">
                {word.content.split('\n').slice(1, 3).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
            
            {/* 评分按钮 */}
            <div className="mt-auto">
              <p className="text-sm text-gray-500 mb-2">你的记忆效果如何？</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleAnswer(1)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs">忘记</span>
                </button>
                <button
                  onClick={() => handleAnswer(3)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                  <span className="text-xs">模糊</span>
                </button>
                <button
                  onClick={() => handleAnswer(4)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-xs">正确</span>
                </button>
                <button
                  onClick={() => handleAnswer(5)}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs">简单</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 闪卡练习模式主组件
interface FlashCardModeProps {
  onClose: () => void;
}

export function FlashCardMode({ onClose }: FlashCardModeProps) {
  const [words, setWords] = useState<WordWithDetail[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });

  // 初始化词汇队列
  useEffect(() => {
    const allWords = parsedVocabularyManager.getAll();
    // 获取需要复习的词汇
    const records = learningService.getAllRecords();
    const forReview = records
      .filter(r => new Date(r.nextReviewAt) <= new Date())
      .map(r => parsedVocabularyManager.getById(r.wordId))
      .filter(Boolean) as WordWithDetail[];
    
    // 如果没有需要复习的，随机选择10个
    if (forReview.length === 0) {
      const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
      setWords(shuffled);
    } else {
      setWords(forReview);
    }
  }, []);

  // 处理回答
  const handleAnswer = (wordId: number, quality: number) => {
    // 更新学习记录
    learningService.updateAfterPractice(wordId, quality >= 3, quality);
    
    // 更新会话统计
    if (quality >= 3) {
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setSessionStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    
    // 下一个单词
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 300);
  };

  // 当前单词
  const currentWord = words[currentIndex];
  const currentRecord = currentWord ? learningService.getOrCreateRecord(currentWord.id) : null;

  if (words.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">加载中...</h2>
        </div>
      </div>
    );
  }

  if (currentIndex >= words.length) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">练习完成！</h2>
          <div className="flex justify-center gap-8 my-6">
            <div>
              <p className="text-3xl font-bold text-green-600">{sessionStats.correct}</p>
              <p className="text-sm text-gray-500">正确</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-600">{sessionStats.wrong}</p>
              <p className="text-sm text-gray-500">错误</p>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            正确率: {Math.round(sessionStats.correct / (sessionStats.correct + sessionStats.wrong) * 100)}%
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              返回
            </button>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSessionStats({ correct: 0, wrong: 0 });
              }}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              再练一轮
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-amber-50 z-50 overflow-auto">
      {/* 顶部栏 */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>{currentIndex + 1} / {words.length}</span>
              <span>正确 {sessionStats.correct} / 错误 {sessionStats.wrong}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 卡片区域 */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        {currentRecord && (
          <FlashCard
            word={currentWord}
            record={currentRecord}
            onAnswer={handleAnswer}
            onNext={() => setCurrentIndex(currentIndex + 1)}
          />
        )}
      </div>
    </div>
  );
}