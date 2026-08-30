import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { roleApplicationRepository } from '@/src/services/db/RoleApplicationRepository';
import { RoleApplication, UserRole } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';
import { Camera, RefreshCw, Check, ArrowRight, ArrowLeft, Loader2, IdCard, UserCircle, MapPin, Upload } from 'lucide-react';

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
  const [docBackImage, setDocBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const [nin, setNin] = useState('');
  const [ninName, setNinName] = useState('');
  const [cac, setCac] = useState('');
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [activeCameraTarget, setActiveCameraTarget] = useState<'FRONT' | 'BACK' | 'SELFIE' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setActiveCameraTarget(null);
  };

  const startCamera = async (target: 'FRONT' | 'BACK' | 'SELFIE', facingMode: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    setActiveCameraTarget(target);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 640, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (err) {
      setCameraError('Could not access your camera. Please allow camera access, or upload a document photo from your device.');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          toast.success('File uploaded successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleCaptureDocFront = () => {
    const frame = captureFrame();
    if (frame) { setDocImage(frame); stopCamera(); }
    else toast.error('Failed to capture document front. Try uploading a photo instead.');
  };

  const handleCaptureDocBack = () => {
    const frame = captureFrame();
    if (frame) { setDocBackImage(frame); stopCamera(); }
    else toast.error('Failed to capture document back. Try uploading a photo instead.');
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current) {
      toast.error('Camera stream not ready.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Quality check 1: Brightness/Lighting
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalBrightness += (r * 299 + g * 587 + b * 114) / 1000;
      }
      const avgBrightness = totalBrightness / (data.length / 4);

      if (avgBrightness < 40) {
        toast.error('Lighting is too dark. Please move to a brighter environment or turn on lights.');
        return;
      }
      if (avgBrightness > 245) {
        toast.error('Lighting is too harsh or overexposed. Please avoid direct glare.');
        return;
      }

      // Quality check 2: Sharpness / Contrast variance
      let varianceSum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 16) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const diff = gray - avgBrightness;
        varianceSum += diff * diff;
      }
      const stdDev = Math.sqrt(varianceSum / (pixelCount / 4));

      if (stdDev < 15) {
        toast.error('Image appears blurry or dark/obscured. Please position your face clearly in the camera frame.');
        return;
      }

      const frame = canvas.toDataURL('image/jpeg', 0.9);
      setSelfieImage(frame);
      stopCamera();
    } catch (err) {
      toast.error('Failed to capture live face scan.');
    }
  };

  const canProceedFromStep = (s: number) => {
    if (s === 0) return !!docImage && !!docBackImage && !!nin.trim() && !!ninName.trim() && (role !== 'CENTER_OWNER' || !!cac.trim());
    if (s === 1) return !!selfieImage;
    if (s === 2) {
      const nameMatch = fullName.trim().toLowerCase() === ninName.trim().toLowerCase();
      return fullName.trim() && phone.trim() && address.trim() && city.trim() && state.trim() && nameMatch;
    }
    return true;
  };

  const handleSubmit = async () => {
    const userId = user?.uid || user?.id;
    if (!userId) return;

    if (fullName.trim().toLowerCase() !== ninName.trim().toLowerCase()) {
      toast.error('Your Full Name must match your Name on NIN exactly.');
      return;
    }

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
          nin,
          ninName,
          cac,
          document_id: docImage || '',
          document_nin_back: docBackImage || '',
          document_selfie: selfieImage || '',
          fullName,
          phone,
          address,
          city,
          state,
        },
        documents: [docImage || '', docBackImage || '', selfieImage || ''].filter(Boolean),
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

        {/* Step 0: NIN & Document capture */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">NIN Identification Details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="NIN (National ID Number)"
                inputMode="numeric"
                value={nin}
                onChange={e => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11-digit NIN (digits only)"
                required
              />
              <Input
                label="Name on NIN"
                value={ninName}
                onChange={e => setNinName(e.target.value)}
                placeholder="Must match Full Name"
                required
              />
            </div>

            {(role === 'CENTER_OWNER' || role === 'MERCHANT') && (
              <Input
                label={role === 'CENTER_OWNER' ? "CAC Registration Number (Required)" : "CAC Registration Number (Optional)"}
                value={cac}
                onChange={e => setCac(e.target.value.toUpperCase())}
                placeholder="e.g. RC123456"
                required={role === 'CENTER_OWNER'}
              />
            )}

            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 pt-2">Snap NIN Card (Front & Back)</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front Capture */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">NIN Card Front</span>
                <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative border border-slate-700">
                  {docImage ? (
                    <img src={docImage} alt="Captured NIN Front" className="w-full h-full object-cover" />
                  ) : activeCameraTarget === 'FRONT' ? (
                    cameraError ? (
                      <p className="text-white text-xs text-center p-4">{cameraError}</p>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      <IdCard size={28} className="mx-auto mb-1 opacity-50" />
                      No front photo attached
                    </div>
                  )}
                </div>

                {docImage ? (
                  <Button variant="outline" size="sm" onClick={() => { setDocImage(null); stopCamera(); }} className="w-full gap-1">
                    <RefreshCw size={14} /> Remove / Replace
                  </Button>
                ) : activeCameraTarget === 'FRONT' ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCaptureDocFront} disabled={!!cameraError} className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700">
                      <Camera size={14} /> Snap Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => startCamera('FRONT', 'environment')} className="gap-1 bg-primary-600 text-xs">
                      <Camera size={12} /> Camera
                    </Button>
                    <label className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <Upload size={12} className="mr-1" /> Upload
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setDocImage)} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Back Capture */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">NIN Card Back</span>
                <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative border border-slate-700">
                  {docBackImage ? (
                    <img src={docBackImage} alt="Captured NIN Back" className="w-full h-full object-cover" />
                  ) : activeCameraTarget === 'BACK' ? (
                    cameraError ? (
                      <p className="text-white text-xs text-center p-4">{cameraError}</p>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      <IdCard size={28} className="mx-auto mb-1 opacity-50" />
                      No back photo attached
                    </div>
                  )}
                </div>

                {docBackImage ? (
                  <Button variant="outline" size="sm" onClick={() => { setDocBackImage(null); stopCamera(); }} className="w-full gap-1">
                    <RefreshCw size={14} /> Remove / Replace
                  </Button>
                ) : activeCameraTarget === 'BACK' ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCaptureDocBack} disabled={!!cameraError} className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700">
                      <Camera size={14} /> Snap Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={() => startCamera('BACK', 'environment')} className="gap-1 bg-primary-600 text-xs">
                      <Camera size={12} /> Camera
                    </Button>
                    <label className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <Upload size={12} className="mr-1" /> Upload
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setDocBackImage)} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Live facial capture */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Camera Face Recognition Scan (Snapping Only)</p>
            <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative border border-slate-700">
              {selfieImage ? (
                <img src={selfieImage} alt="Captured selfie" className="w-full h-full object-cover" />
              ) : activeCameraTarget === 'SELFIE' ? (
                cameraError ? (
                  <p className="text-white text-xs text-center p-6">{cameraError}</p>
                ) : (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                )
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <UserCircle size={40} className="mx-auto mb-2 opacity-50" />
                  Live camera scan required
                </div>
              )}
            </div>

            {selfieImage ? (
              <Button variant="outline" onClick={() => { setSelfieImage(null); startCamera('SELFIE', 'user'); }} className="w-full gap-2">
                <RefreshCw size={16} /> Retake Face Scan
              </Button>
            ) : activeCameraTarget === 'SELFIE' ? (
              <div className="flex gap-3">
                <Button onClick={handleCaptureSelfie} disabled={!!cameraError} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Camera size={16} /> Snap Live Photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => startCamera('SELFIE', 'user')} className="w-full gap-2 bg-primary-600 hover:bg-primary-700">
                <Camera size={16} /> Open Camera for Face Scan
              </Button>
            )}
            <p className="text-[11px] text-slate-500">Live camera snap only. Blurry or dark photos will be rejected automatically.</p>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><MapPin size={16} /> Confirm your real address</p>
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="As it appears on your ID" />
            <Input
              label="Phone Number"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
              placeholder="e.g. 08012345678 (digits only)"
            />
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
