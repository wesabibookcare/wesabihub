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
  ShieldCheck
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

interface GeneratedFlyerRecord {
  id: string;
  parcelId: string;
  trackingNumber: string;
  customerName: string;
  createdAt: string;
  qrUrl: string;
  data: any;
}

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
  const [businessLogo, setBusinessLogo] = useState('');
  const [thankYouNote, setThankYouNote] = useState('Thank you for your order! Your parcel is handled with care via WeSabiHub.');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showWeSabiBranding, setShowWeSabiBranding] = useState(true);

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
        setBusinessLogo(biz.logoUrl || '');
        setContactPhone(biz.phone || user.phoneNumber || '');
        setContactEmail(biz.email || user.email || '');
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

  const generateFlyerPdf = async (parcel: Parcel, options: {
    thankYouNote: string;
    contactPhone: string;
    contactEmail: string;
    socialHandle: string;
    showQrCode: boolean;
    showWeSabiBranding: boolean;
    qrCodeDataUrl: string;
  }) => {
    if (!user) return;

    const flyerData = await flyerEngine.getFlyerData(user.uid, parcel.id, {
      thankYouNote: options.thankYouNote,
      contactPhone: options.contactPhone,
      contactEmail: options.contactEmail,
      socialHandle: options.socialHandle,
      showQrCode: options.showQrCode,
      showWeSabiBranding: options.showWeSabiBranding
    });

    const doc = new jsPDF({
      format: 'a6',
      unit: 'mm'
    });

    // Background card styling
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 105, 148, 'F');

    // Top Header bar
    doc.setFillColor(2, 132, 199); // WeSabi Primary Blue
    doc.rect(0, 0, 105, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(flyerData.merchant.businessName.toUpperCase(), 8, 12);

    if (options.showWeSabiBranding) {
      doc.setFontSize(8);
      doc.text('POWERED BY WESABIHUB', 62, 12);
    }

    // Customer Greeting
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`For: ${flyerData.parcel.recipientName}`, 8, 28);

    // Thank you message
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const splitNote = doc.splitTextToSize(options.thankYouNote, 90);
    doc.text(splitNote, 8, 36);

    let yPos = 36 + (splitNote.length * 5) + 4;

    // Parcel Reference Box
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

    // QR Code Section
    if (options.showQrCode && options.qrCodeDataUrl) {
      doc.addImage(options.qrCodeDataUrl, 'PNG', 32, yPos, 40, 40);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Scan QR code with phone camera to track live delivery', 16, yPos + 45);
      yPos += 50;
    } else {
      yPos += 10;
    }

    // Contact info footer
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');

    const contacts = [];
    if (options.contactPhone) contacts.push(`Tel: ${options.contactPhone}`);
    if (options.contactEmail) contacts.push(`Email: ${options.contactEmail}`);
    if (options.socialHandle) contacts.push(`Social: ${options.socialHandle}`);

    if (contacts.length > 0) {
      doc.text(contacts.join(' | '), 8, yPos);
    }

    const fileName = `Flyer_${parcel.trackingNumber}.pdf`;
    doc.save(fileName);

    return flyerData;
  };

  const handleDownloadPDF = async () => {
    if (!user || !selectedParcel) {
      toast.error('Please select a parcel first');
      return;
    }

    setIsGenerating(true);
    try {
      const flyerData = await generateFlyerPdf(selectedParcel, {
        thankYouNote,
        contactPhone,
        contactEmail,
        socialHandle,
        showQrCode,
        showWeSabiBranding,
        qrCodeDataUrl
      });

      // Save to Flyer History
      const record: GeneratedFlyerRecord = {
        id: flyerData.flyerId,
        parcelId: selectedParcel.id,
        trackingNumber: selectedParcel.trackingNumber,
        customerName: selectedParcel.recipientInfo?.name || 'Customer',
        createdAt: new Date().toISOString(),
        qrUrl: flyerData.qrUrl,
        data: flyerData
      };
      setFlyerHistory(prev => [record, ...prev]);

      toast.success('Parcel flyer PDF downloaded successfully');
    } catch (err: any) {
      console.error('Failed to generate flyer PDF:', err);
      toast.error(err.message || 'Failed to generate flyer');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRedownloadHistoryItem = async (item: GeneratedFlyerRecord) => {
    const parcel = parcels.find(p => p.id === item.parcelId);
    if (!parcel) {
      toast.error('This shipment could not be found for re-download.');
      return;
    }
    setIsGenerating(true);
    try {
      // Re-generate the QR for that specific parcel's tracking number so
      // the re-download matches the parcel this history row actually belongs to.
      const trackingUrl = `${window.location.origin}/customer/track?id=${parcel.trackingNumber}`;
      const qrUrl = await QRCode.toDataURL(trackingUrl, { width: 180, margin: 1 });

      await generateFlyerPdf(parcel, {
        thankYouNote: item.data?.customOptions?.thankYouNote ?? thankYouNote,
        contactPhone: item.data?.customOptions?.contactPhone ?? contactPhone,
        contactEmail: item.data?.customOptions?.contactEmail ?? contactEmail,
        socialHandle: item.data?.customOptions?.socialHandle ?? socialHandle,
        showQrCode: item.data?.customOptions?.showQrCode ?? showQrCode,
        showWeSabiBranding: item.data?.customOptions?.showWeSabiBranding ?? showWeSabiBranding,
        qrCodeDataUrl: qrUrl
      });
      toast.success('Flyer re-downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-download this flyer');
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

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Parcel Flyer - ${selectedParcel?.trackingNumber || ''}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: #fff;
              display: flex;
              justify-content: center;
            }
            .flyer-card {
              width: 105mm;
              min-height: 148mm;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              box-sizing: border-box;
              background: #fafafa;
            }
            @media print {
              body { padding: 0; }
              .flyer-card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="flyer-card">
            ${flyerPreviewRef.current.innerHTML}
          </div>
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
      <div className="space-y-8 max-w-7xl mx-auto">
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
              Create, customize, preview, and print branded parcel insert flyers with live tracking QR codes for your customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!selectedParcel || loading}
              className="rounded-xl flex items-center gap-2"
            >
              <Printer size={18} /> Print Flyer
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={!selectedParcel || isGenerating || loading}
              className="rounded-xl flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Download PDF Flyer
            </Button>
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Customizer Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 space-y-6 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-primary-600" /> 1. Select Shipment
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Shipment / Parcel
                </label>
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
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Recipient:</span> {selectedParcel.recipientInfo?.name}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Status:</span>{' '}
                    <Badge variant="info" className="capitalize">{selectedParcel.status.toLowerCase().replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-6 border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-primary-600" /> 2. Branding & Content Customizer
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Business Name</label>
                  <Input
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Social Media Handle</label>
                  <Input
                    value={socialHandle}
                    onChange={e => setSocialHandle(e.target.value)}
                    placeholder="@yourbusiness"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thank-You Message / Customer Note</label>
                <textarea
                  rows={3}
                  value={thankYouNote}
                  onChange={e => setThankYouNote(e.target.value)}
                  placeholder="Enter thank you message to your customer..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <Input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Support Email</label>
                  <Input
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="support@yourbusiness.com"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold dark:text-white">Live Tracking QR Code</p>
                    <p className="text-xs text-slate-500">Includes camera-scannable QR code linking to public parcel tracking.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={e => setShowQrCode(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold dark:text-white">WeSabiHub Platform Seal</p>
                    <p className="text-xs text-slate-500">Shows 'Powered by WeSabiHub' logistics verification watermark.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showWeSabiBranding}
                    onChange={e => setShowWeSabiBranding(e.target.checked)}
                    className="w-5 h-5 accent-primary-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Printable Flyer Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Eye size={18} className="text-primary-400" /> Live Interactive Preview
                </h2>
                <Badge variant="success" className="rounded-lg text-[10px] uppercase font-bold">A6 Format</Badge>
              </div>

              {/* Printable Canvas */}
              <div
                ref={flyerPreviewRef}
                className="w-full rounded-2xl bg-slate-50 text-slate-900 p-6 shadow-xl border border-slate-200 space-y-5 text-left font-sans transition-all"
              >
                {/* Header Banner */}
                <div className="p-4 rounded-xl bg-primary-600 text-white flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base tracking-wide uppercase">{businessName || 'YOUR BUSINESS NAME'}</h3>
                    <p className="text-[10px] text-primary-100 font-medium">OFFICIAL PARCEL FLYER</p>
                  </div>
                  {showWeSabiBranding && (
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-widest text-primary-200 font-bold block">LOGISTICS SEAL</span>
                      <span className="text-xs font-extrabold tracking-tight">WeSabiHub</span>
                    </div>
                  )}
                </div>

                {/* Recipient Greeting */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">PREPARED FOR</p>
                  <p className="text-lg font-bold text-slate-900">{selectedParcel?.recipientInfo?.name || 'Valued Customer'}</p>
                </div>

                {/* Custom Note */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                  "{thankYouNote || 'Thank you for your business!'}"
                </div>

                {/* Tracking Reference Box */}
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TRACKING NUMBER</p>
                  <p className="text-base font-extrabold font-mono text-slate-900 tracking-wider">
                    {selectedParcel?.trackingNumber || 'WSH-00000000'}
                  </p>
                </div>

                {/* Live QR Code Preview */}
                {showQrCode && (
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Tracking QR Code" className="w-32 h-32 object-contain" />
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                        QR Code Loading...
                      </div>
                    )}
                    <p className="text-[10px] font-semibold text-slate-500 text-center">
                      Scan with camera to track parcel live on WeSabiHub
                    </p>
                  </div>
                )}

                {/* Footer Contacts */}
                <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1 text-center font-medium">
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {contactPhone && <span>📞 {contactPhone}</span>}
                    {contactEmail && <span>✉️ {contactEmail}</span>}
                  </div>
                  {socialHandle && <div>📱 {socialHandle}</div>}
                  <div className="text-[9px] text-slate-400 font-normal pt-1">
                    Verified shipment via WeSabiHub Logistics Engine • www.wesabihub.com
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" /> Authenticated & Security Verified
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
            <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-primary-600" /> Recent Generated Flyers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase">
                    <th className="py-3 px-4 font-bold">Flyer ID</th>
                    <th className="py-3 px-4 font-bold">Tracking #</th>
                    <th className="py-3 px-4 font-bold">Customer</th>
                    <th className="py-3 px-4 font-bold">Date Generated</th>
                    <th className="py-3 px-4 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {flyerHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs">{item.id}</td>
                      <td className="py-3 px-4 font-mono text-primary-600 font-bold">{item.trackingNumber}</td>
                      <td className="py-3 px-4 font-medium dark:text-white">{item.customerName}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRedownloadHistoryItem(item)}
                          disabled={isGenerating}
                          className="rounded-lg text-xs"
                        >
                          <Download size={14} className="mr-1" /> PDF
                        </Button>
                      </td>
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
