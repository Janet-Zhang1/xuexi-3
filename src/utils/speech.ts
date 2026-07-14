// 语音合成服务类
// 使用Web Speech API实现单词发音和文本朗读功能

export interface SpeechOptions {
  rate?: number;      // 语速 0.1-10，默认1
  pitch?: number;     // 音调 0-2，默认1
  volume?: number;    // 音量 0-1，默认1
  lang?: 'en-US' | 'en-GB';  // 语言
}

export class SpeechService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // 检查浏览器是否支持Web Speech API
    if (!('speechSynthesis' in window)) {
      console.warn('当前浏览器不支持Web Speech API');
    }
    this.synth = window.speechSynthesis;
    this.initVoices();
  }

  // 初始化声音列表
  private initVoices(): void {
    // 某些浏览器（如Chrome）需要等待voiceschanged事件
    if (this.synth.getVoices().length > 0) {
      this.voices = this.synth.getVoices();
      this.isInitialized = true;
    } else {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this.isInitialized = true;
      };
    }
  }

  // 获取英语声音
  private getEnglishVoice(lang: 'en-US' | 'en-GB' = 'en-US'): SpeechSynthesisVoice | null {
    if (!this.isInitialized && this.synth.getVoices().length === 0) {
      // 尝试获取声音
      this.voices = this.synth.getVoices();
    }

    // 优先选择指定语言的声音
    const voice = this.voices.find(v => v.lang === lang);
    if (voice) return voice;

    // 如果没有找到，尝试选择任何英语声音
    const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
    return englishVoice || null;
  }

  // 发音单词
  speak(word: string, options: SpeechOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('当前浏览器不支持语音功能'));
        return;
      }

      // 停止当前播放
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      
      // 设置参数
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      utterance.lang = options.lang ?? 'en-US';

      // 设置声音
      const voice = this.getEnglishVoice(options.lang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`语音合成错误: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  // 朗读文本
  speakText(text: string, options: SpeechOptions = {}): Promise<void> {
    return this.speak(text, options);
  }

  // 暂停朗读
  pause(): void {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  // 继续朗读
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  // 停止朗读
  stop(): void {
    this.synth.cancel();
    this.currentUtterance = null;
  }

  // 检查是否正在播放
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  // 检查是否暂停
  isPaused(): boolean {
    return this.synth.paused;
  }

  // 获取可用的英语声音列表
  getEnglishVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized && this.synth.getVoices().length > 0) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  // 检查浏览器是否支持语音功能
  static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// 导出单例实例
export const speechService = new SpeechService();