import { useEffect, useRef } from 'react';
import { MicOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  isSelf?: boolean;
  name?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  className?: string;
}

export function VideoPlayer({
  stream,
  muted = false,
  isSelf = false,
  name,
  isMuted = false,
  isCameraOff = false,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#1a1a2e] ${className}`}
      id={isSelf ? 'video-self' : 'video-remote'}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isCameraOff || !stream ? 'opacity-0' : 'opacity-100'
        } ${isSelf ? 'scale-x-[-1]' : ''}`}
      />

      {/* Camera off overlay */}
      {(isCameraOff || !stream) && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
            {initials}
          </div>
        </div>
      )}

      {/* Name + indicators overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white drop-shadow-md">
            {name || 'Unknown'}{isSelf && ' (You)'}
          </span>
          {isMuted && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80">
              <MicOff className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
