import { useState, useRef, useEffect } from 'react';
import { WordWithDetail } from '../data/vocabulary';
import { learningService } from '../services/learningService';
import { speechService } from '../utils/speech';
import { storageService } from '../utils/storage';
import { 
  Mic, Square, Volume2, RefreshCw, Award, 
  AlertCircle, Check, ChevronRight, Target
} from 'lucide-react';

interface SpeakingPracticeProps {
  word: WordWithDetail;
  onClose: () => void;
  onComplete?: (score: number) => void;
}

// 发音评分结果（模拟，实际需要调用API）
interface PronunciationScore {
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  feedback: string[];
}

export function SpeakingPractice({ word, onClose, onComplete }: SpeakingPracticeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [dailyAttempts, setDailyAttempts] = useState(10);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 播放标准发音
  const playStandard = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const settings = storageService.getSettings();
      await speechService.speak(word.word, { rate: 0.8, lang: settings.voice });
    } finally {
      setIsPlaying(false);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // 这里可以发送到API进行评分
        analyzeRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setScore(null);
    } catch (error) {
      console.error('录音失败:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setHasRecorded(true);
    }
  };

  // 分析录音（模拟API调用）
  const analyzeRecording = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟评分结果（实际应用中调用Azure Speech或其他API）
    const mockScore: PronunciationScore = {
      overall: Math.floor(Math.random() * 30) + 70, // 70-100分
      accuracy: Math.floor(Math.random() * 25) + 75,
      fluency: Math.floor(Math.random() * 30) + 70,
      completeness: Math.floor(Math.random() * 20) + 80,
      feedback: [
        '注意元音发音',
        '辅音发音清晰',
        '语调自然流畅',
        '建议放慢语速练习'
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    };
    
    setScore(mockScore);
    setIsAnalyzing(false);
    setDailyAttempts(prev => Math.max(0, prev - 1));
    
    // 更新学习记录
    learningService.updateAfterPractice(word.id, mockScore.overall >= 80, 4);
    
    if (onComplete) {
      onComplete(mockScore.overall);
    }
  };

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  // 获取分数评级
  const getScoreGrade = (score: number) => {
    if (score >= 90) return '优秀 ⭐⭐⭐';
    if (score >= 80) return '良好 ⭐⭐';
    if (score >= 70) return '及格 ⭐';
    return '需要练习';
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-amber-50 z-50 overflow-auto">
      <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col">
        {/* 顶部信息 */}
        <div className="text-center mb-6">
          <span className="text-sm text-gray-500">剩余评测次数: {dailyAttempts}/10</span>
        </div>

        {/* 单词展示 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">
            {word.word}
          </h2>
          <span className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full mb-3 inline-block">
            {word.pos}
          </span>
          <p className="text-gray-600 mb-4">{word.definition}</p>
          
          {/* 播放标准发音按钮 */}
          <button
            onClick={playStandard}
            disabled={isPlaying || isRecording}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                       ${isPlaying 
                         ? 'bg-indigo-100 text-indigo-600' 
                         : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <Volume2 className="w-5 h-5" />
            {isPlaying ? '正在播放...' : '听标准发音'}
          </button>
        </div>

        {/* 录音区域 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center">
            {/* 录音按钮 */}
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isAnalyzing || dailyAttempts <= 0}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                         ${isRecording 
                           ? 'bg-rose-500 scale-110 animate-pulse' 
                           : isAnalyzing 
                             ? 'bg-gray-300 cursor-wait'
                             : dailyAttempts <= 0 
                               ? 'bg-gray-300 cursor-not-allowed'
                               : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isRecording ? (
                <Square className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-500">
              {isRecording ? '松开停止录音' : '按住说话'}
            </p>
            
            {/* 录音指示器 */}
            {isRecording && (
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                <span className="text-rose-500 font-medium">正在录音...</span>
              </div>
            )}
            
            {/* 分析中 */}
            {isAnalyzing && (
              <div className="mt-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-indigo-500 font-medium">AI正在评分...</span>
              </div>
            )}
          </div>
        </div>

        {/* 评分结果 */}
        {score && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreColor(score.overall)}`}>
                <span className="text-3xl font-bold">{score.overall}</span>
              </div>
              <p className="mt-2 font-medium text-gray-900">{getScoreGrade(score.overall)}</p>
            </div>
            
            {/* 详细评分 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">准确度</p>
                <p className="text-lg font-bold text-gray-900">{score.accuracy}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">流利度</p>
                <p className="text-lg font-bold text-gray-900">{score.fluency}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">完整性</p>
                <p className="text-lg font-bold text-gray-900">{score.completeness}</p>
              </div>
            </div>
            
            {/* 反馈 */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">AI建议:</p>
              {score.feedback.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-auto space-y-3">
          {score && (
            <button
              onClick={() => {
                setScore(null);
                setHasRecorded(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              再试一次
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}