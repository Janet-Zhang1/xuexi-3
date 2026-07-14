/**
 * 学习进度存储服务
 * 管理学习记录、统计和设置
 */

import { 
  WordLearningRecord, 
  LearningGoal, 
  LearningStats, 
  DailyProgress,
  WrongWordEntry,
  DailyForcedTask,
  createEmptyLearningRecord,
  defaultLearningGoal,
  MasteryLevel
} from '../types/learning';
import { calculateNextReview, groupByMasteryLevel } from './srsAlgorithm';

const STORAGE_KEYS = {
  LEARNING_RECORDS: 'learning-records',
  LEARNING_STATS: 'learning-stats',
  LEARNING_GOAL: 'learning-goal',
  WRONG_WORDS: 'wrong-words',
  DAILY_PROGRESS: 'daily-progress',
  DAILY_FORCED_TASK: 'daily-forced-task',
  FORCED_WORDS_PER_DAY: 5
};

export class LearningService {
  private records: Map<number, WordLearningRecord>;
  private stats: LearningStats;
  private goal: LearningGoal;
  private wrongWords: Map<number, WrongWordEntry>;
  private dailyProgress: DailyProgress[];
  private dailyForcedTask: DailyForcedTask | null;

  constructor() {
    this.records = new Map();
    this.wrongWords = new Map();
    this.dailyProgress = [];
    this.dailyForcedTask = null;
    
    // 从localStorage加载数据
    this.loadFromStorage();
    
    // 初始化统计和目标
    this.stats = this.loadStats();
    this.goal = this.loadGoal();
  }

  // ===== 学习记录管理 =====

  // 获取单词的学习记录
  getRecord(wordId: number): WordLearningRecord | undefined {
    return this.records.get(wordId);
  }

  // 获取或创建学习记录
  getOrCreateRecord(wordId: number): WordLearningRecord {
    if (!this.records.has(wordId)) {
      this.records.set(wordId, createEmptyLearningRecord(wordId));
    }
    return this.records.get(wordId)!;
  }

  // 更新学习记录（练习后调用）
  updateAfterPractice(
    wordId: number, 
    isCorrect: boolean, 
    quality?: number
  ): WordLearningRecord {
    const record = this.getOrCreateRecord(wordId);
    
    // 如果没有提供quality，根据是否正确计算
    const practiceQuality = quality ?? (isCorrect ? 4 : 2);
    
    const updatedRecord = calculateNextReview(record, practiceQuality);
    
    // 添加练习历史
    updatedRecord.practiceHistory.push({
      type: 'flashcard',
      isCorrect,
      timestamp: new Date().toISOString()
    });
    
    this.records.set(wordId, updatedRecord);
    this.saveRecords();
    
    // 更新错词本
    if (!isCorrect) {
      this.addToWrongWords(wordId);
    }
    
    // 更新今日进度
    this.updateDailyProgress(isCorrect);
    
    return updatedRecord;
  }

  // 批量获取学习记录
  getRecords(wordIds: number[]): WordLearningRecord[] {
    return wordIds.map(id => this.getOrCreateRecord(id));
  }

  // 获取所有学习记录
  getAllRecords(): WordLearningRecord[] {
    return Array.from(this.records.values());
  }

  // 获取每日进度
  getDailyProgress(): DailyProgress[] {
    return this.dailyProgress;
  }

  // 按掌握状态获取词汇
  getWordsByMastery(level: MasteryLevel): WordLearningRecord[] {
    const grouped = groupByMasteryLevel(this.getAllRecords());
    return grouped[level] || [];
  }

  // ===== 错词本管理 =====

  private addToWrongWords(wordId: number): void {
    const existing = this.wrongWords.get(wordId);
    if (existing) {
      existing.wrongTimes++;
      existing.lastWrongAt = new Date().toISOString();
      existing.needsReview = true;
    } else {
      this.wrongWords.set(wordId, {
        wordId,
        wrongTimes: 1,
        lastWrongAt: new Date().toISOString(),
        wrongTypes: ['flashcard'],
        needsReview: true
      });
    }
    this.saveWrongWords();
  }

