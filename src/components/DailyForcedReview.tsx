import { useState, useEffect, useRef } from 'react';
import { parsedVocabularyManager, WordWithDetail } from '../data/vocabulary';
import { learningService } from '../services/learningService';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { 
  Volume2, XCircle, Check, ChevronRight, 
  AlertTriangle, Trophy, Target, HelpCircle, Lightbulb,
  ArrowRight, X, RefreshCw
} from 'lucide-react';

type QuestionType = 'en2cn' | 'cn2en';

interface DailyForcedReviewProps {
  onClose: () => void;
  onComplete?: () => void;
}

export function DailyForcedReview({ onClose, onComplete }: DailyForcedReviewProps) {
  const [taskWords, setTaskWords] = useState<WordWithDetail[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionType, setQuestionType] = useState<QuestionType>('en2cn');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化任务
  useEffect(() => {
    const allWords = parsedVocabularyManager.getAll();
    const allWordIds = allWords.map(w => w.id);
    const task = learningService.getDailyForcedTask(allWordIds);
    
    const words = task.wordIds
      .map(id => parsedVocabularyManager.getById(id))
      .filter((w): w is WordWithDetail => w !== undefined);
    
    setTaskWords(words);
    setCompletedIds(task.completedIds);
  }, []);

  // 自动聚焦输入框
  useEffect(() => {
    if (inputRef.current && !showResult && taskWords.length > 0) {
      inputRef.current.focus();
    }
  }, [currentIndex, showResult, taskWords.length]);

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

  // 获取提示（首字母+长度 或 释义提示）
  const getHint = () => {
    if (!currentWord) return '';
    if (questionType === 'cn2en') {
      const word = currentWord.word;
      return `首字母: ${word[0].toUpperCase()}, 共 ${word.length} 个字母`;
    } else {
      const def = currentWord.definition;
      const parts = def.split(/[，,；;]/);
      return `提示: ${parts[0].substring(0, 3)}...`;
    }
  };

  // 判断答案是否正确
  const checkAnswer = (): boolean => {
    if (!currentWord) return false;
    
    const answer = userAnswer.trim().toLowerCase();
    
    if (questionType === 'en2cn') {
      // 英译中：判断中文释义是否匹配
      const def = currentWord.definition;
      // 分割释义，只要匹配其中一个就算对
      const meanings = def.split(/[，,；;、]/).map(m => m.trim()).filter(m => m.length > 0);
      return meanings.some(m => m === answer || m.includes(answer) || answer.includes(m));
    } else {
      // 中译英：判断英文单词是否正确
      return answer === currentWord.word.toLowerCase();
    }
  };

  // 提交答案
  const handleSubmit = () => {
    if (!userAnswer.trim() || showResult || !currentWord) return;
    
    const correct = checkAnswer();
    setIsCorrect(correct);
    setShowResult(true);
    setShowHint(false);
    
    if (correct) {
      setCorrectCount(c => c + 1);
    } else {
      setWrongCount(w => w + 1);
    }
    
    // 更新学习记录
    learningService.updateAfterPractice(currentWord.id, correct, correct ? 4 : 2);
    learningService.markForcedWordCompleted(currentWord.id);
    setCompletedIds(prev => [...prev, currentWord.id]);
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex < taskWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowResult(false);
      setShowHint(false);
      // 交替题型
      setQuestionType(prev => prev === 'en2cn' ? 'cn2en' : 'en2cn');
    } else {
      onComplete?.();
    }
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

  const currentWord = taskWords[currentIndex];

  // 完成界面
  if (taskWords.length > 0 && currentIndex >= taskWords.length) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">今日任务完成！</h2>
          <p className="text-gray-600 mb-6">你已完成今日5个未掌握单词的强制学习</p>
          
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              <p className="text-sm text-gray-500">正确</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-600">{wrongCount}</p>
              <p className="text-sm text-gray-500">错误</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">
                {correctCount + wrongCount > 0 
                  ? Math.round(correctCount / (correctCount + wrongCount) * 100) 
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">正确率</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    );
  }

  if (taskWords.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const questionTitle = questionType === 'en2cn' ? '看英文写中文' : '看中文写英文';
  const questionText = questionType === 'en2cn' ? currentWord.word : currentWord.definition;
  const answerText = questionType === 'en2cn' ? currentWord.definition : currentWord.word;
  const placeholder = questionType === 'en2cn' ? '输入中文释义...' : '输入英文单词...';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-amber-50 via-white to-rose-50 z-50 overflow-auto">
      {/* 顶部栏 */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-gray-900">每日强制学习</span>
          </div>
          
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {taskWords.length}
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="max-w-md mx-auto mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${((currentIndex + (showResult ? 1 : 0)) / taskWords.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 提醒横幅 */}
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">未掌握单词强制复习</p>
            <p className="text-sm text-amber-700 mt-1">
              题型交替：英译中 ↔ 中译英，完成今日5个
            </p>
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="max-w-md mx-auto p-4 pt-6">
        {/* 题型标签 */}
        <div className="text-center mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                         ${questionType === 'en2cn' 
                           ? 'bg-indigo-100 text-indigo-700' 
                           : 'bg-emerald-100 text-emerald-700'}`}>
            <RefreshCw className="w-3.5 h-3.5" />
            {questionTitle}
          </span>
        </div>

        {/* 题目卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <p className="text-sm text-gray-500 text-center mb-3">请回答以下问题</p>
          
          <div className="text-center py-4">
            {questionType === 'en2cn' ? (
              <div className="flex items-center justify-center gap-3">
                <h2 className="text-3xl font-serif font-bold text-gray-900">
                  {questionText}
                </h2>
                <button
                  onClick={handleSpeak}
                  disabled={isPlaying}
                  className={`p-2 rounded-full transition-all duration-200
                             ${isPlaying 
                               ? 'bg-indigo-100 text-indigo-600' 
                               : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">
                {questionText}
              </h2>
            )}
          </div>

          {/* 词性提示 */}
          <p className="text-center text-sm text-gray-400 mt-2">
            {currentWord.pos}
          </p>
        </div>

        {/* 提示 */}
        {showHint && !showResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="w-5 h-5" />
              <span className="font-medium">提示</span>
            </div>
            <p className="text-amber-800 mt-2">{getHint()}</p>
          </div>
        )}

        {/* 输入框 */}
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={showResult}
            placeholder={placeholder}
            className={`w-full p-4 text-lg text-center border-2 rounded-xl
                       transition-all duration-200 focus:outline-none
                       ${showResult 
                         ? isCorrect 
                           ? 'border-green-500 bg-green-50 text-green-800' 
                           : 'border-rose-500 bg-rose-50 text-rose-800'
                         : 'border-gray-200 focus:border-indigo-500'}`}
          />
        </div>

        {/* 结果显示 */}
        {showResult && (
          <div className={`rounded-xl p-4 mb-4 ${isCorrect ? 'bg-green-50' : 'bg-rose-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">回答正确！</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-rose-600" />
                  <span className="font-medium text-rose-700">回答错误</span>
                </>
              )}
            </div>
            <div className="text-sm">
              <p className="text-gray-600">正确答案：</p>
              <p className={`text-lg font-medium mt-1 ${isCorrect ? 'text-green-700' : 'text-rose-700'}`}>
                {answerText}
              </p>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {!showResult ? (
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
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
            {currentIndex < taskWords.length - 1 ? '下一题' : '完成今日任务'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 底部统计 */}
      <div className="max-w-md mx-auto px-4 pb-8 pt-2">
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            {correctCount} 正确
          </span>
          <span className="flex items-center gap-1">
            <X className="w-4 h-4 text-rose-500" />
            {wrongCount} 错误
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4 text-indigo-500" />
            第 {currentIndex + 1} / {taskWords.length} 题
          </span>
        </div>
      </div>
    </div>
  );
}