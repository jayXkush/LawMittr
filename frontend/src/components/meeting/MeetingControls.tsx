import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  PhoneOff,
} from 'lucide-react';

interface MeetingControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  unreadMessages: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
}

export function MeetingControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  unreadMessages,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
}: MeetingControlsProps) {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl bg-[#16162a]/90 px-6 py-3 shadow-2xl backdrop-blur-xl"
      id="meeting-controls"
    >
      {/* Mute */}
      <button
        onClick={onToggleMute}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
          isMuted
            ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30 hover:bg-red-500'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
        id="btn-toggle-mute"
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {/* Camera */}
      <button
        onClick={onToggleCamera}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
          isCameraOff
            ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/30 hover:bg-red-500'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        id="btn-toggle-camera"
      >
        {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </button>

      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
          isScreenSharing
            ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30 hover:bg-[#5558e6]'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        id="btn-toggle-screen"
      >
        {isScreenSharing ? (
          <MonitorOff className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </button>

      {/* Chat */}
      <button
        onClick={onToggleChat}
        className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 ${
          isChatOpen
            ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30'
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title="Chat"
        id="btn-toggle-chat"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadMessages > 0 && !isChatOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        className="flex h-12 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 transition-all duration-200 hover:scale-105 hover:bg-red-700 active:scale-95"
        title="End call"
        id="btn-end-call"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
