import React, { useState } from 'react';
import {
  FileText, Download, Calendar, Filter, Eye, RefreshCw,
  CheckCircle2, AlertTriangle, FileSpreadsheet, Printer,
  Info, Sparkles, BookOpen, Clock, Package, DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';

// Predefined Report Types
interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  category: 'FINANCE' | 'LOGISTICS' | 'USERS' | 'DISPUTES';
  frequency: 'Real-time' | 'Daily' | 'Weekly' | 'Monthly';
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: 'SafePay_ledger', title: 'SafePay Transactions & Ledger Report', description: 'Complete reconciliation of held, released, and refunded SafePay funds with commission audits.', category: 'FINANCE', frequency: 'Real-time' },
  { id: 'logistics_throughput', title: 'Logistics Partner Volume & SLA Audit', description: 'Package drop-off rates, transit times, point-to-point transfers, and delivery success metrics.', category: 'LOGISTICS', frequency: 'Daily' },
  { id: 'user_registry', title: 'Merchant & Hub Point Performance Audit', description: 'Active merchant sales throughput, hub centers ratings, star rankings, and active employees.', category: 'USERS', frequency: 'Weekly' },
  { id: 'dispute_resolution', title: 'Dispute Resolutions & Support SLA Log', description: 'Active customer claims, dispute categorizations, refund ratios, and average resolution times.', category: 'DISPUTES', frequency: 'Real-time' },
];

// Mock preview data generator based on selected report
const MOCK_SAFEPAY_PREVIEW = [
  { ref: 'TX-4921-ESC', date: '2026-07-09', merchant: 'Alpha Electronics', hub: 'VGC Lekki Hub', amount: 450.00, comm: 67.50, status: 'HELD' },
  { ref: 'TX-4810-ESC', date: '2026-07-08', merchant: 'Bose Boutique', hub: 'Ikeja Mall Hub', amount: 120.00, comm: 18.00, status: 'RELEASED' },
  { ref: 'TX-4731-ESC', date: '2026-07-08', merchant: 'Cosmo Gadgets', hub: 'Maryland Hub', amount: 980.00, comm: 147.00, status: 'RELEASED' },
  { ref: 'TX-4612-ESC', date: '2026-07-07', merchant: 'Diva Trends', hub: 'VGC Lekki Hub', amount: 350.50, comm: 52.50, status: 'REFUNDED' },
  { ref: 'TX-4521-ESC', date: '2026-07-06', merchant: 'Epicurean NG', hub: 'Surulere Plaza', amount: 1500.00, comm: 225.00, status: 'DISPUTED' },
];

const MOCK_LOGISTICS_PREVIEW = [
  { tracking: 'TRK-9812-NGA', sender: 'Samuel L.', pickup: '2026-07-08', delivery: '2026-07-09', hub: 'Maryland Hub', carrier: 'Swift Express', status: 'DELIVERED' },
  { tracking: 'TRK-9281-NGA', sender: 'Rita K.', pickup: '2026-07-08', delivery: 'Pending', hub: 'VGC Lekki Hub', carrier: 'Red Star Logistics', status: 'IN_TRANSIT' },
  { tracking: 'TRK-8812-NGA', sender: 'Tunde O.', pickup: '2026-07-07', delivery: '2026-07-09', hub: 'Ikeja Mall Hub', carrier: 'Swift Express', status: 'DELIVERED' },
  { tracking: 'TRK-8419-NGA', sender: 'Amaka P.', pickup: '2026-07-07', delivery: 'Pending', hub: 'Surulere Plaza', carrier: 'DHL Express Partner', status: 'AWAITING_DISPATCH' },
];

const MOCK_USERS_PREVIEW = [
  { id: 'USR-891', name: 'Alpha Electronics', role: 'MERCHANT', country: 'Nigeria', rank: 'Premium', sales: 128, rating: 4.8 },
  { id: 'USR-342', name: 'VGC Lekki Hub', role: 'CENTER_OWNER', country: 'Nigeria', rank: 'A+', sales: 492, rating: 4.9 },
  { id: 'USR-119', name: 'Glow Ghana Boutique', role: 'MERCHANT', country: 'Ghana', rank: 'Standard', sales: 45, rating: 4.4 },
  { id: 'USR-702', name: 'Maryland Hub Point', role: 'CENTER_OWNER', country: 'Nigeria', rank: 'B', sales: 184, rating: 4.2 },
];

