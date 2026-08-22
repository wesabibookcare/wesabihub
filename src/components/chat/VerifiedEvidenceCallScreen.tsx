import React, { useState, useEffect, useRef } from 'react';
import {
  Video, ShieldCheck, X,
  VideoOff, Mic, MicOff, Info, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { communicationService } from '../../services/CommunicationService';
import { auditRepository } from '../../services/db/AuditRepository';
import { StorageService } from '../../services/StorageService';
import { paymentProtectionEngine } from '../../services/PaymentProtectionEngine';
import { toast } from 'sonner';

interface VerifiedEvidenceCallScreenProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  callType: 'VERIFIED_PACKING' | 'VERIFIED_UNPACKING';
  shipmentId?: string;
  parcelId?: string;
  trackingNumber?: string;
  SafePayId?: string;
}

// This records ONLY the current user's own camera as SafePay evidence --
// it is intentionally not a live two-way call. The seller records their own
// testing/packing video, and separately the buyer records their own
// unboxing/inspection video, each attached to the shipment's evidence trail.
export const VerifiedEvidenceCallScreen: React.FC<VerifiedEvidenceCallScreenProps> = ({
  isOpen,
  onClose,
  conversationId,
  callType,
  shipmentId = '',
  parcelId = '',
  trackingNumber = '',
  SafePayId = '',
}) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || user?.id || '';
  const currentUserRole = user?.role || 'CUSTOMER';
  const currentUserName = user?.displayName || 'User';

  const [stage, setStage] = useState<'CONSENT' | 'PREPARING' | 'RECORDING' | 'REVIEW' | 'SAVING'>('CONSENT');
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const label = callType === 'VERIFIED_PACKING' ? 'Seller Testing & Packing Evidence' : 'Buyer Unboxing & Inspection Evidence';

  const resetState = () => {
    setStage('CONSENT');
    setActiveSeconds(0);
    setMessageId(null);
    setCameraError(null);
    setRecordedBlob(null);
    setRecordedUrl(null);
    chunksRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setStage('PREPARING');
    setCameraError(null);
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(localStream);
      if (videoRef.current) videoRef.current.srcObject = localStream;

      // Register that this evidence recording started, on the conversation timeline
      const msg = await communicationService.startVerifiedCall(
        conversationId,
        currentUserId,
        currentUserRole,
        currentUserName,
        callType
      );
      setMessageId(msg.id);

      startRecording(localStream);
    } catch (err) {
      console.error('Camera access failed', err);
      setCameraError('Could not access your camera or microphone. Please allow camera access to record evidence.');
      setStage('CONSENT');
    }
  };

  const startRecording = (localStream: MediaStream) => {
    chunksRef.current = [];
    try {
      const supportedType = ['video/webm', 'video/webm;codecs=vp9', 'video/mp4']
        .find(t => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t));
      const recorder = supportedType
        ? new MediaRecorder(localStream, { mimeType: supportedType })
        : new MediaRecorder(localStream);
      const outputType = recorder.mimeType || 'video/webm';
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: outputType });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      recorderRef.current = recorder;
      setStage('RECORDING');
      setActiveSeconds(0);

      auditRepository.logAction(currentUserId, 'SAFEPAY_EVIDENCE_RECORDING_STARTED', {
        conversationId, callType, shipmentId, SafePayId, startedAt: new Date().toISOString()
      }, conversationId);
    } catch (err) {
      console.error('Recording failed to start', err);
      toast.error('Your browser could not start recording. Please try a different browser.');
      stopCameraTracks();
      setStage('CONSENT');
    }
  };

  const stopCameraTracks = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (stage === 'RECORDING') {
      timerRef.current = setInterval(() => setActiveSeconds(s => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const handleStopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    stopCameraTracks();
    setStage('REVIEW');
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    startCamera();
  };

  const handleSaveEvidence = async () => {
    if (!recordedBlob || !messageId) {
      onClose();
      return;
    }
    setStage('SAVING');
    try {
      const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `safepay-evidence-${Date.now()}.${ext}`, { type: recordedBlob.type || 'video/webm' });
      const uploadedUrl = await StorageService.uploadFile(
        `safepay-evidence/${conversationId}/${messageId}.${ext}`,
        file
      );

      await communicationService.saveVerifiedCallRecording(
        messageId,
        conversationId,
        uploadedUrl,
        activeSeconds
      );

      // Link the evidence directly to the SafePay transaction record itself
      // (not just the chat message) so the release/dispute flow can check
      // for its presence without having to search chat history.
      if (SafePayId) {
        try {
          await paymentProtectionEngine.recordEvidenceVideo(
            SafePayId,
            callType === 'VERIFIED_PACKING' ? 'SELLER' : 'BUYER',
            uploadedUrl,
            activeSeconds,
            currentUserId
          );
        } catch (linkErr) {
          console.error('Failed to link evidence video to SafePay record:', linkErr);
          // Non-fatal: the recording itself is already safely saved to the
          // chat message above, so don't block the user on this.
        }
      }

      await auditRepository.logAction(currentUserId, 'SAFEPAY_EVIDENCE_RECORDING_SAVED', {
        conversationId, callType, durationSeconds: activeSeconds, shipmentId, SafePayId
      }, conversationId);

      toast.success('Evidence video saved to this shipment.');
      onClose();
    } catch (err) {
      console.error('Error saving evidence recording', err);
      toast.error('Failed to save your evidence video. Please try again.');
      setStage('REVIEW');
    }
  };

  const handleCancel = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    stopCameraTracks();
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 text-white flex flex-col font-sans">

      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <ShieldCheck className="text-red-500" size={24} />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-100">{label}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">SafePay Evidence Recording — saved to this shipment's protection record</p>
          </div>
        </div>
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors self-end md:self-auto">
          <X size={20} />
        </button>
      </div>

      {/* CORE DISPLAY WINDOW */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 gap-6">

        {/* CONSENT STEP */}
        {stage === 'CONSENT' && (
          <div className="w-full max-w-md space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <Video size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Record SafePay Evidence</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                This records your own camera only — it is not a live call with the other party. Your video is saved to this
                shipment's SafePay evidence trail and can be used to resolve a dispute if one is raised.
              </p>
            </div>
            {cameraError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">{cameraError}</div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button onClick={startCamera} className="flex-1 bg-red-600 hover:bg-red-700">
                Start Recording
              </Button>
            </div>
          </div>
        )}

        {/* PREPARING (camera starting) */}
        {stage === 'PREPARING' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="animate-spin text-red-500" size={32} />
            <p className="text-sm text-slate-400">Starting your camera...</p>
          </div>
        )}

        {/* RECORDING */}
        {stage === 'RECORDING' && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 flex-1">
            <div className="relative w-full max-w-xl aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
              {cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              ) : (
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                  <VideoOff size={32} className="text-slate-600" />
                </div>
              )}
              <div className="absolute top-3 left-3 bg-red-600 text-white flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                REC {formatDuration(activeSeconds)}
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-[10px] px-3 py-1 rounded-xl border border-slate-800 font-semibold">
                {currentUserName} (You)
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setMicActive(!micActive);
                  stream?.getAudioTracks().forEach(t => t.enabled = !micActive);
                }}
                className={`p-3.5 rounded-full border transition-all ${micActive ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
              >
                {micActive ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={handleStopRecording}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold text-sm transition-transform active:scale-95"
              >
                Stop Recording
              </button>
              <button
                onClick={() => {
                  setCameraActive(!cameraActive);
                  stream?.getVideoTracks().forEach(t => t.enabled = !cameraActive);
                }}
                className={`p-3.5 rounded-full border transition-all ${cameraActive ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
              >
                {cameraActive ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* REVIEW before saving */}
        {stage === 'REVIEW' && (
          <div className="w-full max-w-xl space-y-6 animate-fade-in">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800">
              {recordedUrl && <video src={recordedUrl} controls className="w-full h-full object-contain bg-black" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
              <Info size={14} /> Review your recording ({formatDuration(activeSeconds)}) before saving it as evidence.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetake} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
                <RefreshCw size={16} /> Retake
              </Button>
              <Button onClick={handleSaveEvidence} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                <ShieldCheck size={16} /> Save as Evidence
              </Button>
            </div>
          </div>
        )}

        {/* SAVING */}
        {stage === 'SAVING' && (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-sm animate-fade-in">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Saving evidence...</h3>
              <p className="text-xs text-slate-400">Uploading your recording and linking it to this shipment's protection record.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
