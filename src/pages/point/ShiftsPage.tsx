import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Activity,
  ShieldCheck,
  Square,
  Play,
  FileText,
  Loader2,
  Search,
  X,
  Edit3,
  Filter
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, shiftEngine, userEngine } from '@/src/engines';
import { Shift, HubCenter, User } from '@/src/types';
import { toast } from 'sonner';

export const ShiftsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userHub, setUserHub] = useState<HubCenter | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Modals & Forms
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [staffNameInput, setStaffNameInput] = useState('');
  const [staffIdInput, setStaffIdInput] = useState('');
  const [roleInput, setRoleInput] = useState('CENTER_STAFF');
  const [noteInput, setNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [hubStaff, setHubStaff] = useState<User[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');

  useEffect(() => {
    fetchHubAndShifts();
  }, [user]);

  const fetchHubAndShifts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let activeHub: HubCenter | null = null;
      if (user.hubId) {
        activeHub = await centreEngine.getHub(user.hubId);
      } else {
        const hubs = await centreEngine.getHubsByOwner(user.uid);
        if (hubs.length > 0) activeHub = hubs[0];
      }

      setUserHub(activeHub);

      if (activeHub) {
        userEngine.getUsersByHub(activeHub.id).then(setHubStaff).catch(err => console.error('Failed to load hub staff:', err));

        // Subscribe to real-time shift updates for this hub
        const unsubscribe = shiftEngine.subscribeToHubShifts(activeHub.id, (hubShifts) => {
          setShifts(hubShifts);
          setLoading(false);
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch hub and shifts:', err);
      setLoading(false);
    }
  };

  const handleOwnerStartShift = async () => {
    if (!userHub) {
      toast.error('No hub selected.');
      return;
    }
    const selectedStaff = hubStaff.find(s => s.uid === selectedStaffId);
    if (!selectedStaff) {
      toast.error('Please select a staff member.');
      return;
    }

    setActionLoading(true);
    try {
      await shiftEngine.startShift({
        staffId: selectedStaff.uid,
        staffName: selectedStaff.displayName || selectedStaff.email || 'Unknown',
        hubId: userHub.id,
        hubName: userHub.name,
        role: selectedStaff.role || roleInput,
        notes: noteInput
      });

      toast.success(`Shift started for ${selectedStaff.displayName}!`);
      setShowStartModal(false);
      setSelectedStaffId('');
      setNoteInput('');
    } catch (err: any) {
      console.error('Failed to start shift:', err);
      toast.error(err.message || 'Failed to start shift.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOwnerEndShift = async () => {
    if (!selectedShift || !user) return;

    setActionLoading(true);
    try {
      await shiftEngine.endShift({
        shiftId: selectedShift.id,
        actorId: user.uid,
        actorRole: user.role,
        notes: noteInput || 'Closed by Hub Owner / Manager'
      });

      toast.success(`Shift ended for ${selectedShift.staffName}.`);
      setShowEndModal(false);
      setSelectedShift(null);
      setNoteInput('');
    } catch (err: any) {
      console.error('Failed to end shift:', err);
      toast.error(err.message || 'Failed to end shift.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordCorrection = async () => {
    if (!selectedShift || !user) return;
    if (!noteInput.trim()) {
      toast.error('Please enter the correction remark.');
      return;
    }

    setActionLoading(true);
    try {
      await shiftEngine.recordShiftCorrection({
        shiftId: selectedShift.id,
        actorId: user.uid,
        actorRole: user.role,
        reason: 'Hub Owner Audit Review',
        notes: noteInput.trim()
      });

      toast.success('Audited correction remark added.');
      setShowCorrectionModal(false);
      setSelectedShift(null);
      setNoteInput('');
    } catch (err: any) {
      console.error('Failed to record correction:', err);
      toast.error(err.message || 'Failed to record correction.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeShifts = shifts.filter(s => s.status === 'ACTIVE');
  const completedShifts = shifts.filter(s => s.status === 'COMPLETED');

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.shiftId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActionsToday = shifts.reduce((sum, s) => sum + (s.totalOperationalActions || 0), 0);

  if (loading) {
    return (
      <PointLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-sm text-slate-900 font-medium">Loading shift ledger...</p>
          </div>
        </div>
      </PointLayout>
    );
  }

  return (
    <PointLayout>
      <div className="space-y-10 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display flex items-center gap-3">
              <Clock className="text-primary-600" size={32} />
              Hub Shift Management
            </h1>
            <p className="text-slate-900">
              Workspace: <strong className="text-primary-600">{userHub?.name || 'Hub Center'}</strong> — Realtime operational shift tracking & audit ledger.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowStartModal(true)}
              className="rounded-xl px-6 shadow-lg shadow-primary-500/20 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold"
            >
              <Plus size={18} /> Clock In Staff
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Active On-Duty</span>
              <Activity className="text-emerald-600" size={20} />
            </div>
            <p className="text-3xl font-black font-mono text-emerald-800 dark:text-emerald-200">{activeShifts.length}</p>
            <p className="text-xs text-slate-500 mt-1">Staff currently clocked in</p>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-primary-50/50 dark:bg-primary-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-primary-700 dark:text-primary-400 uppercase tracking-widest">Completed Shifts</span>
              <CheckCircle2 className="text-primary-600" size={20} />
            </div>
            <p className="text-3xl font-black font-mono text-primary-800 dark:text-primary-200">{completedShifts.length}</p>
            <p className="text-xs text-slate-500 mt-1">Recorded shift logs</p>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Actions Logged</span>
              <FileText className="text-indigo-600" size={20} />
            </div>
            <p className="text-3xl font-black font-mono text-indigo-800 dark:text-indigo-200">{totalActionsToday}</p>
            <p className="text-xs text-slate-500 mt-1">Intakes, releases & custody actions</p>
          </Card>

          <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Compliance Status</span>
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">100% Audited</p>
            <p className="text-xs text-slate-500 mt-1">All shifts verified via AuditEngine</p>
          </Card>
        </div>

        {/* Active Staff On Duty Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
              <Users size={22} className="text-emerald-600" />
              Active On-Duty Personnel ({activeShifts.length})
            </h2>
          </div>

          {activeShifts.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 italic font-medium">No staff members are currently clocked in at this hub.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeShifts.map((shift) => {
                const startTime = new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <Card key={shift.id} className="p-6 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-5 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          {shift.staffName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-base dark:text-white">{shift.staffName}</h4>
                          <Badge variant="success" className="h-4 text-[9px] px-1.5 mt-0.5">{shift.role}</Badge>
                        </div>
                      </div>
                      <Badge variant="success" className="gap-1 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Clocked In</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{startTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Shift ID</p>
                        <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{shift.shiftId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-1">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Recv</p>
                        <p className="text-sm font-black font-mono text-emerald-600">{shift.parcelsReceived || 0}</p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Rlsd</p>
                        <p className="text-sm font-black font-mono text-emerald-600">{shift.parcelsReleased || 0}</p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Excp</p>
                        <p className="text-sm font-black font-mono text-amber-600">{shift.exceptionsRecorded || 0}</p>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Total</p>
                        <p className="text-sm font-black font-mono text-primary-600">{shift.totalOperationalActions || 0}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setSelectedShift(shift);
                          setShowEndModal(true);
                        }}
                        variant="outline"
                        className="w-full rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs h-9 gap-1.5"
                      >
                        <Square size={14} className="fill-emerald-700" /> Management Clock Out
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Shift History & Ledger Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
              <Calendar size={22} className="text-primary-600" />
              Complete Shift Ledger ({filteredShifts.length})
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Filter staff or shift ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
                {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none",
                      statusFilter === st ? "bg-white dark:bg-slate-900 text-primary-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-4">Shift ID</th>
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Start Time</th>
                    <th className="p-4">End Time</th>
                    <th className="p-4 text-center">Actions Logged</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                        No shift records found for this criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map((s) => {
                      const start = new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                      const end = s.endTime ? new Date(s.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In Progress';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{s.shiftId}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{s.staffName}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="text-[10px] font-bold">{s.role}</Badge>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{start}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{end}</td>
                          <td className="p-4 text-center font-bold font-mono text-primary-600">{s.totalOperationalActions || 0}</td>
                          <td className="p-4">
                            <Badge variant={s.status === 'ACTIVE' ? 'success' : 'default'} className="text-[9px]">
                              {s.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              onClick={() => {
                                setSelectedShift(s);
                                setShowCorrectionModal(true);
                              }}
                              variant="ghost"
                              size="sm"
                              className="rounded-lg h-8 text-xs text-slate-600 hover:text-primary-600 gap-1"
                            >
                              <Edit3 size={14} /> Remark
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Owner Clock In Staff Modal */}
      <AnimatePresence>
        {showStartModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center">
                    <Play size={20} className="fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white font-display">Clock In Hub Personnel</h3>
                    <p className="text-xs text-slate-500">{userHub?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowStartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Select Staff Member *</label>
                  {hubStaff.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      No registered staff found for this hub yet. Invite staff from the Employees page first.
                    </p>
                  ) : (
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold dark:text-white"
                    >
                      <option value="" disabled>Choose a staff member</option>
                      {hubStaff.map(s => (
                        <option key={s.uid} value={s.uid}>{s.displayName || s.email} ({s.role?.replace('_', ' ')})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Shift Opening Notes</label>
                  <Input
                    placeholder="e.g. Afternoon intake assignment"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowStartModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleOwnerStartShift}
                  disabled={actionLoading}
                  className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold px-6"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Clock In'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Owner Clock Out Modal */}
      <AnimatePresence>
        {showEndModal && selectedShift && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Square size={18} className="fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white font-display">Management Clock Out</h3>
                    <p className="text-xs text-slate-500">{selectedShift.staffName}</p>
                  </div>
                </div>
                <button onClick={() => setShowEndModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Shift ID</p>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{selectedShift.shiftId}</p>
                  <p className="text-xs text-slate-500">Actions logged: {selectedShift.totalOperationalActions || 0}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Closing Reason / Remark *</label>
                  <Input
                    placeholder="e.g. End of day management close out"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEndModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleOwnerEndShift}
                  disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Clock Out'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audited Remark Correction Modal */}
      <AnimatePresence>
        {showCorrectionModal && selectedShift && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white font-display">Add Audited Remark</h3>
                    <p className="text-xs text-slate-500">Shift ID: {selectedShift.shiftId}</p>
                  </div>
                </div>
                <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Audit Note / Manager Remark *</label>
                  <Input
                    placeholder="e.g. Verified 12 parcel intake count after audit inspection"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <p className="text-xs text-slate-500 italic">
                  This remark will be appended to the shift record and logged to AuditEngine as SHIFT_CORRECTION.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCorrectionModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordCorrection}
                  disabled={actionLoading}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Audited Remark'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PointLayout>
  );
};
