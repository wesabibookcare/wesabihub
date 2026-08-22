import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  PackagePlus,
  PackageCheck,
  Search,
  CheckSquare,
  Clock,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Activity,
  FileText,
  Boxes,
  Loader2,
  X
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Input } from '@/src/components/ui/Input';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { centreEngine, parcelEngine, shiftEngine } from '@/src/engines';
import { Shift } from '@/src/types';
import { toast } from 'sonner';

export const PointStaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<any>(null);
  const [recentParcels, setRecentParcels] = useState<any[]>([]);
  const [pendingIntakeCount, setPendingIntakeCount] = useState(0);
  const [pendingReleaseCount, setPendingReleaseCount] = useState(0);

  // Realtime Shift State
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [startNotes, setStartNotes] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Realtime shift subscription
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = shiftEngine.subscribeToStaffShifts(user.uid, (shifts) => {
      const active = shifts.find(s => s.status === 'ACTIVE');
      setActiveShift(active || null);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  // Timer tick for active shift
  useEffect(() => {
    if (!activeShift?.startTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const start = new Date(activeShift.startTime).getTime();
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - start);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift?.startTime]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.hubId) {
        const activeHub = await centreEngine.getHub(user.hubId);
        setHub(activeHub);

        if (activeHub) {
          const parcels = await parcelEngine.getParcelsByHub(activeHub.id, 'destination');
          const recent = parcels
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
          setRecentParcels(recent);
          setPendingIntakeCount(parcels.filter(p => ['IN_TRANSIT', 'TRANSFERRED_BETWEEN_POINTS'].includes(p.status)).length);
          setPendingReleaseCount(parcels.filter(p => ['ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP'].includes(p.status)).length);
        }
      } else if (user?.uid) {
        // Fallback: check if owner
        const hubs = await centreEngine.getHubsByOwner(user.uid);
        if (hubs.length > 0) {
          setHub(hubs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async () => {
    if (!user || !hub) {
      toast.error('Workspace or user profile incomplete.');
      return;
    }

    setShiftLoading(true);
    try {
      await shiftEngine.startShift({
        staffId: user.uid,
        staffName: user.displayName || user.email || 'Staff Member',
        hubId: hub.id,
        hubName: hub.name,
        role: user.role || 'CENTER_STAFF',
        notes: startNotes
      });
      toast.success(`Shift started successfully at ${hub.name}!`);
      setShowStartModal(false);
      setStartNotes('');
    } catch (err: any) {
      console.error('Failed to start shift:', err);
      toast.error(err.message || 'Failed to start shift.');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift || !user) return;

    setShiftLoading(true);
    try {
      await shiftEngine.endShift({
        shiftId: activeShift.id,
        actorId: user.uid,
        actorRole: user.role,
        notes: endNotes
      });
      toast.success('Shift ended and log recorded securely.');
      setShowEndModal(false);
      setEndNotes('');
    } catch (err: any) {
      console.error('Failed to end shift:', err);
      toast.error(err.message || 'Failed to end shift.');
    } finally {
      setShiftLoading(false);
    }
  };

  if (loading) {
    return (
      <PointLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-900 font-medium">Loading workspace...</p>
          </div>
        </div>
      </PointLayout>
    );
  }

  if (!hub) {
    return (
      <PointLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Card className="p-10 max-w-lg text-center flex flex-col items-center border-dashed border-2 border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck size={32} className="text-slate-600" />
            </div>
            <h2 className="text-2xl font-black font-display dark:text-white mb-2">No Workspace Assigned</h2>
            <p className="text-slate-900 mb-8 font-medium">Your account is registered as Center Staff, but you haven't been assigned to a specific hub. Please contact your Hub Owner or Administrator to assign you to a hub.</p>
          </Card>
        </div>
      </PointLayout>
    );
  }

  const tasks = [
    { id: 1, title: 'Verify Incoming Parcels', count: pendingIntakeCount, to: '/point/parcels/receive', priority: pendingIntakeCount > 0 ? 'High' : 'Low' },
    { id: 2, title: 'Process Collections', count: pendingReleaseCount, to: '/point/parcels/release', priority: pendingReleaseCount > 0 ? 'High' : 'Low' }
  ];

  return (
    <PointLayout>
      <div className="space-y-10 pb-16">
        {/* Header & Shift Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Welcome, {user?.displayName || 'Staff'}!</h1>
            <p className="text-slate-900">Workspace: <strong className="text-primary-600">{hub?.name}</strong></p>
          </div>

          <div className="flex items-center gap-4">
            {activeShift ? (
              <Card className="px-5 py-3 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center gap-4 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">Active Shift</span>
                    <Badge variant="success" className="h-4 text-[9px] px-1.5">{activeShift.shiftId}</Badge>
                  </div>
                  <p className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-100">{elapsedTime}</p>
                </div>
                <Button
                  onClick={() => setShowEndModal(true)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1 h-9"
                >
                  <Square size={14} className="fill-emerald-700" /> End Shift
                </Button>
              </Card>
            ) : (
              <Card className="px-5 py-3 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-4 shadow-sm">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <p className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-widest">Off Shift</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Clock in to start logging work</p>
                </div>
                <Button
                  onClick={() => setShowStartModal(true)}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 h-9 px-4"
                >
                  <Play size={14} className="fill-white" /> Start Shift
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Shift Operational Stats Bar (Shown when active shift) */}
        {activeShift && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Current Active Session</span>
                  <h3 className="text-lg font-bold font-display flex items-center gap-2 text-white">
                    <Activity size={18} className="text-emerald-400" />
                    Shift Operational Metrics
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="border-l-2 border-primary-500 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Received</p>
                    <p className="text-2xl font-black font-mono text-emerald-400">{activeShift.parcelsReceived || 0}</p>
                  </div>
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Released</p>
                    <p className="text-2xl font-black font-mono text-emerald-400">{activeShift.parcelsReleased || 0}</p>
                  </div>
                  <div className="border-l-2 border-amber-500 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Exceptions</p>
                    <p className="text-2xl font-black font-mono text-amber-400">{activeShift.exceptionsRecorded || 0}</p>
                  </div>
                  <div className="border-l-2 border-indigo-500 pl-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Actions</p>
                    <p className="text-2xl font-black font-mono text-indigo-300">{activeShift.totalOperationalActions || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Receive Parcel', icon: PackagePlus, color: 'bg-primary-600', text: 'text-white', href: '/point/parcels/receive' },
            { title: 'Release Parcel', icon: PackageCheck, color: 'bg-emerald-600', text: 'text-white', href: '/point/parcels/release' },
            { title: 'Search Parcel', icon: Search, color: 'bg-white', text: 'text-slate-900', href: '/point/search' },
            { title: 'Shift Ledger', icon: Clock, color: 'bg-slate-900', text: 'text-white', href: '/point/shifts' },
          ].map((action, i) => (
            <Link key={i} to={action.href}>
              <Card className={cn("p-6 h-full border-slate-200 dark:border-slate-800 group cursor-pointer transition-all hover:scale-[1.02]", action.color)}>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", action.color === 'bg-white' ? "bg-slate-100 text-slate-900" : "bg-white/20 text-white")}>
                  <action.icon size={24} />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className={cn("font-bold font-display", action.text === 'text-white' ? "text-white" : "dark:text-white")}>{action.title}</h4>
                  <ArrowRight size={18} className={cn(action.text === 'text-white' ? "text-white/60" : "text-slate-800")} />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                <CheckSquare size={20} className="text-primary-600" />
                Daily Operations
              </h2>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  onClick={() => navigate(task.to)}
                  className="p-5 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        task.count > 0 ? "bg-primary-100 text-primary-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        <CheckSquare size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-white">{task.title}</h4>
                        <p className="text-[10px] text-slate-900 font-bold uppercase tracking-widest">
                          {task.count > 0 ? `${task.count} awaiting action` : 'All caught up'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={task.priority === 'High' ? 'error' : 'success'} className="h-6">
                      {task.priority === 'High' ? `${task.count}` : 'Clear'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            {/* Shift Details */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-bold dark:text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary-600" />
                Shift Status
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Active Workspace</p>
                  <p className="text-sm font-bold dark:text-white mt-1">{hub?.name}</p>
                </div>

                {activeShift ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Clocked In At</p>
                    <p className="text-xs font-bold dark:text-white mt-0.5">{new Date(activeShift.startTime).toLocaleTimeString()}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">You are currently clocked off. Click 'Start Shift' above to record operational actions.</p>
                  </div>
                )}

                <Button variant="outline" className="w-full rounded-xl text-xs font-bold py-2 h-auto" asChild>
                  <Link to="/point/shifts">View Full Shift History</Link>
                </Button>
              </div>
            </Card>

            {/* Recent Parcels */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Recent Parcel Activity</h4>
              <div className="space-y-3">
                {recentParcels.length === 0 ? (
                  <p className="text-sm text-slate-500 font-medium italic">No recent parcels.</p>
                ) : (
                  recentParcels.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          ['RECEIVED_AT_ORIGIN', 'ARRIVED_AT_DESTINATION'].includes(p.status) ? "bg-primary-50 text-primary-600" :
                          p.status === 'COLLECTED' ? "bg-emerald-50 text-emerald-600" :
                          "bg-slate-50 text-slate-600"
                        )}>
                          {['RECEIVED_AT_ORIGIN', 'ARRIVED_AT_DESTINATION'].includes(p.status) ? 'IN' : p.status === 'COLLECTED' ? 'OUT' : '...'}
                        </div>
                        <span className="text-xs font-bold dark:text-white">{p.trackingNumber || p.id.substring(0,8)}</span>
                      </div>
                      <span className="text-[10px] text-slate-800">{new Date(p.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Shift Modal */}
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
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                    <Play size={20} className="fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white font-display">Start Operational Shift</h3>
                    <p className="text-xs text-slate-500">{hub?.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowStartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Staff Member</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.displayName || user?.email}</p>
                  <p className="text-xs text-slate-500">Role: {user?.role || 'CENTER_STAFF'}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Shift Notes / Objectives (Optional)</label>
                  <Input
                    placeholder="e.g. Morning intake focus & priority deliveries"
                    value={startNotes}
                    onChange={(e) => setStartNotes(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <p className="text-xs text-slate-500 italic">
                  By starting your shift, your operational actions (intakes, releases, exceptions) will be logged to your staff account for performance & compliance auditing.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowStartModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleStartShift}
                  disabled={shiftLoading}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-6"
                >
                  {shiftLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Clock In'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End Shift Modal */}
      <AnimatePresence>
        {showEndModal && activeShift && (
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
                    <h3 className="font-bold text-lg dark:text-white font-display">End Active Shift</h3>
                    <p className="text-xs text-slate-500">ID: {activeShift.shiftId}</p>
                  </div>
                </div>
                <button onClick={() => setShowEndModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Shift Duration</p>
                    <p className="text-lg font-black font-mono text-primary-600">{elapsedTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Actions</p>
                    <p className="text-lg font-black font-mono text-emerald-600">{activeShift.totalOperationalActions || 0}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Handover Notes / Summary (Optional)</label>
                  <Input
                    placeholder="e.g. All morning parcels processed, shelf B2 ready for collection"
                    value={endNotes}
                    onChange={(e) => setEndNotes(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowEndModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleEndShift}
                  disabled={shiftLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                >
                  {shiftLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Clock Out'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PointLayout>
  );
};
