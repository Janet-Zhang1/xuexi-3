import { useState, useEffect, useRef } from 'react';
import { parsedVocabularyManager, WordWithDetail } from '../data/vocabulary';
import { learningService } from '../services/learningService';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { Volume2, Check, X, ArrowRight, XCircle, HelpCircle, Lightbulb } from 'lucide-react';

interface SpellingQuizProps {
  onClose: () => void;
  count?: number;
}

export function SpellingQuiz({ onClose, count = 10 }: SpellingQuizProps) {
  const [words, setWords] = useState<WordWithDetail[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化题目
  useEffect(() => {
    const allWords = parsedVocabularyManager.getAll();
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, count);
    setWords(shuffled);
  }, [count]);

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !showResult) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult]);

  // 播放发音
  const handleSpeak = async () => {
    if (isPlaying || !currentWord) return;
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(currentWord.word, { rate: settings.rate, lang: settings.voice });
    } finally {
      setIsPlaying(false);
    }
  };

  // 提交答案
  const handleSubmit = () => {
    if (!userInput.trim() || showResult || !currentWord) return;
    
    const correct = userInput.trim().toLowerCase() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    setShowResult(true);
    
    // 更新统计
    if (correct) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    
    // 更新学习记录
    learningService.updateAfterPractice(currentWord.id, correct, correct ? 4 : 2);
  };

  // 下一题
  const handleNext = () => {
    setUserInput('');
    setShowResult(false);
    setShowHint(false);
    setCurrentIndex(currentIndex + 1);
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResult) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  // 获取提示（显示首字母和字母数）
  const getHint = () => {
    if (!currentWord) return '';
    const word = currentWord.word;
    const hint = word[0] + '_'.repeat(word.length - 1);
    return `${hint} (${word.length}个字母)`;
  };

  const currentWord = words[currentIndex];

  if (words.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 完成界面
  if (currentIndex >= words.length) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full mx-4">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">练习完成！</h2>
          <div className="flex justify-center gap-8 my-6">
            <div>
              <p className="text-3xl font-bold text-green-600">{stats.correct}</p>
              <p className="text-sm text-gray-500">正确</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-600">{stats.wrong}</p>
              <p className="text-sm text-gray-500">错误</p>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            正确率: {Math.round(stats.correct / (stats.correct + stats.wrong) * 100)}%
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-indigo-50 z-50 overflow-auto">
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
              <span>正确 {stats.correct} / 错误 {stats.wrong}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="max-w-md mx-auto p-4 pt-8">
        {/* 中文释义 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-2">请根据中文释义拼写单词</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentWord.definition}
          </h2>
          <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
            {currentWord.pos}
          </span>
          
          {/* 播放发音按钮 */}
          <button
            onClick={handleSpeak}
            disabled={isPlaying}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                       ${isPlaying 
                         ? 'bg-gray-100 text-gray-600' 
                         : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? '播放中...' : '听发音提示'}
          </button>
        </div>

        {/* 提示 */}
        {showHint && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="w-5 h-5" />
              <span className="font-medium">提示</span>
            </div>
            <p className="text-amber-800 mt-2 text-lg font-mono">{getHint()}</p>
          </div>
        )}

        {/* 输入框 */}
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={showResult}
            placeholder="输入单词..."
            className={`w-full p-4 text-xl text-center border-2 rounded-xl font-mono
                       transition-all duration-200 focus:outline-none
                       ${showResult 
                         ? isCorrect 
                           ? 'border-green-500 bg-green-50 text-green-800' 
                           : 'border-rose-500 bg-rose-50 text-rose-800'
                         : 'border-gray-200 focus:border-indigo-500'}`}
          />
        </div>

        {/* 结果显示 */}
        {showResult && !isCorrect && (
          <div className="bg-rose-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-rose-700 mb-2">
              <X className="w-5 h-5" />
              <span className="font-medium">正确答案</span>
            </div>
            <p className="text-rose-800 text-xl font-mono font-bold">{currentWord.word}</p>
          </div>
        )}

        {/* 操作按钮 */}
        {!showResult ? (
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
              className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              提交答案
            </button>
            {!showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                显示提示
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            下一题
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}