import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useAuth } from '@/src/context/AuthContext';
import { useSettings } from '@/src/context/SettingsContext';
import { ROLES, VALID_PUBLIC_ROLES } from '@/src/constants/roles';
import { roleApplicationRepository } from '@/src/services/db/RoleApplicationRepository';
import { RoleApplication } from '@/src/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { RoleApplicationModal } from './RoleApplicationModal';

export const RoleManagement: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoApplyRole = searchParams.get('apply') || (location.state as any)?.applyRole;

  const { loading: settingsLoading } = useSettings();
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingForRole, setApplyingForRole] = useState<{ id: string; title: string } | null>(null);

  const userId = user?.uid || user?.id;

  useEffect(() => {
    if (autoApplyRole && (VALID_PUBLIC_ROLES as readonly string[]).includes(autoApplyRole)) {
      const roleObj = ROLES.find(r => r.id === autoApplyRole);
      const isApproved = (user?.roles || []).includes(autoApplyRole) || (user?.role === autoApplyRole && (user?.status === 'APPROVED' || user?.status === 'ACTIVE'));
      const hasPending = applications.some(app => app.role === autoApplyRole && (app.status === 'SUBMITTED' || app.status === 'PENDING' || app.status === 'UNDER_REVIEW')) || (user?.pendingRoleApplication && (user?.requestedRole === autoApplyRole || user?.role === autoApplyRole));

      if (roleObj && !isApproved && !hasPending) {
        setApplyingForRole({ id: roleObj.id, title: roleObj.title });
      }
    }
  }, [autoApplyRole, user?.roles, user?.role, user?.status, user?.pendingRoleApplication, user?.requestedRole, applications]);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      roleApplicationRepository.getByUser(userId)
        .then((apps) => {
          setApplications(apps || []);
        })
        .catch((error) => {
          console.error("Failed to load role applications:", error);
          toast.error("Failed to load your role applications.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [userId]);

  const refreshApplications = async () => {
    if (!userId) return;
    const apps = await roleApplicationRepository.getByUser(userId);
    setApplications(apps);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-white font-display">Account & Roles</h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold mb-4">Your Roles</h3>
          <div className="flex gap-2 flex-wrap">
              {(user?.roles || []).length > 0 ? (user?.roles || []).map(role => (
                  <motion.span
                    key={role}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <Badge className="bg-primary-100 text-primary-800 px-3 py-1">{role}</Badge>
                  </motion.span>
              )) : (
                <p className="text-sm text-slate-500 italic">No special roles assigned. You are currently a Customer.</p>
              )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold mb-4">Available Roles</h3>
          <div className="space-y-4">
              <AnimatePresence>
                {ROLES.filter(role => (VALID_PUBLIC_ROLES as readonly string[]).includes(role.id) && !(user?.roles || []).includes(role.id)).map(role => (
                    <motion.div
                      key={role.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                        <div>
                            <p className="font-bold">{role.title}</p>
                            <p className="text-sm text-slate-500">{role.description}</p>
                        </div>
                        <Button
                          onClick={() => setApplyingForRole({ id: role.id, title: role.title })}
                          disabled={applications.some(app => app.role === role.id && app.status === 'SUBMITTED')}
                        >
                          {applications.some(app => app.role === role.id && app.status === 'SUBMITTED') ? 'Pending' : 'Request Access'}
                        </Button>
                    </motion.div>
                ))}
              </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {applications.some(app => app.status !== 'APPROVED' && app.status !== 'REJECTED') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Pending Applications</h3>
            <div className="space-y-2">
              {applications.filter(app => app.status !== 'APPROVED' && app.status !== 'REJECTED').map(app => (
                  <div key={app.id} className="flex justify-between items-center p-4 border-b dark:border-slate-800 last:border-0">
                      <p className="font-bold">{app.role}</p>
                      <Badge variant="outline">{app.status}</Badge>
                  </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {applyingForRole && (
        <RoleApplicationModal
          isOpen={!!applyingForRole}
          onClose={() => setApplyingForRole(null)}
          role={applyingForRole.id as any}
          roleTitle={applyingForRole.title}
          onSubmitted={refreshApplications}
        />
      )}
    </div>
  );
};
