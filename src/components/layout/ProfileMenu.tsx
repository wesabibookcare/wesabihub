import React, { useEffect, useState } from 'react';
import { User, Settings, LogOut, Shield, Bell, HelpCircle, Palette, CheckCircle2, Clock, XCircle, ChevronRight, PlusCircle } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';
import { UserRole, RoleApplication } from '@/src/types';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/Button';
import { roleApplicationRepository } from '@/src/services/db/RoleApplicationRepository';
import { RoleApplicationModal } from '@/src/components/customer/RoleApplicationModal';
import { Modal } from '@/src/components/ui/Modal';
import { Badge } from '@/src/components/ui/Badge';

export const ProfileMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, logout, activeRole, setActiveRole, impersonatedRole, stopImpersonating } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [selectedPendingApp, setSelectedPendingApp] = useState<RoleApplication | null>(null);
  const [applyingRoleModal, setApplyingRoleModal] = useState<{ id: UserRole; title: string } | null>(null);

  const userId = user?.uid || user?.id;

  useEffect(() => {
    if (userId) {
      roleApplicationRepository.getByUser(userId).then(apps => setApplications(apps || [])).catch(console.error);
    }
  }, [userId]);

  const availableArchetypes: { id: UserRole; title: string; desc: string }[] = [
    { id: 'CUSTOMER', title: 'Customer', desc: 'Send & receive parcels' },
    { id: 'MERCHANT', title: 'Merchant', desc: 'Manage high-volume business shipments' },
    { id: 'CENTER_OWNER', title: 'Hub Owner', desc: 'Operate an approved PUDO Hub' },
    { id: 'CENTER_STAFF', title: 'Hub Staff', desc: 'Process hub intake & collection' },
    { id: 'DISPATCH_RIDER', title: 'SendOmorfi', desc: 'Deliver on foot, bicycle or vehicle' },
  ];

  const handleArchetypeClick = (archetypeId: UserRole, title: string) => {
    const isAuthorized = (user?.roles || []).includes(archetypeId) || user?.role === archetypeId;
    const existingApp = applications.find(app => app.role === archetypeId);

    if (isAuthorized) {
      setActiveRole(archetypeId);
      const redirectPath =
        archetypeId === 'SUPER_ADMIN' || archetypeId === 'OPERATIONS_MANAGER' ? '/admin' :
        archetypeId === 'MERCHANT' ? '/merchant/dashboard' :
        archetypeId === 'CENTER_OWNER' ? '/point/dashboard/owner' :
        archetypeId === 'CENTER_STAFF' ? '/point/dashboard/staff' :
        archetypeId === 'DISPATCH_RIDER' ? '/dispatch/dashboard' :
        '/dashboard';
      navigate(redirectPath);
      onClose();
    } else if (existingApp && (existingApp.status === 'SUBMITTED' || existingApp.status === 'PENDING')) {
      setSelectedPendingApp(existingApp);
    } else if (existingApp && existingApp.status === 'REJECTED') {
      setSelectedPendingApp(existingApp);
    } else {
      setApplyingRoleModal({ id: archetypeId, title });
    }
  };

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

        {user && (
          <div className="border-t mt-1 pt-1 space-y-1">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 px-3 py-1 font-black uppercase tracking-wider">Switch View / Workspace</p>
            {availableArchetypes.map(archetype => {
              const isAuthorized = (user.roles || []).includes(archetype.id) || user.role === archetype.id;
              const app = applications.find(a => a.role === archetype.id);
              const isPending = app && (app.status === 'SUBMITTED' || app.status === 'PENDING');
              const isRejected = app && app.status === 'REJECTED';
              const isActive = activeRole === archetype.id;

              return (
                <button
                  key={archetype.id}
                  onClick={() => handleArchetypeClick(archetype.id, archetype.title)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{archetype.id === 'DISPATCH_RIDER' ? 'SendOmorfi' : archetype.title}</span>
                  </div>
                  <div>
                    {isAuthorized && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {!isAuthorized && isPending && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Under Review 🫡
                      </span>
                    )}
                    {!isAuthorized && isRejected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Rejected ❌
                      </span>
                    )}
                    {!isAuthorized && !isPending && !isRejected && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-normal">
                        Apply <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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

      {/* Application Status Modal for Pending / Rejected Roles */}
      {selectedPendingApp && (
        <Modal
          isOpen={!!selectedPendingApp}
          onClose={() => setSelectedPendingApp(null)}
          title={`Application Status: ${selectedPendingApp.role.replace(/_/g, ' ')}`}
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
                <Badge variant={selectedPendingApp.status === 'REJECTED' ? 'error' : 'warning'}>
                  {selectedPendingApp.status === 'REJECTED' ? 'Application Rejected' : 'Under Review 🫡'}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedPendingApp.status === 'REJECTED'
                  ? selectedPendingApp.rejectionReason || 'Your application was rejected by Admin. You may re-apply with updated KYC credentials.'
                  : `Your ${selectedPendingApp.role.replace(/_/g, ' ')} application is currently under review by the OmorfiHub compliance team. You will be notified immediately upon approval.`}
              </p>
            </div>

            {selectedPendingApp.status === 'REJECTED' ? (
              <Button
                className="w-full h-12 rounded-xl"
                onClick={() => {
                  const roleToApply = selectedPendingApp.role;
                  setSelectedPendingApp(null);
                  setApplyingRoleModal({
                    id: roleToApply,
                    title: availableArchetypes.find(a => a.id === roleToApply)?.title || roleToApply
                  });
                }}
              >
                Re-apply Now
              </Button>
            ) : (
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => setSelectedPendingApp(null)}>
                Got it
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Role Application Modal */}
      {applyingRoleModal && (
        <RoleApplicationModal
          isOpen={!!applyingRoleModal}
          onClose={() => setApplyingRoleModal(null)}
          role={applyingRoleModal.id}
          roleTitle={applyingRoleModal.title}
          onSubmitted={() => {
            setApplyingRoleModal(null);
            if (userId) {
              roleApplicationRepository.getByUser(userId).then(apps => setApplications(apps || [])).catch(console.error);
            }
          }}
        />
      )}
    </div>
  );
};
