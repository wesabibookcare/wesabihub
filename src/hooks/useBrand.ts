import { BRAND_ASSETS } from '../lib/brand';

export const useBrand = () => {
  // In a production app, this would fetch from Firebase
  // and handle real-time updates.
  return BRAND_ASSETS;
};
