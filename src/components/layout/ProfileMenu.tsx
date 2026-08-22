import React from 'react';
import { User, Settings, LogOut, Shield, Bell, HelpCircle, Palette, Languages } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole } from '@/src/types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';

export const ProfileMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, logout, activeRole, setActiveRole, impersonatedRole, stopImpersonating } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    import('@/src/services/db/AuditRepository').then(({ auditRepository }) => {
        auditRepository.logAction(
          user!.id,
          'ROLE_SWITCH',
          { targetRole: role },
          'auth'
        );
    });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose();
  };

  const getSettingsPath = (tab?: string) => {
    let base = '/customer/settings';
    if (activeRole === 'MERCHANT') base = '/merchant/settings';
    else if (activeRole === 'CENTER_OWNER' || activeRole === 'CENTER_STAFF') base = '/point/settings';
    else if (activeRole === 'LOGISTICS_OWNER' || activeRole === 'LOGISTICS_COMPANY' || activeRole === 'DRIVER') base = '/logistics/settings';
    else if (activeRole === 'SUPER_ADMIN' || activeRole === 'OPERATIONS_MANAGER') base = '/admin/settings';

    return tab ? `${base}?tab=${tab}` : base;
  };

  const getProfilePath = () => {
    if (activeRole === 'CUSTOMER') return '/customer/profile';
    if (activeRole === 'MERCHANT') return '/merchant/settings';
    if (activeRole === 'CENTER_OWNER' || activeRole === 'CENTER_STAFF') return '/point/profile';
    if (activeRole === 'LOGISTICS_OWNER' || activeRole === 'LOGISTICS_COMPANY' || activeRole === 'DRIVER') return '/logistics/profile';
    return '/customer/profile';
  };

  const getHelpPath = () => {
    if (activeRole === 'CUSTOMER') return '/customer/support';
    if (activeRole === 'MERCHANT') return '/merchant/support';
    if (activeRole === 'CENTER_OWNER' || activeRole === 'CENTER_STAFF') return '/point/support';
    if (activeRole === 'LOGISTICS_OWNER' || activeRole === 'LOGISTICS_COMPANY' || activeRole === 'DRIVER') return '/logistics/support';
    return '/faq';
  };

  const handleProfileClick = () => {
    navigate(getProfilePath());
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <p className="font-bold dark:text-white">{user?.displayName || 'User'}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
        <p className="text-[10px] font-bold text-primary-600 uppercase mt-1">{impersonatedRole || activeRole}</p>
      </div>

      <div className="space-y-1 mt-2 max-h-[350px] overflow-y-auto no-scrollbar">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleProfileClick}>
          <User size={16} /> My Profile
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate(getProfilePath()); onClose(); }}>
          <User size={16} className="text-slate-400" /> Edit Profile
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate(getSettingsPath()); onClose(); }}>
          <Settings size={16} /> Account Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate(getSettingsPath('security')); onClose(); }}>
          <Shield size={16} /> Security
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate(getSettingsPath('notifications')); onClose(); }}>
          <Bell size={16} /> Notification Preferences
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { navigate(getHelpPath()); onClose(); }}>
          <HelpCircle size={16} /> Help
        </Button>

        {user?.roles && user.roles.length > 1 && (
            <div className="border-t mt-1 pt-1">
                <p className="text-[10px] text-slate-500 px-3 py-1 font-black uppercase tracking-wider">Switch Role</p>
                {user.roles.map(role => (
                    <Button key={role} variant={activeRole === role ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 text-xs" onClick={() => handleRoleSwitch(role)}>
                        {role}
                    </Button>
                ))}
            </div>
        )}

        {impersonatedRole && (
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-600" onClick={() => { stopImpersonating(); onClose(); }}>
            <Shield size={16} /> Stop Impersonating
          </Button>
        )}
        <Button variant="ghost" className="w-full justify-start gap-2 border-t mt-1 pt-1 rounded-none text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </Button>
      </div>
    </div>
  );
};
