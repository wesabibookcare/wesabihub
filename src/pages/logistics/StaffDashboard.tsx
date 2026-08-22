import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Map as MapIcon,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  Navigation,
  Clock,
  Briefcase,
  AlertCircle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Building,
  Key,
  ShieldAlert,
  Loader2,
  IdCard,
  Download
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { invitationService } from '@/src/services/InvitationService';
import { userRepository } from '@/src/services/db/UserRepository';


import { toast } from 'sonner';

export const StaffDashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isIndependent = user?.role === 'DISPATCH_RIDER';
  const [showIdCard, setShowIdCard] = useState(false);

  const stats = [
    { label: "Today's Routes", value: "03", icon: MapIcon, color: "text-blue-600" },
    { label: "Assigned Parcels", value: "28", icon: Package, color: "text-primary-600" },
    { label: "Completion", value: "85%", icon: CheckCircle2, color: "text-emerald-600" },
  ];

  const currentAssignment = {
    id: "RT-8812",
    from: "Lagos Hub A",
    to: "Ikeja Point 1",
    parcelCount: 12,
    timeLeft: "45 mins",
    status: "ONGOING"
  };

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode || !user) return;

    setLoading(true);
    setError(null);

    try {
      const inv = await invitationService.validateCode(inviteCode, user.role);
      if (!inv) {
        setError('Invalid or expired code. Please contact your company owner.');
        setLoading(false);
        return;
      }

      // Link user to company
      await userRepository.update(user.uid, {
        companyId: inv.senderId,
        inviteCode: inviteCode,
        status: 'PENDING' // Wait for owner to confirm face
      } as any);

      await invitationService.acceptInvitation(inv.id, user.uid);
      await refreshUser();
      toast.success('Successfully joined the company!');
    } catch (e) {
      console.error('Error joining company:', e);
      setError('An error occurred. Please try again.');
      toast.error('Failed to join the company');
    } finally {
      setLoading(false);
    }
  };

  // GATEWAY: NO COMPANY (Only for Drivers/Managers)
  if (!isIndependent && !user?.companyId) {
    return (
      <LogisticsLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            <Card className="p-10 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] text-center overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />

              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 relative z-10">
                <Key size={40} />
              </div>

              <h1 className="text-3xl font-black tracking-tight dark:text-white mb-3 relative z-10">Join Your Company</h1>
              <p className="text-slate-900 font-medium mb-10 relative z-10">Enter the 6-digit invitation code provided by your Logistics Company owner.</p>

              <form onSubmit={handleJoinCompany} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-Digit Code"
                    className="h-16 text-center text-3xl font-black tracking-[0.3em] uppercase rounded-2xl border-slate-200 focus:border-primary-600 focus:ring-primary-600"
                    maxLength={6}
                    required
                  />
                  {error && (
                    <p className="text-xs text-red-500 font-bold flex items-center justify-center gap-1 mt-2">
                      <ShieldAlert size={14} />
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || inviteCode.length < 6}
                  className="w-full h-16 rounded-[1.5rem] bg-primary-600 hover:bg-primary-700 text-white font-black text-lg shadow-xl shadow-primary-500/20 gap-3"
                >
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      Join Fleet
                      <ArrowRight size={20} />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-10 text-xs text-slate-800 font-medium px-4">
                Don't have a code? Please reach out to your manager or logistics company administrator.
              </p>
            </Card>
          </motion.div>
        </div>
      </LogisticsLayout>
    );
  }

  // GATEWAY: AWAITING CONFIRMATION
  if (user.status === 'PENDING' && user.companyId) {
    return (
      <LogisticsLayout>
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Clock size={48} className="animate-pulse" />
            </div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white mb-4">Awaiting Confirmation</h1>
            <p className="text-slate-900 font-medium mb-8">You've successfully joined the company! Please wait for your manager to confirm your facial verification and activate your account.</p>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
               <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">Company Status</p>
               <p className="text-sm font-black text-slate-900 flex items-center justify-center gap-2">
                  <Building size={16} />
                  Awaiting Owner Approval
               </p>
            </div>
            <Button variant="ghost" onClick={() => refreshUser()} className="text-primary-600 font-black">
               Check Status
            </Button>
          </motion.div>
        </div>
      </LogisticsLayout>
    );
  }

  // MAIN DASHBOARD
  return (
    <LogisticsLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
      {/* Driver Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">On Duty • Shift #902</p>
           </div>
           <h1 className="text-4xl font-black tracking-tight dark:text-white">Welcome, {user.displayName?.split(' ')[0]}</h1>
           <p className="text-slate-900 font-medium mt-1">Ready for your next pickup? Stay safe on the road.</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Button
           onClick={() => navigate('/logistics/scan')}
           className="h-28 rounded-3xl bg-primary-600 hover:bg-primary-700 text-white flex flex-col gap-3 shadow-xl shadow-primary-500/20 group transition-all"
         >
            <div className="p-3 rounded-2xl bg-white/20 group-hover:scale-110 transition-transform">
               <QrCode size={24} />
            </div>
            <span className="font-black text-sm">Scan Parcel</span>
         </Button>
         <Button
           onClick={() => navigate('/logistics/staff/routes')}
           variant="outline"
           className="h-28 rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col gap-3 hover:border-blue-500 hover:bg-blue-50/50 group transition-all"
         >
            <div className="p-3 rounded-2xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
               <MapIcon size={24} />
            </div>
            <span className="font-black text-sm">View Route</span>
         </Button>
         <Button
           variant="outline"
           className="h-28 rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col gap-3 hover:border-amber-500 hover:bg-amber-50/50 group transition-all"
           asChild
         >
            <Link to="/logistics/support">
               <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                  <AlertCircle size={24} />
               </div>
               <span className="font-black text-sm">Report Issue</span>
            </Link>
         </Button>
         <Button
           variant="outline"
           className="h-28 rounded-3xl border-slate-200 dark:border-slate-800 flex flex-col gap-3 hover:border-emerald-500 hover:bg-emerald-50/50 group transition-all"
           onClick={() => setShowIdCard(true)}
         >
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
               <IdCard size={24} />
            </div>
            <span className="font-black text-sm">Digital ID</span>
         </Button>
      </div>

      <AnimatePresence>
        {showIdCard && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-2xl p-6"
            >
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white overflow-hidden shadow-2xl aspect-[3/4] flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="w-full flex justify-between items-center mb-8 relative z-10">
                   <div className="flex items-center gap-2">
                      <Building size={20} className="text-primary-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-left truncate max-w-[120px]">
                        {isIndependent ? 'WeSabiDelivery' : (user.companyName || 'Logistics Partner')}
                      </span>
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-900">WeSabiHub</div>
                </div>

                <div className="w-32 h-32 rounded-[2rem] border-4 border-white/10 overflow-hidden mb-6 relative z-10 shadow-2xl">
                   {user.photoURL || user.photoUrl ? (
                      <img src={user.photoURL || user.photoUrl} alt="Staff" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-black text-4xl">
                         {user.displayName?.[0]}
                      </div>
                   )}
                </div>

                <div className="relative z-10 space-y-1">
                   <h2 className="text-2xl font-black tracking-tight">{user.displayName}</h2>
                   <Badge className="bg-primary-600 text-white border-none rounded-full px-4 py-1.5 font-black text-[10px] tracking-widest uppercase">
                      {user.role?.replace('_', ' ')}
                   </Badge>
                </div>

                <div className="mt-auto w-full grid grid-cols-1 gap-4 pt-8 border-t border-white/5 relative z-10">
                   <div className="flex flex-col items-center">
                      <QrCode size={48} className="text-white/20 mb-2" />
                      <p className="text-[8px] font-bold text-slate-900 uppercase tracking-widest">
                         {isIndependent ? 'Rider ID' : 'Staff ID'}: {user.uid.slice(-8).toUpperCase()}
                      </p>
                   </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowIdCard(false)}
                  variant="outline"
                  className="rounded-2xl h-12 font-black border-slate-200"
                >
                  Close
                </Button>
                <Button
                  className="rounded-2xl h-12 font-black bg-primary-600 text-white gap-2 hover:bg-primary-700"
                  disabled={isDownloading}
                  onClick={async () => {
                    setIsDownloading(true);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    setIsDownloading(false);
                    toast.success('ID Card downloaded successfully!');
                    setShowIdCard(false);
                  }}
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Active Task Card */}
            <Card className="p-0 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
               <div className="bg-slate-950 p-8 text-white relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 flex items-center justify-between mb-8">
                     <Badge className="bg-primary-600/20 text-primary-400 border-none px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
                        Current Assignment
                     </Badge>
                     <div className="flex items-center gap-2 text-primary-400">
                        <Clock size={16} />
                        <span className="text-sm font-black">{currentAssignment.timeLeft} remaining</span>
                     </div>
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <div className="text-center">
                           <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1">Pickup</p>
                           <p className="text-xl font-black">{currentAssignment.from}</p>
                        </div>
                        <div className="flex-1 flex items-center gap-4 px-4">
                           <div className="h-px flex-1 bg-slate-800 relative">
                              <div className="absolute inset-y-0 left-0 bg-primary-500 w-2/3" />
                           </div>
                           <Truck className="text-primary-500" size={20} />
                           <div className="h-px flex-1 bg-slate-800" />
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1">Drop-off</p>
                           <p className="text-xl font-black">{currentAssignment.to}</p>
                        </div>
                     </div>
                     <Button className="bg-white text-slate-950 hover:bg-slate-100 rounded-2xl px-8 h-12 font-black shadow-lg shadow-white/10 gap-2" asChild>
                        <Link to="/logistics/staff/routes">
                           <Navigation size={18} />
                           Start Route
                        </Link>
                     </Button>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Job ID</span>
                     <span className="text-sm font-black dark:text-white">{currentAssignment.id}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                     <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Parcels</span>
                     <span className="text-sm font-black dark:text-white">{currentAssignment.parcelCount} units</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                     <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Est. Reward</span>
                     <span className="text-sm font-black text-emerald-600">₦8,500.00</span>
                  </div>
               </div>
            </Card>

            {/* Next Tasks List */}
            <div className="space-y-4">
               <h3 className="text-xl font-black dark:text-white px-2">Next in Queue</h3>
               {[1, 2].map((i) => (
                  <Card key={i} className="p-6 border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl hover:translate-x-2 transition-transform cursor-pointer group">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                              <MapPin size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-black dark:text-white">Collect from Surulere Hub</p>
                              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mt-0.5">8 Parcels • Priority Normal</p>
                           </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-600 transition-colors" />
                     </div>
                  </Card>
               ))}
            </div>
         </div>

         <div className="space-y-8">
             <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2.5rem]">
               <h3 className="text-xl font-black dark:text-white mb-6">Today's Summary</h3>
               <div className="space-y-8">
                  {stats.map((stat) => (
                     <div key={stat.label} className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-2xl bg-opacity-10", stat.color.replace('text', 'bg'))}>
                           <stat.icon size={20} className={stat.color} />
                        </div>
                        <div>
                           <p className="text-2xl font-black dark:text-white leading-tight">{stat.value}</p>
                           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{stat.label}</p>
                        </div>
                     </div>
                  ))}
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-sm font-bold text-slate-900">Earnings Today</span>
                     <span className="text-lg font-black text-emerald-600">₦22,400</span>
                  </div>
                  <Button variant="outline" className="w-full rounded-2xl h-12 font-black border-slate-200" asChild>
                     <Link to="/logistics/staff/earnings">View Wallet</Link>
                  </Button>
               </div>
            </Card>

            <Card className="p-8 border-none shadow-xl bg-slate-950 rounded-[2.5rem] text-white overflow-hidden relative">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mb-16 -mr-16 blur-2xl" />
               <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Performance
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-900">
                     <span>On-time Rate</span>
                     <span className="text-white">98%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[98%]" />
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed pt-2">You're in the top 5% of drivers this week. Keep it up!</p>
               </div>
            </Card>
         </div>
      </div>
      </div>
    </LogisticsLayout>
  );
};
