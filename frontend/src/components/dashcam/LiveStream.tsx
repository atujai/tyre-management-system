import React, { useRef, useEffect, useState } from 'react';

interface Props {
  streamUrl?: string;
  onStop: () => void;
}

export const LiveStream: React.FC<Props> = ({ streamUrl, onStop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamUrl) {
      setError('No stream URL provided');
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Try to load stream
    video.src = streamUrl;
    video.load();

    const handleCanPlay = () => {
      setIsLoading(false);
      video.play().catch((err) => {
        setError('Failed to autoplay: ' + err.message);
      });
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Stream failed to load');
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.pause();
      video.src = '';
    };
  }, [streamUrl]);

  return (
    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        muted
        playsInline
        className={`w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Live indicator */}
      {!isLoading && !error && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-medium">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      {/* Stop button */}
      <button
        onClick={onStop}
        className="absolute top-4 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Stop Stream
      </button>
    </div>
  );
};