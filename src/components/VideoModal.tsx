import { useRef, useEffect, useState } from 'react';
import { X, Play, RefreshCw, AlertCircle } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoSrc, title = '视频播放' }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHasError(false);
      setIsLoading(true);
      setErrorMessage('');
      
      // 30秒超时
      const timer = setTimeout(() => {
        if (isLoading) {
          setHasError(true);
          setIsLoading(false);
          setErrorMessage('视频加载超时，请检查网络或重试');
        }
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setErrorMessage('');
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 视频区域 */}
        <div className="bg-black relative">
          {hasError ? (
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-gray-400 px-4">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <div className="text-center">
                <p className="text-sm text-gray-300 mb-1">视频加载失败</p>
                {errorMessage && (
                  <p className="text-xs text-gray-500 mb-3">{errorMessage}</p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  视频路径：{videoSrc}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                点击重试
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              className="w-full max-h-[70vh]"
              playsInline
              preload="auto"
              onLoadedData={() => setIsLoading(false)}
              onCanPlay={() => setIsLoading(false)}
              onError={(e) => {
                setHasError(true);
                setIsLoading(false);
                setErrorMessage('视频文件无法加载，请检查文件是否存在');
              }}
            >
              您的浏览器不支持视频播放
            </video>
          )}
          
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3 text-white">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
                <p className="text-sm">视频加载中，请稍候...</p>
                <p className="text-xs text-gray-400">视频约6MB，首次加载需要一点时间</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
