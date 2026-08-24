import { merchantEngine, parcelEngine, configurationEngine, auditEngine } from './index';

export interface FlyerCustomOptions {
  tagline?: string;
  thankYouNote?: string;
  contactPhone?: string;
  contactEmail?: string;
  socialHandle?: string;
  address?: string;
  showAddress?: boolean;
  showPhone?: boolean;
  showEmail?: boolean;
  showSocial?: boolean;
  showQrCode?: boolean;
  showOmorfiHubBranding?: boolean;
  designTemplate?: 'modern' | 'classic' | 'vibrant' | 'minimal';
  layoutFormat?: 'single_a6' | 'grid_6_per_a4';
}

/**
 * OmorfiHub Flyer Engine
 * Authoritative engine for generating Merchant Parcel Flyer data.
 */
class FlyerEngine {
  private static instance: FlyerEngine;
  private constructor() {}

  public static getInstance(): FlyerEngine {
    if (!FlyerEngine.instance) {
      FlyerEngine.instance = new FlyerEngine();
    }
    return FlyerEngine.instance;
  }

  /**
   * Generates flyer data for a specific parcel and merchant.
   * Performs authorization check to ensure merchant owns the parcel.
   */
  async getFlyerData(merchantId: string, parcelId: string, customOptions?: FlyerCustomOptions): Promise<any> {
    const [business, parcel, settings] = await Promise.all([
      merchantEngine.getBusiness(merchantId),
      parcelEngine.getParcel(parcelId),
      configurationEngine.getGlobalSettings()
    ]);

    if (!parcel) {
      throw new Error('Parcel not found for flyer generation.');
    }

    // Security check: Merchant can only generate flyer for their own shipment
    if (parcel.senderId !== merchantId) {
      throw new Error('Unauthorized: You can only generate flyers for your own shipments.');
    }

    const businessName = business?.businessName || 'Verified Merchant';
    const logoUrl = business?.logoUrl || '';

    // Public tracking URL for QR code (does not expose sensitive IDs)
    const publicTrackUrl = `/customer/track?id=${parcel.trackingNumber}`;

    const flyerData = {
      flyerId: `FLYER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      merchant: {
        id: merchantId,
        businessName,
        logoUrl,
        tagline: customOptions?.tagline || (business as any)?.tagline || 'Delivering Excellence with Care',
        address: customOptions?.address || (business?.address ? `${business.address}, ${business.city || ''}` : ''),
        phone: customOptions?.contactPhone || business?.phone || '',
        email: customOptions?.contactEmail || business?.email || '',
        socialHandle: customOptions?.socialHandle || ''
      },
      parcel: {
        id: parcel.id,
        trackingNumber: parcel.trackingNumber,
        recipientName: parcel.recipientInfo?.name || 'Valued Customer',
        destinationCenterId: parcel.destinationCenterId,
        weightKg: parcel.weightKg
      },
      branding: {
        platformName: settings?.platformName || 'OmorfiHub',
        logoUrl: settings?.branding?.logoUrl || '',
        primaryColor: settings?.branding?.primaryColor || '#0284c7'
      },
      customNote: customOptions?.thankYouNote || 'Thank you for your order! Your parcel is handled with care via OmorfiHub.',
      showAddress: customOptions?.showAddress ?? true,
      showPhone: customOptions?.showPhone ?? true,
      showEmail: customOptions?.showEmail ?? true,
      showSocial: customOptions?.showSocial ?? true,
      showQrCode: customOptions?.showQrCode ?? true,
      showOmorfiHubBranding: customOptions?.showOmorfiHubBranding ?? true,
      designTemplate: customOptions?.designTemplate || 'modern',
      layoutFormat: customOptions?.layoutFormat || 'single_a6',
      qrUrl: publicTrackUrl
    };

    // Audit event logging (Rule 15)
    await auditEngine.logEvent({
      userId: merchantId,
      userRole: 'MERCHANT',
      action: 'GENERATE_PARCEL_FLYER',
      details: { merchantId, parcelId, trackingNumber: parcel.trackingNumber, layoutFormat: flyerData.layoutFormat },
      result: 'SUCCESS'
    });

    return flyerData;
  }
}

export const flyerEngine = FlyerEngine.getInstance();
