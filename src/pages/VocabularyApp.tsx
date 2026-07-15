import { useState, useMemo, useEffect } from 'react';
import { WordCard } from '../components/WordCard';
import { WordDetailCard } from '../components/WordDetailCard';
import { TextReader } from '../components/TextReader';
import { LetterFilter } from '../components/LetterFilter';
import { SearchBar } from '../components/SearchBar';
import { FlashCardMode } from '../components/FlashCardMode';
import { ChoiceQuiz } from '../components/ChoiceQuiz';
import { SpellingQuiz } from '../components/SpellingQuiz';
import { LearningDashboard } from '../components/LearningDashboard';
import { DailyForcedReview } from '../components/DailyForcedReview';
import { SettingsModal } from '../components/SettingsModal';
import { VideoModal } from '../components/VideoModal';
import { vocabularyManager, parsedVocabularyManager, Word, WordWithDetail } from '../data/vocabulary';
import { storageService } from '../utils/storage';
import { learningService } from '../services/learningService';
import { 
  BookOpen, Heart, Volume2, AlertCircle, FileText, Play,
  Layers, CheckSquare, BarChart3, PenTool, Target, Flame, Settings
} from 'lucide-react';

type ViewMode = 'all' | 'favorites' | 'wrong';
type DataType = 'basic' | 'detailed';
type ActiveModal = 'none' | 'flashcard' | 'choice' | 'spelling' | 'stats' | 'daily' | 'settings';

