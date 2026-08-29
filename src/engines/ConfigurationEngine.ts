import { systemSettingsRepository } from '../services/db/SystemSettingsRepository';
import { countryRepository } from '../services/db/CountryRepository';
import { roleApplicationConfigRepository } from '../services/db/RoleApplicationConfigRepository';
import { documentRequirementRepository } from '../services/db/DocumentRequirementRepository';
import { pageContentRepository } from '../services/db/PageContentRepository';
import { faqRepository } from '../services/db/FAQRepository';
import { announcementRepository } from '../services/db/AnnouncementRepository';
import { advertisementRepository } from '../services/db/AdvertisementRepository';
import {
  SystemSettings,
  Country,
  RoleApplicationConfig,
  DocumentRequirement,
  UserRole
} from '../types';

/**
 * OmorfiHub Configuration Engine
 * Authoritative source for platform settings, rules, and localization.
 */
class ConfigurationEngine {
  private static instance: ConfigurationEngine;
  private settingsCache: SystemSettings | null = null;
  private countryCache: Record<string, Country | null> = {};
  private countriesListCache: any[] | null = null;
  private activeCountriesListCache: any[] | null = null;
  private faqCache: any[] | null = null;
  private announcementsCache: any[] | null = null;
  private advertisementsCache: any[] | null = null;
  private documentRequirementsCache: Record<string, DocumentRequirement[]> = {};
  private allDocRequirementsCache: any[] | null = null;
  private pageContentCache: Record<string, any> = {};
  private complianceConfigCache: any = null;

  private constructor() {}

  public static getInstance(): ConfigurationEngine {
    if (!ConfigurationEngine.instance) {
      ConfigurationEngine.instance = new ConfigurationEngine();
    }
    return ConfigurationEngine.instance;
  }

