import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, RefreshCw, ArrowRight, UserCheck, LogOut } from 'lucide-react';
import { Avatar } from '@/src/components/ui/Avatar';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';
import { useAuth } from '@/src/context/AuthContext';
import { notificationRepository } from '@/src/services/db/NotificationRepository';
import { Notification, UserRole } from '@/src/types';
import { useNavigate } from 'react-router-dom';

const ROLE_DASHBOARDS: Record<string, { label: string; path: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', path: '/admin/dashboard' },
  MERCHANT: { label: 'Merchant', path: '/merchant/dashboard' },
  CENTER_OWNER: { label: 'Hub Owner', path: '/point/dashboard/owner' },
  CENTER_STAFF: { label: 'Hub Staff', path: '/point/dashboard/staff' },
  DISPATCH_RIDER: { label: 'SendOmorfi', path: '/dispatch/dashboard' },
  LOGISTICS_OWNER: { label: 'Logistics Partner', path: '/logistics/dashboard/owner' },
  CUSTOMER: { label: 'Customer', path: '/dashboard' },
};

export const GlobalHeaderRight: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const { user, impersonatedRole, impersonate, stopImpersonating, activeRole, setActiveRole, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const isSuperAdminUser = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const anns = await notificationRepository.getByUser(user.uid);
      setNotifications(anns);
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const currentRole = impersonatedRole || activeRole || user?.role || 'CUSTOMER';

  const handleSwitchRole = (targetRole: UserRole) => {
    if (targetRole === 'SUPER_ADMIN') {
      stopImpersonating();
      setActiveRole('SUPER_ADMIN');
    } else {
      impersonate(targetRole);
    }
    setShowRoleMenu(false);
    const routeInfo = ROLE_DASHBOARDS[targetRole];
    if (routeInfo) {
      navigate(routeInfo.path);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
      {/* Role Simulator / Switcher for Super Admin */}
      {isSuperAdminUser && (
        <div className="relative">
          <button
            onClick={() => { setShowRoleMenu(!showRoleMenu); setShowNotifications(false); setShowProfile(false); }}
            aria-expanded={showRoleMenu}
            aria-haspopup="true"
            aria-label="Switch User Role Perspective"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              impersonatedRole
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-primary-500/10 text-primary-700 dark:text-primary-300 border-primary-500/20 hover:bg-primary-500/20'
            }`}
            title="Switch User Role Perspective"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Role:</span>
            <span className="uppercase">{ROLE_DASHBOARDS[currentRole]?.label || currentRole}</span>
            {impersonatedRole && (
              <span className="ml-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black">
                Simulated
              </span>
            )}
          </button>

          {showRoleMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-2 space-y-1">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Role Simulator</span>
                  {impersonatedRole && (
                    <button
                      onClick={() => handleSwitchRole('SUPER_ADMIN')}
                      className="text-[10px] text-red-600 hover:underline font-semibold"
                    >
                      Reset to Admin
                    </button>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">View & experience the app as any user type</p>
              </div>

              {Object.entries(ROLE_DASHBOARDS).map(([roleKey, info]) => {
                const isActive = currentRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    onClick={() => handleSwitchRole(roleKey as UserRole)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{info.label}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={showNotifications}
          aria-haspopup="true"
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors shrink-0"
          onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowRoleMenu(false); }}
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />}
        </button>
        {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
      </div>

      <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

      {/* Profile Menu */}
      <div className="relative">
        <button
          aria-label="User profile menu"
          aria-expanded={showProfile}
          aria-haspopup="true"
          className="flex items-center gap-3 shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowRoleMenu(false); }}
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

      {/* Direct Logout Button */}
      <button
        onClick={async () => {
          await logout();
          navigate('/login');
        }}
        title="Sign Out"
        aria-label="Sign Out"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors shrink-0"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Logout</span>
      </button>
    </div>
  );
};
