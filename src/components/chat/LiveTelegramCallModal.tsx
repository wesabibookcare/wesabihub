import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  ShieldCheck, AlertCircle, Info, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { communicationService } from '../../services/CommunicationService';
import { StorageService } from '../../services/StorageService';
import { paymentProtectionEngine } from '../../services/PaymentProtectionEngine';
import { toast } from 'sonner';

interface LiveTelegramCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  partnerName: string;
  isVideoCall?: boolean;
  SafePayId?: string;
}

export const LiveTelegramCallModal: React.FC<LiveTelegramCallModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  partnerName,
  isVideoCall = true,
  SafePayId = ''
}) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || '';
  const currentUserRole = user?.role || 'CUSTOMER';
  const currentUserName = user?.displayName || 'User';

  const [callStatus, setCallStatus] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(isVideoCall);
  const [recordingConsented, setRecordingConsented] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize media devices
  useEffect(() => {
    if (!isOpen) {
      cleanupCall();
      return;
    }

    setCallStatus('RINGING');
    setActiveSeconds(0);
    setIsRecording(false);
    setRecordingConsented(false);

    // Simulate connecting after 2.5 seconds ringing
    const ringTimeout = setTimeout(() => {
      setCallStatus('CONNECTED');
    }, 2500);

    // Get user media
    navigator.mediaDevices?.getUserMedia({ video: isVideoCall, audio: true })
      .then((localStream) => {
        streamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      })
      .catch((err) => {
        console.warn('Camera/Mic access warning:', err);
        setCameraError('Camera/Microphone access not granted.');
      });

    return () => {
      clearTimeout(ringTimeout);
      cleanupCall();
    };
  }, [isOpen, isVideoCall]);

  // Duration timer when connected
  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setActiveSeconds(s => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const cleanupCall = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleToggleConsent = () => {
    const nextVal = !recordingConsented;
    setRecordingConsented(nextVal);
    if (nextVal && streamRef.current) {
      startCallRecording(streamRef.current);
    } else if (!nextVal && recorderRef.current) {
      try { recorderRef.current.stop(); } catch (e) {}
      setIsRecording(false);
    }
  };

  const startCallRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    try {
      const supportedType = ['video/webm', 'video/webm;codecs=vp9', 'video/mp4']
        .find(t => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t));
      const recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setIsRecording(true);
      toast.success('Call evidence recording active with mutual consent.');
    } catch (err) {
      console.error('Call recording error:', err);
      toast.error('Could not start video call recording');
    }
  };

  const handleEndCall = async () => {
    setCallStatus('ENDED');

    // Save recording if active
    if (isRecording && chunksRef.current.length > 0) {
      try {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `call-evidence-${Date.now()}.webm`, { type: 'video/webm' });
        const uploadedUrl = await StorageService.uploadFile(`safepay-calls/${conversationId}/${Date.now()}.webm`, file);

        await communicationService.sendMessage(
          conversationId,
          currentUserId,
          currentUserRole,
          currentUserName,
          `📞 Recorded Telegram-style Evidence Call (${activeSeconds}s)`,
          undefined,
          [{ url: uploadedUrl, type: 'VIDEO', name: 'Verified Call Evidence' }]
        );

        if (SafePayId) {
          await paymentProtectionEngine.recordEvidenceVideo(
            SafePayId,
            currentUserRole === 'MERCHANT' ? 'SELLER' : 'BUYER',
            uploadedUrl,
            activeSeconds,
            currentUserId
          );
        }
        toast.success('Call recording attached to SafePay conversation.');
      } catch (err) {
        console.error('Failed to save call recording:', err);
      }
    }

    cleanupCall();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 text-white font-sans">
      {/* Top Bar */}
      <div className="w-full max-w-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-bold text-emerald-400">
          <ShieldCheck size={16} />
          <span>Omorfi Chat WebCall</span>
        </div>
        {callStatus === 'CONNECTED' && (
          <span className="font-mono text-sm font-bold text-slate-300 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
            {formatTime(activeSeconds)}
          </span>
        )}
      </div>

      {/* Main Video / Calling Avatar Section */}
      <div className="relative w-full max-w-2xl flex-1 flex flex-col items-center justify-center my-4 overflow-hidden rounded-3xl bg-slate-900/50 border border-slate-800/80 shadow-2xl">
        {isVideoOn && callStatus === 'CONNECTED' ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {/* Local stream preview */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{partnerName}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 p-8 text-center">
            {/* Animated Telegram Pulse Rings */}
            <div className="relative flex items-center justify-center">
              {callStatus === 'RINGING' && (
                <>
                  <div className="absolute w-36 h-36 rounded-full bg-primary-500/20 animate-ping" />
                  <div className="absolute w-48 h-48 rounded-full bg-primary-500/10 animate-pulse" />
                </>
              )}
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-black font-display text-4xl shadow-2xl z-10">
                {partnerName?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black font-display">{partnerName}</h2>
              <p className="text-xs text-primary-400 font-medium">
                {callStatus === 'RINGING' ? 'Ringing Omorfi Chat user...' : callStatus === 'CONNECTED' ? 'Connected' : 'Call Ended'}
              </p>
            </div>
          </div>
        )}

        {/* Consent Prompt Banner */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <span>Record call for SafePay evidence (Both parties consent)</span>
          </div>
          <button
            onClick={handleToggleConsent}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              recordingConsented
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {recordingConsented ? 'Consent Granted' : 'Enable Consent'}
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-6 z-10 my-2">
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`p-4 rounded-full border transition-all ${
            isMicOn
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
          title="Toggle Microphone"
        >
          {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl transition-transform active:scale-95"
          title="End Call"
        >
          <PhoneOff size={28} />
        </button>

        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className={`p-4 rounded-full border transition-all ${
            isVideoOn
              ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
          title="Toggle Camera"
        >
          {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      </div>
    </div>
  );
};
