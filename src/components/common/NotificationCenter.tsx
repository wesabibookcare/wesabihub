import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Package,
  Tag,
  Info,
  CheckCircle2,
  Trash2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Loader2,
  CheckCheck,
  AlertTriangle,
  Wallet,
  MessageSquare
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { notificationEngine } from '@/src/engines/NotificationEngine';
import { Notification } from '@/src/types';
import { toast } from 'sonner';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notification updates from Firestore
    const unsubscribe = notificationEngine.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationEngine.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationEngine.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationEngine.deleteNotification(id);
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
        if (activeTab === 'parcel') return n.category === 'SHIPMENT' || n.category === 'RETURN' || n.category === 'STORAGE';
        if (activeTab === 'safepay') return n.category === 'DISPUTE' || n.category === 'PAYMENT';
        if (activeTab === 'announcement') return n.category === 'ANNOUNCEMENT' || n.category === 'PLATFORM';
        if (activeTab === 'system') return n.category === 'SYSTEM' || n.category === 'SECURITY';
        return true;
      });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SHIPMENT':
      case 'STORAGE':
      case 'RETURN':
        return Package;
      case 'SECURITY':
        return ShieldCheck;
      case 'DISPUTE':
      case 'PAYMENT':
        return Wallet;
      case 'ANNOUNCEMENT':
        return Tag;
      case 'WESABICHAT':
        return MessageSquare;
      default:
        return Info;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SHIPMENT': return 'bg-emerald-500 text-white';
      case 'SECURITY': return 'bg-slate-900 text-white dark:bg-slate-700';
      case 'DISPUTE':
      case 'PAYMENT': return 'bg-amber-500 text-white';
      case 'ANNOUNCEMENT': return 'bg-primary-600 text-white';
      case 'WESABICHAT': return 'bg-blue-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white font-display">Notification Center</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base">Real-time alerts, shipment updates, and account security notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 gap-1.5"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.isRead) || notifications.length === 0}
          >
            <CheckCheck size={16} /> Mark all as read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: `Unread (${notifications.filter(n => !n.isRead).length})` },
          { id: 'parcel', label: 'Parcels' },
          { id: 'safepay', label: 'SafePay & Payments' },
          { id: 'announcement', label: 'Announcements' },
          { id: 'system', label: 'Security & System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0",
              activeTab === tab.id
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "p-4 md:p-5 border-slate-200 dark:border-slate-800 transition-all group",
                  !n.isRead ? "ring-2 ring-primary-500/20 bg-primary-50/20 dark:bg-primary-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}>
                  <div className="flex gap-4 items-start">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                      colorClass
                    )}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3
                            className="font-bold text-slate-900 dark:text-white text-sm md:text-base group-hover:text-primary-600 transition-colors cursor-pointer truncate"
                            onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          >
                            {n.title}
                          </h3>
                          {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-primary-600 animate-pulse shrink-0" />}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0">
                          <Clock size={12} /> {new Date(n.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {n.message}
                      </p>
                      {n.link && (
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg text-xs bg-white dark:bg-slate-800"
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
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          title="Mark as read"
                          className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        title="Delete notification"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
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
          <Card className="p-10 text-center space-y-3 border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Bell size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">No notifications found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">You are all caught up! Platform alerts and shipment updates will appear here.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
