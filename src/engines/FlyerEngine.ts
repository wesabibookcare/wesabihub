import { merchantEngine, parcelEngine, configurationEngine, auditEngine } from './index';

export interface FlyerCustomOptions {
  thankYouNote?: string;
  contactPhone?: string;
  contactEmail?: string;
  socialHandle?: string;
  showQrCode?: boolean;
  showWeSabiBranding?: boolean;
}

/**
 * WeSabiHub Flyer Engine
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
      // Check if user is admin
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
        address: business?.address || '',
        city: business?.city || '',
        state: business?.state || '',
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
        platformName: settings?.platformName || 'WeSabiHub',
        logoUrl: settings?.branding?.logoUrl || '',
        primaryColor: settings?.branding?.primaryColor || '#0284c7'
      },
      customNote: customOptions?.thankYouNote || 'Thank you for your order! Your parcel is handled with care via WeSabiHub.',
      showQrCode: customOptions?.showQrCode ?? true,
      showWeSabiBranding: customOptions?.showWeSabiBranding ?? true,
      qrUrl: publicTrackUrl
    };

    // Audit event logging (Rule 15)
    await auditEngine.logEvent({
      userId: merchantId,
      userRole: 'MERCHANT',
      action: 'GENERATE_PARCEL_FLYER',
      details: { merchantId, parcelId, trackingNumber: parcel.trackingNumber },
      result: 'SUCCESS'
    });

    return flyerData;
  }
}

export const flyerEngine = FlyerEngine.getInstance();
