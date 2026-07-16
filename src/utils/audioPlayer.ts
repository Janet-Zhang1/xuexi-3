import { speechService } from './speech';
import { storageService } from './storage';

export type PronunciationMode = 'auto' | 'yilin' | 'tts';

interface AudioCache {
  [word: string]: string;
}

class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private audioCache: AudioCache = {};
  private checkingPromises: { [word: string]: Promise<boolean> } = {};
  private manifestWords: Set<string> = new Set();
  private manifestLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
      this.audio.addEventListener('error', () => {
        this.isPlaying = false;
      });
      this.loadManifest();
    }
    this.loadCache();
  }

  private async loadManifest(): Promise<void> {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${basePath}audio/manifest.json`, { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data.words && Array.isArray(data.words)) {
          this.manifestWords = new Set(data.words.map((w: string) => w.toLowerCase()));
          this.manifestLoaded = true;
        }
      }
    } catch (e) {
      console.warn('加载音频清单失败:', e);
    }
  }

  private loadCache(): void {
    try {
      const cached = localStorage.getItem('audio_url_cache');
      if (cached) {
        this.audioCache = JSON.parse(cached);
      }
    } catch (e) {
      this.audioCache = {};
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem('audio_url_cache', JSON.stringify(this.audioCache));
    } catch (e) {
      console.warn('保存音频缓存失败:', e);
    }
  }

  private getAudioUrl(word: string): string {
    const basePath = import.meta.env.BASE_URL || '/';
    return `${basePath}audio/${word.toLowerCase()}.mp3`;
  }

  private checkAudioExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const timer = setTimeout(() => resolve(false), 3000);
      audio.onloadeddata = () => {
        clearTimeout(timer);
        resolve(true);
      };
      audio.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      audio.src = url;
    });
  }

  private async checkWordExists(word: string): Promise<boolean> {
    const lowerWord = word.toLowerCase();
    
    if (this.audioCache[lowerWord] === 'exists') return true;
    if (this.audioCache[lowerWord] === 'not_exists') return false;
    
    if (this.manifestLoaded && this.manifestWords.has(lowerWord)) {
      this.audioCache[lowerWord] = 'exists';
      this.saveCache();
      return true;
    }
    
    if (this.checkingPromises[lowerWord]) {
      return this.checkingPromises[lowerWord];
    }
    
    const promise = this.checkAudioExists(this.getAudioUrl(word));
    this.checkingPromises[lowerWord] = promise;
    
    const exists = await promise;
    this.audioCache[lowerWord] = exists ? 'exists' : 'not_exists';
    this.saveCache();
    delete this.checkingPromises[lowerWord];
    
    return exists;
  }

  async speakWord(word: string, options?: { rate?: number; lang?: 'en-US' | 'en-GB' }): Promise<void> {
    if (this.isPlaying) return;

    const settings = storageService.getSettings();
    const mode: PronunciationMode = settings.pronunciationMode || 'auto';

    if (mode === 'tts') {
      return this.speakWithTTS(word, options);
    }

    const lowerWord = word.toLowerCase();
    const cached = this.audioCache[lowerWord];
    const audioUrl = this.getAudioUrl(word);

    if (mode === 'yilin') {
      if (cached === 'exists') {
        return this.playAudio(audioUrl, word, options);
      }
      if (cached === 'not_exists') {
        return this.speakWithTTS(word, options);
      }
      
      const exists = await this.checkWordExists(word);
      if (exists) {
        return this.playAudio(audioUrl, word, options);
      } else {
        return this.speakWithTTS(word, options);
      }
    }

    if (cached === 'exists') {
      return this.playAudio(audioUrl, word, options);
    }
    
    if (cached === 'not_exists') {
      return this.speakWithTTS(word, options);
    }

    this.checkWordExists(word);
    return this.speakWithTTS(word, options);
  }

  private playAudio(url: string, word: string, options?: { rate?: number; lang?: 'en-US' | 'en-GB' }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audio) {
        this.speakWithTTS(word, options).then(resolve).catch(reject);
        return;
      }

      this.isPlaying = true;
      this.audio.src = url;
      this.audio.playbackRate = options?.rate || 1;
      
      this.audio.onended = () => {
        this.isPlaying = false;
        resolve();
      };
      
      this.audio.onerror = () => {
        this.isPlaying = false;
        const lowerWord = word.toLowerCase();
        this.audioCache[lowerWord] = 'not_exists';
        this.saveCache();
        this.speakWithTTS(word, options).then(resolve).catch(reject);
      };

      this.audio.play().catch(() => {
        this.isPlaying = false;
        this.speakWithTTS(word, options).then(resolve).catch(reject);
      });
    });
  }

  private async speakWithTTS(word: string, options?: { rate?: number; lang?: 'en-US' | 'en-GB' }): Promise<void> {
    const settings = storageService.getSettings();
    return speechService.speak(word, {
      rate: options?.rate || settings.rate,
      lang: options?.lang || settings.voice,
    });
  }

  speakText(text: string, options?: { rate?: number; lang?: 'en-US' | 'en-GB' }): Promise<void> {
    return speechService.speakText(text, options);
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    speechService.stop();
    this.isPlaying = false;
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  clearCache(): void {
    this.audioCache = {};
    localStorage.removeItem('audio_url_cache');
  }

  hasYilinAudio(word: string): boolean {
    const lowerWord = word.toLowerCase();
    if (this.audioCache[lowerWord] === 'exists') return true;
    if (this.manifestLoaded && this.manifestWords.has(lowerWord)) return true;
    return false;
  }

  getYilinAudioCount(): number {
    if (this.manifestLoaded) {
      return this.manifestWords.size;
    }
    return Object.values(this.audioCache).filter(v => v === 'exists').length;
  }

  getCacheSize(): number {
    return Object.values(this.audioCache).filter(v => v === 'exists').length;
  }
}

export const audioPlayer = new AudioPlayerService();
