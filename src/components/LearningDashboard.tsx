import { useMemo } from 'react';
import { learningService } from '../services/learningService';
import { masteryLevelConfig, MasteryLevel } from '../types/learning';
import { 
  BarChart3, Target, TrendingUp, Calendar, 
  Check, X, AlertTriangle, BookOpen
} from 'lucide-react';

export function LearningDashboard() {
  const stats = learningService.getStats();
  const records = learningService.getAllRecords();
  const heatmapData = learningService.getHeatmapData();
  const goal = learningService.getGoal();
  
  // 按掌握状态统计
  const masteryStats = useMemo(() => {
    const grouped: Record<MasteryLevel, number> = {
      new: 0,
      learning: 0,
      familiar: 0,
      mastered: 0
    };
    
    records.forEach(r => {
      grouped[r.masteryLevel]++;
    });
    
    return grouped;
  }, [records]);
  
  // 总词汇数
  const totalWords = records.length;
  const learnedWords = records.filter(r => r.masteryLevel !== 'new').length;
  
  // 正确率
  const totalCorrect = records.reduce((sum, r) => sum + r.correctCount, 0);
  const totalWrong = records.reduce((sum, r) => sum + r.wrongCount, 0);
  const accuracy = totalCorrect + totalWrong > 0 
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
    : 0;
  
  // 本周进度
  const today = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    weekDays.push(date.toISOString().split('T')[0]);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">学习统计</h2>
          <p className="text-sm text-gray-500">追踪你的学习进度</p>
        </div>
      </div>
      
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-indigo-700">已学习</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{learnedWords}</p>
          <p className="text-xs text-indigo-600">/ {totalWords} 词</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">正确率</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{accuracy}%</p>
          <p className="text-xs text-green-600">{totalCorrect} 正确 / {totalWrong} 错误</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="text-sm text-amber-700">连续学习</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.streakDays} 天</p>
          <p className="text-xs text-amber-600">最长 {stats.longestStreak} 天</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">今日目标</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{goal.dailyNewWords}</p>
          <p className="text-xs text-purple-600">新词 / 天</p>
        </div>
      </div>
      
      {/* 掌握状态分布 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">掌握状态分布</h3>
        <div className="flex gap-2">
          {(Object.keys(masteryStats) as MasteryLevel[]).map(level => {
            const config = masteryLevelConfig[level];
            const count = masteryStats[level];
            const percentage = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0;
            
            const bgClassMap: Record<string, string> = {
              gray: 'bg-gray-50',
              amber: 'bg-amber-50',
              blue: 'bg-blue-50',
              green: 'bg-green-50'
            };
            const bgClass = bgClassMap[config.color] || bgClassMap.gray;
            
            return (
              <div 
                key={level}
                className={`flex-1 ${bgClass} rounded-lg p-3 text-center`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm text-gray-700">{config.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* GitHub风格热力图 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">学习热力图（最近90天）</h3>
        <div className="flex gap-1 flex-wrap">
          {heatmapData.length > 0 ? (
            heatmapData.map((day, index) => {
              const colors = [
                'bg-gray-100',
                'bg-green-100',
                'bg-green-300',
                'bg-green-500',
                'bg-green-700'
              ];
              
              return (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm ${colors[day.level]} cursor-pointer hover:ring-2 hover:ring-indigo-400`}
                  title={`${day.date}: ${day.count} 词`}
                />
              );
            })
          ) : (
            <p className="text-sm text-gray-400">暂无学习记录</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>少</span>
          <div className="w-3 h-3 bg-gray-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-200 rounded-sm" />
          <div className="w-3 h-3 bg-green-400 rounded-sm" />
          <div className="w-3 h-3 bg-green-600 rounded-sm" />
          <div className="w-3 h-3 bg-green-800 rounded-sm" />
          <span>多</span>
        </div>
      </div>
      
      {/* 本周学习统计 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">本周学习</h3>
        <div className="flex gap-2">
          {weekDays.map((day, index) => {
            const dayProgress = learningService.getDailyProgress().find(p => p.date === day);
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][new Date(day).getDay()];
            const isActive = dayProgress && (dayProgress.newWords + dayProgress.reviewedWords) > 0;
            
            return (
              <div key={day} className="flex-1 text-center">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1
                                ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-gray-500">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}