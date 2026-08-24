
/**
 * Global application configuration.
 * Centralizing these values ensures consistency across the app
 * and makes it easier to support multi-country deployments.
 */
export const APP_CONFIG = {
  NAME: 'OmorfiHub',
  VERSION: '1.0.0',
  DEFAULT_COUNTRY: 'Nigeria',
  DEFAULT_CURRENCY: 'NGN',
  SUPPORTED_COUNTRIES: ['Nigeria', 'Ghana', 'Kenya'],
  MAP_DEFAULTS: {
    lat: 6.5244,
    lng: 3.3792, // Lagos
    zoom: 12,
  },
  THEME: {
    PRIMARY_COLOR: '#0F172A', // Slate-900
    ACCENT_COLOR: '#3B82F6',  // Blue-500
  }
};

export const FEATURE_FLAGS = {
  ENABLE_INTERNATIONAL: false,
  ENABLE_CRYPTO_PAYMENTS: false,
  SHOW_BETA_SIMULATOR: true,
};
