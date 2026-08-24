import React from 'react';
import { useSettings } from '@/src/context/SettingsContext';
import { cn } from '@/src/lib/utils';

// The official OmorfiHub logo, used as the built-in default everywhere in the
// app. An admin can still override this per-environment via Admin > Brand
// Assets (Primary Logo / Dark Mode Logo) -- that upload always takes priority
// over this default when set.
const DEFAULT_LOGO_URL = '/assets/brand/omorfi-logo.png';

interface BrandLogoProps {
  className?: string;
  /** px height of the logo image; width scales automatically */
  size?: number;
  /** Show the platform name next to the logo if no image is set, or always if withText is true */
  withText?: boolean;
}

/**
 * Single source of truth for displaying the company logo across the app.
 * Prefers the real, admin-editable branding settings (Admin > Brand Assets);
 * falls back to the built-in official OmorfiHub logo so nothing ever shows a
 * broken image, even before any admin upload has happened.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className, size = 32, withText = false }) => {
  const { settings } = useSettings();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const configuredLogoUrl = (isDark ? settings?.branding?.logoDarkUrl : settings?.branding?.logoUrl)
    || settings?.branding?.logoUrl;
  const platformName = settings?.platformName || 'OmorfiHub';

  const [logoUrl, setLogoUrl] = React.useState(configuredLogoUrl || DEFAULT_LOGO_URL);
  const [triedDefault, setTriedDefault] = React.useState(!configuredLogoUrl);

  // Keep in sync if the admin-configured URL changes after mount (e.g. once
  // settings finish loading, or an admin updates branding live).
  React.useEffect(() => {
    setLogoUrl(configuredLogoUrl || DEFAULT_LOGO_URL);
    setTriedDefault(!configuredLogoUrl);
  }, [configuredLogoUrl]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={logoUrl}
        alt={platformName}
        style={{ height: size }}
        className="w-auto object-contain"
        referrerPolicy="no-referrer"
        onError={() => {
          // If the admin-configured logo URL is broken, fall back to the
          // reliable built-in default instead of just hiding the logo.
          // Only hide it as an absolute last resort, if even the default
          // file somehow fails too.
          if (!triedDefault) {
            setTriedDefault(true);
            setLogoUrl(DEFAULT_LOGO_URL);
          } else {
            setLogoUrl('');
          }
        }}
      />
      {withText && (
        <span className="font-black text-lg tracking-tight dark:text-white">{platformName}</span>
      )}
    </div>
  );
};
