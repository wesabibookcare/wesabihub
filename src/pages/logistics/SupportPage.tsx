import React from 'react';
import { motion } from 'motion/react';
import {
  LifeBuoy,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Search,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';

export const SupportPage = () => {
  return (
    <LogisticsLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4 mb-12">
         <div className="inline-flex p-4 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 mb-4">
            <LifeBuoy size={40} />
         </div>
         <h1 className="text-4xl font-black tracking-tight dark:text-white">Partner Support</h1>
         <p className="text-slate-900 font-medium max-w-xl mx-auto">Get help with your logistics operations, account issues, or platform inquiries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: MessageCircle, label: "Live Chat", desc: "Average response: 2 mins", color: "text-blue-600", bg: "bg-blue-50" },
           { icon: Phone, label: "Phone Support", desc: "Available 24/7 for urgencies", color: "text-emerald-600", bg: "bg-emerald-50" },
           { icon: Mail, label: "Email Support", desc: "Response within 24 hours", color: "text-indigo-600", bg: "bg-indigo-50" },
         ].map((item) => (
            <Card key={item.label} className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem] text-center group cursor-pointer hover:-translate-y-2 transition-all">
               <div className={cn("p-4 rounded-2xl mb-6 inline-flex transition-colors", item.bg, item.color, "dark:bg-slate-800")}>
                  <item.icon size={28} />
               </div>
               <h3 className="text-xl font-black dark:text-white mb-2">{item.label}</h3>
               <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">{item.desc}</p>
            </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
         <Card className="p-10 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
            <h3 className="text-2xl font-black dark:text-white mb-8">Frequently Asked</h3>
            <div className="space-y-4">
               {[
                 "How are transport rates calculated?",
                 "What happens if a parcel is damaged?",
                 "How to add new drivers to my fleet?",
                 "Update bank details for payouts"
               ].map((q) => (
                  <div key={q} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between group cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                     <span className="text-sm font-black dark:text-white">{q}</span>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-600 transition-transform group-hover:translate-x-1" />
                  </div>
               ))}
            </div>
            <Button variant="link" className="text-primary-600 font-black mt-8 gap-2 p-0 h-auto">
               Browse Knowledge Base <ArrowRight size={18} />
            </Button>
         </Card>

         <Card className="p-10 border-none shadow-2xl bg-slate-950 text-white rounded-[3rem] relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full -mb-32 -mr-32 blur-3xl" />
            <div className="relative z-10">
               <h3 className="text-2xl font-black mb-6">Open Support Ticket</h3>
               <p className="text-slate-800 text-sm font-medium mb-8 leading-relaxed">If you couldn't find an answer, please describe your issue and our team will get back to you shortly.</p>

               <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Subject"
                    className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary-500/50 transition-all"
                  />
                  <textarea
                    placeholder="Describe your issue..."
                    className="w-full h-32 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary-500/50 resize-none transition-all"
                  />
                  <Button className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-xl shadow-primary-500/20">
                     Send Ticket
                  </Button>
               </div>
            </div>
         </Card>
      </div>
      </div>
    </LogisticsLayout>
  );
};
