import { useCallback, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMeetingChat } from '@/hooks/useMeetingChat';
import { useMeetingTimer } from '@/hooks/useMeetingTimer';
import { VideoPlayer } from '@/components/meeting/VideoPlayer';
import { MeetingControls } from '@/components/meeting/MeetingControls';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { WaitingRoom } from '@/components/meeting/WaitingRoom';
import { ConnectionStatus } from '@/components/meeting/ConnectionStatus';
import { MeetingTimer } from '@/components/meeting/MeetingTimer';
import { Button } from '@/components/ui/button';
import type { MeetingValidation, ChatMessage } from '@/types/meeting';

interface LocationState {
  meetingPassword: string;
  meetingData: MeetingValidation;
}

export function MeetingRoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const state = location.state as LocationState | null;
  const meetingPassword = state?.meetingPassword || '';
  const meetingData = state?.meetingData;

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Chat hook
  const {
    messages: chatMessages,
    addMessage,
    setHistory,
    unreadCount,
    resetUnread,
  } = useMeetingChat();

  // Timer hook
  const timer = useMeetingTimer();

  // Chat callbacks (stable refs)
  const onChatMessage = useCallback(
    (msg: ChatMessage) => addMessage(msg),
    [addMessage]
  );
  const onChatHistory = useCallback(
    (msgs: ChatMessage[]) => setHistory(msgs),
    [setHistory]
  );

  // WebRTC hook
  const {
    localStream,
    remoteStream,
    connectionState,
    peerInfo,
    isMuted,
    isCameraOff,
    isScreenSharing,
    error,
    join,
    leave,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendChatMessage,
  } = useWebRTC({
    meetingId: meetingId || '',
    meetingPassword,
    onChatMessage,
    onChatHistory,
  });

  // Auto-join on mount
  useEffect(() => {
    if (!meetingId || !meetingPassword) {
      navigate('/meeting/join', { replace: true });
      return;
    }
    join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start timer when connected
  useEffect(() => {
    if (connectionState === 'connected' && !timer.isRunning) {
      timer.start();
    }
    if (connectionState === 'disconnected' || connectionState === 'failed') {
      timer.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  // Reset unread when chat opens
  useEffect(() => {
    if (isChatOpen) resetUnread();
  }, [isChatOpen, resetUnread]);

  // End call handler
  const handleEndCall = () => {
    leave();
    navigate('/dashboard/user', { replace: true });
  };

  // Redirect if no state
  if (!meetingId || !meetingPassword) {
    return null;
  }

  const slotInfo = meetingData
    ? `${meetingData.startTime} – ${meetingData.endTime}`
    : undefined;

  const userName = user?.name || 'You';

  return (
    <div className="flex h-screen flex-col bg-[#0f0f23] text-white" id="meeting-room">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-white/80">
            LawMittr <span className="text-indigo-400">Consultation</span>
          </h1>
          <ConnectionStatus state={connectionState} />
        </div>
        <div className="flex items-center gap-4">
          <MeetingTimer formatted={timer.formatted} slotInfo={slotInfo} />
          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-white/40">
            {meetingId}
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex flex-1 flex-col">
          {connectionState === 'waiting' ? (
            <WaitingRoom meetingId={meetingId} userName={userName} />
          ) : connectionState === 'failed' || connectionState === 'disconnected' ? (
            /* Error / disconnected state */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                {connectionState === 'failed' ? 'Connection Failed' : 'Disconnected'}
              </h2>
              {error && <p className="text-sm text-white/50">{error}</p>}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    join();
                  }}
                  className="bg-[#6366f1] hover:bg-[#5558e6]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rejoin
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEndCall}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Leave
                </Button>
              </div>
            </div>
          ) : (
            /* Video grid */
            <div className="relative flex flex-1 items-center justify-center p-4">
              {/* Remote video (large) */}
              <VideoPlayer
                stream={remoteStream}
                name={peerInfo?.peerName || 'Peer'}
                className="h-full w-full max-h-[75vh]"
              />

              {/* Self video (picture-in-picture) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-6 right-6 h-36 w-48 overflow-hidden rounded-xl border-2 border-white/10 shadow-2xl sm:h-44 sm:w-60"
              >
                <VideoPlayer
                  stream={localStream}
                  muted
                  isSelf
                  name={userName}
                  isMuted={isMuted}
                  isCameraOff={isCameraOff}
                  className="h-full w-full"
                />
              </motion.div>

              {/* Reconnecting overlay */}
              <AnimatePresence>
                {connectionState === 'reconnecting' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-400" />
                      <p className="text-lg font-medium text-white">Reconnecting...</p>
                      <p className="mt-1 text-sm text-white/50">
                        The other participant may have a connection issue
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Controls bar */}
          {connectionState !== 'failed' && connectionState !== 'disconnected' && (
            <div className="flex justify-center pb-4 pt-2">
              <MeetingControls
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                isScreenSharing={isScreenSharing}
                isChatOpen={isChatOpen}
                unreadMessages={unreadCount}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={toggleScreenShare}
                onToggleChat={() => setIsChatOpen((v) => !v)}
                onEndCall={handleEndCall}
              />
            </div>
          )}
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ChatPanel
                messages={chatMessages}
                currentUserId={user?.id || ''}
                onSend={sendChatMessage}
                onClose={() => setIsChatOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
