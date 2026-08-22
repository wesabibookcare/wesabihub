import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Package,
  ShieldCheck,
  Wallet,
  ShoppingBag,
  Info,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

import { notificationEngine } from '@/src/engines/NotificationEngine';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';
import { Notification } from '@/src/types';

export const MerchantNotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = notificationEngine.subscribeToNotifications(user.uid, (notes) => {
      setNotifications(notes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'shipments') return n.category === 'SHIPMENT';
    if (activeTab === 'orders') return n.category === 'PAYMENT'; // Assuming order notifications are payment related for now
    if (activeTab === 'wallet') return n.category === 'PAYMENT';
    if (activeTab === 'system') return n.category === 'SYSTEM';
    if (activeTab === 'safepay') return n.category === 'DISPUTE' || n.category === 'PAYMENT';
    return true;
  });

  const markAllRead = async () => {
    if (!user) return;
    try {
      await notificationEngine.markAllAsRead(user.uid);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationEngine.deleteNotification(id);
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationEngine.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (category === 'PAYMENT') return ShieldCheck;
    if (category === 'SHIPMENT') return Package;
    if (category === 'WESABICHAT') return ShoppingBag;

    switch (type) {
      case 'SUCCESS': return CheckCircle2;
      case 'WARNING': return Clock;
      case 'ERROR': return Info;
      default: return Info;
    }
  };

  const getColor = (type: string, category?: string) => {
    if (category === 'PAYMENT') return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30';
    if (category === 'SHIPMENT') return 'bg-primary-100 text-primary-600 dark:bg-primary-900/30';

    switch (type) {
      case 'SUCCESS': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30';
      case 'WARNING': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30';
      case 'ERROR': return 'bg-red-100 text-red-600 dark:bg-red-900/30';
      default: return 'bg-slate-100 text-slate-900 dark:bg-slate-900/30';
    }
  };

  return (
    <MerchantLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Notifications</h1>
            <p className="text-slate-800">Stay updated on your store's activity and order status.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="text" onClick={markAllRead} className="text-slate-800 font-bold text-xs">Mark all as read</Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
           {['all', 'unread', 'safepay', 'shipments', 'orders', 'wallet', 'system'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "px-5 py-2 rounded-xl font-bold text-xs capitalize transition-all shrink-0",
                 activeTab === tab
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-800 border border-slate-100 dark:border-slate-800"
               )}
             >
                {tab}
             </button>
           ))}
        </div>

        {/* Notifications List */}
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
           {loading ? (
             <div className="p-12 text-center text-slate-500">Loading notifications...</div>
           ) : (
             <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotifications.map((notif) => (
                  <div key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={cn(
                    "p-6 flex gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group cursor-pointer",
                    !notif.isRead && "bg-primary-500/5 dark:bg-primary-500/5"
                  )}>
                     {!notif.isRead && (
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
                     )}

                     <div className={cn(
                       "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                       getColor(notif.type, notif.category)
                     )}>
                        {React.createElement(getIcon(notif.type, notif.category), { size: 24 })}
                     </div>

                     <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                           <h4 className="font-bold dark:text-white text-sm">{notif.title}</h4>
                           <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
                             {new Date(notif.timestamp).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">{notif.message}</p>

                        <div className="pt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           {notif.link && (
                             <Button variant="text" onClick={(e) => { e.stopPropagation(); navigate(notif.link!); }} className="text-primary-600 font-bold text-xs p-0">View Details</Button>
                           )}
                           <Button variant="text" onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="text-red-500 font-bold text-xs p-0">Delete</Button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </Card>

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <Card className="border-dashed border-2 py-12">
            <EmptyState
              icon={Bell}
              title="All caught up!"
              description="No new notifications in this category. We'll alert you when something important happens."
              action={
                <Button variant="outline" onClick={() => setActiveTab('all')} className="rounded-xl">
                  Clear Filters
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </MerchantLayout>
  );
};
