import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const LOADING_VIDEO_URL = '/assets/brand/wesabihub-loading-video.mp4';

interface LoadingIconProps {
  className?: string;
  size?: number;
}

/**
 * The app's official loading indicator, shown on buttons and anywhere else
 * an action is in progress. Plays the official WeSabiHub loading video
 * (muted, looping). Falls back to a generic spinner icon if the video ever
 * fails to load, so a loading state never renders as empty/broken.
 */
export const LoadingIcon: React.FC<LoadingIconProps> = ({ className, size = 16 }) => {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <Loader2 className={cn('animate-spin', className)} style={{ width: size, height: size }} />;
  }

  return (
    <video
      src={LOADING_VIDEO_URL}
      autoPlay
      loop
      muted
      playsInline
      style={{ width: size, height: size }}
      className={cn('object-contain rounded-full', className)}
      onError={() => setErrored(true)}
    />
  );
};