  /**
   * Default Global Settings Fallback
   */
  private getDefaultGlobalSettings(): SystemSettings {
    return {
      id: 'global',
      platformName: 'OmorfiHub',
      tagline: 'Seamless Logistics for Everyone',
      supportEmail: 'support@omorfihub.com',
      supportPhone: '+234 123 456 7890',
      socialLinks: {
        facebook: 'https://facebook.com/omorfihub',
        twitter: 'https://twitter.com/omorfihub',
        instagram: 'https://instagram.com/omorfihub',
        linkedin: 'https://linkedin.com/company/omorfihub',
        whatsapp: 'https://wa.me/2341234567890',
        telegram: 'https://t.me/omorfihub',
        website: 'https://omorfihub.com'
      },
      branding: {
        logoUrl: '/assets/brand/omorfi-logo.png',
        logoDarkUrl: '/assets/brand/omorfi-logo.png',
        logoLightUrl: '/assets/brand/omorfi-logo.png',
        logoWithTaglineUrl: '/assets/brand/omorfi-logo.png',
        faviconUrl: '/favicon.ico',
        appIconUrl: '/assets/brand/omorfi-logo.png',
        emailLogoUrl: '/assets/brand/omorfi-logo.png',
        documentLogoUrl: '/assets/brand/omorfi-logo.png',
        primaryColor: '#0F172A',
        secondaryColor: '#3B82F6',
        typography: {
          headingFont: 'Space Grotesk',
          bodyFont: 'Inter',
          baseFontSize: '16px'
        },
        defaultTheme: 'light'
      },
      landingPage: {
        hero: {
          title: 'Trusted & Reliable Pick & Drop-Off Centre',
          subtitle: "Connecting you closer to your parcels. We've built Nigeria's largest network of verified neighborhood centers.",
          ctaText: 'Get Started',
          ctaLink: '/register'
        },
        cta: {
          title: 'Ready to grow your business?',
          description: 'Join thousands of merchants and hub points today.',
          buttonText: 'Join Now',
          buttonLink: '/register'
        },
        aboutUsText: 'OmorfiHub is the trusted Pick-Up & Drop-Off (PUDO) network.',
        descriptions: {
          networkSummary: 'A nationwide network of local businesses serving as secure parcel hubs.',
          merchantValueProp: 'Expand your reach without increasing your logistics costs.',
          logisticsValueProp: 'Focus on middle-mile delivery while hubs handle the last mile.',
          centerValueProp: 'Turn your business into a high-traffic logistics hub.'
        },
        features: [],
        statistics: [],
        testimonials: []
      },
      footer: {
        aboutText: 'OmorfiHub is the trusted Pick-Up & Drop-Off (PUDO) network.',
        copyrightNotice: '© 2026 OmorfiHub. All rights reserved.',
        links: []
      },
      countryConfig: {
        defaultCountry: 'Nigeria',
        defaultCurrency: 'Naira',
        defaultCurrencySymbol: '₦',
        defaultTimezone: 'Africa/Lagos',
        defaultPhoneCode: '+234',
        defaultDateFormat: 'DD/MM/YYYY',
        defaultAddressFormat: '{address}, {city}, {state}, {country}',
        defaultWeightUnit: 'kg',
        defaultMeasurementUnit: 'metric',
        taxSettings: { vatRate: 7.5, enabled: true },
        consumerProtectionRules: 'Governed by FCCPC.',
        supportedCountries: ['Nigeria'],
        multiCountryEnabled: false,
        languages: ['English']
      },
      policies: {
        privacyPolicy: '# Privacy Policy...',
        termsOfService: '# Terms of Service...',
        paymentProtectionPolicy: '# Payment Protection Policy...',
        returnsPolicy: '# Returns Policy...',
        storagePolicy: '# Storage Policy...',
        merchantPolicy: '# Merchant Policy...',
        centreAgreement: '# Centre Agreement...',
        developerAgreement: '# Developer Agreement...',
        communityGuidelines: '# Community Guidelines...'
      },
      companyPages: {
        aboutUs: '# About Us',
        howItWorks: '# How It Works',
        solutions: '# Solutions',
        merchants: '# Merchants',
        logistics: '# Logistics',
        hubs: '# Hubs'
      },
      contactInfo: {
        supportEmail: 'support@omorfihub.com',
        supportPhone: '+234 123 456 7890',
        whatsapp: '+234 123 456 7890',
        address: 'Lagos, Nigeria',
        workingHours: 'Mon-Fri 9AM-6PM'
      },
      maintenanceMode: false,
      platformFees: {
        percentage: 5,
        fixed: 100
      },
      paymentConfig: {
        primaryProvider: 'FLUTTERWAVE',
        backupProvider: 'PAYSTACK',
        enabledProviders: ['FLUTTERWAVE', 'PAYSTACK'],
        primarySafePayProvider: 'FLUTTERWAVE',
        primaryPlatformProvider: 'PAYSTACK',
        enableFallback: true,
        allowedFallbackTypes: ['WALLET_FUNDING', 'REGISTRATION_FEE', 'MEMBERSHIP', 'SUBSCRIPTION', 'GENERAL_PLATFORM_CHARGE'],
        retryLimits: 3,
        timeoutDuration: 30,
        paymentMaintenanceMode: false,
        providerPriority: ['PAYSTACK', 'FLUTTERWAVE'],
        isCardPaymentEnabled: false,
        isBankTransferEnabled: true,
        allowedPaymentMethods: ['BANK_TRANSFER', 'WALLET']
      },
      featureFlags: {
        enableMerchantRegistration: true,
        enableLogisticsOnboarding: true,
        enableHubCenterApplications: true,
        enablePublicMarketplace: true,
        enableAIAssistant: false,
        enableGlobalSearch: true,
        enableSafePay: true
      }
    };
  }

