import { BRAND_ASSETS } from '../lib/brand';
import { useSettings } from '../context/SettingsContext';

export const useBrand = () => {
  try {
    const { settings } = useSettings();
    return {
      companyName: settings?.platformName || BRAND_ASSETS.companyName,
      parentCompany: BRAND_ASSETS.parentCompany,
      attributionText: `${settings?.platformName || BRAND_ASSETS.companyName} is a product of ${BRAND_ASSETS.parentCompany}`,
      fullLogo: settings?.branding?.logoUrl || BRAND_ASSETS.fullLogo,
      iconLogo: settings?.branding?.appIconUrl || settings?.branding?.logoUrl || BRAND_ASSETS.iconLogo,
      omorfiLogo: BRAND_ASSETS.omorfiLogo,
      primaryColor: settings?.branding?.primaryColor || BRAND_ASSETS.primaryColor,
      secondaryColor: settings?.branding?.secondaryColor || BRAND_ASSETS.secondaryColor,
      typography: settings?.branding?.typography?.bodyFont || BRAND_ASSETS.typography,
      aiCharacterName: (settings as any)?.aiConfig?.characterName || 'Omorfi AI',
      aiCharacterImage: (settings as any)?.aiConfig?.characterImage || '/assets/brand/ai-character.png',
    };
  } catch {
    return BRAND_ASSETS;
  }
};
