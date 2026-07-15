interface WordImageCache {
  [word: string]: string;
}

const IMAGE_CACHE_KEY = 'word_image_cache';
const IMAGE_SIZE = 'square_hd';

// 词性标记列表，用于从释义中提取核心中文意思
const POS_MARKERS = [
  'n.', 'n', 'v.', 'v', 'adj.', 'adj', 'adv.', 'adv',
  'prep.', 'prep', 'conj.', 'conj', 'pron.', 'pron',
  'art.', 'art', 'num.', 'num', 'int.', 'int',
  'v./n.', 'n./v.', 'adj./n.', 'n./adj.',
  'v./n', 'n./v', 'adj./n', 'n./adj',
];

// Emoji 分类映射：根据中文关键词的语义类别匹配 Emoji
const EMOJI_CATEGORIES: { keywords: string[]; emoji: string }[] = [
  // 人物/身份
  { keywords: ['老师', '教师', '学生', '医生', '护士', '工人', '农民', '警察', '司机', '厨师', '歌手', '演员', '作家', '科学家', '工程师'], emoji: '👤' },
  { keywords: ['男人', '男孩', '先生', '爸爸', '爷爷', '叔叔'], emoji: '👨' },
  { keywords: ['女人', '女孩', '女士', '妈妈', '奶奶', '阿姨'], emoji: '👩' },
  { keywords: ['孩子', '儿童', '婴儿'], emoji: '👶' },
  { keywords: ['朋友', '伙伴'], emoji: '👫' },
  { keywords: ['家庭', '家人'], emoji: '👨‍👩‍👧' },
  
  // 动物
  { keywords: ['动物', '野兽'], emoji: '🐾' },
  { keywords: ['猫', '小猫'], emoji: '🐱' },
  { keywords: ['狗', '小狗', '犬'], emoji: '🐶' },
  { keywords: ['鸟', '小鸟', '飞禽'], emoji: '🐦' },
  { keywords: ['鱼', '鱼类'], emoji: '🐟' },
  { keywords: ['马'], emoji: '🐴' },
  { keywords: ['牛', '奶牛'], emoji: '🐮' },
  { keywords: ['猪'], emoji: '🐷' },
  { keywords: ['羊', '绵羊'], emoji: '🐑' },
  { keywords: ['老虎', '虎'], emoji: '🐯' },
  { keywords: ['狮子'], emoji: '🦁' },
  { keywords: ['大象', '象'], emoji: '🐘' },
  { keywords: ['猴子', '猴'], emoji: '🐵' },
  { keywords: ['兔子', '兔'], emoji: '🐰' },
  { keywords: ['鸡', '公鸡', '母鸡'], emoji: '🐔' },
  { keywords: ['鸭', '鸭子'], emoji: '🦆' },
  { keywords: ['蛇'], emoji: '🐍' },
  { keywords: ['老鼠', '鼠'], emoji: '🐭' },
  
  // 食物
  { keywords: ['食物', '食品', '饮食'], emoji: '🍽️' },
  { keywords: ['苹果'], emoji: '🍎' },
  { keywords: ['香蕉'], emoji: '🍌' },
  { keywords: ['橙子', '橘子'], emoji: '🍊' },
  { keywords: ['葡萄'], emoji: '🍇' },
  { keywords: ['西瓜'], emoji: '🍉' },
  { keywords: ['草莓'], emoji: '🍓' },
  { keywords: ['水果'], emoji: '🍎' },
  { keywords: ['面包'], emoji: '🍞' },
  { keywords: ['蛋糕'], emoji: '🎂' },
  { keywords: ['米饭', '饭'], emoji: '🍚' },
  { keywords: ['面条', '面'], emoji: '🍜' },
  { keywords: ['汉堡', '汉堡包'], emoji: '🍔' },
  { keywords: ['披萨', '比萨'], emoji: '🍕' },
  { keywords: ['冰淇淋', '冰激凌'], emoji: '🍦' },
  { keywords: ['糖果', '糖'], emoji: '🍬' },
  { keywords: ['咖啡'], emoji: '☕' },
  { keywords: ['茶', '茶水'], emoji: '🍵' },
  { keywords: ['牛奶', '奶'], emoji: '🥛' },
  { keywords: ['水'], emoji: '💧' },
  { keywords: ['果汁'], emoji: '🧃' },
  
  // 自然/天气
  { keywords: ['太阳', '阳光'], emoji: '☀️' },
  { keywords: ['月亮', '月光'], emoji: '🌙' },
  { keywords: ['星星'], emoji: '⭐' },
  { keywords: ['云', '云朵'], emoji: '☁️' },
  { keywords: ['雨', '下雨', '雨水'], emoji: '🌧️' },
  { keywords: ['雪', '下雪'], emoji: '❄️' },
  { keywords: ['风', '刮风'], emoji: '💨' },
  { keywords: ['天气', '气候'], emoji: '🌤️' },
  { keywords: ['树', '树木', '森林'], emoji: '🌳' },
  { keywords: ['花', '花朵', '鲜花'], emoji: '🌸' },
  { keywords: ['草', '草地'], emoji: '🌱' },
  { keywords: ['山', '山脉'], emoji: '⛰️' },
  { keywords: ['河', '河流', '江'], emoji: '🏞️' },
  { keywords: ['海', '大海', '海洋'], emoji: '🌊' },
  { keywords: ['湖', '湖泊'], emoji: '🏞️' },
  { keywords: ['火', '火焰'], emoji: '🔥' },
  { keywords: ['石头', '岩石'], emoji: '🪨' },
  
  // 交通工具
  { keywords: ['汽车', '轿车', '小汽车'], emoji: '🚗' },
  { keywords: ['公共汽车', '公交车', '巴士'], emoji: '🚌' },
  { keywords: ['自行车', '单车'], emoji: '🚲' },
  { keywords: ['火车', '列车'], emoji: '🚆' },
  { keywords: ['飞机', '航空器'], emoji: '✈️' },
  { keywords: ['轮船', '船', '船舶'], emoji: '🚢' },
  { keywords: ['出租车', '的士'], emoji: '🚕' },
  { keywords: ['摩托车'], emoji: '🏍️' },
  
  // 建筑物/地点
  { keywords: ['房子', '房屋', '住宅'], emoji: '🏠' },
  { keywords: ['学校'], emoji: '🏫' },
  { keywords: ['医院'], emoji: '🏥' },
  { keywords: ['商店', '店铺', '商场'], emoji: '🏪' },
  { keywords: ['图书馆'], emoji: '📚' },
  { keywords: ['公园', '花园'], emoji: '🏞️' },
  { keywords: ['餐厅', '饭馆', '饭店'], emoji: '🍽️' },
  { keywords: ['银行'], emoji: '🏦' },
  { keywords: ['邮局'], emoji: '🏤' },
  { keywords: ['城市', '城镇'], emoji: '🏙️' },
  { keywords: ['村庄', '乡村'], emoji: '🏘️' },
  { keywords: ['机场'], emoji: '✈️' },
  { keywords: ['车站', '火车站'], emoji: '🚉' },
  
  // 学习/办公
  { keywords: ['书', '书本', '书籍'], emoji: '📖' },
  { keywords: ['笔', '钢笔', '铅笔'], emoji: '✏️' },
  { keywords: ['尺子'], emoji: '📏' },
  { keywords: ['书包'], emoji: '🎒' },
  { keywords: ['电脑', '计算机'], emoji: '💻' },
  { keywords: ['电话', '手机'], emoji: '📱' },
  { keywords: ['报纸'], emoji: '📰' },
  { keywords: ['邮件', '信'], emoji: '✉️' },
  { keywords: ['时钟', '表', '时间'], emoji: '⏰' },
  { keywords: ['钱', '金钱', '货币'], emoji: '💰' },
  { keywords: ['卡片', '名片'], emoji: '💳' },
  
  // 动作/动词
  { keywords: ['跑', '跑步'], emoji: '🏃' },
  { keywords: ['走', '走路', '行走'], emoji: '🚶' },
  { keywords: ['跳', '跳跃'], emoji: '🦘' },
  { keywords: ['游泳'], emoji: '🏊' },
  { keywords: ['吃', '吃饭', '食用'], emoji: '🍽️' },
  { keywords: ['喝', '喝水'], emoji: '🥤' },
  { keywords: ['睡觉', '睡眠'], emoji: '😴' },
  { keywords: ['学习', '学'], emoji: '📚' },
  { keywords: ['工作', '干活'], emoji: '💼' },
  { keywords: ['玩', '玩耍', '游戏'], emoji: '🎮' },
  { keywords: ['唱歌', '唱'], emoji: '🎤' },
  { keywords: ['跳舞', '舞蹈'], emoji: '💃' },
  { keywords: ['画画', '绘画', '画'], emoji: '🎨' },
  { keywords: ['读', '阅读', '看书'], emoji: '📖' },
  { keywords: ['写', '书写', '写作'], emoji: '✍️' },
  { keywords: ['听', '倾听'], emoji: '👂' },
  { keywords: ['看', '看见', '观看'], emoji: '👀' },
  { keywords: ['说', '说话', '讲'], emoji: '💬' },
  { keywords: ['买', '购买'], emoji: '🛒' },
  { keywords: ['卖', '出售'], emoji: '💰' },
  { keywords: ['开', '打开'], emoji: '🔓' },
  { keywords: ['关', '关闭'], emoji: '🔒' },
  { keywords: ['开始', '开始做'], emoji: '▶️' },
  { keywords: ['停止', '停下'], emoji: '⏹️' },
  { keywords: ['帮助', '帮忙'], emoji: '🤝' },
  { keywords: ['喜欢', '喜爱'], emoji: '❤️' },
  { keywords: ['想', '想要', '思考'], emoji: '🤔' },
  { keywords: ['知道', '了解'], emoji: '💡' },
  { keywords: ['制作', '制造', '做'], emoji: '🔨' },
  { keywords: ['使用', '用'], emoji: '👆' },
  { keywords: ['找到', '发现'], emoji: '🔍' },
  { keywords: ['给', '给予'], emoji: '🎁' },
  { keywords: ['拿', '取'], emoji: '🤏' },
  { keywords: ['放', '放置'], emoji: '📥' },
  { keywords: ['来', '来到'], emoji: '🚪' },
  { keywords: ['去', '离开'], emoji: '🚶' },
  { keywords: ['坐', '坐下'], emoji: '🪑' },
  { keywords: ['站', '站立'], emoji: '🧍' },
  { keywords: ['睡觉', '睡'], emoji: '😴' },
  { keywords: ['起床'], emoji: '🌅' },
  
  // 形容词
  { keywords: ['大', '大的'], emoji: '⬜' },
  { keywords: ['小', '小的'], emoji: '🔹' },
  { keywords: ['长', '长的'], emoji: '📏' },
  { keywords: ['短', '短的'], emoji: '📐' },
  { keywords: ['高', '高的'], emoji: '📏' },
  { keywords: ['矮', '矮的', '低'], emoji: '📉' },
  { keywords: ['新', '新的'], emoji: '🆕' },
  { keywords: ['旧', '旧的', '老'], emoji: '🗓️' },
  { keywords: ['好', '好的', '棒'], emoji: '👍' },
  { keywords: ['坏', '坏的', '糟糕'], emoji: '👎' },
  { keywords: ['快乐', '高兴', '开心'], emoji: '😊' },
  { keywords: ['伤心', '难过', '悲伤'], emoji: '😢' },
  { keywords: ['生气', '愤怒'], emoji: '😠' },
  { keywords: ['害怕', '恐惧'], emoji: '😨' },
  { keywords: ['热', '热的'], emoji: '🔥' },
  { keywords: ['冷', '冷的'], emoji: '❄️' },
  { keywords: ['快', '快的', '迅速'], emoji: '⚡' },
  { keywords: ['慢', '慢的'], emoji: '🐢' },
  { keywords: ['多', '多的', '许多'], emoji: '📦' },
  { keywords: ['少', '少的'], emoji: '🔻' },
  { keywords: ['美丽', '漂亮', '好看'], emoji: '🌸' },
  { keywords: ['丑', '丑陋'], emoji: '👺' },
  { keywords: ['干净', '清洁'], emoji: '🧼' },
  { keywords: ['脏', '肮脏'], emoji: '🧹' },
  { keywords: ['强壮', '强大'], emoji: '💪' },
  { keywords: ['虚弱', '弱'], emoji: '🩹' },
  { keywords: ['聪明', '智慧'], emoji: '🧠' },
  { keywords: ['笨', '愚蠢'], emoji: '🤡' },
  { keywords: ['饥饿', '饿'], emoji: '🍽️' },
  { keywords: ['口渴', '渴'], emoji: '💧' },
  { keywords: ['累', '疲倦'], emoji: '😩' },
  { keywords: ['健康', '健壮'], emoji: '💚' },
  { keywords: ['生病', '不舒服'], emoji: '🤒' },
  
  // 数字/时间
  { keywords: ['数字', '数'], emoji: '🔢' },
  { keywords: ['时间'], emoji: '⏰' },
  { keywords: ['今天'], emoji: '📅' },
  { keywords: ['明天'], emoji: '📆' },
  { keywords: ['昨天'], emoji: '📇' },
  { keywords: ['年'], emoji: '📅' },
  { keywords: ['月', '月份'], emoji: '📆' },
  { keywords: ['日', '天'], emoji: '📅' },
  { keywords: ['早上', '早晨'], emoji: '🌅' },
  { keywords: ['下午'], emoji: '🌞' },
  { keywords: ['晚上', '夜晚'], emoji: '🌙' },
  
  // 其他常用
  { keywords: ['颜色', '色彩'], emoji: '🎨' },
  { keywords: ['红色'], emoji: '🔴' },
  { keywords: ['蓝色'], emoji: '🔵' },
  { keywords: ['绿色'], emoji: '🟢' },
  { keywords: ['黄色'], emoji: '🟡' },
  { keywords: ['黑色'], emoji: '⚫' },
  { keywords: ['白色'], emoji: '⚪' },
  { keywords: ['问题', '疑问'], emoji: '❓' },
  { keywords: ['答案', '回答'], emoji: '✅' },
  { keywords: ['名字', '姓名'], emoji: '📛' },
  { keywords: ['年龄', '岁数'], emoji: '🎂' },
  { keywords: ['国家', '祖国'], emoji: '🇨🇳' },
  { keywords: ['语言', '话'], emoji: '🗣️' },
  { keywords: ['音乐', '歌曲'], emoji: '🎵' },
  { keywords: ['电影', '影片'], emoji: '🎬' },
  { keywords: ['运动', '体育'], emoji: '⚽' },
  { keywords: ['游戏', '比赛'], emoji: '🎮' },
  { keywords: ['节日', '假期'], emoji: '🎉' },
  { keywords: ['礼物', '礼品'], emoji: '🎁' },
  { keywords: ['爱', '爱情'], emoji: '❤️' },
  { keywords: ['家庭', '家'], emoji: '👨‍👩‍👧' },
  { keywords: ['世界', '地球'], emoji: '🌍' },
  { keywords: ['故事', '事情'], emoji: '📖' },
  { keywords: ['办法', '方法'], emoji: '💡' },
  { keywords: ['地方', '地点'], emoji: '📍' },
  { keywords: ['东西', '物品'], emoji: '📦' },
  { keywords: ['人', '人们'], emoji: '👥' },
];

