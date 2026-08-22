import { Parcel } from '../types';

class QRService {
  generateQRData(parcel: Parcel): string {
    // Generate a secure token
    const token = crypto.randomUUID();
    return JSON.stringify({
      shipmentId: parcel.shipmentId,
      parcelId: parcel.parcelId,
      token
    });
  }

  generateBarcodeData(parcel: Parcel): string {
    return parcel.trackingNumber;
  }
}

export const qrService = new QRService();
