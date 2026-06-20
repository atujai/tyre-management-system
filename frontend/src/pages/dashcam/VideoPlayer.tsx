import React, { useRef, useEffect } from 'react';

interface Props {
  src?: string;
  streamUrl?: string;
}

export const VideoPlayer: React.FC<Props> = ({ src, streamUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (streamUrl && videoRef.current) {
      // For HLS streams, you'd use hls.js here
      videoRef.current.src = streamUrl;
    }
  }, [streamUrl]);

  return (
    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
      {src || streamUrl ? (
        <video
          ref={videoRef}
          src={src}
          controls
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-500">
          No video source
        </div>
      )}
    </div>
  );
};