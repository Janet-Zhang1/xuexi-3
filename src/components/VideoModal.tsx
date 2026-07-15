import { useRef, useEffect, useState } from 'react';
import { X, Play, RefreshCw } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      setHasError(false);
      setIsLoading(true);
    }
  }, [isOpen]);

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
            <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
              <RefreshCw className="w-10 h-10" />
              <p className="text-sm">视频加载失败</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
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
              preload="metadata"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            >
              您的浏览器不支持视频播放
            </video>
          )}
          
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2 text-white">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm">加载中...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