  /**
   * Global Settings
   */
  async getGlobalSettings(): Promise<SystemSettings> {
    if (this.settingsCache) return this.settingsCache;
    try {
      const settings = await systemSettingsRepository.getById('global');
      if (settings) {
        this.settingsCache = settings;
        return settings;
      }
    } catch (err) {
      console.warn('Failed to fetch global system settings from database, using safe defaults:', err);
    }

    const fallback = this.getDefaultGlobalSettings();
    this.settingsCache = fallback;

    // Attempt background creation if missing
    systemSettingsRepository.create('global', fallback as any).catch(err => {
      console.warn('Background auto-creation of global system settings skipped or failed:', err?.message || err);
    });

    return fallback;
  }

  /**
   * Maps & Geolocation Settings
   */
  async getMapsSettings() {
    try {
      const settings = await this.getGlobalSettings();
      return {
        mapsProvider: settings.mapsConfig?.mapsProvider || 'GOOGLE',
        defaultSearchRadiusKm: settings.mapsConfig?.defaultSearchRadiusKm ?? 10,
        maxDispatchRadiusKm: settings.mapsConfig?.maxDispatchRadiusKm ?? 15,
        defaultCountry: settings.mapsConfig?.defaultCountry || 'Nigeria',
        distanceUnits: settings.mapsConfig?.distanceUnits || 'km',
        locationUpdateIntervalMs: settings.mapsConfig?.locationUpdateIntervalMs ?? 10000,
        geofenceRadiusMeters: settings.mapsConfig?.geofenceRadiusMeters ?? 100,
        locationAccuracyThresholdMeters: settings.mapsConfig?.locationAccuracyThresholdMeters ?? 15,
        routeDeviationThresholdMeters: settings.mapsConfig?.routeDeviationThresholdMeters ?? 150,
        enableRouteDeviationDetection: settings.mapsConfig?.enableRouteDeviationDetection ?? true,
        enableLiveRiderTracking: settings.mapsConfig?.enableLiveRiderTracking ?? true,
        enableGeofencing: settings.mapsConfig?.enableGeofencing ?? true,
      };
    } catch {
      return {
        mapsProvider: 'GOOGLE',
        defaultSearchRadiusKm: 10,
        maxDispatchRadiusKm: 15,
        defaultCountry: 'Nigeria',
        distanceUnits: 'km' as 'km' | 'miles',
        locationUpdateIntervalMs: 10000,
        geofenceRadiusMeters: 100,
        locationAccuracyThresholdMeters: 15,
        routeDeviationThresholdMeters: 150,
        enableRouteDeviationDetection: true,
        enableLiveRiderTracking: true,
        enableGeofencing: true,
      };
    }
  }

