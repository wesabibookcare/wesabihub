import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Search } from 'lucide-react';
import { notificationRepository } from '@/src/services/db/NotificationRepository';
import { useAuth } from '@/src/context/AuthContext';
import { Notification } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { cn } from '@/src/lib/utils';
import { useNavigate } from 'react-router-dom';

export const NotificationPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'WESABICHAT' | 'SHIPMENT' | 'PAYMENT' | 'RETURN' | 'STORAGE' | 'COMPLAINT' | 'DISPUTE' | 'ANNOUNCEMENT' | 'APPROVAL' | 'INVITATION' | 'API' | 'PLATFORM' | 'SECURITY' | 'SYSTEM'>('ALL');
  const navigate = useNavigate();

  const filteredNotifications = filter === 'ALL' ? notifications : notifications.filter(n => n.category === filter);

  const groupedNotifications = filteredNotifications.reduce((groups: Record<string, Notification[]>, n) => {
        const date = new Date(n.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let key = 'Earlier';
        if (date.toDateString() === today.toDateString()) key = 'Today';
        else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';

        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
        return groups;
    }, {} as Record<string, Notification[]>);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const anns = await notificationRepository.getByUser(user.uid);
      setNotifications(anns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };
    fetchNotifications();
  }, [user]);

  const { activeRole } = useAuth();

  const getNotificationPath = () => {
    if (activeRole === 'MERCHANT') return '/merchant/notifications';
    if (activeRole === 'LOGISTICS_OWNER' || activeRole === 'LOGISTICS_COMPANY' || activeRole === 'DRIVER') return '/logistics/notifications';
    return '/customer/notifications';
  };

  const markAsRead = async (id: string) => {
    await notificationRepository.update(id, { isRead: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => notificationRepository.update(n.id, { isRead: true })));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
      await notificationRepository.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[80vh]">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
            <h3 className="font-bold dark:text-white">Notifications</h3>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={markAllAsRead} title="Mark all as read"><Check size={16} /></Button>
                <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
            </div>
        </div>
        <select className="w-full text-xs p-1 border rounded" value={filter} onChange={e => setFilter(e.target.value as any)}>
            <option value="ALL">All Categories</option>
            {['WESABICHAT', 'SHIPMENT', 'PAYMENT', 'RETURN', 'STORAGE', 'COMPLAINT', 'DISPUTE', 'ANNOUNCEMENT', 'APPROVAL', 'INVITATION', 'API', 'PLATFORM', 'SECURITY', 'SYSTEM'].map(c => <option key={c} value={c}>{c === 'WESABICHAT' ? 'OmorfiHubChat' : c}</option>)}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        {(Object.entries(groupedNotifications) as [string, Notification[]][]).map(([group, ns]) => (
            <div key={group}>
                <p className="px-4 py-1 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800">{group}</p>
                {ns.map(notification => (
                  <div
                    key={notification.id}
                    className={cn("p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-start", !notification.isRead && "bg-primary-50 dark:bg-primary-900/10")}
                    onClick={() => {
                        markAsRead(notification.id);
                        if (notification.link) navigate(notification.link);
                    }}
                  >
                    <div>
                        <p className="font-bold text-sm dark:text-white">{notification.title}</p>
                        <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}><Trash2 size={14} /></Button>
                  </div>
                ))}
            </div>
        ))}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Bell size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-semibold">No notifications found</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-center shrink-0">
        <button
          onClick={() => {
            onClose();
            navigate(getNotificationPath());
          }}
          className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 hover:underline transition-all"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
};
