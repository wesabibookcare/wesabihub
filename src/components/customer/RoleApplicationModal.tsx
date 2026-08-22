import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { roleApplicationRepository } from '@/src/services/db/RoleApplicationRepository';
import { RoleApplication, UserRole } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Camera, RefreshCw, Check, ArrowRight, ArrowLeft, Loader2, IdCard, UserCircle, MapPin } from 'lucide-react';

interface RoleApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  roleTitle: string;
  onSubmitted: () => void;
}

type DocType = 'NIN_CARD' | 'VOTERS_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';

const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: 'NIN_CARD', label: 'National ID (NIN)' },
  { id: 'VOTERS_CARD', label: "Voter's Card" },
  { id: 'PASSPORT', label: 'International Passport' },
  { id: 'DRIVERS_LICENSE', label: "Driver's License" },
];

// Steps: 0 = document type + capture, 1 = live facial capture, 2 = address, 3 = review/submit
export const RoleApplicationModal: React.FC<RoleApplicationModalProps> = ({
  isOpen, onClose, role, roleTitle, onSubmitted
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [docType, setDocType] = useState<DocType>('NIN_CARD');
  const [docImage, setDocImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (facingMode: 'user' | 'environment') => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 640, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setCameraError('Could not access your camera. Please allow camera access to continue, or check that your device has a working camera.');
    }
  };

  // Start the right camera for the current step whenever the modal / step changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    if (step === 0 && !docImage) startCamera('environment');
    else if (step === 1 && !selfieImage) startCamera('user');
    else stopCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step, docImage, selfieImage]);

  // Reset state whenever the modal is opened fresh
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setDocImage(null);
      setSelfieImage(null);
      setFullName(user?.displayName || '');
      setPhone(user?.phoneNumber || '');
      setAddress('');
      setCity('');
      setState('');
    }
  }, [isOpen, user]);

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  const handleCaptureDoc = () => {
    const frame = captureFrame();
    if (frame) { setDocImage(frame); stopCamera(); }
    else toast.error('Failed to capture your document. Please try again.');
  };

  const handleCaptureSelfie = () => {
    const frame = captureFrame();
    if (frame) { setSelfieImage(frame); stopCamera(); }
    else toast.error('Failed to capture your photo. Please try again.');
  };

  const canProceedFromStep = (s: number) => {
    if (s === 0) return !!docImage;
    if (s === 1) return !!selfieImage;
    if (s === 2) return fullName.trim() && phone.trim() && address.trim() && city.trim() && state.trim();
    return true;
  };

  const handleSubmit = async () => {
    const userId = user?.uid || user?.id;
    if (!userId) return;

    setSubmitting(true);
    try {
      const appId = `APP-${Date.now()}`;
      const application: RoleApplication = {
        id: appId,
        userId,
        role,
        status: 'SUBMITTED',
        data: {
          documentType: docType,
          document_id: docImage || '',
          document_selfie: selfieImage || '',
          fullName,
          phone,
          address,
          city,
          state,
        },
        documents: [docImage || '', selfieImage || ''].filter(Boolean),
        submittedAt: new Date().toISOString(),
      } as RoleApplication;

      await roleApplicationRepository.create(appId, application);
      toast.success('Application submitted! We will notify you once it has been reviewed.');
      onSubmitted();
      onClose();
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['Identity Document', 'Live Photo', 'Address', 'Review & Submit'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply for ${roleTitle}`}
      description="We need to verify your identity before this role can be activated on your account."
      size="lg"
    >
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              )}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={cn("h-0.5 flex-1", i < step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800")} />}
            </div>
          ))}
        </div>

        {/* Step 0: Document capture */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Select your document type</p>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDocType(d.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-xs font-bold text-left transition-all",
                    docType === d.id ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative">
              {docImage ? (
                <img src={docImage} alt="Captured document" className="w-full h-full object-cover" />
              ) : cameraError ? (
                <p className="text-white text-xs text-center p-6">{cameraError}</p>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex gap-3">
              {docImage ? (
                <Button variant="outline" onClick={() => { setDocImage(null); startCamera('environment'); }} className="flex-1 gap-2">
                  <RefreshCw size={16} /> Retake
                </Button>
              ) : (
                <Button onClick={handleCaptureDoc} disabled={!!cameraError} className="flex-1 gap-2 bg-primary-600 hover:bg-primary-700">
                  <IdCard size={16} /> Capture Document
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Hold your {DOC_TYPES.find(d => d.id === docType)?.label} steady and in focus. Make sure all details are clearly visible.</p>
          </div>
        )}

        {/* Step 1: Live facial capture */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Take a live photo of yourself</p>
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative">
              {selfieImage ? (
                <img src={selfieImage} alt="Captured selfie" className="w-full h-full object-cover" />
              ) : cameraError ? (
                <p className="text-white text-xs text-center p-6">{cameraError}</p>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              )}
            </div>
            <div className="flex gap-3">
              {selfieImage ? (
                <Button variant="outline" onClick={() => { setSelfieImage(null); startCamera('user'); }} className="flex-1 gap-2">
                  <RefreshCw size={16} /> Retake
                </Button>
              ) : (
                <Button onClick={handleCaptureSelfie} disabled={!!cameraError} className="flex-1 gap-2 bg-primary-600 hover:bg-primary-700">
                  <UserCircle size={16} /> Capture Photo
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">This must be a live photo taken now, not an uploaded picture. Make sure your face is clearly visible and well lit.</p>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin size={16} /> Confirm your real address</p>
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="As it appears on your ID" />
            <Input label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0801 234 5678" />
            <Input label="Street Address" value={address} onChange={e => setAddress(e.target.value)} placeholder="House number and street" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" value={city} onChange={e => setCity(e.target.value)} />
              <Input label="State" value={state} onChange={e => setState(e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Review your application</p>
            <div className="grid grid-cols-2 gap-3">
              {docImage && <img src={docImage} alt="Document" className="rounded-xl w-full aspect-video object-cover border border-slate-200 dark:border-slate-800" />}
              {selfieImage && <img src={selfieImage} alt="Selfie" className="rounded-xl w-full aspect-video object-cover border border-slate-200 dark:border-slate-800" />}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1">
              <p><span className="font-bold">Document:</span> {DOC_TYPES.find(d => d.id === docType)?.label}</p>
              <p><span className="font-bold">Name:</span> {fullName}</p>
              <p><span className="font-bold">Phone:</span> {phone}</p>
              <p><span className="font-bold">Address:</span> {address}, {city}, {state}</p>
            </div>
            <p className="text-[11px] text-slate-500">By submitting, you confirm this information is accurate. An admin will review your application and you'll be notified of the outcome.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => step === 0 ? onClose() : setStep(s => s - 1)} className="gap-2">
            <ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceedFromStep(step)} className="gap-2 bg-primary-600 hover:bg-primary-700">
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-primary-600 hover:bg-primary-700">
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Submit Application
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