export const ReportsPage = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('SafePay_ledger');
  const [dateFrom, setDateFrom] = useState<string>('2026-07-01');
  const [dateTo, setDateTo] = useState<string>('2026-07-10');
  const [region, setRegion] = useState<string>('NG');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleGeneratePreview = () => {
    setIsPreviewing(true);
    // Simulate query loading
    setTimeout(() => {
      setIsPreviewing(false);
    }, 600);
  };

  const getActiveData = () => {
    switch (selectedTemplate) {
      case 'SafePay_ledger': return MOCK_SAFEPAY_PREVIEW;
      case 'logistics_throughput': return MOCK_LOGISTICS_PREVIEW;
      case 'user_registry': return MOCK_USERS_PREVIEW;
      default: return [];
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers.map(header => {
        const val = (row as any)[header];
        const stringVal = val === null || val === undefined ? '' : String(val);
        // Escape quotes and wrap in quotes if contains comma or newline
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  // Standard high-fidelity CSV / Excel exporter
  const handleExport = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    setIsExporting(true);
    const data = getActiveData();
    const activeTitle = REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.title || 'Report';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${activeTitle.replace(/\s+/g, '_')}_${timestamp}`;

    setTimeout(() => {
      setIsExporting(false);

      try {
        if (format === 'PDF') {
          window.print();
          return;
        }

        if (format === 'CSV') {
          const csv = convertToCSV(data);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          downloadFile(blob, `${filename}.csv`);
        } else if (format === 'EXCEL') {
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          downloadFile(blob, `${filename}.xlsx`);
        }

        setExportSuccess(`SUCCESS: Your ${format} document for "${activeTitle}" was compiled and downloaded.`);
        toast.success(`Export successful: ${format} document generated.`);
        setTimeout(() => setExportSuccess(null), 5000);
      } catch (error) {
        console.error('Export failed:', error);
        toast.error('Export failed');
      }
    }, 1000);
  };

  const activeTemplate = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <AdminLayout>
      <div className="space-y-8 print:p-0 print:space-y-4">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6 print:hidden">
          <div>
            <p className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              Enterprise Ledger Reporting
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Reporting Engine
            </h1>
            <p className="text-sm text-slate-900 font-medium">
              Export transactional auditing, logistics SLAs, and Hub Point rankings in pristine formats.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('PDF')}
              variant="outline"
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 font-bold"
            >
              <Printer size={16} className="mr-2" /> Direct Print PDF
            </Button>
          </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-tight">{activeTemplate?.title}</h1>
          <p className="text-xs text-slate-900 mt-1">WeSabiHub Unified Reporting System — Confidential Audit Record</p>
          <div className="grid grid-cols-4 gap-4 mt-4 text-[10px] font-mono">
            <div><strong>Date Scope:</strong> {dateFrom} to {dateTo}</div>
            <div><strong>Region Filter:</strong> {region}</div>
            <div><strong>Segment status:</strong> {statusFilter}</div>
            <div><strong>Printed At:</strong> {new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* Export success toast */}
        {exportSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-3 print:hidden">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 animate-bounce" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Report Selectors & Parameters */}
          <div className="lg:col-span-1 space-y-6 print:hidden">

            {/* Box 1: Select Profile */}
            <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-600" /> 1. Report Profiles
              </h3>

              <div className="space-y-3">
                {REPORT_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5",
                      selectedTemplate === tmpl.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                        : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-black tracking-widest uppercase opacity-75">{tmpl.category}</span>
                      <Badge className={cn(
                        "text-[9px] font-bold px-2 py-0 border-none shrink-0",
                        selectedTemplate === tmpl.id ? "bg-white/25 text-white" : "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {tmpl.frequency}
                      </Badge>
                    </div>
                    <h4 className="text-xs font-black leading-snug">{tmpl.title}</h4>
                    <p className="text-[10px] opacity-75 leading-relaxed font-medium line-clamp-2 mt-0.5">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Box 2: Parameters & Filters */}
            <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md space-y-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Filter size={16} className="text-primary-600" /> 2. Export Filters
              </h3>

              <div className="space-y-4">

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Start Date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">End Date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    />
                  </div>
                </div>

                {/* Region Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Operational Area</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                  >
                    <option value="NG">Nigeria (NGN)</option>
                    <option value="GH">Ghana (GHS)</option>
                    <option value="KE">Kenya (KES)</option>
                    <option value="RW">Rwanda (RWF)</option>
                  </select>
                </div>

                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Reconciliation Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                  >
                    <option value="ALL">Show All Records</option>
                    <option value="SUCCESS">Success / Completed Only</option>
                    <option value="ACTIVE">Locked / Active Holding Only</option>
                    <option value="DISPUTE">Disputed / Exception Flagged</option>
                  </select>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

                <Button
                  onClick={handleGeneratePreview}
                  className="w-full rounded-xl py-3 text-xs font-bold shadow-lg shadow-primary-500/10"
                >
                  <RefreshCw size={14} className="mr-2 animate-spin-slow" /> Generate Data Stream
                </Button>

              </div>
            </Card>

          </div>

          {/* Right Column: Grid Preview & Export Controls */}
          <div className="lg:col-span-2 space-y-6">

            {/* Preview Sheet Card */}
            <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md">

              {/* Card Header controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 print:hidden">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider font-mono">Live Document Preview</h3>
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {activeTemplate?.title}
                  </h4>
                </div>

                {/* Export triggers */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => handleExport('CSV')}
                    variant="outline"
                    className="rounded-lg text-[10px] font-black h-8 px-2.5 border-slate-200 text-slate-900 hover:bg-slate-50"
                  >
                    <FileText size={12} className="mr-1" /> CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('EXCEL')}
                    variant="outline"
                    className="rounded-lg text-[10px] font-black h-8 px-2.5 border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100"
                  >
                    <FileSpreadsheet size={12} className="mr-1" /> EXCEL
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse font-mono text-[10px]">

                  {/* Ledger report columns */}
                  {selectedTemplate === 'SafePay_ledger' && (
                    <>
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-800 border-b border-slate-100 dark:border-slate-800 uppercase font-black tracking-widest">
                          <th className="p-3">Reference</th>
                          <th className="p-3">Transaction Date</th>
                          <th className="p-3">Merchant</th>
                          <th className="p-3">Hub Point</th>
                          <th className="p-3 text-right">Value</th>
                          <th className="p-3 text-right">Commission</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-300">
                        {MOCK_SAFEPAY_PREVIEW.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{row.ref}</td>
                            <td className="p-3">{row.date}</td>
                            <td className="p-3 font-sans font-semibold">{row.merchant}</td>
                            <td className="p-3 font-sans font-semibold">{row.hub}</td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">${row.amount.toFixed(2)}</td>
                            <td className="p-3 text-right text-indigo-600 font-bold">${row.comm.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase",
                                row.status === 'RELEASED' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                row.status === 'HELD' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                row.status === 'DISPUTED' ? "bg-red-50 text-red-600 border border-red-100" :
                                "bg-slate-50 text-slate-800 border border-slate-200"
                              )}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Logistics Throughput */}
                  {selectedTemplate === 'logistics_throughput' && (
                    <>
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-800 border-b border-slate-100 dark:border-slate-800 uppercase font-black tracking-widest">
                          <th className="p-3">Tracking Code</th>
                          <th className="p-3">Shipper</th>
                          <th className="p-3">Dispatched</th>
                          <th className="p-3">Released Date</th>
                          <th className="p-3">Destination Hub</th>
                          <th className="p-3">Logistics Partner</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-300">
                        {MOCK_LOGISTICS_PREVIEW.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{row.tracking}</td>
                            <td className="p-3 font-sans font-semibold">{row.sender}</td>
                            <td className="p-3">{row.pickup}</td>
                            <td className="p-3">{row.delivery}</td>
                            <td className="p-3 font-sans font-semibold">{row.hub}</td>
                            <td className="p-3 font-sans font-semibold text-slate-900">{row.carrier}</td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase",
                                row.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-600" :
                                row.status === 'IN_TRANSIT' ? "bg-indigo-50 text-indigo-600" :
                                "bg-amber-50 text-amber-600"
                              )}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {/* Users Audit report */}
                  {selectedTemplate === 'user_registry' && (
                    <>
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 text-slate-800 border-b border-slate-100 dark:border-slate-800 uppercase font-black tracking-widest">
                          <th className="p-3">User/Point ID</th>
                          <th className="p-3">Legal Name</th>
                          <th className="p-3">Profile Role</th>
                          <th className="p-3">Registered Country</th>
                          <th className="p-3">Internal Ranking</th>
                          <th className="p-3 text-right">Vol throughput</th>
                          <th className="p-3 text-right">SLA Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-300">
                        {MOCK_USERS_PREVIEW.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{row.id}</td>
                            <td className="p-3 font-sans font-semibold">{row.name}</td>
                            <td className="p-3 font-bold text-indigo-600">{row.role}</td>
                            <td className="p-3 font-sans font-semibold">{row.country}</td>
                            <td className="p-3 text-indigo-600 font-bold">{row.rank}</td>
                            <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{row.sales} files</td>
                            <td className="p-3 text-right text-emerald-600 font-bold">{row.rating} / 5.0</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                </table>
              </div>

              {/* Informational Guidelines Footer */}
              <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl mt-6 print:hidden">
                <Info size={16} className="text-primary-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-primary-700 dark:text-primary-300 leading-normal font-sans">
                  The data displayed above is an interactive preview. When you trigger the Excel or CSV exports, the platform compiles all historical documents from the respective collections, satisfying the exact date boundaries. Direct PDF outputs render optimal, borderless paper sizes tailored specifically for corporate archiving.
                </p>
              </div>

            </Card>

          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
