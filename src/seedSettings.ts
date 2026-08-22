import { systemSettingsRepository } from './services/db/SystemSettingsRepository';
import { SystemSettings } from './types';

export const seedInitialSettings = async () => {
  const existing = await systemSettingsRepository.getGlobalSettings();
  if (existing) return;

  const initialSettings: Omit<SystemSettings, 'id'> = {
    platformName: 'WeSabiHub',
    tagline: 'Seamless Logistics for Everyone',
    supportEmail: 'support@wesabihub.com',
    supportPhone: '+234 123 456 7890',
    socialLinks: {
      facebook: 'https://facebook.com/wesabihub',
      twitter: 'https://twitter.com/wesabihub',
      instagram: 'https://instagram.com/wesabihub',
      linkedin: 'https://linkedin.com/company/wesabihub',
      whatsapp: 'https://wa.me/2341234567890',
      telegram: 'https://t.me/wesabihub',
      website: 'https://wesabihub.com'
    },
    branding: {
      logoUrl: '/assets/brand/official-logo.png',
      logoDarkUrl: '/assets/brand/official-logo-dark.png',
      logoLightUrl: '/assets/brand/official-logo-light.png',
      logoWithTaglineUrl: '/assets/brand/logo-tagline.png',
      faviconUrl: '/favicon.ico',
      appIconUrl: '/assets/brand/app-icon.png',
      emailLogoUrl: '/assets/brand/official-logo.png',
      documentLogoUrl: '/assets/brand/official-logo.png',
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
        title: 'Nationwide Pick-Up & Drop-Off Hub Network.',
        subtitle: 'Connect with customers, merchants, and logistics partners through a secure network of verified neighborhood businesses.',
        ctaText: 'Get Started',
        ctaLink: '/register'
      },
      cta: {
        title: 'Ready to grow your business?',
        description: 'Join thousands of merchants and hub points today.',
        buttonText: 'Join Now',
        buttonLink: '/register'
      },
      aboutUsText: 'WeSabiHub is the trusted Pick-Up & Drop-Off (PUDO) network, connecting millions through a secure platform of verified neighborhood centers.',
      descriptions: {
        networkSummary: 'A nationwide network of local businesses serving as secure parcel hubs.',
        merchantValueProp: 'Expand your reach without increasing your logistics costs.',
        logisticsValueProp: 'Focus on middle-mile delivery while hubs handle the last mile.',
        centerValueProp: 'Turn your business into a high-traffic logistics hub.'
      },
      features: [
        { id: '1', title: 'Secure Payment Protection', description: 'Payments are held securely until parcel is verified.', icon: 'ShieldCheck', enabled: true, order: 1 },
        { id: '2', title: 'Neighborhood Hubs', description: 'Drop off and pick up at your favorite local spots.', icon: 'MapPin', enabled: true, order: 2 },
        { id: '3', title: 'Real-time Tracking', description: 'Know exactly where your parcel is at all times.', icon: 'Search', enabled: true, order: 3 }
      ],
      statistics: [
        { id: '1', label: 'Verified Hubs', value: '2,500+', order: 1 },
        { id: '2', label: 'Parcels Delivered', value: '1M+', order: 2 },
        { id: '3', label: 'Satisfied Users', value: '500k+', order: 3 }
      ],
      testimonials: [
        { id: '1', name: 'Chidi O.', role: 'Merchant', content: 'WeSabiHub has transformed how I deliver to my customers.' }
      ]
    },
    footer: {
      aboutText: 'WeSabiHub is the trusted Pick-Up & Drop-Off (PUDO) network.',
      copyrightNotice: '© 2026 WeSabiHub. All rights reserved.',
      links: [
        { id: '1', label: 'About Us', href: '/about', category: 'COMPANY', enabled: true, order: 1 },
        { id: '2', label: 'How It Works', href: '/how-it-works', category: 'COMPANY', enabled: true, order: 2 },
        { id: '3', label: 'Privacy Policy', href: '/privacy', category: 'LEGAL', enabled: true, order: 3 },
        { id: '4', label: 'Terms of Service', href: '/terms', category: 'LEGAL', enabled: true, order: 4 }
      ]
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
      taxSettings: {
        vatRate: 7.5,
        enabled: true
      },
      consumerProtectionRules: 'Governed by the Federal Competition and Consumer Protection Commission (FCCPC).',
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
    contactInfo: {
      supportEmail: 'support@wesabihub.com',
      supportPhone: '+234 123 456 7890',
      whatsapp: '+234 123 456 7890',
      address: 'WeSabiHub HQ, Lagos, Nigeria',
      workingHours: 'Mon-Fri 9AM-6PM, Sat 10AM-2PM'
    },
    companyPages: {
      aboutUs: '# About WeSabiHub\n\nWe are the trusted PUDO network.',
      howItWorks: '# How It Works\n\nDrop off. Pick up. Simple.',
      solutions: '# Our Solutions\n\nEnd-to-end logistics infrastructure.',
      merchants: '# For Merchants\n\nScale your business.',
      logistics: '# For Logistics\n\nMiddle-mile efficiency.',
      hubs: '# For Hub Centers\n\nEarn extra revenue.'
    },
    featureFlags: {
      enableMerchantRegistration: true,
      enableLogisticsOnboarding: true,
      enableHubCenterApplications: true,
      enablePublicMarketplace: true,
      enableAIAssistant: false,
      enableGlobalSearch: true
    }
  };

  await systemSettingsRepository.create('global', initialSettings as any);
};