  getWrongWords(): WrongWordEntry[] {
    return Array.from(this.wrongWords.values())
      .filter(entry => entry.needsReview)
      .sort((a, b) => b.wrongTimes - a.wrongTimes);
  }

  removeFromWrongWords(wordId: number): void {
    const entry = this.wrongWords.get(wordId);
    if (entry) {
      entry.needsReview = false;
      this.saveWrongWords();
    }
  }

  // ===== 每日强制学习任务 =====

  // 获取今日强制学习任务
  getDailyForcedTask(allWordIds: number[]): DailyForcedTask {
    const today = new Date().toISOString().split('T')[0];
    
    // 如果没有今日任务或日期不对，生成新任务
    if (!this.dailyForcedTask || this.dailyForcedTask.date !== today) {
      this.dailyForcedTask = this.generateDailyForcedTask(allWordIds);
      this.saveDailyForcedTask();
    }
    
    return this.dailyForcedTask;
  }

  // 生成每日强制学习任务（从未掌握/盲区中选5个）
  private generateDailyForcedTask(allWordIds: number[]): DailyForcedTask {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取未掌握的单词（new + learning状态，即盲区和学习中）
    const unmasteredIds: number[] = [];
    
    for (const wordId of allWordIds) {
      const record = this.records.get(wordId);
      if (!record || record.masteryLevel === 'new' || record.masteryLevel === 'learning') {
        unmasteredIds.push(wordId);
      }
    }
    
    // 优先选错词本里的
    const wrongWordIds = Array.from(this.wrongWords.values())
      .filter(w => w.needsReview)
      .map(w => w.wordId);
    
    // 合并去重，错词本优先
    const priorityIds = [...new Set([...wrongWordIds, ...unmasteredIds])];
    
    // 随机选5个
    const shuffled = priorityIds.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, STORAGE_KEYS.FORCED_WORDS_PER_DAY);
    
    // 如果不够5个，从所有词里补
    if (selected.length < STORAGE_KEYS.FORCED_WORDS_PER_DAY && allWordIds.length > selected.length) {
      const remaining = allWordIds.filter(id => !selected.includes(id));
      const extra = remaining.sort(() => Math.random() - 0.5)
        .slice(0, STORAGE_KEYS.FORCED_WORDS_PER_DAY - selected.length);
      selected.push(...extra);
    }
    
