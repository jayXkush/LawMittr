import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { meetingsApi } from '@/api/meetings.api';
import type { ConnectionState, PeerInfo, ChatMessage } from '@/types/meeting';

const SOCKET_URL = (() => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;

  const api = import.meta.env.VITE_API_URL;
  if (api) return api.replace(/\/api\/?$/, '');

  return import.meta.env.DEV ? 'http://localhost:5000' : '';
})();

interface UseWebRTCOptions {
  meetingId: string;
  meetingPassword: string;
  onChatMessage?: (msg: ChatMessage) => void;
  onChatHistory?: (msgs: ChatMessage[]) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: ConnectionState;
  peerInfo: PeerInfo | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  error: string | null;
  join: () => Promise<void>;
  leave: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  sendChatMessage: (text: string) => void;
}

export function useWebRTC({
  meetingId,
  meetingPassword,
  onChatMessage,
  onChatHistory,
}: UseWebRTCOptions): UseWebRTCReturn {
  const token = useAuthStore((s) => s.token);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const isInitiatorRef = useRef<boolean>(false);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // Cleanup helper
  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    socketRef.current?.disconnect();
    socketRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setPeerInfo(null);
    setIsScreenSharing(false);
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(
    async (isInitiator: boolean) => {
      try {
        const res = await meetingsApi.getIceServers();
        const iceServers = res.data.data.iceServers;

        const pc = new RTCPeerConnection({ iceServers });
        pcRef.current = pc;

        // Add local tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        // Remote tracks
        const newRemoteStream = new MediaStream();
        remoteStreamRef.current = newRemoteStream;

        pc.ontrack = (event) => {
          newRemoteStream.addTrack(event.track);
          // Create a completely new MediaStream reference to trigger React state update
          const updatedStream = new MediaStream();
          newRemoteStream.getTracks().forEach(t => updatedStream.addTrack(t));
          setRemoteStream(updatedStream);
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit('ice-candidate', {
              meetingId,
              candidate: event.candidate.toJSON(),
            });
          }
        };

        // Connection state
        pc.onconnectionstatechange = () => {
          switch (pc.connectionState) {
            case 'connected':
              setConnectionState('connected');
              break;
            case 'disconnected':
              setConnectionState('reconnecting');
              break;
            case 'failed':
              setConnectionState('failed');
              setError('Connection failed. Please try rejoining.');
              break;
            case 'closed':
              setConnectionState('disconnected');
              break;
          }
        };

        // Create offer if initiator
        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.emit('offer', { meetingId, offer });
        }

        // Process any queued ICE candidates
        while (iceCandidateQueueRef.current.length > 0) {
          const candidate = iceCandidateQueueRef.current.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error('Queued ICE error', e);
            }
          }
        }

        return pc;
      } catch (err) {
        console.error('Failed to create peer connection:', err);
        setError('Failed to establish connection');
        return null;
      }
    },
    [meetingId]
  );

  // Join meeting
  const join = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }

    if (!SOCKET_URL) {
      setError('Socket service URL is not configured');
      setConnectionState('failed');
      return;
    }

    try {
      setConnectionState('connecting');
      setError(null);

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      // Connect socket
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      // Socket event handlers
      socket.on('connect', () => {
        socket.emit(
          'join-room',
          { meetingId, meetingPassword },
          (res: { success: boolean; error?: string; participants?: string[] }) => {
            if (!res.success) {
              setError(res.error || 'Failed to join room');
              setConnectionState('failed');
              cleanup();
              return;
            }
            // Joined successfully — waiting for peer or already connected
            if (res.participants && res.participants.length > 0) {
              setConnectionState('connected');
              isInitiatorRef.current = false; // The other person was already here, they will initiate
            } else {
              setConnectionState('waiting');
              isInitiatorRef.current = true; // I am the first one here, I will initiate when they join
            }
          }
        );
      });

      socket.on('connect_error', (err) => {
        setError(err.message || 'Connection failed');
        setConnectionState('failed');
      });

      // Peer ready — create peer connection
      socket.on('peer-ready', async (data: PeerInfo) => {
        setPeerInfo(data);
        // Ensure we don't recreate if we already have one
        if (!pcRef.current) {
          await createPeerConnection(isInitiatorRef.current);
        }
      });

      // Handle WebRTC signaling
      socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
        if (!pcRef.current) {
          await createPeerConnection(false);
        }
        const pc = pcRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { meetingId, answer });
      });

      socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

      socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
        const pc = pcRef.current;
        if (!pc) {
          // Queue candidate if PC is not ready yet
          iceCandidateQueueRef.current.push(data.candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          // Ignore ICE candidate errors during renegotiation
        }
      });

      // User joined (other peer)
      socket.on(
        'user-joined',
        (data: { userId: string; name: string; role: string; isReconnect: boolean }) => {
          setPeerInfo({ peerId: data.userId, peerName: data.name, peerRole: data.role });
          if (data.isReconnect) {
            setConnectionState('connected');
          }
        }
      );

      // User disconnected temporarily
      socket.on('user-disconnected', () => {
        setConnectionState('reconnecting');
      });

      // User left permanently
      socket.on('user-left', () => {
        pcRef.current?.close();
        pcRef.current = null;
        setRemoteStream(null);
        setPeerInfo(null);
        setConnectionState('waiting');
      });

      // Chat
      socket.on('chat-message', (msg: ChatMessage) => {
        onChatMessage?.(msg);
      });

      socket.on('chat-history', (msgs: ChatMessage[]) => {
        onChatHistory?.(msgs);
      });
    } catch (err) {
      console.error('Join error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera/microphone access denied. Please allow permissions and try again.');
      } else {
        setError('Failed to join meeting');
      }
      setConnectionState('failed');
      cleanup();
    }
  }, [token, meetingId, meetingPassword, connectionState, createPeerConnection, cleanup, onChatMessage, onChatHistory]);

  // Leave meeting
  const leave = useCallback(() => {
    socketRef.current?.emit('leave-room', { meetingId });
    cleanup();
    setConnectionState('disconnected');
  }, [meetingId, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  // Toggle screen share (replaces video track)
  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      // Stop screen share, restore camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      const cameraStream = localStreamRef.current;
      const cameraTrack = cameraStream?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        await sender?.replaceTrack(cameraTrack);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        await sender?.replaceTrack(screenTrack);

        // When user stops sharing via browser UI
        screenTrack.onended = () => {
          const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
          if (cameraTrack) {
            sender?.replaceTrack(cameraTrack);
          }
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch {
        // User cancelled screen share dialog
      }
    }
  }, [isScreenSharing]);

  // Send chat message
  const sendChatMessage = useCallback(
    (text: string) => {
      if (!socketRef.current || !text.trim()) return;
      socketRef.current.emit('chat-message', { meetingId, text: text.trim() });
    },
    [meetingId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
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
  };
}
