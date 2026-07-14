/**
 * SRS (Spaced Repetition System) 间隔重复算法
 * 基于 SM-2 算法实现
 */

import { WordLearningRecord, MasteryLevel } from '../types/learning';

// SM-2算法参数
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

// 复习间隔配置（艾宾浩斯遗忘曲线）
const REVIEW_INTERVALS = {
  // 针对不同掌握级别的初始间隔（天）
  initial: {
    new: 0,          // 立即学习
    learning: 1,     // 1天后
    familiar: 3,     // 3天后
    mastered: 7      // 7天后
  }
};

/**
 * 计算下次复习时间
 * @param record 当前学习记录
 * @param quality 回答质量（0-5，5=完美，0=完全忘记）
 */
export function calculateNextReview(
  record: WordLearningRecord,
  quality: number // 0-5
): WordLearningRecord {
  const now = new Date();
  
  // 根据回答质量更新掌握级别
  let newMasteryLevel = record.masteryLevel;
  if (quality >= 4) {
    // 答对
    if (record.masteryLevel === 'new') newMasteryLevel = 'learning';
    else if (record.masteryLevel === 'learning') newMasteryLevel = 'familiar';
    else if (record.masteryLevel === 'familiar') newMasteryLevel = 'mastered';
  } else if (quality <= 2) {
    // 答错，降级
    if (record.masteryLevel === 'mastered') newMasteryLevel = 'familiar';
    else if (record.masteryLevel === 'familiar') newMasteryLevel = 'learning';
    else if (record.masteryLevel === 'learning') newMasteryLevel = 'learning';
  }
  
  // 计算新的难度因子
  let newEaseFactor = record.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);
  
  // 计算新的间隔
  let newInterval: number;
  if (quality < 3) {
    // 答错，重置间隔
    newInterval = 1;
    newMasteryLevel = 'learning';
  } else if (record.interval === 0) {
    // 首次复习
    newInterval = 1;
  } else if (record.interval === 1) {
    // 第二次复习
    newInterval = 6;
  } else {
    // 后续复习，应用难度因子
    newInterval = Math.round(record.interval * newEaseFactor);
  }
  
  // 计算下次复习时间
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return {
    ...record,
    masteryLevel: newMasteryLevel,
    interval: newInterval,
    easeFactor: newEaseFactor,
    lastPracticeAt: now.toISOString(),
    nextReviewAt: nextReviewDate.toISOString(),
    correctCount: quality >= 3 ? record.correctCount + 1 : record.correctCount,
    wrongCount: quality < 3 ? record.wrongCount + 1 : record.wrongCount
  };
}

/**
 * 获取今天需要复习的词汇
 */
export function getWordsForReview(records: WordLearningRecord[]): WordLearningRecord[] {
  const now = new Date();
  return records.filter(record => {
    const nextReview = new Date(record.nextReviewAt);
    return nextReview <= now;
  });
}

/**
 * 获取今天需要学习的新词
 */
export function getNewWordsForLearning(records: WordLearningRecord[], dailyLimit: number): WordLearningRecord[] {
  return records
    .filter(record => record.masteryLevel === 'new')
    .slice(0, dailyLimit);
}

/**
 * 按掌握状态分组
 */
export function groupByMasteryLevel(records: WordLearningRecord[]): Record<MasteryLevel, WordLearningRecord[]> {
  return records.reduce((acc, record) => {
    const level = record.masteryLevel;
    if (!acc[level]) acc[level] = [];
    acc[level].push(record);
    return acc;
  }, {} as Record<MasteryLevel, WordLearningRecord[]>);
}

/**
 * 获取学习优先级队列
 * 优先复习到期词汇，然后是新词
 */
export function getPriorityQueue(
  records: WordLearningRecord[],
  newWordLimit: number,
  reviewLimit: number
): { review: WordLearningRecord[]; new: WordLearningRecord[] } {
  const forReview = getWordsForReview(records).slice(0, reviewLimit);
  const forLearning = getNewWordsForLearning(records, newWordLimit);
  
  return { review: forReview, new: forLearning };
}

/**
 * 计算记忆强度（百分比）
 */
export function calculateMemoryStrength(record: WordLearningRecord): number {
  const daysSinceLastPractice = Math.floor(
    (Date.now() - new Date(record.lastPracticeAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // 基于间隔和距离上次复习天数计算记忆强度
  if (record.masteryLevel === 'mastered') return 90 + Math.min(10, record.interval);
  if (record.masteryLevel === 'familiar') return 70 + Math.min(20, record.interval * 2);
  if (record.masteryLevel === 'learning') return 40 + Math.min(30, record.correctCount * 5);
  return 0;
}

/**
 * 预测遗忘概率
 */
export function predictForgettingProbability(record: WordLearningRecord): number {
  const daysSinceLastPractice = Math.floor(
    (Date.now() - new Date(record.lastPracticeAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // 基于遗忘曲线的简化模型
  const strength = calculateMemoryStrength(record);
  const decayRate = 1 / (record.interval + 1);
  const forgettingProb = 100 - strength * Math.exp(-decayRate * daysSinceLastPractice);
  
  return Math.max(0, Math.min(100, forgettingProb));
}