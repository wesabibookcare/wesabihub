import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Parcel, HubCenter, MerchantBusiness } from '../types';

class LabelService {
  /**
   * Generates a shipping label PDF and triggers download
   */
  async downloadShippingLabel(params: {
    parcel: Parcel;
    originHub?: HubCenter;
    destinationHub?: HubCenter;
    merchant?: MerchantBusiness;
  }) {
    const { parcel, originHub, destinationHub, merchant } = params;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // Typical shipping label size 4x6 inch approx
    });

    // Generate QR Code Data (Tracking Number + Verification Token)
    const verificationUrl = `${window.location.origin}/track/${parcel.trackingNumber}`;
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 100
      });
    } catch (err) {
      console.error('Failed to generate QR Code for label:', err);
    }

    // Colors
    const black = [0, 0, 0];

    // Header - WeSabiHub
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('WeSabiHub Shipping Label', 5, 10);
    doc.setLineWidth(0.5);
    doc.line(5, 12, 95, 12);

    // Tracking Number Barcode Area (Simplified as text for now, but we can use qrcode for it)
    doc.setFontSize(10);
    doc.text('TRACKING #:', 5, 20);
    doc.setFontSize(16);
    doc.text(parcel.trackingNumber, 5, 27);

    // FROM Section
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text('FROM:', 5, 35);
    doc.setFont('Helvetica', 'normal');
    doc.text(merchant?.name || 'Merchant', 5, 39);
    doc.text(originHub?.name || 'Origin Hub', 5, 43);
    doc.text(originHub?.city || '', 5, 47);

    // TO Section
    doc.setFont('Helvetica', 'bold');
    doc.text('TO:', 5, 55);
    doc.setFont('Helvetica', 'normal');
    doc.text(parcel.recipientInfo.name, 5, 59);
    doc.text(parcel.recipientInfo.phone, 5, 63);
    doc.text(destinationHub?.name || 'Destination Hub', 5, 67);
    doc.text(destinationHub?.city || '', 5, 71);

    doc.line(5, 75, 95, 75);

    // Parcel Info
    doc.setFontSize(8);
    doc.text(`Weight: ${parcel.weightKg}kg`, 5, 82);
    doc.text(`Service: ${parcel.pricing?.transferDiscount ? 'EXPRESS' : 'STANDARD'}`, 40, 82);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 70, 82);

    // QR Code
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', 30, 90, 40, 40);
    }

    // Footer info
    doc.setFontSize(7);
    doc.text('Scan to update status or track at WeSabiHub.com', 50, 135, { align: 'center' });
    doc.text('DO NOT SHARE OTP WITH DRIVERS', 50, 140, { align: 'center' });

    // Boundary box
    doc.rect(2, 2, 96, 146);

    doc.save(`Label_${parcel.trackingNumber}.pdf`);
  }
}

export const labelService = new LabelService();
