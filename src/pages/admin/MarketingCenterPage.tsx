
import React, { useState } from 'react';
import {
  Megaphone,
  Printer,
  Download,
  Plus,
  Search,
  Filter,
  FileText,
  BadgeCheck,
  Sticker,
  Image as ImageIcon,
  MoreVertical,
  ChevronRight,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { MOCK_BRAND_ASSETS } from '../../types/admin';

export const MarketingCenterPage = () => {
  const { settings } = useSettings();
  const branding = settings?.branding || MOCK_BRAND_ASSETS;

  const templates = [
    { id: 1, type: 'PRINT', category: 'Banner', title: 'OmorfiHub Point Large Banner', size: '200x100cm', icon: ImageIcon, color: 'text-blue-600', bg: 'bg-blue-600/10' },
    { id: 2, type: 'PRINT', category: 'Sticker', title: 'Standard Door Decal', size: '20x20cm', icon: Sticker, color: 'text-indigo-600', bg: 'bg-indigo-600/10' },
    { id: 3, type: 'DIGITAL', category: 'Certificate', title: 'Verified Merchant Certificate', size: 'A4 Digital', icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
    { id: 4, type: 'DIGITAL', category: 'Social', title: 'Partner Announcement Post', size: '1080x1080px', icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { id: 5, type: 'PRINT', category: 'Poster', title: 'Service Rates Counter Poster', size: 'A3', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-600/10' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10 ">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Promotion & Collateral</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Marketing Center</h1>
            <p className="text-slate-900 font-medium mt-1">Manage brand materials and templates for the ecosystem.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-slate-200 font-bold">
              <Printer size={18} className="mr-2" /> Bulk Print Orders
            </Button>
            <Button className="rounded-xl font-bold shadow-lg shadow-primary-600/20">
              <Plus size={18} className="mr-2" /> Create New Template
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {['All Assets', 'Printables', 'Digital Assets', 'Badges', 'Social Media'].map((tab, i) => (
              <Button
                key={tab}
                variant={i === 0 ? "default" : "outline"}
                className={cn(
                  "rounded-xl px-4 py-2 font-bold text-xs whitespace-nowrap border-none shadow-none",
                  i === 0 ? "bg-slate-900 text-white" : "text-slate-900 hover:bg-slate-100"
                )}
              >
                {tab}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl w-64 shadow-sm">
              <Search size={16} className="text-slate-800" />
              <input type="text" placeholder="Search templates..." className="bg-transparent border-none focus:outline-none text-xs font-bold w-full" />
            </div>
            <Button variant="outline" className="p-2 border-slate-200 rounded-xl">
              <Filter size={18} />
            </Button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="group border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/80 transition-all overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center p-12">
                   {/* Dynamic Branding Preview */}
                   <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-40 transition-opacity z-10" />

                   {/* Template Preview with Master Branding */}
                   <div className="w-full h-full bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900 rounded-bl-[40px] flex items-center justify-center pt-2 pl-2">
                        <img src={branding.faviconUrl || MOCK_BRAND_ASSETS.faviconUrl} className="w-6 h-6 object-contain" alt="Logo Icon" />
                      </div>
                      <img src={branding.logoUrl || MOCK_BRAND_ASSETS.logoUrl} className="w-16 h-16 object-contain mb-4" alt="Brand Logo" />
                      <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">{settings?.platformName || MOCK_BRAND_ASSETS.name}</p>
                        <p className="text-[10px] font-bold text-slate-800 mb-4">{template.title}</p>
                        <div className="w-20 h-0.5 bg-primary-600 mx-auto" />
                      </div>
                   </div>


                   <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all z-20 scale-90 group-hover:scale-100">
                      <Button className="bg-white text-slate-900 hover:bg-slate-50 font-black text-xs px-4 py-2 h-auto rounded-xl shadow-xl">
                        <Eye size={16} className="mr-2" /> Preview
                      </Button>
                      <Button className="bg-slate-900 text-white hover:bg-black font-black text-xs px-4 py-2 h-auto rounded-xl shadow-xl border-none">
                        <Download size={16} className="mr-2" /> Edit
                      </Button>
                   </div>
                </div>

                <div className="p-6">
                   <div className="flex items-center justify-between mb-3">
                      <Badge className={cn("border-none px-2 py-0.5 font-bold text-[10px]", template.bg, template.color)}>
                         {template.type}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{template.size}</span>
                   </div>
                   <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1">{template.title}</h3>
                   <p className="text-xs text-slate-900 font-medium mb-6">Master template for verified ecosystem partners.</p>

                   <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                         <div className={cn("p-2 rounded-lg", template.bg)}>
                            <template.icon size={16} className={template.color} />
                         </div>
                         <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{template.category}</span>
                      </div>
                      <button className="text-slate-800 hover:text-slate-900 transition-colors">
                        <MoreVertical size={20} />
                      </button>
                   </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {/* New Template Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button className="w-full h-full min-h-[400px] border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-slate-800 hover:border-primary-400 hover:text-primary-600 transition-all group bg-slate-50/50">
               <div className="p-6 rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 group-hover:scale-110 transition-transform mb-6">
                  <Plus size={48} strokeWidth={1} />
               </div>
               <h3 className="text-xl font-black tracking-tight text-slate-900 mb-2">Create New Template</h3>
               <p className="text-sm font-bold text-slate-900 max-w-[200px] text-center uppercase tracking-widest leading-loose">Build custom printable or digital brand assets</p>
            </button>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};