  /**
   * Payment & SafePay Provider Settings
   */
  async getPaymentSettings() {
    try {
      const settings = await this.getGlobalSettings();
      return {
        primaryProvider: settings.paymentConfig?.primaryProvider || 'FLUTTERWAVE',
        backupProvider: settings.paymentConfig?.backupProvider || 'PAYSTACK',
        enabledProviders: settings.paymentConfig?.enabledProviders || ['FLUTTERWAVE', 'PAYSTACK'],
        primarySafePayProvider: settings.paymentConfig?.primarySafePayProvider || 'FLUTTERWAVE',
        primaryPlatformProvider: settings.paymentConfig?.primaryPlatformProvider || 'PAYSTACK',
        enableFallback: settings.paymentConfig?.enableFallback ?? true,
        allowedFallbackTypes: settings.paymentConfig?.allowedFallbackTypes || ['WALLET_FUNDING', 'REGISTRATION_FEE', 'MEMBERSHIP', 'SUBSCRIPTION', 'GENERAL_PLATFORM_CHARGE'],
        retryLimits: settings.paymentConfig?.retryLimits ?? 3,
        timeoutDuration: settings.paymentConfig?.timeoutDuration ?? 30,
        paymentMaintenanceMode: settings.paymentConfig?.paymentMaintenanceMode ?? false,
        providerPriority: settings.paymentConfig?.providerPriority || ['PAYSTACK', 'FLUTTERWAVE'],
        supportedCurrencies: settings.paymentConfig?.supportedCurrencies || ['NGN', 'USD', 'GHS', 'KES'],
        webhookEndpoint: settings.paymentConfig?.webhookEndpoint || '/api/payment-protection/webhook',
        settlementDelays: settings.paymentConfig?.settlementDelays ?? 86400, // 24 hours in seconds
        refundRules: settings.paymentConfig?.refundRules || ['FULL_REFUND', 'PARTIAL_REFUND_WITH_FEE'],
        isFlutterwaveEnabled: settings.paymentConfig?.isFlutterwaveEnabled ?? true,
        isPaystackEnabled: settings.paymentConfig?.isPaystackEnabled ?? true,
        isCardPaymentEnabled: settings.paymentConfig?.isCardPaymentEnabled ?? false,
        isBankTransferEnabled: settings.paymentConfig?.isBankTransferEnabled ?? true,
        allowedPaymentMethods: settings.paymentConfig?.allowedPaymentMethods || ['BANK_TRANSFER', 'WALLET'],
        providerHealthStatus: settings.paymentConfig?.providerHealthStatus || { 'FLUTTERWAVE': 'HEALTHY', 'PAYSTACK': 'HEALTHY' }
      };
    } catch {
      return {
        primaryProvider: 'FLUTTERWAVE',
        backupProvider: 'PAYSTACK',
        enabledProviders: ['FLUTTERWAVE', 'PAYSTACK'],
        primarySafePayProvider: 'FLUTTERWAVE',
        primaryPlatformProvider: 'PAYSTACK',
        enableFallback: true,
        allowedFallbackTypes: ['WALLET_FUNDING', 'REGISTRATION_FEE', 'MEMBERSHIP', 'SUBSCRIPTION', 'GENERAL_PLATFORM_CHARGE'],
        retryLimits: 3,
        timeoutDuration: 30,
        paymentMaintenanceMode: false,
        providerPriority: ['PAYSTACK', 'FLUTTERWAVE'],
        supportedCurrencies: ['NGN', 'USD', 'GHS', 'KES'],
        webhookEndpoint: '/api/payment-protection/webhook',
        settlementDelays: 86400,
        refundRules: ['FULL_REFUND', 'PARTIAL_REFUND_WITH_FEE'],
        isFlutterwaveEnabled: true,
        isPaystackEnabled: true,
        isCardPaymentEnabled: false,
        isBankTransferEnabled: true,
        allowedPaymentMethods: ['BANK_TRANSFER', 'WALLET'],
        providerHealthStatus: { 'FLUTTERWAVE': 'HEALTHY', 'PAYSTACK': 'HEALTHY' }
      };
    }
  }

  /**
   * Helper to check if a specific payment method is permitted by platform configuration
   */
  async isPaymentMethodAllowed(method: string, paymentType?: string): Promise<boolean> {
    // SafePay (SafePay) uses Flutterwave and remains separate and supported
    if (paymentType === 'SAFEPAY') {
      return true;
    }
    const config = await this.getPaymentSettings();
    const normalized = (method || '').toUpperCase();
    if (normalized === 'CARD' || normalized === 'FLUTTERWAVE_CARD' || normalized === 'PAYSTACK_CARD') {
      return config.isCardPaymentEnabled === true;
    }
    if (normalized === 'BANK' || normalized === 'BANK_TRANSFER' || normalized === 'PAYSTACK') {
      return config.isBankTransferEnabled !== false;
    }
    if (normalized === 'WALLET') {
      return true;
    }
    return true;
  }

  /**
   * Country Specific Rules
   */
  async getCountryConfig(countryCode: string): Promise<Country | null> {
    if (this.countryCache[countryCode] !== undefined) {
      return this.countryCache[countryCode];
    }
    const country = await countryRepository.getById(countryCode);
    this.countryCache[countryCode] = country;
    return country;
  }

