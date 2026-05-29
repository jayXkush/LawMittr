import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionState } from '@/types/meeting';

interface ConnectionStatusProps {
  state: ConnectionState;
}

const stateConfig: Record<
  ConnectionState,
  { label: string; color: string; icon: 'connected' | 'disconnected' | 'loading' }
> = {
  idle: { label: 'Not connected', color: 'text-white/40', icon: 'disconnected' },
  connecting: { label: 'Connecting...', color: 'text-yellow-400', icon: 'loading' },
  waiting: { label: 'Waiting for peer', color: 'text-indigo-400', icon: 'loading' },
  connected: { label: 'Connected', color: 'text-emerald-400', icon: 'connected' },
  reconnecting: { label: 'Reconnecting...', color: 'text-yellow-400', icon: 'loading' },
  disconnected: { label: 'Disconnected', color: 'text-red-400', icon: 'disconnected' },
  failed: { label: 'Connection failed', color: 'text-red-400', icon: 'disconnected' },
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const config = stateConfig[state];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
      id="connection-status"
    >
      {config.icon === 'connected' && <Wifi className="h-3.5 w-3.5" />}
      {config.icon === 'disconnected' && <WifiOff className="h-3.5 w-3.5" />}
      {config.icon === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <span>{config.label}</span>
    </div>
  );
}
