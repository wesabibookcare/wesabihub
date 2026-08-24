import React from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Package,
  Truck,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';

export const NotificationsPage = () => {
  const notifications = [
    { id: 1, title: "New Job Assigned", desc: "Job #8812 (Lagos Hub A → Ikeja) is ready for pickup.", type: "JOB", time: "5 mins ago", read: false },
    { id: 2, title: "Payout Processed", desc: "₦1,240,000 has been sent to your registered bank account.", type: "FINANCE", time: "2 hours ago", read: false },
    { id: 3, title: "Vehicle Breakdown Reported", desc: "Driver Abiodun reported a breakdown for VEH-103.", type: "EXCEPTION", time: "4 hours ago", read: true },
    { id: 4, title: "System Update", desc: "OmorfiHub Rules Engine updated to v2.4.0. See what's new.", type: "SYSTEM", time: "1 day ago", read: true },
  ];

  return (
    <LogisticsLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-black tracking-tight dark:text-white">Notifications</h1>
         <Button variant="ghost" className="text-primary-600 font-bold">Mark all as read</Button>
      </div>

      <div className="space-y-4">
         {notifications.map((n) => (
            <Card key={n.id} className={cn(
              "p-6 border-none shadow-xl rounded-[2rem] flex items-center justify-between group transition-all cursor-pointer",
              n.read ? "bg-white dark:bg-slate-900 opacity-60" : "bg-white dark:bg-slate-900 ring-2 ring-primary-600/10"
            )}>
               <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    n.type === 'JOB' ? "bg-blue-50 text-blue-600" :
                    n.type === 'FINANCE' ? "bg-emerald-50 text-emerald-600" :
                    n.type === 'EXCEPTION' ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-800"
                  )}>
                     {n.type === 'JOB' ? <Package size={22} /> :
                      n.type === 'FINANCE' ? <Wallet size={22} /> :
                      n.type === 'EXCEPTION' ? <AlertTriangle size={22} /> : <Bell size={22} />}
                  </div>
                  <div>
                     <h4 className="text-lg font-black dark:text-white leading-tight">{n.title}</h4>
                     <p className="text-sm font-medium text-slate-900 mt-1">{n.desc}</p>
                     <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-2">{n.time}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-primary-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />}
                  <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight size={20} />
                  </Button>
               </div>
            </Card>
         ))}
      </div>
      </div>
    </LogisticsLayout>
  );
};
