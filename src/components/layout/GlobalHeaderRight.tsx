import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Avatar } from '@/src/components/ui/Avatar';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';
import { useAuth } from '@/src/context/AuthContext';
import { notificationRepository } from '@/src/services/db/NotificationRepository';
import { Notification } from '@/src/types';

export const GlobalHeaderRight: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const anns = await notificationRepository.getByUser(user.uid);
      setNotifications(anns);
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
      <div className="relative">
        <button
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />}
        </button>
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>

      <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

      <div className="relative">
        <button
          className="flex items-center gap-3 shrink-0"
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold dark:text-white leading-tight">{user?.name || 'User'}</p>
          </div>
          <Avatar
            src={user?.photoUrl || "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=256&h=256"}
            name={user?.name || 'User'}
            className="w-10 h-10 border-2 border-primary-500/20"
          />
        </button>
        {showProfile && <ProfileMenu onClose={() => setShowProfile(false)} />}
      </div>
    </div>
  );
};