  /**
   * Role Registration Requirements
   */
  async getRoleRegistrationConfig(role: UserRole): Promise<RoleApplicationConfig | null> {
    return await roleApplicationConfigRepository.getByRole(role);
  }

  /**
   * Document Requirements
   */
  async getDocumentRequirements(role: UserRole): Promise<DocumentRequirement[]> {
    if (this.documentRequirementsCache[role]) {
      return this.documentRequirementsCache[role];
    }
    const activeDocs = await documentRequirementRepository.getAll();
    const filtered = activeDocs.filter(d =>
      d.isActive &&
      !d.isDeleted &&
      d.applicableRoles.includes(role)
    );
    this.documentRequirementsCache[role] = filtered;
    return filtered;
  }

  /**
   * Compliance & Legal Rules
   */
  async getComplianceConfig() {
    if (this.complianceConfigCache) return this.complianceConfigCache;
    try {
      const settings = await this.getGlobalSettings();
      const config = {
        mandatoryPolicies: settings.complianceConfig?.mandatoryPolicies || ['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY'],
        roleSpecificPolicies: settings.complianceConfig?.roleSpecificPolicies || {
          'MERCHANT': ['MERCHANT_AGREEMENT'],
          'CENTER_OWNER': ['CENTRE_AGREEMENT'],
          'CENTER_STAFF': ['TRAINING_ACCEPTANCE'],
          'LOGISTICS_COMPANY': ['LOGISTICS_COMPANY_AGREEMENT'],
          'DISPATCH_RIDER': ['DISPATCH_PARTNER_AGREEMENT'],
          'DEVELOPER': ['API_PARTNER_AGREEMENT'],
          'API_MERCHANT_PARTNER': ['API_PARTNER_AGREEMENT']
        },
        countrySpecificPolicies: settings.complianceConfig?.countrySpecificPolicies || {
          'NG': []
        }
      };
      this.complianceConfigCache = config;
      return config;
    } catch {
      return {
        mandatoryPolicies: ['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY'],
        roleSpecificPolicies: {
          'MERCHANT': ['MERCHANT_AGREEMENT'],
          'CENTER_OWNER': ['CENTRE_AGREEMENT'],
          'CENTER_STAFF': ['TRAINING_ACCEPTANCE'],
          'LOGISTICS_COMPANY': ['LOGISTICS_COMPANY_AGREEMENT'],
          'DISPATCH_RIDER': ['DISPATCH_PARTNER_AGREEMENT'],
          'DEVELOPER': ['API_PARTNER_AGREEMENT'],
          'API_MERCHANT_PARTNER': ['API_PARTNER_AGREEMENT']
        },
        countrySpecificPolicies: {
          'NG': []
        }
      };
    }
  }

  /**
   * Feature Flags
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    const settings = await this.getGlobalSettings();
    return !!settings.featureFlags?.[featureKey];
  }

  /**
   * Payout / Pricing Constants
   */
  async getInventorySettings() {
    return { longStayWarningDays: 3 };
  }

  async getPricingConstants(): Promise<any> {
    const settings = await this.getGlobalSettings();
    return (settings as any).pricing;
  }

  /**
   * Check if a role requires manual review in a specific country
   */
  async doesRoleRequireReview(role: UserRole, countryCode: string): Promise<boolean> {
    const country = await this.getCountryConfig(countryCode);
    if (!country) return true; // Default to review for safety
    return country.registrationRules?.manualApprovalOnlyRoles?.includes(role) || false;
  }

  /**
   * Page Content
   */
  async getPageContent(pageId: string): Promise<any> {
    if (this.pageContentCache[pageId] !== undefined) {
      return this.pageContentCache[pageId];
    }

    const content = await pageContentRepository.getPageContent(pageId);
    this.pageContentCache[pageId] = content;
    return content;
  }