// 词性对应的默认 Emoji
const POS_EMOJI: { [key: string]: string } = {
  'n': '📦',
  'v': '🏃',
  'adj': '🎨',
  'adv': '⚡',
  'prep': '📍',
  'conj': '🔗',
  'pron': '👤',
  'art': '🔤',
  'num': '🔢',
  'int': '💬',
};

class WordImageService {
  private cache: WordImageCache = {};
  private loadingWords: Set<string> = new Set();
  private pendingPromises: Map<string, Promise<string | null>> = new Map();

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const cached = localStorage.getItem(IMAGE_CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (e) {
      this.cache = {};
    }
  }

  private saveCache(): void {
    try {
      const entries = Object.entries(this.cache);
      const limited: WordImageCache = {};
      entries.slice(-200).forEach(([k, v]) => {
        limited[k] = v;
      });
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(limited));
    } catch (e) {
      console.warn('保存图片缓存失败:', e);
    }
  }

  private buildImageUrl(prompt: string): string {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=${IMAGE_SIZE}`;
  }

  // 从中文释义中提取核心关键词（去掉词性标记，取第一个主要意思）
  extractChineseKeyword(meaning: string): string {
    if (!meaning) return '';
    
    let result = meaning.trim();
    
    // 去掉开头的词性标记
    for (const marker of POS_MARKERS) {
      if (result.startsWith(marker + ' ') || result.startsWith(marker + '　')) {
        result = result.substring(marker.length).trim();
        break;
      }
    }
    
    // 去掉括号里的补充说明
    result = result.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
    
    // 取第一个主要意思（用分号、逗号、顿号分隔的，取第一个）
    const separators = ['；', ';', '，', ',', '、'];
    for (const sep of separators) {
      if (result.includes(sep)) {
        const parts = result.split(sep);
        if (parts[0].trim().length >= 2) {
          result = parts[0].trim();
          break;
        }
      }
    }
    
    // 如果太短，取前几个字
    if (result.length < 2) {
      return meaning;
    }
    
    return result;
  }

  // 根据中文关键词匹配 Emoji
  getEmojiForWord(meaning: string, pos?: string): string {
    const keyword = this.extractChineseKeyword(meaning);
    
    // 精确匹配关键词
    for (const category of EMOJI_CATEGORIES) {
      for (const kw of category.keywords) {
        if (keyword === kw || keyword.includes(kw)) {
          return category.emoji;
        }
      }
    }
    
    // 按词性返回默认 Emoji
    if (pos) {
      const posShort = pos.replace(/\./g, '').toLowerCase();
      for (const [key, emoji] of Object.entries(POS_EMOJI)) {
        if (posShort.startsWith(key)) {
          return emoji;
        }
      }
    }
    
    // 兜底返回通用图标
    return '📖';
  }

  // 生成基于中文释义的图片 prompt
  private generateChinesePrompt(word: string, meaning: string): string {
    const keyword = this.extractChineseKeyword(meaning);
    
    return `一张清晰的英语单词学习配图，单词"${word}"的中文意思是"${keyword}"。画面内容要直观表达"${keyword}"的含义，风格简洁明亮，色彩丰富，适合学生记忆单词，白色背景，高质量插画风格，没有文字。`;
  }

  getImageUrl(word: string, meaning?: string): string | null {
    const key = word.toLowerCase();
    return this.cache[key] || null;
  }

  async generateImage(word: string, meaning?: string, forceRegenerate = false): Promise<string | null> {
    const key = word.toLowerCase();

    if (!forceRegenerate && this.cache[key]) {
      return this.cache[key];
    }

    if (this.loadingWords.has(key)) {
      return this.pendingPromises.get(key) || null;
    }

    this.loadingWords.add(key);

    // 使用中文释义生成图片
    const prompt = this.generateChinesePrompt(word, meaning || word);

    const promise = this.fetchImage(prompt)
      .then((url) => {
        if (url) {
          this.cache[key] = url;
          this.saveCache();
        }
        return url;
      })
      .finally(() => {
        this.loadingWords.delete(key);
        this.pendingPromises.delete(key);
      });

    this.pendingPromises.set(key, promise);
    return promise;
  }

  private async fetchImage(prompt: string): Promise<string | null> {
    try {
      const url = this.buildImageUrl(prompt);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 15000);

        img.onload = () => {
          clearTimeout(timeout);
          resolve(url);
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        img.src = url;
      });
    } catch (e) {
      console.warn('生成图片失败:', e);
      return null;
    }
  }

  isLoading(word: string): boolean {
    return this.loadingWords.has(word.toLowerCase());
  }

  clearCache(): void {
    this.cache = {};
    localStorage.removeItem(IMAGE_CACHE_KEY);
  }

  // 清除单个单词的图片缓存
  clearWordCache(word: string): void {
    const key = word.toLowerCase();
    delete this.cache[key];
    this.saveCache();
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }
}

export const wordImageService = new WordImageService();
