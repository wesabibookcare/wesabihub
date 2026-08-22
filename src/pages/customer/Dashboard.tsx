import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { apiFetch } from '@/src/lib/apiClient';
import { permissionService } from '@/src/services/permissionService';
import { Parcel, HubCenter } from '@/src/types';
import {
  Send,
  Search,
  MapPin,
  Download,
  Package,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Zap,
  Calendar,
  Info,
  Building2
} from 'lucide-react';
import {
  parcelEngine,
  centreEngine
} from '@/src/engines';

export const CustomerDashboard = () => {
  const { user, fbUser } = useAuth();
  const canSend = permissionService.hasPermission(user, 'SEND_PARCEL');
  const [shipments, setShipments] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  const [nearestHub, setNearestHub] = useState<HubCenter | null>(null);

  // AI Delivery Estimator State
  const [estimateOrigin, setEstimateOrigin] = useState('');
  const [estimateDest, setEstimateDest] = useState('');
  const [estimateSize, setEstimateSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('SMALL');
  const [trafficLevel, setTrafficLevel] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<{
    estimatedDays: number;
    estimatedArrivalDate: string;
    reasoning: string;
    confidence: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const [userShipments, allHubs] = await Promise.all([
          parcelEngine.parcels.listUserShipments(user.uid),
          centreEngine.getAllHubs()
        ]);
        setShipments(userShipments);

        // Find nearest hub
        if (allHubs.length > 0) {
          const preferredHub = allHubs.find(h => h.status === 'ACTIVE' && (h.city === user.country || h.state === 'Lagos')) || allHubs[0];
          setNearestHub(preferredHub);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const openDirections = () => {
    if (!nearestHub) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nearestHub.address + ', ' + nearestHub.city)}`;
    window.open(url, '_blank');
  };

  const stats = {
    inTransit: shipments.filter(s => ['IN_TRANSIT', 'PENDING_PICKUP'].includes(s.status)).length,
    awaitingDropoff: shipments.filter(s => s.status === 'PENDING_DROPOFF').length,
    delivered: shipments.filter(s => s.status === 'DELIVERED').length
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleEstimate = async () => {
    if (!estimateOrigin || !estimateDest) return;
    setIsEstimating(true);
    setEstimationResult(null);
    try {
      const data = await apiFetch<any>(fbUser, '/api/ai/estimate-delivery', {
        method: 'POST',
        body: {
          origin: estimateOrigin,
          destination: estimateDest,
          parcelSize: estimateSize,
          trafficLevel: trafficLevel
        }
      });
      setEstimationResult(data);
    } catch (error) {
      console.error('Estimation failed:', error);
    } finally {
      setIsEstimating(false);
    }
  };

  return (
    <CustomerLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Welcome Card */}
        <motion.div variants={item}>
          <Card className="relative overflow-hidden p-8 md:p-12 bg-slate-900 border-none">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/20 blur-[100px]" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <Badge className="bg-primary-500/10 text-primary-400 border-primary-500/20">Active User</Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-white font-display tracking-tight">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}! 👋
                </h1>
                <p className="text-slate-300 text-lg max-w-xl">
                  {loading ? 'Loading your activity...' : (
                    <>
                      You have {stats.inTransit} parcels in transit and {stats.awaitingDropoff} waiting for drop-off at a WeSabiHub Point.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                   {canSend && (
                     <Button className="rounded-xl px-6 h-12" asChild>
                        <Link to="/customer/send">Send Parcel</Link>
                     </Button>
                   )}
                   <Button variant="outline" className="rounded-xl px-6 h-12 border-slate-700 text-white hover:bg-slate-800" asChild>
                      <Link to="/customer/track">Track Parcel</Link>
                   </Button>
                </div>
              </div>
              <div className="hidden lg:block shrink-0">
                 <div className="w-48 h-48 rounded-full bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
                    <Package size={80} className="text-primary-500 animate-bounce-slow" />
                 </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="space-y-6">
           <h2 className="text-2xl font-bold font-display dark:text-white">Quick Actions</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                ...(canSend ? [{ icon: Send, label: 'Send Parcel', color: 'bg-blue-50 text-blue-600', hover: 'hover:border-blue-500', href: '/customer/send' }] : []),
                { icon: Search, label: 'Track Parcel', color: 'bg-amber-50 text-amber-600', hover: 'hover:border-amber-500', href: '/customer/track' },
                { icon: MapPin, label: 'Find Hub Point', color: 'bg-emerald-50 text-emerald-600', hover: 'hover:border-emerald-500', href: '/customer/hubs' },
                { icon: Download, label: 'Receive Parcel', color: 'bg-purple-50 text-purple-600', hover: 'hover:border-purple-500', href: '/customer/receive' },
              ].map((action, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Link to={action.href}>
                    <Card className={cn("p-6 flex flex-col items-center gap-4 text-center group cursor-pointer transition-all duration-300 border-slate-200 dark:border-slate-800", action.hover)}>
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", action.color)}>
                        <action.icon size={32} />
                      </div>
                      <span className="font-bold text-lg dark:text-white">{action.label}</span>
                    </Card>
                  </Link>
                </motion.div>
              ))}
           </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
           {/* Main Column */}
           <div className="lg:col-span-2 space-y-10">
              {/* Recent Shipments */}
              <motion.div variants={item} className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-display dark:text-white">Recent Shipments</h2>
                    <Button variant="text" size="sm" className="text-primary-600" asChild>
                       <Link to="/customer/history">View All <ChevronRight size={16} /></Link>
                    </Button>
                 </div>
                 <div className="space-y-4">
                    {loading ? (
                      <div className="p-12 text-center">
                        <Loader2 className="animate-spin mx-auto text-primary-600" size={32} />
                        <p className="mt-4 text-slate-900">Fetching your shipments...</p>
                      </div>
                    ) : shipments.length === 0 ? (
                      <Card className="p-12 text-center border-dashed border-2">
                        <Package className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-900 font-bold">No shipments found</p>
                        {canSend ? (
                          <Button variant="outline" className="mt-4" asChild>
                            <Link to="/customer/send">Send your first parcel</Link>
                          </Button>
                        ) : (
                          <Button variant="outline" className="mt-4" asChild>
                            <Link to="/customer/track">Track a parcel</Link>
                          </Button>
                        )}
                      </Card>
                    ) : (
                      shipments.slice(0, 5).map((shipment, i) => (
                        <Card key={shipment.id} className="p-4 flex items-center justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900">
                                <Package size={24} />
                             </div>
                             <div>
                                <p className="font-bold dark:text-white">{shipment.trackingNumber}</p>
                                <p className="text-sm text-slate-900">{shipment.status.replace(/_/g, ' ')}</p>
                             </div>
                          </div>
                          <div className="text-right hidden sm:block">
                             <p className="text-xs text-slate-800 mb-1">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                             <Badge
                               variant={
                                 shipment.status === 'DELIVERED' ? 'success' :
                                 shipment.status === 'AT_DESTINATION_HUB' ? 'info' : 'default'
                               }
                               className="capitalize"
                             >
                               {shipment.status.replace(/_/g, ' ')}
                             </Badge>
                          </div>
                          <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg" asChild>
                             <Link to={`/customer/track?id=${shipment.trackingNumber}`}>Track</Link>
                          </Button>
                        </Card>
                      ))
                    )}
                 </div>
              </motion.div>
              <motion.div variants={item}>
                 <Card className="p-8 bg-primary-600 border-none text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                       <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <MapPin size={32} />
                       </div>
                       <div className="flex-1 space-y-1">
                          <p className="text-primary-100 text-sm font-semibold uppercase tracking-wider">Your Nearest WeSabiHub Point</p>
                          <h3 className="text-2xl font-bold font-display">{nearestHub?.name || 'Find a Hub Point'}</h3>
                          <p className="text-primary-100/80">{nearestHub ? `${nearestHub.address} • Open until ${nearestHub.operatingHours || '6:00 PM'}` : 'Locate centers near you to drop off or receive parcels.'}</p>
                       </div>
                       <Button size="lg" onClick={openDirections} className="bg-white text-primary-600 hover:bg-slate-100 rounded-xl px-8 h-12 font-bold shrink-0">
                          {nearestHub ? 'Get Directions' : 'Find Centers'}
                       </Button>
                    </div>
                 </Card>
              </motion.div>
           </div>

           {/* Sidebar Column */}
           <div className="space-y-10">
              {/* Status Summary */}
              <motion.div variants={item} className="space-y-6">
                 <h2 className="text-xl font-bold font-display dark:text-white">Status Summary</h2>
                 <Card className="p-6 border-slate-200 dark:border-slate-800">
                    <div className="space-y-6">
                       {[
                         { icon: Package, label: 'In Transit', count: stats.inTransit, color: 'text-blue-500' },
                         { icon: MapPin, label: 'Awaiting Pickup', count: stats.awaitingDropoff, color: 'text-amber-500' },
                         { icon: CheckCircle2, label: 'Delivered', count: stats.delivered, color: 'text-emerald-500' },
                       ].map((stat, i) => (
                         <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <stat.icon className={cn("w-5 h-5", stat.color)} />
                               <span className="font-medium text-slate-800 dark:text-slate-300">{stat.label}</span>
                            </div>
                            <span className="text-xl font-bold dark:text-white">{stat.count}</span>
                         </div>
                       ))}
                    </div>
                 </Card>
              </motion.div>

              {/* Support Card */}
              <motion.div variants={item}>
                 <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600">
                       <HelpCircle size={28} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-bold dark:text-white">Need Help?</h3>
                       <p className="text-slate-900 dark:text-slate-300 text-sm leading-relaxed">
                          Our customer support team is available 24/7 to assist with your shipments.
                       </p>
                    </div>
                    <Button variant="outline" className="w-full h-11 rounded-xl" asChild>
                       <Link to="/customer/chat">Contact Support</Link>
                    </Button>
                 </Card>
              </motion.div>

              {/* Latest Notification */}
              <motion.div variants={item} className="space-y-6">
                 <h2 className="text-xl font-bold font-display dark:text-white">Latest Update</h2>
                 <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                       <ShieldCheck size={20} />
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-emerald-600">Security Alert</p>
                       <p className="text-xs text-emerald-600/80 leading-relaxed">
                          Your pickup code for WSH-102-441 has been generated and sent to your email.
                       </p>
                    </div>
                 </div>
              </motion.div>

              {/* AI Delivery Estimator */}
              <motion.div variants={item} className="space-y-6">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                       <Zap size={18} />
                    </div>
                    <h2 className="text-xl font-bold font-display dark:text-white">AI Delivery Estimator</h2>
                 </div>
                 <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="space-y-3">
                       <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-3 text-slate-800" />
                          <input
                            type="text"
                            placeholder="Origin City/Hub"
                            value={estimateOrigin}
                            onChange={(e) => setEstimateOrigin(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                          />
                       </div>
                       <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-3 text-slate-800" />
                          <input
                            type="text"
                            placeholder="Destination City/Hub"
                            value={estimateDest}
                            onChange={(e) => setEstimateDest(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                          />
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                          {(['SMALL', 'MEDIUM', 'LARGE'] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => setEstimateSize(size)}
                              className={cn(
                                "h-10 rounded-lg text-xs font-bold transition-all",
                                estimateSize === size
                                  ? "bg-primary-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 hover:bg-slate-200"
                              )}
                            >
                              {size}
                            </button>
                          ))}
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest px-1">Network Traffic</label>
                          <div className="grid grid-cols-4 gap-2">
                             {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const).map(level => (
                               <button
                                 key={level}
                                 onClick={() => setTrafficLevel(level)}
                                 className={cn(
                                   "h-9 rounded-lg text-[10px] font-bold transition-all border",
                                   trafficLevel === level
                                     ? "bg-amber-100 border-amber-200 text-amber-800"
                                     : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 hover:bg-slate-50"
                                 )}
                               >
                                 {level}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                    <Button
                      onClick={handleEstimate}
                      disabled={isEstimating || !estimateOrigin || !estimateDest}
                      className="w-full h-11 rounded-xl shadow-lg shadow-primary-600/20"
                    >
                      {isEstimating ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={18} />
                          Analyzing Logistics...
                        </>
                      ) : (
                        <>
                          <Zap size={18} className="mr-2" />
                          Predict Arrival Time
                        </>
                      )}
                    </Button>

                    {estimationResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4"
                      >
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Calendar size={16} className="text-primary-600" />
                               <span className="text-sm font-bold dark:text-white">Estimated Arrival</span>
                            </div>
                            <Badge variant="success">
                               {new Date(estimationResult.estimatedArrivalDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Badge>
                         </div>
                         <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                               <Info size={12} />
                               AI Reasoning
                            </div>
                            <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed italic">
                               "{estimationResult.reasoning}"
                            </p>
                         </div>
                         <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-800 uppercase tracking-widest">Model Confidence</span>
                            <span className="text-primary-600">{estimationResult.confidence}%</span>
                         </div>
                         <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${estimationResult.confidence}%` }}
                              className="h-full bg-primary-600"
                            />
                         </div>
                      </motion.div>
                    )}
                 </Card>
              </motion.div>
           </div>
        </div>
      </motion.div>
    </CustomerLayout>
  );
};
