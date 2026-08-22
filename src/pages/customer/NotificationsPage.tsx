import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Package,
  Tag,
  Info,
  CheckCircle2,
  Trash2,
  MoreVertical,
  Clock,
  ShieldCheck,
  ChevronRight,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { notificationRepository } from '@/src/services/db/NotificationRepository';
import { Notification } from '@/src/types';
import { toast } from 'sonner';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notification updates from Firestore
    const unsubscribe = notificationRepository.subscribeToUser(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationRepository.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => notificationRepository.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationRepository.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => {
        if (activeTab === 'unread') return !n.isRead;
        if (activeTab === 'shipment') return n.category === 'SHIPMENT';
        if (activeTab === 'promotion') return n.category === 'ANNOUNCEMENT' || n.category === 'PLATFORM';
        if (activeTab === 'system') return n.category === 'SYSTEM' || n.category === 'SECURITY';
        return true;
      });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SHIPMENT': return Package;
      case 'SECURITY': return ShieldCheck;
      case 'ANNOUNCEMENT': return Tag;
      case 'SUCCESS': return CheckCircle2;
      default: return Info;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SHIPMENT': return 'bg-emerald-500';
      case 'SECURITY': return 'bg-slate-900 dark:bg-slate-700';
      case 'ANNOUNCEMENT': return 'bg-primary-600';
      case 'SUCCESS': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Notifications</h1>
            <p className="text-slate-600 dark:text-slate-300">Stay updated on your shipments and platform news in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
             <Button
               variant="outline"
               size="sm"
               className="rounded-xl h-10 gap-1.5"
               onClick={handleMarkAllAsRead}
               disabled={notifications.every(n => n.isRead)}
             >
               <CheckCheck size={16} /> Mark all as read
             </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
           {[
             { id: 'all', label: 'All Notifications' },
             { id: 'unread', label: `Unread (${notifications.filter(n => !n.isRead).length})` },
             { id: 'shipment', label: 'Shipments' },
             { id: 'promotion', label: 'Promotions' },
             { id: 'system', label: 'System' },
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "px-6 py-3 rounded-xl text-sm font-bold transition-all shrink-0",
                 activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
               )}
             >
                {tab.label}
             </button>
           ))}
        </div>

        <div className="space-y-4">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400 gap-2">
               <Loader2 className="animate-spin text-primary-600" size={28} />
               <p className="text-sm">Loading notifications...</p>
             </div>
           ) : filteredNotifications.length > 0 ? (
             filteredNotifications.map((n) => {
               const IconComponent = getCategoryIcon(n.category);
               const colorClass = getCategoryColor(n.category);

               return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={cn(
                    "p-5 md:p-6 border-slate-200 dark:border-slate-800 transition-all group",
                    !n.isRead ? "ring-2 ring-primary-500/10 bg-primary-50/30 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}>
                     <div className="flex gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg",
                          colorClass
                        )}>
                           <IconComponent size={24} />
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => !n.isRead && handleMarkAsRead(n.id)}>
                                   {n.title}
                                 </h3>
                                 {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                 <Clock size={12} /> {new Date(n.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp || Date.now()).toLocaleDateString()}
                              </span>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {n.message}
                           </p>
                           {n.link && (
                             <div className="pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-9 px-4 rounded-lg bg-white dark:bg-slate-800"
                                  onClick={() => {
                                    if (!n.isRead) handleMarkAsRead(n.id);
                                    window.location.hash = n.link || '';
                                  }}
                                >
                                  View Details <ChevronRight size={14} className="ml-1" />
                                </Button>
                             </div>
                           )}
                        </div>
                        <div className="flex items-center gap-1">
                           {!n.isRead && (
                             <button
                               onClick={() => handleMarkAsRead(n.id)}
                               title="Mark as read"
                               className="p-2 text-slate-400 hover:text-primary-600 rounded-lg transition-colors"
                             >
                               <CheckCircle2 size={18} />
                             </button>
                           )}
                           <button
                             onClick={() => handleDelete(n.id)}
                             title="Delete notification"
                             className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  </Card>
                </motion.div>
               );
             })
           ) : (
             <Card className="p-12 text-center space-y-4 border-slate-200 dark:border-slate-800">
               <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                 <Bell size={32} />
               </div>
               <div className="space-y-1">
                 <h3 className="font-bold text-slate-900 dark:text-white text-lg">No notifications found</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">You are all caught up! New updates and alerts will appear here.</p>
               </div>
             </Card>
           )}
        </div>
      </div>
    </CustomerLayout>
  );
};