export function VocabularyApp() {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [dataType, setDataType] = useState<DataType>('detailed'); // 默认使用解析词汇
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [dailyTaskProgress, setDailyTaskProgress] = useState({ completed: 0, total: 5, isCompleted: false });
  const [showVideoModal, setShowVideoModal] = useState(false);

  // 更新每日任务进度
  const updateDailyTaskProgress = () => {
    const allWords = parsedVocabularyManager.getAll();
    const allWordIds = allWords.map(w => w.id);
    const task = learningService.getDailyForcedTask(allWordIds);
    setDailyTaskProgress({
      completed: task.completedIds.length,
      total: task.wordIds.length,
      isCompleted: task.isCompleted
    });
  };

  // 初始化时检查每日任务
  useEffect(() => {
    updateDailyTaskProgress();
  }, []);

  // 获取可用的字母
  const availableLetters = useMemo(() => {
    return dataType === 'detailed' 
      ? parsedVocabularyManager.getCategories()
      : vocabularyManager.getCategories();
  }, [dataType]);

  // 过滤词汇
  const filteredWords = useMemo(() => {
    let words: any[] = dataType === 'detailed' 
      ? parsedVocabularyManager.getAll() as any[]
      : vocabularyManager.getAll() as any[];
    
    // 按收藏过滤
    if (viewMode === 'favorites') {
      const favoriteIds = storageService.getFavorites();
      words = words.filter(w => favoriteIds.includes(w.id));
    }
    
    // 按字母过滤
    if (selectedLetter) {
      words = words.filter(w => w.category === selectedLetter);
    }
    
    // 按关键词搜索
    if (searchKeyword) {
      words = dataType === 'detailed'
        ? parsedVocabularyManager.search(searchKeyword)
        : vocabularyManager.search(searchKeyword);
    }
    
    return words;
  }, [selectedLetter, searchKeyword, viewMode, dataType, refreshKey]) as any[];

  // 收藏变化时刷新
  const handleFavoriteChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  // 统计信息
  const totalWords = dataType === 'detailed' 
    ? parsedVocabularyManager.getAll().length 
    : vocabularyManager.getAll().length;
  const favoriteCount = storageService.getFavorites().length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">英语词汇学习助手</h1>
                <p className="text-sm text-gray-500">中考英语核心词汇 · 点击发音</p>
              </div>
            </div>
            
            {/* 统计信息 */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{totalWords}</p>
                <p className="text-xs text-gray-500">总词汇</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-rose-500">{favoriteCount}</p>
                <p className="text-xs text-gray-500">已收藏</p>
              </div>
              <button
                onClick={() => setActiveModal('settings')}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title="设置"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* 移动端设置按钮 */}
            <button
              onClick={() => setActiveModal('settings')}
              className="sm:hidden p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 浏览器不支持提示 */}
        {!('speechSynthesis' in window) && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">浏览器兼容性提示</p>
              <p className="text-sm text-amber-700">您的浏览器不支持语音合成功能，请使用 Chrome、Safari 或 Edge 浏览器。</p>
            </div>
          </div>
        )}
        
        {/* 搜索和视图切换 */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <SearchBar 
              onSearch={setSearchKeyword} 
              placeholder="搜索单词或释义..."
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setDataType('detailed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                         ${dataType === 'detailed' 
                           ? 'bg-indigo-600 text-white' 
                           : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              <FileText className="w-4 h-4" />
              解析词汇
            </button>
            <button
              onClick={() => setDataType('basic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                         ${dataType === 'basic' 
                           ? 'bg-indigo-600 text-white' 
                           : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              <BookOpen className="w-4 h-4" />
              基础词汇
            </button>
            <button
              onClick={() => setShowVideoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                         bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600
                         shadow-md hover:shadow-lg"
              title="48个国际音标视频"
            >
              <Play className="w-4 h-4" />
              音标视频
            </button>
          </div>
        </div>
        
        {/* 视图切换 */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                       ${viewMode === 'all' 
                         ? 'bg-indigo-600 text-white' 
                         : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
          >
            <BookOpen className="w-4 h-4" />
            全部词汇
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                       ${viewMode === 'favorites' 
                         ? 'bg-rose-500 text-white' 
                         : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
          >
            <Heart className="w-4 h-4" />
            我的收藏
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧边栏 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 每日强制学习提醒 */}
            <div 
              className={`rounded-xl shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md
                         ${dailyTaskProgress.isCompleted 
                           ? 'bg-green-50 border-green-200' 
                           : 'bg-amber-50 border-amber-200'}`}
              onClick={() => setActiveModal('daily')}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {dailyTaskProgress.isCompleted ? (
                    <Flame className="w-5 h-5 text-green-600" />
                  ) : (
                    <Target className="w-5 h-5 text-amber-600" />
                  )}
                  <span className={`font-medium text-sm ${dailyTaskProgress.isCompleted ? 'text-green-700' : 'text-amber-700'}`}>
                    每日强制学习
                  </span>
                </div>
                {dailyTaskProgress.isCompleted && (
                  <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    已完成
                  </span>
                )}
              </div>
              
              {!dailyTaskProgress.isCompleted && (
                <>
                  <p className="text-xs text-amber-600 mb-2">
                    从未掌握词汇中精选5个，每日必须完成
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${(dailyTaskProgress.completed / dailyTaskProgress.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-amber-700">
                      {dailyTaskProgress.completed}/{dailyTaskProgress.total}
                    </span>
                  </div>
                </>
              )}
              
              {dailyTaskProgress.isCompleted && (
                <p className="text-xs text-green-600">
                  🎉 今日任务已完成，继续保持！
                </p>
              )}
            </div>

            {/* 学习模式入口 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">学习模式</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveModal('flashcard')}
                  className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">闪卡模式</span>
                </button>
                <button
                  onClick={() => setActiveModal('choice')}
                  className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">选择题</span>
                </button>
                <button
                  onClick={() => setActiveModal('spelling')}
                  className="flex flex-col items-center gap-2 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <PenTool className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">拼写练习</span>
                </button>
                <button
                  onClick={() => setActiveModal('stats')}
                  className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">学习统计</span>
                </button>
              </div>
            </div>
            
            {/* 文本朗读 */}
            <TextReader />
            
            {/* 字母过滤 */}
            <LetterFilter 
              selectedLetter={selectedLetter}
              onSelectLetter={setSelectedLetter}
              availableLetters={availableLetters}
            />
          </div>

          {/* 右侧词汇列表 */}
          <div className="lg:col-span-3">
            {filteredWords.length > 0 ? (
              <>
                {/* 结果统计 */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    显示 {filteredWords.length} 个词汇
                    {searchKeyword && ` · 搜索"${searchKeyword}"`}
                    {selectedLetter && ` · ${selectedLetter.toUpperCase()}开头`}
                  </p>
                </div>
                
                {/* 词汇网格 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredWords.map(word => (
                    dataType === 'detailed' ? (
                      <WordDetailCard 
                        key={word.id} 
                        word={word as any}
                        onFavoriteChange={handleFavoriteChange}
                      />
                    ) : (
                      <WordCard 
                        key={word.id} 
                        word={word as any}
                        onFavoriteChange={handleFavoriteChange}
                      />
                    )
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {viewMode === 'favorites' ? '暂无收藏' : '未找到匹配的词汇'}
                </h3>
                <p className="text-gray-500">
                  {viewMode === 'favorites' 
                    ? '点击词汇卡片上的心形图标添加收藏' 
                    : '请尝试其他搜索关键词'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              英语词汇学习助手 · 使用 Web Speech API 实现语音合成
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Volume2 className="w-4 h-4" />
              点击任意单词即可发音
            </div>
          </div>
        </div>
      </footer>
      
      {/* 模态框 */}
      {activeModal === 'flashcard' && (
        <FlashCardMode onClose={() => setActiveModal('none')} />
      )}
      {activeModal === 'choice' && (
        <ChoiceQuiz onClose={() => setActiveModal('none')} />
      )}
      {activeModal === 'spelling' && (
        <SpellingQuiz onClose={() => setActiveModal('none')} />
      )}
      {activeModal === 'daily' && (
        <DailyForcedReview 
          onClose={() => {
            setActiveModal('none');
            updateDailyTaskProgress();
            setRefreshKey(k => k + 1);
          }}
          onComplete={() => {
            updateDailyTaskProgress();
            setRefreshKey(k => k + 1);
          }}
        />
      )}
      {activeModal === 'stats' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">学习统计</h2>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <LearningDashboard />
            </div>
          </div>
        </div>
      )}
      
      {/* 设置弹窗 */}
      <SettingsModal 
        isOpen={activeModal === 'settings'} 
        onClose={() => setActiveModal('none')} 
      />

      {/* 音标视频弹窗 */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoSrc={`${import.meta.env.BASE_URL}phonetics.mp4`}
        title="48个国际音标"
      />
    </div>
  );
}