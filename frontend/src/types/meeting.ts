export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface MeetingValidation {
  meetingId: string;
  date: string;
  startTime: string;
  endTime: string;
  client: { name: string; email: string };
  lawyer: { name: string; email: string };
  userRole: 'client' | 'lawyer';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export type ConnectionState =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export interface PeerInfo {
  peerId: string;
  peerName: string;
  peerRole: string;
}
