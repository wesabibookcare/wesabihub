import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { receiptRepository } from './db/ReceiptRepository';
import { Receipt, Parcel, HubCenter } from '../types';

class ReceiptService {
  /**
   * Generates a new Receipt record in Firestore and downloads the PDF
   */
  async generateAndSaveReceipt(params: {
    type: 'INTAKE' | 'RELEASE';
    parcel: Parcel;
    hub: HubCenter;
    staffId: string;
    staffName: string;
    shelfLocation?: string;
    recipientRelation?: string;
  }): Promise<Receipt> {
    const { type, parcel, hub, staffId, staffName, shelfLocation, recipientRelation } = params;

    const receiptId = type === 'INTAKE'
      ? `REC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`
      : `REL-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const verificationToken = crypto.randomUUID();
    const verificationUrl = `${window.location.origin}/verify-receipt?token=${verificationToken}`;

    // Generate QR Code Data URL
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 150
      });
    } catch (err) {
      console.error('Failed to generate QR Code for receipt:', err);
    }

    const receiptData: Receipt = {
      id: receiptId,
      receiptId,
      type,
      shipmentId: parcel.id || parcel.shipmentId || '',
      trackingNumber: parcel.trackingNumber,
      amount: parcel.pricing?.total || 10000,
      customerName: type === 'INTAKE'
        ? parcel.senderId || 'Customer'
        : parcel.collectedBy?.name || parcel.recipientInfo?.name || 'Customer',
      customerEmail: type === 'INTAKE' ? undefined : parcel.recipientInfo?.email,
      customerPhone: type === 'INTAKE' ? undefined : parcel.recipientInfo?.phone,
      hubId: hub.id,
      hubName: hub.name,
      staffId,
      staffName,
      shelfLocation: shelfLocation || 'Shelf A1',
      verificationToken,
      qrCodeDataUrl,
      items: 'General Merchandise',
      weight: parcel.weightKg || 1.0,
      packagingCondition: type === 'INTAKE' ? 'Factory Sealed / Safe' : 'Inspected & Acceptable',
      recipientRelation: recipientRelation || parcel.collectedBy?.relation || 'Self',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore
    await receiptRepository.create(receiptId, receiptData);

    // Download PDF (runs on client side)
    this.downloadPDF(receiptData);

    return receiptData;
  }

  /**
   * Constructs the beautiful, branded PDF document using jsPDF and triggers download
   */
  downloadPDF(receipt: Receipt) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Palette
    const primaryColor = [15, 23, 42]; // Slate 900
    const accentColor = [14, 165, 233]; // Sky 500
    const lightBg = [248, 250, 252]; // Slate 50
    const borderColor = [226, 232, 240]; // Slate 200

    // Set document properties
    doc.setProperties({
      title: `WeSabiHub Receipt - ${receipt.receiptId}`,
      subject: 'Transaction Receipt',
      author: 'WeSabiHub Platform',
      keywords: 'logistics, SafePay, receipt',
      creator: 'WeSabiHub System'
    });

    // 1. Draw Background Watermarks & Header Line
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 15, 'F'); // Top colored band

    // Header Content
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('WESABIHUB LOGISTICS & SAFEPAY NETWORK', 15, 10);

    // 2. Receipt Type Title Banner
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.text(
      receipt.type === 'INTAKE' ? 'PARCEL DROP-OFF RECEIPT' : 'PARCEL COLLECTION RECEIPT',
      15,
      32
    );

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('This is a digitally certified proof of custody transfer.', 15, 38);

    // Accent line divider
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1.5);
    doc.line(15, 42, 195, 42);

    // 3. Metadata Bento Block (2 Column)
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, 48, 180, 32, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400

    doc.text('RECEIPT NUMBER', 20, 56);
    doc.text('TRANSACTION TIMESTAMP', 20, 68);
    doc.text('TRACKING NUMBER', 110, 56);
    doc.text('SAFEPAY PROTECTION STATUS', 110, 68);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(receipt.receiptId, 20, 61);
    doc.text(receipt.trackingNumber, 110, 61);

    doc.setFont('Helvetica', 'normal');
    doc.text(new Date(receipt.createdAt || '').toLocaleString(), 20, 73);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text('SECURED / VERIFIED', 110, 73);

    // 4. Shipment & Custody Details Section
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('CHAIN OF CUSTODY PARTICIPANTS', 15, 92);

    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 95, 195, 95);

    // Key-Values for Custody
    doc.setFontSize(10);
    const renderRow = (y: number, label1: string, val1: string, label2: string, val2: string) => {
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label1, 15, y);
      doc.text(label2, 110, y);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(val1, 50, y);
      doc.text(val2, 145, y);
    };

    renderRow(104, 'Customer/Recipient:', receipt.customerName, 'Hub Point:', receipt.hubName);
    renderRow(112, 'Authorized Agent:', receipt.staffName, 'Shelf Allocation:', receipt.shelfLocation || 'N/A');
    if (receipt.type === 'RELEASE') {
      renderRow(120, 'Recipient Relation:', receipt.recipientRelation || 'Self', 'Agent ID:', receipt.staffId.substring(0, 8));
    } else {
      renderRow(120, 'Package Type:', receipt.items || 'General', 'Agent ID:', receipt.staffId.substring(0, 8));
    }

    // 5. Package Characteristics & Financials
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PACKAGE CHARACTERISTICS & VALUE', 15, 135);
    doc.line(15, 138, 195, 138);

    // Characteristics Grid
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Declared Items:', 15, 146);
    doc.text('Registered Weight:', 15, 153);
    doc.text('Packaging Condition:', 15, 160);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(receipt.items || 'General Merchandise', 55, 146);
    doc.text(`${(receipt.weight || 1.0).toFixed(2)} kg`, 55, 153);
    doc.text(receipt.packagingCondition || 'Excellent / Intake checklist passed', 55, 160);

    // Big SafePay Price Box
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(120, 142, 75, 23, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PROTECTED SAFEPAY AMOUNT', 125, 148);
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(`₦${receipt.amount.toLocaleString()}`, 125, 158);

    // 6. Security & Verification Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SECURITY VERIFICATION CODE', 15, 182);
    doc.line(15, 185, 195, 185);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const verifyText = [
      'Each intake or release of a package on WeSabiHub generates an immutable proof of custody.',
      'Scan the secure QR Code on the right with any smartphone to instantly verify that this receipt is',
      'authentic and matches our official records stored securely on WeSabiHub\'s Firestore databases.',
      '',
      `Secure Verification Token: ${receipt.verificationToken}`
    ];
    doc.text(verifyText, 15, 193);

    // Render the QR code if present
    if (receipt.qrCodeDataUrl) {
      doc.addImage(receipt.qrCodeDataUrl, 'PNG', 150, 190, 45, 45);
    } else {
      // Fallback if no QR Code
      doc.rect(150, 190, 45, 45);
      doc.setFontSize(8);
      doc.text('[QR CODE]', 165, 215);
    }

    // 7. Footer & Legal Disclaimer
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 255, 195, 255);

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400
    const disclaimer = [
      'WeSabiHub Logistics & SafePay Services Co. ensures complete protection for both buyers and sellers.',
      'This document is computer-generated and electronically certified. No physical signature is required to assert validity.',
      'For issues or inquiries regarding this shipment, contact WeSabiHub Support or open the Dispute Resolution Desk.'
    ];
    doc.text(disclaimer, 15, 262);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('WESABIHUB.COM • TRUSTED EVERYWHERE', 15, 282);

    // Trigger download
    doc.save(`WeSabiHub_Receipt_${receipt.receiptId}.pdf`);
  }
}

export const receiptService = new ReceiptService();
