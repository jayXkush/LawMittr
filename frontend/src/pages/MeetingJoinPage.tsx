import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, LogIn, AlertCircle, Settings } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { meetingsApi } from '@/api/meetings.api';
import { useAuthStore } from '@/store/authStore';

export function MeetingJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [meetingId, setMeetingId] = useState(searchParams.get('id') || '');
  const [password, setPassword] = useState(searchParams.get('pwd') || '');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera preview
  const startPreview = useCallback(async () => {
    try {
      setMediaError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setPreviewStream(stream);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setMediaError('Camera/microphone access denied. Please allow permissions in your browser settings.');
      } else {
        setMediaError('Could not access camera or microphone.');
      }
    }
  }, []);

  useEffect(() => {
    startPreview();
    return () => {
      // Cleanup preview on unmount
      setPreviewStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [startPreview]);

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Toggle preview mic
  const toggleMute = () => {
    if (!previewStream) return;
    const audioTrack = previewStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  // Toggle preview camera
  const toggleCamera = () => {
    if (!previewStream) return;
    const videoTrack = previewStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  // Validate meeting
  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await meetingsApi.validateMeeting(meetingId.trim(), password.trim());
      return res.data.data;
    },
    onSuccess: (data) => {
      // Stop preview stream before navigating
      previewStream?.getTracks().forEach((t) => t.stop());
      navigate(`/meeting/room/${meetingId.trim()}`, {
        state: {
          meetingPassword: password.trim(),
          meetingData: data,
        },
      });
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId.trim() || !password.trim()) return;
    validateMutation.mutate();
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-[#0f0f23]">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Join Consultation</h1>
            <p className="mt-2 text-white/50">
              Enter your meeting credentials to start the video call
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Camera Preview */}
            <div className="order-2 md:order-1">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#1a1a2e] shadow-2xl shadow-indigo-500/10">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${
                    isCameraOff || !previewStream ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                {(isCameraOff || !previewStream) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-3xl font-bold text-white shadow-lg shadow-purple-500/20">
                      {initials}
                    </div>
                  </div>
                )}
                {/* Preview controls */}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                  <button
                    onClick={toggleMute}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isMuted
                        ? 'bg-red-500/90 text-white'
                        : 'bg-black/40 text-white backdrop-blur-sm hover:bg-black/60'
                    }`}
                    id="preview-toggle-mute"
                  >
                    {isMuted ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                      isCameraOff
                        ? 'bg-red-500/90 text-white'
                        : 'bg-black/40 text-white backdrop-blur-sm hover:bg-black/60'
                    }`}
                    id="preview-toggle-camera"
                  >
                    {isCameraOff ? (
                      <VideoOff className="h-4 w-4" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {mediaError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/90 p-4">
                    <div className="text-center">
                      <Settings className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                      <p className="text-sm text-yellow-300">{mediaError}</p>
                      <button
                        onClick={startPreview}
                        className="mt-3 rounded-lg bg-white/10 px-4 py-1.5 text-sm text-white hover:bg-white/20"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-sm text-white/40">
                <Settings className="mr-1 inline h-3.5 w-3.5" />
                Check your camera and microphone before joining
              </p>
            </div>

            {/* Join Form */}
            <div className="order-1 md:order-2">
              <Card className="border-white/10 bg-[#1a1a2e]/80 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Video className="h-5 w-5 text-indigo-400" />
                    Meeting Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleJoin} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-white/70">Meeting ID</Label>
                      <Input
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="e.g. LM-A1B2C3D4"
                        className="border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/30"
                        required
                        id="input-meeting-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/70">Password</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter meeting password"
                        className="border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/30"
                        required
                        id="input-meeting-password"
                      />
                    </div>

                    {validateMutation.isError && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {(validateMutation.error as { response?: { data?: { message?: string } } })
                            ?.response?.data?.message || 'Invalid meeting credentials. Please check and try again.'}
                        </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#6366f1] text-white hover:bg-[#5558e6]"
                      size="lg"
                      isLoading={validateMutation.isPending}
                      id="btn-join-meeting"
                    >
                      <LogIn className="h-5 w-5" />
                      Join Meeting
                    </Button>
                  </form>

                  {user && (
                    <p className="mt-4 text-center text-xs text-white/30">
                      Joining as <span className="font-medium text-white/50">{user.name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
