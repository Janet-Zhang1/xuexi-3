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

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
      this.audio.addEventListener('error', () => {
        this.isPlaying = false;
      });
    }
    this.loadCache();
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
      audio.onloadeddata = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.src = url;
    });
  }

  async speakWord(word: string, options?: { rate?: number; lang?: 'en-US' | 'en-GB' }): Promise<void> {
    if (this.isPlaying) return;

    const settings = storageService.getSettings();
    const mode: PronunciationMode = settings.pronunciationMode || 'auto';

    if (mode === 'tts') {
      return this.speakWithTTS(word, options);
    }

    const audioUrl = this.getAudioUrl(word);

    if (mode === 'yilin') {
      return this.playAudio(audioUrl, word, options);
    }

    const cached = this.audioCache[word.toLowerCase()];
    if (cached === 'exists') {
      return this.playAudio(audioUrl, word, options);
    } else if (cached === 'not_exists') {
      return this.speakWithTTS(word, options);
    }

    const exists = await this.checkAudioExists(audioUrl);
    if (exists) {
      this.audioCache[word.toLowerCase()] = 'exists';
      this.saveCache();
      return this.playAudio(audioUrl, word, options);
    } else {
      this.audioCache[word.toLowerCase()] = 'not_exists';
      this.saveCache();
      return this.speakWithTTS(word, options);
    }
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
}

export const audioPlayer = new AudioPlayerService();
