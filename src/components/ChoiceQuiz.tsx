import { useState, useEffect } from 'react';
import { parsedVocabularyManager, WordWithDetail } from '../data/vocabulary';
import { learningService } from '../services/learningService';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { Check, X, Volume2, ArrowRight, XCircle } from 'lucide-react';

interface ChoiceQuestion {
  word: WordWithDetail;
  options: string[];
  correctIndex: number;
}

interface ChoiceQuizProps {
  onClose: () => void;
  count?: number;
}

export function ChoiceQuiz({ onClose, count = 10 }: ChoiceQuizProps) {
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  // 生成题目
  useEffect(() => {
    const allWords = parsedVocabularyManager.getAll();
    const shuffled = [...allWords].sort(() => Math.random() - 0.5).slice(0, count);
    
    const generatedQuestions = shuffled.map(word => {
      // 获取其他词汇作为干扰项
      const otherWords = allWords.filter(w => w.id !== word.id);
      const distractors = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.definition.split(/[，,；;]/)[0]);
      
      // 正确答案
      const correctAnswer = word.definition.split(/[，,；;]/)[0];
      
      // 组合选项并打乱
      const options = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);
      
      return {
        word,
        options,
        correctIndex: options.indexOf(correctAnswer)
      };
    });
    
    setQuestions(generatedQuestions);
  }, [count]);

  // 播放发音
  const handleSpeak = async () => {
    if (isPlaying || !currentQuestion) return;
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(currentQuestion.word.word, { rate: settings.rate, lang: settings.voice });
    } finally {
      setIsPlaying(false);
    }
  };

  // 选择答案
  const handleSelect = (index: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(index);
    const correct = index === currentQuestion?.correctIndex;
    setIsCorrect(correct);
    
    // 更新统计
    if (correct) {
      setStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setStats(prev => ({ ...prev, wrong: prev.wrong + 1 }));
    }
    
    // 更新学习记录
    learningService.updateAfterPractice(currentQuestion!.word.id, correct, correct ? 4 : 2);
  };

  // 下一题
  const handleNext = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setCurrentIndex(currentIndex + 1);
  };

  const currentQuestion = questions[currentIndex];

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 完成界面
  if (currentIndex >= questions.length) {
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
              <span>{currentIndex + 1} / {questions.length}</span>
              <span>正确 {stats.correct} / 错误 {stats.wrong}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 题目区域 */}
      <div className="max-w-md mx-auto p-4 pt-8">
        {/* 单词 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-3xl font-serif font-bold text-gray-900">
              {currentQuestion.word.word}
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
          <p className="text-gray-500">选择正确的中文释义</p>
        </div>

        {/* 选项 */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === currentQuestion.correctIndex;
            
            let optionClass = 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50';
            if (selectedOption !== null) {
              if (isCorrectOption) {
                optionClass = 'bg-green-50 border-green-500 text-green-800';
              } else if (isSelected) {
                optionClass = 'bg-rose-50 border-rose-500 text-rose-800';
              }
            }
            
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selectedOption !== null}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${optionClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {selectedOption !== null && isCorrectOption && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                  {selectedOption !== null && isSelected && !isCorrectOption && (
                    <X className="w-5 h-5 text-rose-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 结果和下一题按钮 */}
        {selectedOption !== null && (
          <div className="mt-6">
            <p className={`text-center mb-4 ${isCorrect ? 'text-green-600' : 'text-rose-600'}`}>
              {isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}
            </p>
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              下一题
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}