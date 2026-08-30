import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Files,
  Upload,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Package,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { workflowEngine, centreEngine } from '@/src/engines';
import { HubCenter, Parcel } from '@/src/types';
import { toast } from 'sonner';

interface BulkItem {
  id: number;
  recipient: string;
  phone: string;
  email?: string;
  category: string;
  hubId: string;
  hubName: string;
  weightKg: number;
  estimatedValue: number;
}

export const BulkShipmentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD' | 'BANK' | 'FLUTTERWAVE'>('WALLET');
  const [hubs, setHubs] = useState<HubCenter[]>([]);
  const [originHubId, setOriginHubId] = useState('');
  const [shipments, setShipments] = useState<BulkItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<{ batchId: string; parcels: Parcel[]; totalCount: number; totalCost: number } | null>(null);

  useEffect(() => {
    const loadHubs = async () => {
      try {
        const list = await centreEngine.listNearbyHubs(0, 0, 9999);
        const active = list.filter(h => h.status === 'ACTIVE');
        setHubs(active);
        if (active.length > 0) setOriginHubId(prev => prev || active[0].id);
      } catch (err) {
        console.error('Failed to load hubs:', err);
      }
    };
    loadHubs();
  }, []);

  const handleDownloadTemplate = () => {
    const csvContent = "Recipient Name,Phone Number,Email,Category,Destination Hub ID,Weight (kg),Estimated Value (NGN)\nJohn Doe,+2348021234567,john@example.com,Fashion,hub-lagos-main,2.5,15000\nJane Smith,+2348039876543,jane@example.com,Electronics,hub-abuja-main,1.0,35000";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'OmorfiHub_Bulk_Shipments_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded CSV Template');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        const newItems: BulkItem[] = [];

        const startIdx = lines[0].toLowerCase().includes('recipient') || lines[0].toLowerCase().includes('name') ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2) {
            const recipient = cols[0] || `Recipient ${i}`;
            const phone = cols[1] || '+234 800 000 0000';
            const email = cols[2] && cols[2].includes('@') ? cols[2] : undefined;
            const category = cols[3] || 'General Goods';
            const rawHub = cols[4] || (hubs[0]?.id || 'hub-lagos-main');
            const weightKg = parseFloat(cols[5]) || 1.0;
            const estimatedValue = parseFloat(cols[6]) || 5000;

            const foundHub = hubs.find(h => h.id === rawHub || h.name.toLowerCase().includes(rawHub.toLowerCase()));

            newItems.push({
              id: Date.now() + i,
              recipient,
              phone,
              email,
              category,
              hubId: foundHub?.id || hubs[0]?.id || 'hub-lagos-main',
              hubName: foundHub?.name || 'Selected Hub',
              weightKg,
              estimatedValue
            });
          }
        }

        setShipments(prev => [...prev, ...newItems]);
        setSuccessMsg(`Successfully imported ${newItems.length} records from "${file.name}"`);
        setActiveTab('manual');
      } catch (err) {
        toast.error('Failed to parse CSV file. Please use the standard template.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessBulk = async () => {
    if (!user) {
      toast.error('You must be logged in to process bulk shipments.');
      return;
    }

    if (shipments.length === 0) {
      toast.error('Please add at least one shipment.');
      return;
    }

    if (!originHubId) {
      toast.error('Please select your pickup / origin hub before submitting.');
      return;
    }

    const incomplete = shipments.find(s => !s.recipient.trim() || !s.phone.trim() || !s.hubId);
    if (incomplete) {
      toast.error('Please fill in the recipient name, phone number, and destination hub for every row before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parcelPayloads = shipments.map(s => ({
        senderId: user.uid,
        recipientInfo: {
          name: s.recipient,
          phone: s.phone,
          email: s.email
        },
        originCenterId: originHubId,
        destinationCenterId: s.hubId || (hubs[0]?.id || 'hub-lagos-main'),
        weightKg: s.weightKg || 1,
        estimatedValue: s.estimatedValue || 5000,
        category: s.category,
        fulfillmentMethod: 'HUB_PICKUP' as const
      }));

      const response = await workflowEngine.runBulkParcelCreationWorkflow(
        user.uid,
        parcelPayloads,
        paymentMethod
      );

      if (response.success && response.data) {
        setBatchResult(response.data);
        toast.success(`Batch ${response.data.batchId} processed successfully!`);
        setShipments([]);
      } else {
        toast.error(response.message || 'Bulk shipment processing failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process bulk shipments.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateShipment = (id: number, field: keyof BulkItem, value: string | number) => {
    setShipments(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (field === 'hubId') {
        const hub = hubs.find(h => h.id === value);
        return { ...s, hubId: value as string, hubName: hub?.name || s.hubName };
      }
      return { ...s, [field]: value };
    }));
  };

  const isPendingVerification = !!(user?.pendingRoleApplication || user?.status === 'PENDING' || user?.status === 'SUBMITTED');

  if (isPendingVerification) {
    return (
      <MerchantLayout>
        <div className="max-w-2xl mx-auto my-12 p-8 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-3xl text-center space-y-6 shadow-md">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 mx-auto">
            <AlertCircle size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold dark:text-white font-display">Merchant Application Under Review</h2>
            <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
              Your Merchant business profile is currently pending Admin verification. Bulk shipment creation will be unlocked automatically as soon as your account approval is completed.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="rounded-xl px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs">
              <Link to="/merchant/dashboard">Go to Merchant Dashboard</Link>
            </Button>
          </div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Bulk Shipments</h1>
            <p className="text-slate-800">Upload and process multiple shipments via CSV template or manual entry.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={handleDownloadTemplate} className="rounded-xl flex items-center gap-2">
                <Download size={18} /> Download CSV Template
             </Button>
          </div>
        </div>

        {batchResult && (
          <Card className="p-8 border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-6 rounded-3xl">
            <div className="flex items-center gap-4 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={32} />
              <div>
                <h3 className="text-xl font-bold">Batch Processing Complete!</h3>
                <p className="text-xs">Batch Reference: <span className="font-mono font-bold">{batchResult.batchId}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-800 uppercase font-bold">Total Shipments</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{batchResult.totalCount}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-800 uppercase font-bold">Total Charge</p>
                <p className="text-2xl font-black text-primary-600">₦{batchResult.totalCost.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] text-slate-800 uppercase font-bold">Status</p>
                <p className="text-2xl font-black text-emerald-600">Booked</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Created Tracking Numbers</h4>
              <div className="flex flex-wrap gap-2">
                {batchResult.parcels.map(p => (
                  <span key={p.id}>
                    <Badge variant="outline" className="font-mono text-xs py-1 px-3">
                      {p.trackingNumber}
                    </Badge>
                  </span>
                ))}
              </div>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => setBatchResult(null)}>
              Start New Batch
            </Button>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
           <button
             onClick={() => setActiveTab('upload')}
             className={cn(
               "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
               activeTab === 'upload' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
             )}
           >
              Upload Spreadsheet
           </button>
           <button
             onClick={() => setActiveTab('manual')}
             className={cn(
               "px-6 py-2.5 rounded-xl font-bold text-sm transition-all",
               activeTab === 'manual' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
             )}
           >
              Manual Entry
           </button>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl text-xs font-bold uppercase tracking-wide">
            {successMsg}
          </div>
        )}

        {activeTab === 'upload' ? (
          <div className="space-y-8 animate-fade-in">
              <Card
                onClick={() => document.getElementById('spreadsheet-input')?.click()}
                className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center space-y-6 group hover:border-primary-500/50 transition-colors cursor-pointer"
              >
                 <input
                   type="file"
                   id="spreadsheet-input"
                   className="hidden"
                   accept=".csv,.xlsx,.xls"
                   onChange={handleFileChange}
                 />
                 <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 mx-auto shadow-lg shadow-primary-500/5 group-hover:scale-110 transition-transform">
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    ) : (
                      <Upload size={32} />
                    )}
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold dark:text-white">
                      {isProcessing ? "Analyzing CSV records..." : "Click to select or drag CSV spreadsheet here"}
                    </h3>
                    <p className="text-sm text-slate-800 max-w-sm mx-auto">Supports standard .csv format. Maximum 500 rows per upload.</p>
                 </div>
                 <div className="pt-4">
                    <Button
                      type="button"
                      className="rounded-xl px-10 h-12 shadow-lg shadow-primary-500/20"
                      isLoading={isProcessing}
                    >
                       Browse Files
                    </Button>
                 </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { title: 'Download Template', desc: 'Get our pre-formatted CSV template.', icon: Download },
                   { title: 'Data Validation', desc: 'We automatically check for errors.', icon: CheckCircle2 },
                   { title: 'Save Hubs', desc: 'Reference your saved hubs by name or ID.', icon: FileSpreadsheet },
                 ].map((feature, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-900 shrink-0">
                         <feature.icon size={20} />
                      </div>
                      <div>
                         <h4 className="font-bold text-sm dark:text-white">{feature.title}</h4>
                         <p className="text-[10px] text-slate-800">{feature.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
              <Card className="p-6 border-slate-200 dark:border-slate-800 bg-primary-50/30 dark:bg-primary-900/10">
                 <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Pickup / Origin Hub (applies to this whole batch)</label>
                 <select
                   value={originHubId}
                   onChange={(e) => setOriginHubId(e.target.value)}
                   className="w-full mt-2 h-12 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white text-sm font-semibold"
                 >
                    <option value="" disabled>Select the hub you'll drop these parcels off at</option>
                    {hubs.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}
                 </select>
                 <p className="text-[11px] text-slate-500 mt-2">All shipments in this batch will be picked up from this single hub. Each row's "Destination Hub" is where that parcel is delivered to.</p>
              </Card>

              <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
                 <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold dark:text-white">Multi-Shipment Entry</h3>
                    <Badge variant="info">{shipments.length} Shipments Added</Badge>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Recipient</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Category</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Destination Hub</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Weight (kg)</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-900 uppercase tracking-widest">Est. Value (₦)</th>
                             <th className="px-6 py-4 text-right"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {shipments.map((shipment) => (
                            <tr key={shipment.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30">
                               <td className="px-6 py-3 min-w-[220px]">
                                  <input
                                    value={shipment.recipient}
                                    onChange={(e) => updateShipment(shipment.id, 'recipient', e.target.value)}
                                    placeholder="Recipient name"
                                    className="w-full bg-transparent border-none outline-none font-bold text-sm dark:text-white focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  />
                                  <input
                                    value={shipment.phone}
                                    onChange={(e) => updateShipment(shipment.id, 'phone', e.target.value)}
                                    placeholder="Phone number"
                                    className="w-full bg-transparent border-none outline-none text-[11px] text-slate-800 focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  />
                               </td>
                               <td className="px-6 py-3 min-w-[160px]">
                                  <select
                                    value={shipment.category}
                                    onChange={(e) => updateShipment(shipment.id, 'category', e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-sm dark:text-white font-semibold focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  >
                                    <option>Fashion & Apparel</option>
                                    <option>Electronics</option>
                                    <option>Beauty & Personal Care</option>
                                    <option>Home & Office</option>
                                    <option>General Goods</option>
                                  </select>
                               </td>
                               <td className="px-6 py-3 min-w-[200px]">
                                  <select
                                    value={shipment.hubId}
                                    onChange={(e) => updateShipment(shipment.id, 'hubId', e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-sm dark:text-white font-semibold focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  >
                                    {hubs.length === 0 && <option value={shipment.hubId}>{shipment.hubName}</option>}
                                    {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                  </select>
                               </td>
                               <td className="px-6 py-3 min-w-[100px]">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={shipment.weightKg}
                                    onChange={(e) => updateShipment(shipment.id, 'weightKg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                    className="w-full bg-transparent border-none outline-none text-sm dark:text-white font-bold focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  />
                               </td>
                               <td className="px-6 py-3 min-w-[120px]">
                                  <input
                                    type="number"
                                    value={shipment.estimatedValue}
                                    onChange={(e) => updateShipment(shipment.id, 'estimatedValue', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent border-none outline-none text-sm text-primary-600 font-bold focus:ring-2 focus:ring-primary-500/20 rounded-lg px-2 py-1 -mx-2"
                                  />
                               </td>
                               <td className="px-6 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setShipments(shipments.filter(s => s.id !== shipment.id))}
                                    className="p-2 text-slate-900 hover:text-red-500 transition-colors"
                                  >
                                     <Trash2 size={18} />
                                  </button>
                               </td>
                            </tr>
                          ))}
                          {shipments.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12">
                                <EmptyState
                                  icon={Files}
                                  title="No shipments entered"
                                  description="Upload a spreadsheet or click 'Add Row' below to start."
                                />
                              </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
                 <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl flex items-center gap-2 text-sm"
                      onClick={() => setShipments([
                        ...shipments,
                        {
                          id: Date.now(),
                          recipient: '',
                          phone: '',
                          category: 'Fashion & Apparel',
                          hubId: hubs[0]?.id || '',
                          hubName: hubs[0]?.name || '',
                          weightKg: 1.0,
                          estimatedValue: 5000
                        }
                      ])}
                    >
                       <Plus size={18} /> Add Row
                    </Button>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                       <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-800">Payment Method:</span>
                          <select
                            value={paymentMethod}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'CARD') {
                                toast.error('Card payments are temporarily disabled for platform payments. Please select Merchant Wallet or Bank Transfer.');
                                return;
                              }
                              setPaymentMethod(val as any);
                            }}
                            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 font-bold"
                          >
                            <option value="WALLET">Merchant Wallet</option>
                            <option value="BANK">Bank Transfer (Paystack)</option>
                            <option value="CARD" disabled>Card Payment (Disabled)</option>
                          </select>
                       </div>
                       <Button
                         type="button"
                         onClick={handleProcessBulk}
                         isLoading={isSubmitting}
                         className="rounded-xl px-8 shadow-lg shadow-primary-500/20"
                         disabled={shipments.length === 0 || isSubmitting}
                       >
                         Submit Bulk Shipments ({shipments.length})
                       </Button>
                    </div>
                 </div>
              </Card>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                 <AlertCircle className="text-amber-600 shrink-0" size={20} />
                 <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Bulk shipments are processed authoritatively through the Workflow Engine. All child tracking records, pricing calculations, and audit trails will be recorded in real time.
                 </p>
              </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
};
