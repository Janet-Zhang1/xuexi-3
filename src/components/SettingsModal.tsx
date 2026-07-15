import { useState, useEffect } from 'react';
import { storageService, UserSettings } from '../utils/storage';
import { wordImageService } from '../utils/wordImage';
import { Settings, Volume2, Image, X, Info, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [cacheSize, setCacheSize] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 监听设置变化
  useEffect(() => {
    const currentSettings = storageService.getSettings();
    setSettings(currentSettings);
    setCacheSize(wordImageService.getCacheSize());
  }, [isOpen]);

  const handlePronunciationModeChange = (mode: 'auto' | 'yilin' | 'tts') => {
    const newSettings = { ...settings, pronunciationMode: mode };
    setSettings(newSettings);
    storageService.updateSettings(newSettings);
  };

  const handleShowImageChange = (show: boolean) => {
    const newSettings = { ...settings, showWordImage: show };
    setSettings(newSettings);
    storageService.updateSettings(newSettings);
  };

  const handleRateChange = (rate: number) => {
    const newSettings = { ...settings, rate };
    setSettings(newSettings);
    storageService.updateSettings(newSettings);
  };

  const handleVoiceChange = (voice: 'en-US' | 'en-GB') => {
    const newSettings = { ...settings, voice };
    setSettings(newSettings);
    storageService.updateSettings(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 发音模式设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">发音模式</h3>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => handlePronunciationModeChange('auto')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left
                  ${settings.pronunciationMode === 'auto' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">自动模式</span>
                  {settings.pronunciationMode === 'auto' && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">优先使用译林版音频，没有时自动切换到系统语音</p>
              </button>

              <button
                onClick={() => handlePronunciationModeChange('yilin')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left
                  ${settings.pronunciationMode === 'yilin' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">译林版音频</span>
                  {settings.pronunciationMode === 'yilin' && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">仅使用译林版教材配套音频（英音）</p>
              </button>

              <button
                onClick={() => handlePronunciationModeChange('tts')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left
                  ${settings.pronunciationMode === 'tts' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">系统语音 (TTS)</span>
                  {settings.pronunciationMode === 'tts' && (
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">使用浏览器内置语音合成引擎</p>
              </button>
            </div>

            {/* 译林版音频提示 */}
            {(settings.pronunciationMode === 'yilin' || settings.pronunciationMode === 'auto') && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">关于译林版音频</p>
                    <p>需要将音频文件放到项目的 <code className="bg-amber-100 px-1 rounded">public/audio/</code> 目录下，文件名格式为 <code className="bg-amber-100 px-1 rounded">单词.mp3</code>（如 <code className="bg-amber-100 px-1 rounded">underground.mp3</code>）</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TTS 设置（仅 TTS 模式或自动模式显示） */}
          {(settings.pronunciationMode === 'tts' || settings.pronunciationMode === 'auto') && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">语音设置</h3>
              
              {/* 语速调节 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">语速</span>
                  <span className="text-sm font-medium text-indigo-600">{settings.rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>慢</span>
                  <span>快</span>
                </div>
              </div>

              {/* 发音类型 */}
              <div>
                <span className="text-sm text-gray-600 block mb-2">发音类型</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVoiceChange('en-US')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all
                      ${settings.voice === 'en-US' 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    美音 (US)
                  </button>
                  <button
                    onClick={() => handleVoiceChange('en-GB')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all
                      ${settings.voice === 'en-GB' 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    英音 (UK)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 单词图片设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-5 h-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">单词图片</h3>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">显示单词图片</p>
                <p className="text-sm text-gray-500">在学习界面显示单词配图，帮助记忆</p>
              </div>
              <button
                onClick={() => handleShowImageChange(!settings.showWordImage)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200
                  ${settings.showWordImage ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                    ${settings.showWordImage ? 'left-7' : 'left-1'}`}
                ></span>
              </button>
            </div>

            {settings.showWordImage && (
              <p className="text-xs text-gray-500 mt-2">
                图片由 AI 根据中文释义自动生成，首次显示时需要加载时间
              </p>
            )}

            {/* 清除图片缓存 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">图片缓存</p>
                  <p className="text-xs text-gray-500 mt-0.5">已缓存 {cacheSize} 张单词图片</p>
                </div>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除缓存
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        wordImageService.clearCache();
                        setCacheSize(0);
                        setShowClearConfirm(false);
                      }}
                      className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      确认清除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}