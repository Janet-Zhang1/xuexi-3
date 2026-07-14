// 本地存储管理模块
// 用于存储用户收藏和学习进度

export interface UserSettings {
  rate: number;       // 语速
  voice: 'en-US' | 'en-GB';  // 声音
  theme: 'light' | 'dark';   // 主题
}

export interface UserProgress {
  total: number;        // 总词汇数
  learned: number;      // 已学习词汇数
  lastVisit: string;    // 上次访问日期
}

export interface StorageData {
  favorites: number[];    // 收藏的词汇ID列表
  progress: UserProgress;
  settings: UserSettings;
}

const STORAGE_KEY = 'english-vocabulary-app';

// 默认数据
const defaultData: StorageData = {
  favorites: [],
  progress: {
    total: 1023,
    learned: 0,
    lastVisit: new Date().toISOString().split('T')[0]
  },
  settings: {
    rate: 1,
    voice: 'en-US',
    theme: 'light'
  }
};

// 存储服务类
export class StorageService {
  private data: StorageData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  // 从localStorage加载数据
  private loadFromStorage(): StorageData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultData, ...parsed };
      }
    } catch (error) {
      console.warn('加载本地存储失败:', error);
    }
    return { ...defaultData };
  }

  // 保存数据到localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn('保存到本地存储失败:', error);
    }
  }

  // 获取收藏列表
  getFavorites(): number[] {
    return this.data.favorites;
  }

  // 添加收藏
  addFavorite(wordId: number): void {
    if (!this.data.favorites.includes(wordId)) {
      this.data.favorites.push(wordId);
      this.saveToStorage();
    }
  }

  // 移除收藏
  removeFavorite(wordId: number): void {
    const index = this.data.favorites.indexOf(wordId);
    if (index > -1) {
      this.data.favorites.splice(index, 1);
      this.saveToStorage();
    }
  }

  // 检查是否已收藏
  isFavorite(wordId: number): boolean {
    return this.data.favorites.includes(wordId);
  }

  // 切换收藏状态
  toggleFavorite(wordId: number): boolean {
    if (this.isFavorite(wordId)) {
      this.removeFavorite(wordId);
      return false;
    } else {
      this.addFavorite(wordId);
      return true;
    }
  }

  // 获取学习进度
  getProgress(): UserProgress {
    return this.data.progress;
  }

  // 更新学习进度
  updateProgress(learned: number): void {
    this.data.progress.learned = learned;
    this.data.progress.lastVisit = new Date().toISOString().split('T')[0];
    this.saveToStorage();
  }

  // 获取用户设置
  getSettings(): UserSettings {
    return this.data.settings;
  }

  // 更新用户设置
  updateSettings(settings: Partial<UserSettings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveToStorage();
  }

  // 获取语速
  getRate(): number {
    return this.data.settings.rate;
  }

  // 设置语速
  setRate(rate: number): void {
    this.data.settings.rate = rate;
    this.saveToStorage();
  }

  // 获取声音
  getVoice(): 'en-US' | 'en-GB' {
    return this.data.settings.voice;
  }

  // 设置声音
  setVoice(voice: 'en-US' | 'en-GB'): void {
    this.data.settings.voice = voice;
    this.saveToStorage();
  }

  // 清除所有数据
  clearAll(): void {
    this.data = { ...defaultData };
    this.saveToStorage();
  }
}

// 导出单例实例
export const storageService = new StorageService();