// 学习状态类型
export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered';

// 练习类型
export type PracticeType = 'flashcard' | 'choice' | 'spelling' | 'fillblank' | 'speaking';

// 单词学习记录
export interface WordLearningRecord {
  wordId: number;
  masteryLevel: MasteryLevel;
  correctCount: number;      // 正确次数
  wrongCount: number;        // 错误次数
  lastPracticeAt: string;    // 上次练习时间
  nextReviewAt: string;      // 下次复习时间（SRS算法）
  interval: number;          // 复习间隔（天）
  easeFactor: number;        // 难度因子（SM-2算法）
  practiceHistory: PracticeRecord[];
}

// 练习记录
export interface PracticeRecord {
  type: PracticeType;
  isCorrect: boolean;
  timestamp: string;
  responseTime?: number;     // 响应时间（毫秒）
  speakingScore?: number;    // 口语评分
}

// 学习目标设置
export interface LearningGoal {
  dailyNewWords: number;     // 每日新词数
  dailyReviewWords: number;  // 每日复习数
  weeklyGoal: number;        // 每周目标
  reminderTime?: string;     // 提醒时间
  reminderEnabled: boolean;
}

// 学习统计
export interface LearningStats {
  totalLearned: number;
  totalMastered: number;
  streakDays: number;        // 连续学习天数
  longestStreak: number;
  totalPracticeTime: number; // 总学习时间（分钟）
  weeklyProgress: DailyProgress[];
  weakPhonemes: string[];    // 薄弱音素
}

// 每日进度
export interface DailyProgress {
  date: string;
  newWords: number;
  reviewedWords: number;
  correctRate: number;
  speakingAvgScore?: number;
}

// 错词本条目
export interface WrongWordEntry {
  wordId: number;
  wrongTimes: number;
  lastWrongAt: string;
  wrongTypes: PracticeType[];
  needsReview: boolean;
}

// 每日强制学习任务
export interface DailyForcedTask {
  date: string;           // 日期 YYYY-MM-DD
  wordIds: number[];      // 当日需要强制学习的单词ID列表
  completedIds: number[]; // 已完成的单词ID列表
  isCompleted: boolean;   // 今日任务是否完成
}

// 默认学习目标
export const defaultLearningGoal: LearningGoal = {
  dailyNewWords: 10,
  dailyReviewWords: 30,
  weeklyGoal: 70,
  reminderTime: '12:00',
  reminderEnabled: true
};

// 掌握状态显示配置
export const masteryLevelConfig = {
  new: { label: '未学习', color: 'gray', icon: '○' },
  learning: { label: '学习中', color: 'amber', icon: '◐' },
  familiar: { label: '熟悉', color: 'blue', icon: '◑' },
  mastered: { label: '已掌握', color: 'green', icon: '●' }
};

// 获取初始学习记录
export function createEmptyLearningRecord(wordId: number): WordLearningRecord {
  return {
    wordId,
    masteryLevel: 'new',
    correctCount: 0,
    wrongCount: 0,
    lastPracticeAt: new Date().toISOString(),
    nextReviewAt: new Date().toISOString(),
    interval: 0,
    easeFactor: 2.5,  // SM-2算法默认难度因子
    practiceHistory: []
  };
}