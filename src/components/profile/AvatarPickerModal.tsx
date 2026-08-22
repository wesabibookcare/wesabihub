import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { NativeMediaHandler } from '../ui/NativeMediaHandler';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (fileOrBase64: File | string) => Promise<void>;
  currentAvatarUrl?: string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  onImageSelected,
  currentAvatarUrl
}) => {
  const [mode, setMode] = useState<'options' | 'camera' | 'upload'>('options');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop video stream on close or unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      setMode('options');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    setMode('camera');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? "Permission denied. Please enable camera access in your browser settings."
          : "Could not access camera. Please make sure no other application is using it, or upload an image instead."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');

      // Use original video dimensions to maintain quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply mirror transform if needed (since we mirrored the preview)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    } else {
      setCameraError("Camera not ready. Please try again in a moment.");
    }
  };

  const handleRetake = () => {
    startCamera();
  };

  const handleUseCapturedImage = async () => {
    if (!capturedImage) return;
    setIsProcessing(true);
    try {
      await onImageSelected(capturedImage);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }
    setIsProcessing(true);
    try {
      await onImageSelected(file);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="avatar-picker-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold dark:text-white font-display">Personalize Profile Picture</h3>
            <button type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {mode === 'options' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
                  <div className="relative">
                    <img
                      src={currentAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"}
                      className="w-24 h-24 rounded-full border-4 border-primary-500/10 object-cover"
                      alt="Current Avatar"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-primary-600/5 rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Identity Avatar</h4>
                    <p className="text-xs text-slate-500 mt-1">Select how you want to personalize your profile picture</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button"
                    onClick={() => setMode('upload')}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 transition-all text-center space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 flex items-center justify-center text-slate-500 group-hover:text-primary-600 transition-colors">
                      <Upload size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload File</span>
                  </button>

                  <NativeMediaHandler
                    captureMode="user"
                    label="Native Camera"
                    variant="secondary"
                    className="h-full"
                    onMediaCaptured={processFile}
                    icon={
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 flex items-center justify-center text-slate-500 group-hover:text-primary-600 transition-colors">
                        <Camera size={22} />
                      </div>
                    }
                  />
                </div>

                <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Embedded Preview</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="w-full rounded-2xl py-6 border-dashed border-2 flex flex-col h-auto gap-1"
                >
                  <span className="text-xs font-bold">Open Web-Cam Preview</span>
                  <span className="text-[10px] text-slate-400 font-normal">Real-time embedded mirroring</span>
                </Button>
              </div>
            )}

            {mode === 'upload' && (
              <div className="space-y-6">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-primary-500 bg-primary-50/10"
                      : "border-slate-200 dark:border-slate-800 hover:border-primary-500"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/20 flex items-center justify-center text-primary-600 mb-4">
                    <Upload size={28} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Drag and drop file</h4>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, or WEBP up to 5MB</p>
                  <Button type="button" variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-bold">
                    Browse Files
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <button type="button"
                    onClick={() => setMode('options')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Back to options
                  </button>
                </div>
              </div>
            )}

            {mode === 'camera' && (
              <div className="space-y-6">
                {cameraError ? (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex gap-3 text-xs leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{cameraError}</div>
                  </div>
                ) : (
                  <div className="relative aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 dark:border-slate-800">
                    {!capturedImage ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]" // mirror effect
                        />
                        <div className="absolute inset-0 border-4 border-white/20 rounded-2xl pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-4 flex justify-center">
                          <button type="button"
                            onClick={handleCapture}
                            className="w-14 h-14 bg-white hover:bg-slate-100 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-slate-800/20"
                          >
                            <div className="w-6 h-6 bg-primary-600 rounded-full" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <img
                          src={capturedImage}
                          alt="Captured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                      </>
                    )}
                  </div>
                )}

                {capturedImage && (
                  <div className="flex justify-center gap-3">
                    <Button type="button"
                      variant="outline"
                      onClick={handleRetake}
                      disabled={isProcessing}
                      className="rounded-xl flex items-center gap-1.5 text-xs font-bold"
                    >
                      <RefreshCw size={14} /> Retake
                    </Button>
                    <Button type="button"
                      onClick={handleUseCapturedImage}
                      disabled={isProcessing}
                      className="rounded-xl flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Check size={14} /> Use Photo
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button type="button"
                    onClick={() => { stopCamera(); setMode('options'); }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Back to options
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
