import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Filter,
  X,
  Loader2
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, invitationEngine, userEngine } from '@/src/engines';
import { User, HubCenter } from '@/src/types';

export const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [userHub, setUserHub] = useState<HubCenter | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const hubs = await centreEngine.getHubsByOwner(user.uid);
        if (hubs.length > 0) {
          const hub = hubs[0];
          setUserHub(hub);

          const staff = await userEngine.getUsersByHub(hub.id);
          setEmployees(staff);
        }
      } catch (err) {
        console.error('Failed to fetch employee data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleTogglePermission = async (empId: string, permKey: 'canBookShipments' | 'canProcessIntake' | 'canProcessRelease') => {
    try {
      const emp = employees.find(e => e.uid === empId);
      if (!emp) return;

      const currentDelegated = emp.delegatedPermissions || {};
      const updatedDelegated = {
        ...currentDelegated,
        [permKey]: !currentDelegated[permKey]
      };

      await userEngine.updateUser(empId, {
        delegatedPermissions: updatedDelegated
      });

      setEmployees(prev => prev.map(e => e.uid === empId ? { ...e, delegatedPermissions: updatedDelegated } : e));
      toast.success(`Updated delegated permission`);
    } catch (err: any) {
      toast.error('Failed to update employee permission: ' + err.message);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !userHub || !user) return;
    setIsInviting(true);
    try {
      await invitationEngine.createInvitation({
        email: inviteEmail.trim().toLowerCase(),
        hubId: userHub.id,
        hubName: userHub.name,
        inviterId: user.uid,
        senderId: user.uid,
        status: 'PENDING',
        role: 'CENTER_STAFF',
      });

      toast.success('Invitation sent successfully!');
      setIsInviteModalOpen(false);
      setInviteEmail('');
    } catch (err) {
      console.error('Failed to send invite:', err);
      toast.error('Failed to send invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const filteredEmployees = employees.filter(e =>
    !searchQuery.trim() ||
    e.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveStaff = async (empId: string, empName: string) => {
    if (!confirm(`Remove ${empName} from this hub? They will lose staff access immediately.`)) return;
    try {
      await userEngine.updateUser(empId, { hubId: undefined, status: 'INACTIVE' } as any);
      setEmployees(prev => prev.filter(e => e.uid !== empId));
      toast.success(`${empName} has been removed from your hub.`);
    } catch (err: any) {
      toast.error('Failed to remove staff member: ' + err.message);
    }
  };

  const handleApproveStaff = async (empId: string, empName: string) => {
    try {
      await userEngine.updateUser(empId, { status: 'ACTIVE', pendingRoleApplication: false } as any);
      setEmployees(prev => prev.map(e => e.uid === empId ? { ...e, status: 'ACTIVE', pendingRoleApplication: false } : e));
      toast.success(`${empName} has been approved and activated for your hub.`);
    } catch (err: any) {
      toast.error('Failed to approve staff member: ' + err.message);
    }
  };

  return (
    <PointLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Employees</h1>
            <p className="text-slate-900">Manage your hub staff, permissions, and performance.</p>
          </div>
          <Button
            className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2"
            onClick={() => setIsInviteModalOpen(true)}
          >
             <Plus size={18} /> Invite New Employee
          </Button>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <Card className="p-6 border-slate-200 dark:border-slate-800 lg:col-span-1 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Total Staff</p>
              <h3 className="text-3xl font-black dark:text-white font-display">{employees.length.toString().padStart(2, '0')}</h3>
              <div className="mt-4 flex items-center gap-2">
                 <Badge variant="success" className="h-5">{employees.filter(e => e.status === 'ACTIVE').length} Active</Badge>
                 <Badge variant="info" className="h-5">{employees.filter(e => e.status === 'PENDING').length} Pending</Badge>
              </div>
           </Card>

           <Card className="p-6 border-slate-200 dark:border-slate-800 lg:col-span-3 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800 w-4 h-4" />
                 <Input placeholder="Search by name, email or role..." className="pl-12 h-12 rounded-2xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="h-12 px-4 flex items-center gap-2 text-slate-500 font-normal">
                    <Calendar size={16} /> Attendance tracking coming soon
                 </Badge>
              </div>
           </Card>
        </div>

        {/* Employee List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {employees.length === 0 ? (
             <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-300">
                   <Users size={40} />
                </div>
                <h3 className="text-xl font-bold dark:text-white">No employees yet</h3>
                <p className="text-slate-900">Invite your first staff member to start managing your hub.</p>
                <Button variant="outline" className="rounded-xl" onClick={() => setIsInviteModalOpen(true)}>
                   Send Invitation
                </Button>
             </div>
           ) : filteredEmployees.length === 0 ? (
             <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-300">
                   <Search size={40} />
                </div>
                <h3 className="text-xl font-bold dark:text-white">No matching employees</h3>
                <p className="text-slate-900">Try a different search term.</p>
             </div>
           ) : filteredEmployees.map((emp, i) => (
             <Card key={i} className="p-8 border-slate-200 dark:border-slate-800 group hover:border-primary-500 transition-all cursor-pointer relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                   <div className="flex items-start justify-between">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 font-bold text-xl">
                            {emp.displayName?.[0]}
                         </div>
                         <div className={cn(
                           "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800",
                           emp.status === 'ACTIVE' ? "bg-emerald-500" : "bg-orange-400"
                         )} />
                      </div>
                      <button
                        className="p-2 text-slate-800 hover:text-red-600 transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleRemoveStaff(emp.uid, emp.displayName || 'this employee'); }}
                        title="Remove from hub"
                      >
                         <XCircle size={20} />
                      </button>
                   </div>

                   <div className="space-y-1">
                      <h4 className="text-xl font-bold dark:text-white font-display group-hover:text-primary-600 transition-colors">{emp.displayName}</h4>
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="rounded-lg h-6 gap-1 bg-slate-50 dark:bg-slate-800 border-none font-bold">
                            <Shield size={12} className="text-primary-600" /> {emp.role?.replace('_', ' ')}
                         </Badge>
                         {emp.status === 'PENDING' && (
                            <Button size="sm" onClick={() => handleApproveStaff(emp.uid, emp.displayName || 'Staff')} className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md">
                               Approve
                            </Button>
                         )}
                      </div>
                   </div>

                   <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-xs text-slate-900">
                         <Mail size={14} /> {emp.email}
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-xs text-slate-900">
                            <Clock size={14} /> Joined {new Date(emp.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                   </div>

                   {/* Delegated Permissions Controls */}
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider">Delegated Operations Permissions</div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Book Shipments</span>
                        <button
                          onClick={() => handleTogglePermission(emp.uid, 'canBookShipments')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                            emp.delegatedPermissions?.canBookShipments
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {emp.delegatedPermissions?.canBookShipments ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Process Intake</span>
                        <button
                          onClick={() => handleTogglePermission(emp.uid, 'canProcessIntake')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                            emp.delegatedPermissions?.canProcessIntake
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {emp.delegatedPermissions?.canProcessIntake ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>
                   </div>
                </div>
                {/* Background Decoration */}
                <Users className="absolute -right-6 -bottom-6 text-slate-100 dark:text-slate-800/20 w-32 h-32 group-hover:scale-110 transition-transform pointer-events-none" />
             </Card>
           ))}
        </div>

        {/* Invite Modal */}
        <AnimatePresence>
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                 onClick={() => setIsInviteModalOpen(false)}
               />
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800"
               >
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 transition-colors"
                  >
                     <X size={20} />
                  </button>

                  <div className="space-y-6">
                     <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                        <Mail size={32} />
                     </div>
                     <div className="space-y-2">
                        <h2 className="text-2xl font-bold dark:text-white">Invite Staff</h2>
                        <p className="text-slate-900 text-sm">Send an invitation to your team member. They'll need to register with this email.</p>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-sm font-bold dark:text-white">Email Address</label>
                           <Input
                             placeholder="staff@example.com"
                             value={inviteEmail}
                             onChange={(e) => setInviteEmail(e.target.value)}
                             type="email"
                             className="h-12 rounded-xl"
                           />
                        </div>
                        <Button
                          className="w-full h-12 rounded-xl font-bold"
                          onClick={handleSendInvite}
                          disabled={!inviteEmail || isInviting}
                        >
                           {isInviting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2" />}
                           Send Invitation
                        </Button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Accountability Banner */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white overflow-hidden relative group">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                 <h3 className="text-xl font-bold font-display">Staff Training & Compliance</h3>
                 <p className="text-slate-800 text-sm max-w-xl">
                    Ensure your staff are up to date with OmorfiHub standard operating procedures. Certified points have 40% fewer disputes.
                 </p>
              </div>
              <Badge variant="outline" className="h-12 px-6 flex items-center gap-2 text-white border-white/20 font-normal whitespace-nowrap">
                Training portal coming soon
              </Badge>
           </div>
           <Shield className="absolute -right-8 -top-8 text-white/5 w-48 h-48 pointer-events-none" />
        </div>
      </div>
    </PointLayout>
  );
};