  async updatePageContent(pageId: string, content: any): Promise<void> {

    await pageContentRepository.updatePageContent(pageId, content);
    delete this.pageContentCache[pageId];
  }

  /**
   * FAQs
   */
  async getFAQs(): Promise<any[]> {
    if (this.faqCache) return this.faqCache;

    const faqs = await faqRepository.getAll();
    this.faqCache = faqs;
    return faqs;
  }

  async createFAQ(id: string, faq: any): Promise<void> {

    await faqRepository.create(id, faq);
    this.faqCache = null;
  }

  /**
   * Clear cache (useful when admin updates settings)
   */
  clearCache(): void {
    this.settingsCache = null;
    this.countryCache = {};
    this.countriesListCache = null;
    this.activeCountriesListCache = null;
    this.faqCache = null;
    this.announcementsCache = null;
    this.advertisementsCache = null;
    this.documentRequirementsCache = {};
    this.allDocRequirementsCache = null;
    this.pageContentCache = {};
    this.complianceConfigCache = null;
  }

  async getAnnouncements(): Promise<any[]> {
    if (this.announcementsCache) return this.announcementsCache;

    const announcements = await announcementRepository.getAll();
    this.announcementsCache = announcements;
    return announcements;
  }
  async getAdvertisements(): Promise<any[]> {
    if (this.advertisementsCache) return this.advertisementsCache;

    const advertisements = await advertisementRepository.getAll();
    this.advertisementsCache = advertisements;
    return advertisements;
  }
  async getAllDocumentRequirements(): Promise<any[]> {
    if (this.allDocRequirementsCache) return this.allDocRequirementsCache;

    const docReqs = await documentRequirementRepository.getAll();
    this.allDocRequirementsCache = docReqs;
    return docReqs;
  }
  async updateSystemSettings(id: string, data: any): Promise<void> {

    await systemSettingsRepository.update(id, data);
    this.clearCache();
  }
  async createAnnouncement(id: string, data: any): Promise<void> {

    await announcementRepository.create(id, data);
    this.announcementsCache = null;
  }
  async createAdvertisement(id: string, data: any): Promise<void> {

    await advertisementRepository.create(id, data);
    this.advertisementsCache = null;
  }
  async deleteAnnouncement(id: string): Promise<void> {

    await announcementRepository.softDelete(id);
    this.announcementsCache = null;
  }
  async deleteAdvertisement(id: string): Promise<void> {

    await advertisementRepository.softDelete(id);
    this.advertisementsCache = null;
  }
  async deleteDocumentRequirement(id: string): Promise<void> {

    await documentRequirementRepository.softDelete(id);
    this.documentRequirementsCache = {};
    this.allDocRequirementsCache = null;
  }
  async updateDocumentRequirement(id: string, data: any): Promise<void> {

    await documentRequirementRepository.update(id, data);
    this.documentRequirementsCache = {};
    this.allDocRequirementsCache = null;
  }
  async createDocumentRequirement(id: string, data: any): Promise<void> {

    await documentRequirementRepository.create(id, data);
    this.documentRequirementsCache = {};
    this.allDocRequirementsCache = null;
  }
  async getAllCountries(): Promise<any[]> {
    if (this.countriesListCache) return this.countriesListCache;

    const countries = await countryRepository.getAllCountries();
    this.countriesListCache = countries;
    return countries;
  }

  async getActiveCountries(): Promise<any[]> {
    if (this.activeCountriesListCache) return this.activeCountriesListCache;

    const activeCountries = await countryRepository.getActiveCountries();
    this.activeCountriesListCache = activeCountries;
    return activeCountries;
  }


  subscribeToCountries(callback: (data: any[]) => void): () => void {

    return countryRepository.subscribeToCountries(callback);
  }

}

export const configurationEngine = ConfigurationEngine.getInstance();
