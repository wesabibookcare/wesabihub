import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Printer,
  Download,
  QrCode,
  Building2,
  MessageSquare,
  Phone,
  Mail,
  Share2,
  Sparkles,
  Eye,
  CheckCircle2,
  Package,
  Search,
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Grid,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { parcelEngine, flyerEngine, merchantEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

interface GeneratedFlyerRecord {
  id: string;
  parcelId: string;
  trackingNumber: string;
  customerName: string;
  createdAt: string;
  layoutFormat: string;
  qrUrl: string;
  data: any;
}

const THANK_YOU_TEMPLATES = [
  "Thank you for your order! Your parcel is handled with care via WeSabiHub.",
  "Thank you for supporting our small business! Your order means the world to us.",
  "We appreciate your purchase and trust in our brand!",
  "Your satisfaction matters deeply to us. Thank you for choosing us today!",
  "Thank you for shopping with us! We hope you love your new purchase.",
  "Thank you for trusting our brand. Enjoy your item!",
  "We are thrilled to serve you. Thank you for being a valued customer!",
  "Your order is packed with care. Thank you for choosing us!",
  "Thank you for choosing us! Track your order anytime via WeSabiHub.",
  "Custom Message"
];

export const ParcelFlyerPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialParcelId = searchParams.get('parcelId') || '';

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string>(initialParcelId);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Customizer options
  const [businessName, setBusinessName] = useState('');
  const [businessTagline, setBusinessNameTagline] = useState('Delivering Quality & Trust');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [thankYouNote, setThankYouNote] = useState(THANK_YOU_TEMPLATES[0]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Toggles
  const [showAddress, setShowAddress] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showSocial, setShowSocial] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showWeSabiBranding, setShowWeSabiBranding] = useState(true);

  // Layout & Theme choices
  const [layoutFormat, setLayoutFormat] = useState<'single_a6' | 'grid_6_per_a4'>('single_a6');
  const [designTemplate, setDesignTemplate] = useState<'modern' | 'classic' | 'vibrant' | 'minimal'>('modern');

  // Generated QR Code Data URL for live preview
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Flyer History
  const [flyerHistory, setFlyerHistory] = useState<GeneratedFlyerRecord[]>([]);

  // Print ref
  const flyerPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMerchantAndParcels();
    }
  }, [user]);

  useEffect(() => {
    if (selectedParcelId && parcels.length > 0) {
      const found = parcels.find(p => p.id === selectedParcelId || p.trackingNumber === selectedParcelId);
      if (found) {
        setSelectedParcel(found);
      }
    } else if (parcels.length > 0 && !selectedParcel) {
      setSelectedParcel(parcels[0]);
      setSelectedParcelId(parcels[0].id);
    }
  }, [selectedParcelId, parcels]);

  // Generate QR code whenever selected parcel or tracking URL changes
  useEffect(() => {
    if (selectedParcel) {
      const trackingUrl = `${window.location.origin}/customer/track?id=${selectedParcel.trackingNumber}`;
      QRCode.toDataURL(trackingUrl, { width: 180, margin: 1 })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR generation failed:', err));
    }
  }, [selectedParcel]);

  const loadMerchantAndParcels = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Load merchant profile defaults
      const biz = await merchantEngine.getBusiness(user.uid);
      if (biz) {
        setBusinessName(biz.businessName || '');
        if ((biz as any).tagline) setBusinessNameTagline((biz as any).tagline);
        setContactPhone(biz.phone || user.phoneNumber || '');
        setContactEmail(biz.email || user.email || '');
        if (biz.address) setBusinessAddress(`${biz.address}${biz.city ? `, ${biz.city}` : ''}`);
      }

      // Load merchant shipments
      const userParcels = await parcelEngine.getParcelsBySender(user.uid);
      setParcels(userParcels);

      if (initialParcelId) {
        const found = userParcels.find(p => p.id === initialParcelId || p.trackingNumber === initialParcelId);
        if (found) {
          setSelectedParcel(found);
          setSelectedParcelId(found.id);
        }
      } else if (userParcels.length > 0) {
        setSelectedParcel(userParcels[0]);
        setSelectedParcelId(userParcels[0].id);
      }
    } catch (err) {
      console.error('Failed to load merchant parcel flyer data:', err);
      toast.error('Failed to load shipments for flyer generation');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (idx: number) => {
    setSelectedTemplateIndex(idx);
    if (idx < THANK_YOU_TEMPLATES.length - 1) {
      setThankYouNote(THANK_YOU_TEMPLATES[idx]);
    }
  };

  const generateFlyerPdf = async (parcel: Parcel, options: {
    tagline: string;
    thankYouNote: string;
    contactPhone: string;
    contactEmail: string;
    socialHandle: string;
    address: string;
    showAddress: boolean;
    showPhone: boolean;
    showEmail: boolean;
    showSocial: boolean;
    showQrCode: boolean;
    showWeSabiBranding: boolean;
    designTemplate: string;
    layoutFormat: 'single_a6' | 'grid_6_per_a4';
    qrCodeDataUrl: string;
  }) => {
    if (!user) return;

    const flyerData = await flyerEngine.getFlyerData(user.uid, parcel.id, {
      tagline: options.tagline,
      thankYouNote: options.thankYouNote,
      contactPhone: options.contactPhone,
      contactEmail: options.contactEmail,
      socialHandle: options.socialHandle,
      address: options.address,
      showAddress: options.showAddress,
      showPhone: options.showPhone,
      showEmail: options.showEmail,
      showSocial: options.showSocial,
      showQrCode: options.showQrCode,
      showWeSabiBranding: options.showWeSabiBranding,
      designTemplate: options.designTemplate as any,
      layoutFormat: options.layoutFormat
    });

    if (options.layoutFormat === 'grid_6_per_a4') {
      // 6 Flyers on 1 A4 Page
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });

      // Page Background
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, 210, 297, 'F');

      const cols = 2;
      const rows = 3;
      const blockWidth = 92;
      const blockHeight = 84;
      const startX = 10;
      const startY = 12;
      const gapX = 6;
      const gapY = 8;

      for (let i = 0; i < 6; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const bx = startX + c * (blockWidth + gapX);
        const by = startY + r * (blockHeight + gapY);

        // Card Border and Fill
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 225, 230);
        doc.roundedRect(bx, by, blockWidth, blockHeight, 3, 3, 'FD');

        // Header Bar
        let headerColor = [2, 132, 199]; // Default modern blue
        if (options.designTemplate === 'classic') headerColor = [217, 119, 6];
        if (options.designTemplate === 'vibrant') headerColor = [5, 150, 105];
        if (options.designTemplate === 'minimal') headerColor = [30, 41, 59];

        doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
        doc.roundedRect(bx, by, blockWidth, 14, 3, 3, 'F');
        doc.rect(bx, by + 10, blockWidth, 4, 'F'); // Square bottom corners of header

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(flyerData.merchant.businessName.toUpperCase(), bx + 4, by + 9);

        if (options.showWeSabiBranding) {
          doc.setFontSize(6.5);
          doc.text('WeSabiHub', bx + blockWidth - 18, by + 9);
        }

        // Tagline / Recipient
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`For: ${flyerData.parcel.recipientName}`, bx + 4, by + 20);

        // Note
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        const splitNote = doc.splitTextToSize(options.thankYouNote, blockWidth - 8);
        doc.text(splitNote, bx + 4, by + 25);

        let curY = by + 25 + (Math.min(splitNote.length, 2) * 3.5) + 2;

        // Tracking Ref Box (leaving room for QR code if enabled)
        const refBoxWidth = (options.showQrCode && options.qrCodeDataUrl) ? blockWidth - 32 : blockWidth - 8;
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(bx + 4, curY, refBoxWidth, 12, 2, 2, 'FD');

        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('TRACKING REFERENCE', bx + 6, curY + 4);

        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(flyerData.parcel.trackingNumber, bx + 6, curY + 9.5);

        // QR Code right side in block if enabled
        if (options.showQrCode && options.qrCodeDataUrl) {
          doc.addImage(options.qrCodeDataUrl, 'PNG', bx + blockWidth - 26, curY - 2, 20, 20);
        }

        curY += 15;

        // Contact info line
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');

        const contactParts = [];
        if (options.showPhone && options.contactPhone) contactParts.push(`Tel: ${options.contactPhone}`);
        if (options.showEmail && options.contactEmail) contactParts.push(`Email: ${options.contactEmail}`);
        if (options.showSocial && options.socialHandle) contactParts.push(`Social: ${options.socialHandle}`);
        if (options.showAddress && options.address) contactParts.push(`Addr: ${options.address}`);

        if (contactParts.length > 0) {
          const lineStr = contactParts.slice(0, 2).join(' | ');
          doc.text(lineStr, bx + 4, curY + 2);
        }
      }

      const fileName = `Flyers_6xA4_${parcel.trackingNumber}.pdf`;
      doc.save(fileName);
      return flyerData;
    } else {
      // Single A6 PDF
      const doc = new jsPDF({ format: 'a6', unit: 'mm' });

      doc.setFillColor(250, 250, 250);
      doc.rect(0, 0, 105, 148, 'F');

      let headerColor = [2, 132, 199];
      if (options.designTemplate === 'classic') headerColor = [217, 119, 6];
      if (options.designTemplate === 'vibrant') headerColor = [5, 150, 105];
      if (options.designTemplate === 'minimal') headerColor = [30, 41, 59];

      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(0, 0, 105, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(flyerData.merchant.businessName.toUpperCase(), 8, 12);

      if (options.tagline) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(options.tagline, 8, 17);
      }

      if (options.showWeSabiBranding) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('POWERED BY WESABIHUB', 60, 12);
      }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Prepared for: ${flyerData.parcel.recipientName}`, 8, 32);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const splitNote = doc.splitTextToSize(options.thankYouNote, 89);
      doc.text(splitNote, 8, 40);

      let yPos = 40 + (splitNote.length * 5) + 4;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(8, yPos, 89, 20, 2, 2, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TRACKING REFERENCE', 12, yPos + 6);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(flyerData.parcel.trackingNumber, 12, yPos + 14);

      yPos += 26;

      if (options.showQrCode && options.qrCodeDataUrl) {
        doc.addImage(options.qrCodeDataUrl, 'PNG', 32, yPos, 40, 40);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Scan QR code with phone camera to track live delivery', 14, yPos + 45);
        yPos += 50;
      } else {
        yPos += 10;
      }

      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');

      const contacts = [];
      if (options.showPhone && options.contactPhone) contacts.push(`Tel: ${options.contactPhone}`);
      if (options.showEmail && options.contactEmail) contacts.push(`Email: ${options.contactEmail}`);
      if (options.showSocial && options.socialHandle) contacts.push(`Social: ${options.socialHandle}`);
      if (options.showAddress && options.address) contacts.push(`Addr: ${options.address}`);

      if (contacts.length > 0) {
        const line = doc.splitTextToSize(contacts.join(' | '), 89);
        doc.text(line, 8, yPos);
      }

      const fileName = `Flyer_${parcel.trackingNumber}.pdf`;
      doc.save(fileName);

      return flyerData;
    }
  };

  const handleDownloadPDF = async () => {
    if (!user || !selectedParcel) {
      toast.error('Please select a parcel first');
      return;
    }

    setIsGenerating(true);
    try {
      const flyerData = await generateFlyerPdf(selectedParcel, {
        tagline: businessTagline,
        thankYouNote,
        contactPhone,
        contactEmail,
        socialHandle,
        address: businessAddress,
        showAddress,
        showPhone,
        showEmail,
        showSocial,
        showQrCode,
        showWeSabiBranding,
        designTemplate,
        layoutFormat,
        qrCodeDataUrl
      });

      const record: GeneratedFlyerRecord = {
        id: flyerData.flyerId,
        parcelId: selectedParcel.id,
        trackingNumber: selectedParcel.trackingNumber,
        customerName: selectedParcel.recipientInfo?.name || 'Customer',
        createdAt: new Date().toISOString(),
        layoutFormat,
        qrUrl: flyerData.qrUrl,
        data: flyerData
      };
      setFlyerHistory(prev => [record, ...prev]);

      toast.success(`Parcel flyer PDF downloaded (${layoutFormat === 'grid_6_per_a4' ? '6-per-A4 Sheet' : 'Single A6'})`);
    } catch (err: any) {
      console.error('Failed to generate flyer PDF:', err);
      toast.error(err.message || 'Failed to generate flyer');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!flyerPreviewRef.current) return;
    try {
      setIsGenerating(true);
      const canvas = await html2canvas(flyerPreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Flyer_${selectedParcel?.trackingNumber || 'Image'}.png`;
      link.click();
      toast.success('Flyer PNG image downloaded successfully!');
    } catch (err: any) {
      console.error('Failed to export image:', err);
      toast.error('Failed to export flyer image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!flyerPreviewRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Browser pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    const printContent = layoutFormat === 'grid_6_per_a4'
      ? `<div class="grid-a4">
          ${Array.from({ length: 6 }).map(() => `<div class="flyer-card-a4">${flyerPreviewRef.current?.innerHTML}</div>`).join('')}
         </div>`
      : `<div class="flyer-card-single">
          ${flyerPreviewRef.current?.innerHTML}
         </div>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Parcel Flyer - ${selectedParcel?.trackingNumber || ''}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 10mm;
              background: #fff;
            }
            .grid-a4 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 6mm;
              width: 100%;
              max-width: 190mm;
              margin: 0 auto;
            }
            .flyer-card-a4 {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px;
              background: #ffffff;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .flyer-card-single {
              width: 105mm;
              min-height: 148mm;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              background: #ffffff;
              margin: 0 auto;
            }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 8mm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <MerchantLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                <FileText size={22} />
              </span>
              <h1 className="text-3xl font-bold dark:text-white font-display">Merchant Parcel Flyer Studio</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create, customize, preview, and export 6-per-A4 sheet or single branded parcel flyers with live tracking QR codes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleDownloadImage}
              disabled={!selectedParcel || loading}
              className="rounded-xl flex items-center gap-2 text-xs"
            >
              <ImageIcon size={16} /> PNG Image
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!selectedParcel || loading}
              className="rounded-xl flex items-center gap-2 text-xs"
            >
              <Printer size={16} /> Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedParcel || isGenerating || loading}
              className="rounded-xl flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF ({layoutFormat === 'grid_6_per_a4' ? '6 per A4' : 'Single A6'})
            </Button>
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Customizer Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Step 1: Shipment */}
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-primary-600" /> 1. Target Shipment Selection
              </h2>

              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                    <Loader2 size={16} className="animate-spin" /> Loading your shipments...
                  </div>
                ) : parcels.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm border border-amber-200 dark:border-amber-800">
                    No active or past shipments found for your merchant account. Create a shipment first to generate a parcel flyer.
                  </div>
                ) : (
                  <select
                    value={selectedParcelId}
                    onChange={(e) => setSelectedParcelId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {parcels.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.trackingNumber} — To: {p.recipientInfo?.name || 'Customer'} ({p.destinationCenterId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedParcel && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold dark:text-white">Recipient:</span> {selectedParcel.recipientInfo?.name}
                  </div>
                  <div>
                    <span className="font-bold dark:text-white">Tracking:</span> <span className="font-mono text-primary-600 font-bold">{selectedParcel.trackingNumber}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Step 2: Format & Design Theme */}
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
                <Grid size={18} className="text-primary-600" /> 2. Print Layout & Design Theme
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLayoutFormat('single_a6')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    layoutFormat === 'single_a6'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold dark:text-white">Single Flyer (A6)</p>
                  <p className="text-[10px] text-slate-500 mt-1">One high-res flyer card per PDF page.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutFormat('grid_6_per_a4')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    layoutFormat === 'grid_6_per_a4'
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold dark:text-white flex items-center justify-between">
                    6 Flyers per A4 Sheet <Badge variant="success" className="text-[9px] uppercase">Print Preferred</Badge>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">6 identical flyers laid out in 2x3 grid on single A4 sheet.</p>
                </button>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Design Palette Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'modern', label: 'Modern Sky', color: 'bg-sky-600' },
                    { id: 'classic', label: 'Classic Gold', color: 'bg-amber-600' },
                    { id: 'vibrant', label: 'Vibrant Emerald', color: 'bg-emerald-600' },
                    { id: 'minimal', label: 'Sleek Dark', color: 'bg-slate-800' }
                  ].map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setDesignTemplate(tmpl.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        designTemplate === tmpl.id
                          ? 'border-primary-600 ring-2 ring-primary-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${tmpl.color}`} />
                      <span className="text-[10px] font-bold dark:text-white">{tmpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Step 3: Thank-You Message Templates */}
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-primary-600" /> 3. Thank-You Message Templates (10 Choices)
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Template Preset</label>
                <select
                  value={selectedTemplateIndex}
                  onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {THANK_YOU_TEMPLATES.map((tmpl, idx) => (
                    <option key={idx} value={idx}>
                      #{idx + 1}: {tmpl.substring(0, 60)}{tmpl.length > 60 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Custom Thank-You Message Text</label>
                <textarea
                  rows={3}
                  value={thankYouNote}
                  onChange={(e) => {
                    setThankYouNote(e.target.value);
                    setSelectedTemplateIndex(THANK_YOU_TEMPLATES.length - 1);
                  }}
                  placeholder="Enter custom note to customer..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </Card>

            {/* Step 4: Merchant Info & Toggles */}
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-primary-600" /> 4. Business Information & Toggles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Name</label>
                  <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tagline / Slogan</label>
                  <Input value={businessTagline} onChange={e => setBusinessNameTagline(e.target.value)} placeholder="Business tagline" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
                  <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+234 800 000 0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Email</label>
                  <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="support@brand.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Social Handle</label>
                  <Input value={socialHandle} onChange={e => setSocialHandle(e.target.value)} placeholder="@yourbrand" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address / City</label>
                  <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="Lagos, Nigeria" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} className="accent-primary-600" />
                  <span>Show Phone</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showEmail} onChange={e => setShowEmail(e.target.checked)} className="accent-primary-600" />
                  <span>Show Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showSocial} onChange={e => setShowSocial(e.target.checked)} className="accent-primary-600" />
                  <span>Show Social</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showAddress} onChange={e => setShowAddress(e.target.checked)} className="accent-primary-600" />
                  <span>Show Address</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showQrCode} onChange={e => setShowQrCode(e.target.checked)} className="accent-primary-600" />
                  <span>Show QR Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showWeSabiBranding} onChange={e => setShowWeSabiBranding(e.target.checked)} className="accent-primary-600" />
                  <span>WeSabiHub Seal</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Printable Flyer Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Eye size={18} className="text-primary-400" /> Live Interactive Preview
                </h2>
                <Badge variant="success" className="rounded-lg text-[10px] uppercase font-bold">
                  {layoutFormat === 'grid_6_per_a4' ? '6-per-A4 View' : 'Single A6 View'}
                </Badge>
              </div>

              {/* Printable Canvas */}
              <div
                ref={flyerPreviewRef}
                className="w-full rounded-2xl bg-white text-slate-900 p-5 shadow-xl border border-slate-200 space-y-4 text-left font-sans transition-all"
              >
                {/* Header Banner */}
                <div className={`p-3.5 rounded-xl text-white flex items-center justify-between ${
                  designTemplate === 'classic' ? 'bg-amber-600' :
                  designTemplate === 'vibrant' ? 'bg-emerald-600' :
                  designTemplate === 'minimal' ? 'bg-slate-800' :
                  'bg-sky-600'
                }`}>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide uppercase">{businessName || 'YOUR BUSINESS NAME'}</h3>
                    {businessTagline && <p className="text-[10px] opacity-90 font-medium">{businessTagline}</p>}
                  </div>
                  {showWeSabiBranding && (
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-widest opacity-80 font-bold block">VERIFIED LOGISTICS</span>
                      <span className="text-xs font-black tracking-tight">WeSabiHub</span>
                    </div>
                  )}
                </div>

                {/* Recipient Greeting */}
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PREPARED FOR</p>
                  <p className="text-base font-bold text-slate-900">{selectedParcel?.recipientInfo?.name || 'Valued Customer'}</p>
                </div>

                {/* Custom Note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  "{thankYouNote || 'Thank you for your business!'}"
                </div>

                {/* Tracking Reference Box */}
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">TRACKING NUMBER</p>
                    <p className="text-sm font-black font-mono text-slate-900 tracking-wider">
                      {selectedParcel?.trackingNumber || 'WSH-00000000'}
                    </p>
                  </div>
                  {showQrCode && qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="Tracking QR Code" className="w-12 h-12 object-contain" />
                  )}
                </div>

                {/* Live QR Scan Caption */}
                {showQrCode && (
                  <p className="text-[9.5px] font-semibold text-slate-500 text-center">
                    Scan QR code with phone camera to track live delivery on WeSabiHub
                  </p>
                )}

                {/* Footer Contacts */}
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1 text-center font-medium">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {showPhone && contactPhone && <span>📞 {contactPhone}</span>}
                    {showEmail && contactEmail && <span>✉️ {contactEmail}</span>}
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {showSocial && socialHandle && <span>📱 {socialHandle}</span>}
                    {showAddress && businessAddress && <span>📍 {businessAddress}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" /> Authenticated Merchant Data
                </span>
                <button
                  onClick={() => {
                    if (selectedParcel) {
                      navigator.clipboard.writeText(`${window.location.origin}/customer/track?id=${selectedParcel.trackingNumber}`);
                      toast.success('Public tracking link copied!');
                    }
                  }}
                  className="flex items-center gap-1 text-primary-400 hover:underline"
                >
                  <Copy size={12} /> Copy Tracking URL
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Flyer Generation History Table */}
        {flyerHistory.length > 0 && (
          <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-primary-600" /> Recent Generated Flyers History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase">
                    <th className="py-2.5 px-3 font-bold">Flyer ID</th>
                    <th className="py-2.5 px-3 font-bold">Tracking #</th>
                    <th className="py-2.5 px-3 font-bold">Customer</th>
                    <th className="py-2.5 px-3 font-bold">Format</th>
                    <th className="py-2.5 px-3 font-bold">Date Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {flyerHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-[10px]">{item.id}</td>
                      <td className="py-2.5 px-3 font-mono text-primary-600 font-bold">{item.trackingNumber}</td>
                      <td className="py-2.5 px-3 font-medium dark:text-white">{item.customerName}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {item.layoutFormat === 'grid_6_per_a4' ? '6 per A4' : 'Single A6'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </MerchantLayout>
  );
};
