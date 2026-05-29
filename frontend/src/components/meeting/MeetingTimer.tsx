import { Clock } from 'lucide-react';

interface MeetingTimerProps {
  formatted: string;
  slotInfo?: string; // e.g. "09:00 – 10:00"
}

export function MeetingTimer({ formatted, slotInfo }: MeetingTimerProps) {
  return (
    <div className="flex items-center gap-2 text-sm" id="meeting-timer">
      <Clock className="h-3.5 w-3.5 text-white/50" />
      <span className="font-mono font-medium text-white/80">{formatted}</span>
      {slotInfo && (
        <span className="text-xs text-white/30">· Scheduled {slotInfo}</span>
      )}
    </div>
  );
}
