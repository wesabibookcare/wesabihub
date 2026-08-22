import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from './Button';

interface NativeMediaHandlerProps {
  onMediaCaptured: (file: File) => void;
  captureMode?: 'user' | 'environment';
  accept?: string;
  label?: string;
  className?: string;
  variant?: 'outline' | 'ghost' | 'secondary' | 'primary';
  icon?: React.ReactNode;
}

/**
 * NativeMediaHandler
 * Triggers the device's native camera or file picker.
 * Highly recommended for mobile users for best image quality and stability.
 */
export const NativeMediaHandler: React.FC<NativeMediaHandlerProps> = ({
  onMediaCaptured,
  captureMode = 'environment',
  accept = 'image/*',
  label = 'Open Native Camera',
  className,
  variant = 'outline',
  icon = <Camera size={18} />
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMediaCaptured(file);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        capture={captureMode}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        variant={variant}
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 rounded-xl font-bold"
      >
        {icon}
        {label}
      </Button>
    </div>
  );
};
