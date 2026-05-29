import { motion } from 'framer-motion';
import { Loader2, Users } from 'lucide-react';

interface WaitingRoomProps {
  meetingId: string;
  userName: string;
}

export function WaitingRoom({ meetingId, userName }: WaitingRoomProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#0f0f23] p-8 text-center">
      {/* Animated ring */}
      <motion.div
        className="relative flex h-28 w-28 items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-indigo-400/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-lg shadow-indigo-500/30">
          <Users className="h-8 w-8 text-white" />
        </div>
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">Waiting for other participant</h2>
        <p className="text-sm text-white/50">
          You've joined as <span className="font-medium text-indigo-400">{userName}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>
          Meeting ID: <code className="font-mono text-white/60">{meetingId}</code>
        </span>
      </div>

      <p className="max-w-xs text-xs text-white/30">
        The other participant will see a notification to join. Please wait while they connect.
      </p>
    </div>
  );
}
