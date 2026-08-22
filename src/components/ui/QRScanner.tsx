import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Zap, ZapOff, RefreshCw, Upload } from 'lucide-react';
import { Button } from './Button';
import { NativeMediaHandler } from './NativeMediaHandler';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanFailure,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-custom';

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(containerId);
    scannerRef.current = html5QrCode;

    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));
        // Default to back camera if possible
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear')
        );
        const initialCameraId = backCamera ? backCamera.id : devices[0].id;
        setCurrentCameraId(initialCameraId);
        startScanner(initialCameraId);
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
      if (onScanFailure) onScanFailure("No cameras found or permission denied.");
    });

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraId: string) => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.start(
        cameraId,
        {
          fps,
          qrbox,
          aspectRatio,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        (decodedText) => {
          playSuccessFeedback();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Failure callback is noisy, only use if explicitly needed
          if (onScanFailure && !errorMessage.includes("NotFoundException")) {
            onScanFailure(errorMessage);
          }
        }
      );

      setIsScannerActive(true);

      // Check for torch capability
      const track = scannerRef.current.getVideoTrack();
      const capabilities = track?.getCapabilities() as any;
      setHasTorch(!!capabilities?.torch);
      setIsTorchOn(false);

    } catch (err) {
      console.error("Unable to start scanner", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScannerActive(false);
      } catch (err) {
        console.error("Unable to stop scanner", err);
      }
    }
  };

  const playSuccessFeedback = () => {
    // 1. Haptic Feedback (Vibration)
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }

    // 2. Audio Feedback (Web Audio API Synth Chime)
    if (typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); // Slide to E6

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } catch (err) {
        console.warn("Audio feedback failed:", err);
      }
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setCurrentCameraId(nextCameraId);
    startScanner(nextCameraId);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorchState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        //@ts-ignore - torch is not in standard types but supported by html5-qrcode/browsers
        advanced: [{ torch: nextTorchState }]
      });
      setIsTorchOn(nextTorchState);
    } catch (err) {
      console.error("Error toggling torch", err);
    }
  };

  const handleFileScan = async (file: File) => {
    if (!scannerRef.current) return;
    try {
      // Stop live camera if running
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setIsScannerActive(false);
      }

      const decodedText = await scannerRef.current.scanFile(file, true);
      playSuccessFeedback();
      onScanSuccess(decodedText);
    } catch (err) {
      console.error("File scan failed", err);
      if (onScanFailure) onScanFailure("No QR code found in the image. Please try another photo.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-full max-w-md mx-auto overflow-hidden rounded-3xl border-4 border-slate-100 dark:border-slate-800 bg-black relative shadow-2xl">
        <div id={containerId} className="w-full aspect-square bg-slate-950" />

        {/* Overlay UI */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
          <div className="w-full h-full border-2 border-primary-500/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-md" />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6 pointer-events-auto">
          {cameras.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={switchCamera}
              className="rounded-full w-12 h-12 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 text-white"
            >
              <RefreshCw size={20} className={isScannerActive ? "" : "animate-spin"} />
            </Button>
          )}

          {hasTorch && (
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleTorch}
              className={cn(
                  "rounded-full w-12 h-12 p-0 backdrop-blur-md border-white/10 text-white",
                  isTorchOn ? "bg-yellow-500/80 hover:bg-yellow-500" : "bg-white/10 hover:bg-white/20"
              )}
            >
              {isTorchOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
            </Button>
          )}
        </div>

        <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Camera size={12} className="text-primary-500" />
              {isScannerActive ? 'Live Scanner Active' : 'Camera Ready'}
            </p>
          </div>
        </div>

        <style>{`
          #qr-reader-custom video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
        `}</style>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 w-full px-4">
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Upload Code</span>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        </div>

        <NativeMediaHandler
          onMediaCaptured={handleFileScan}
          label="Scan from Photo Library"
          variant="outline"
          className="w-full max-w-md px-4"
          icon={<Upload size={16} />}
        />
      </div>
    </div>
  );
};

// Helper for class names since utils might not be in every file
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