    return {
      date: today,
      wordIds: selected,
      completedIds: [],
      isCompleted: false
    };
  }

  // 标记单词完成强制学习
  markForcedWordCompleted(wordId: number): void {
    if (!this.dailyForcedTask) return;
    
    if (!this.dailyForcedTask.completedIds.includes(wordId)) {
      this.dailyForcedTask.completedIds.push(wordId);
      
      // 检查是否全部完成
      if (this.dailyForcedTask.completedIds.length >= this.dailyForcedTask.wordIds.length) {
        this.dailyForcedTask.isCompleted = true;
      }
      
      this.saveDailyForcedTask();
    }
  }

  // 检查今日任务是否完成
  isTodayForcedTaskCompleted(): boolean {
    return this.dailyForcedTask?.isCompleted ?? false;
  }

  // ===== 学习目标 =====

  getGoal(): LearningGoal {
    return this.goal;
  }

  updateGoal(goal: Partial<LearningGoal>): void {
    this.goal = { ...this.goal, ...goal };
    this.saveGoal();
  }

  // ===== 学习统计 =====

  getStats(): LearningStats {
    return this.stats;
  }

  private updateDailyProgress(isCorrect: boolean): void {
    const today = new Date().toISOString().split('T')[0];
    let todayProgress = this.dailyProgress.find(p => p.date === today);
    
    if (!todayProgress) {
      todayProgress = {
        date: today,
        newWords: 0,
        reviewedWords: 0,
        correctRate: 0
      };
      this.dailyProgress.push(todayProgress);
    }
    
    // 更新今日数据
    todayProgress.reviewedWords++;
    const total = todayProgress.correctRate * (todayProgress.reviewedWords - 1);
    todayProgress.correctRate = (total + (isCorrect ? 1 : 0)) / todayProgress.reviewedWords;
    
    this.saveDailyProgress();
    this.updateStreak();
  }

  private updateStreak(): void {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // 检查昨天是否有学习记录
    const hasYesterdayProgress = this.dailyProgress.some(p => p.date === yesterday);
    
    if (hasYesterdayProgress) {
      this.stats.streakDays++;
      this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.streakDays);
    }
    
    this.saveStats();
  }

  // 获取GitHub风格热力图数据
  getHeatmapData(): { date: string; count: number; level: number }[] {
    const last90Days = this.dailyProgress
      .slice(-90)
      .map(p => ({
        date: p.date,
        count: p.newWords + p.reviewedWords,
        level: this.getHeatmapLevel(p.newWords + p.reviewedWords)
      }));
    
    return last90Days;
  }

  private getHeatmapLevel(count: number): number {
    if (count === 0) return 0;
    if (count < 5) return 1;
    if (count < 10) return 2;
    if (count < 20) return 3;
    return 4;
  }

  // ===== 存储操作 =====

  private loadFromStorage(): void {
    try {
      // 加载学习记录
      const recordsData = localStorage.getItem(STORAGE_KEYS.LEARNING_RECORDS);
      if (recordsData) {
        const records = JSON.parse(recordsData);
        this.records = new Map(records.map((r: WordLearningRecord) => [r.wordId, r]));
      }
      
      // 加载错词本
      const wrongWordsData = localStorage.getItem(STORAGE_KEYS.WRONG_WORDS);
      if (wrongWordsData) {
        const entries = JSON.parse(wrongWordsData);
        this.wrongWords = new Map(entries.map((e: WrongWordEntry) => [e.wordId, e]));
      }
      
      // 加载每日进度
      const progressData = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
      if (progressData) {
        this.dailyProgress = JSON.parse(progressData);
      }
      
      // 加载每日强制任务
      this.dailyForcedTask = this.loadDailyForcedTask();
    } catch (error) {
      console.warn('加载学习数据失败:', error);
    }
  }

  private loadStats(): LearningStats {
    try {
      const statsData = localStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
      if (statsData) {
        return JSON.parse(statsData);
      }
    } catch (error) {
      console.warn('加载统计数据失败:', error);
    }
    
    return {
      totalLearned: 0,
      totalMastered: 0,
      streakDays: 0,
      longestStreak: 0,
      totalPracticeTime: 0,
      weeklyProgress: [],
      weakPhonemes: []
    };
  }

  private loadGoal(): LearningGoal {
    try {
      const goalData = localStorage.getItem(STORAGE_KEYS.LEARNING_GOAL);
      if (goalData) {
        return { ...defaultLearningGoal, ...JSON.parse(goalData) };
      }
    } catch (error) {
      console.warn('加载目标设置失败:', error);
    }
    return defaultLearningGoal;
  }

  private saveRecords(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNING_RECORDS, JSON.stringify(Array.from(this.records.values())));
    } catch (error) {
      console.warn('保存学习记录失败:', error);
    }
  }

  private saveWrongWords(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WRONG_WORDS, JSON.stringify(Array.from(this.wrongWords.values())));
    } catch (error) {
      console.warn('保存错词本失败:', error);
    }
  }

  private saveDailyProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(this.dailyProgress));
    } catch (error) {
      console.warn('保存每日进度失败:', error);
    }
  }

  private saveStats(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNING_STATS, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('保存统计数据失败:', error);
    }
  }

  private saveGoal(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEARNING_GOAL, JSON.stringify(this.goal));
    } catch (error) {
      console.warn('保存目标设置失败:', error);
    }
  }

  private saveDailyForcedTask(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_FORCED_TASK, JSON.stringify(this.dailyForcedTask));
    } catch (error) {
      console.warn('保存每日强制任务失败:', error);
    }
  }

  private loadDailyForcedTask(): DailyForcedTask | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_FORCED_TASK);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('加载每日强制任务失败:', error);
    }
    return null;
  }
}

// 导出单例实例
export const learningService = new LearningService();