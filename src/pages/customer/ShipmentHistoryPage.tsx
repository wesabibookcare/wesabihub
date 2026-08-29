import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Package,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { cn, exportToCsv } from '@/src/lib/utils';
import { RequestDeliveryModal } from '@/src/components/delivery/RequestDeliveryModal';
import { useAuth } from '@/src/context/AuthContext';
import { permissionService } from '@/src/services/permissionService';
import { parcelEngine } from '@/src/engines';
import { centreEngine } from '@/src/engines';
import { Parcel, HubCenter } from '@/src/types';
import { RatingModal } from '@/src/components/ratings/RatingModal';
import { Star } from 'lucide-react';

import { toast } from 'sonner';

export const ShipmentHistoryPage = () => {
  const { user } = useAuth();
  const isApprovedMerchant = (user?.roles?.includes('MERCHANT') || user?.role === 'MERCHANT') &&
    (user?.status === 'APPROVED' || user?.status === 'ACTIVE' || user?.verificationStatus?.kyc === true);
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || user?.role === 'SUPER_ADMIN' || user?.email === 'wesabibookcare@gmail.com';
  const canSend = isApprovedMerchant || isSuperAdmin;
  const [isExporting, setIsExporting] = useState(false);
  const [ratingParcel, setRatingParcel] = useState<Parcel | null>(null);


  const handleExport = async () => {
    if (shipments.length === 0) {
      toast.success('No shipment history to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvData = shipments.map(s => ({
        TrackingNumber: s.trackingNumber,
        Status: s.status,
        OriginHub: hubs[s.originCenterId] || s.originCenterId,
        DestinationHub: hubs[s.destinationCenterId] || s.destinationCenterId,
        Date: new Date(s.createdAt).toLocaleString(),
        Weight: s.weightKg,
        Amount: s.pricing.total
      }));

      exportToCsv(`ShipmentHistory_${user?.uid}_${new Date().toISOString()}.csv`, csvData);

      toast.success('History exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export shipment history');
    } finally {
      setIsExporting(false);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const [shipments, setShipments] = useState<Parcel[]>([]);
  const [hubs, setHubs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch hubs to resolve names
      const allHubs = await centreEngine.listNearbyHubs(0, 0, 9999);
      const hubMap: Record<string, string> = {};
      allHubs.forEach(h => { hubMap[h.id] = h.name; });
      setHubs(hubMap);

      // Fetch shipments where user is sender
      const userShipments = await parcelEngine.query([
        { field: 'senderId', operator: '==', value: user.uid }
      ]);

      // Sort by newest
      userShipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setShipments(userShipments);
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter(s =>
    s.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRoute = (originId: string, destId: string) => {
    const origin = hubs[originId] || 'Center';
    const dest = hubs[destId] || 'Center';
    // Get city names (simplification)
    const originCity = origin.split(' ')[0];
    const destCity = dest.split(' ')[0];
    return `${originCity} → ${destCity}`;
  };

  return (
    <CustomerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Shipment History</h1>
            <p className="text-slate-600 dark:text-slate-300">View and manage all your past and present shipments.</p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl h-12 px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download size={18} className="mr-2" />}
            {isExporting ? 'Exporting...' : 'Export History'}
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-4 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center">
           <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
              <input
                type="text"
                placeholder="Search by tracking number or status..."
                className="w-full h-12 pl-12 pr-6 rounded-xl bg-slate-50 dark:bg-slate-900 border-none outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="outline" className="h-12 rounded-xl flex-1 md:flex-none">
                 <Filter size={18} className="mr-2" /> Filter
              </Button>
              <Button variant="outline" className="h-12 rounded-xl flex-1 md:flex-none">
                 <ArrowUpDown size={18} className="mr-2" /> Sort
              </Button>
           </div>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin text-primary-600" size={40} />
            <p className="text-slate-600 dark:text-slate-300">Loading your shipments...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <Card className="p-16 border-dashed">
            <EmptyState
              icon={Package}
              title="No shipments found"
              description="We couldn't find any shipments matching your search. Try adjusting your filters or send a new parcel."
              action={canSend ? (
                <Button className="mt-4 rounded-xl px-8" asChild>
                  <Link to="/customer/send">Send Parcel</Link>
                </Button>
              ) : (
                <Button className="mt-4 rounded-xl px-8 bg-amber-600 hover:bg-amber-700 font-bold" asChild>
                  <Link to="/register?role=MERCHANT">Apply for Merchant Account</Link>
                </Button>
              )}
            />
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden lg:block overflow-hidden border-slate-200 dark:border-slate-800">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Tracking No.</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Type</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Route</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     <AnimatePresence>
                       {filteredShipments.map((s) => (
                         <motion.tr
                           key={s.id}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                         >
                            <td className="px-6 py-5">
                               <span className="font-bold font-mono dark:text-white">{s.trackingNumber}</span>
                            </td>
                            <td className="px-6 py-5">
                               <Badge variant="info" className="rounded-md px-2 py-0.5">Send</Badge>
                            </td>
                            <td className="px-6 py-5">
                               <span className="text-slate-600 dark:text-slate-300 font-medium">
                                 {formatRoute(s.originCenterId, s.destinationCenterId)}
                               </span>
                            </td>
                            <td className="px-6 py-5">
                               <span className="text-slate-600 dark:text-slate-300 text-sm">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-5">
                               <Badge
                                 variant={
                                   s.status === 'DELIVERED' ? 'success' :
                                   s.status === 'CANCELLED' ? 'error' :
                                   s.status === 'AT_DESTINATION_HUB' ? 'warning' : 'info'
                                 }
                                 className="capitalize"
                               >
                                  {s.status.replace(/_/g, ' ')}
                               </Badge>
                            </td>
                            <td className="px-6 py-5 text-right flex justify-end gap-2">
                               {['COLLECTED', 'DELIVERED', 'RELEASED'].includes(s.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-bold"
                                    onClick={() => setRatingParcel(s)}
                                  >
                                    <Star size={14} className="mr-1 text-amber-400 fill-amber-400" /> Rate
                                  </Button>
                               )}
                               {s.status === 'AT_DESTINATION_HUB' && (
                                  <Button size="sm" onClick={() => setSelectedParcelId(s.id as string)}>
                                    Request Doorstep
                                  </Button>
                               )}
                               <Button variant="text" size="sm" className="h-8 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                  <Link to={`/customer/track?id=${s.trackingNumber}`}>
                                    <Eye size={18} />
                                  </Link>
                               </Button>
                            </td>
                         </motion.tr>
                       ))}
                     </AnimatePresence>
                  </tbody>
               </table>
            </Card>

            {/* Mobile List View */}
            <div className="lg:hidden space-y-4">
               {filteredShipments.map((s) => (
                 <motion.div
                   key={s.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                 >
                   <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <p className="font-bold font-mono dark:text-white">{s.trackingNumber}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{formatRoute(s.originCenterId, s.destinationCenterId)}</p>
                         </div>
                         <Badge
                           variant={
                             s.status === 'DELIVERED' ? 'success' :
                             s.status === 'CANCELLED' ? 'error' :
                             s.status === 'AT_DESTINATION_HUB' ? 'warning' : 'info'
                           }
                         >
                            {s.status.replace(/_/g, ' ')}
                         </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                         <div className="text-sm text-slate-600 dark:text-slate-300">
                            <p>{new Date(s.createdAt).toLocaleDateString()}</p>
                         </div>
                         <div className="flex gap-2">
                           {s.status === 'AT_DESTINATION_HUB' && (
                              <Button size="sm" onClick={() => setSelectedParcelId(s.id as string)}>
                                Doorstep
                              </Button>
                           )}
                           <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg transition-all active:scale-95" asChild>
                              <Link to={`/customer/track?id=${s.trackingNumber}`}>
                                Details <ChevronRight size={16} className="ml-1" />
                              </Link>
                           </Button>
                         </div>
                      </div>
                   </Card>
                 </motion.div>
               ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-6">
               <p className="text-sm text-slate-600 dark:text-slate-300">Showing {filteredShipments.length} shipments</p>
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled className="h-10 w-10 p-0 rounded-lg"><ChevronLeft size={20} /></Button>
                  <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-lg bg-primary-600 text-white border-primary-600">1</Button>
                  <Button variant="outline" size="sm" disabled className="h-10 w-10 p-0 rounded-lg"><ChevronRight size={20} /></Button>
               </div>
            </div>
          </>
        )}
      </div>
      <RequestDeliveryModal
        parcelId={selectedParcelId || ''}
        isOpen={!!selectedParcelId}
        onClose={() => setSelectedParcelId(null)}
        onSuccess={() => { setSelectedParcelId(null); fetchData(); }}
      />

      {ratingParcel && (
        <RatingModal
          isOpen={!!ratingParcel}
          onClose={() => setRatingParcel(null)}
          authorId={user?.uid || 'DEMO_USER'}
          authorName={user?.displayName || user?.email?.split('@')[0] || 'Customer'}
          authorRole="CUSTOMER"
          targetId={ratingParcel.originCenterId || ratingParcel.destinationCenterId}
          targetName={hubs[ratingParcel.originCenterId] || hubs[ratingParcel.destinationCenterId] || 'Hub Center'}
          targetType="HUB"
          relationshipType="CUSTOMER_TO_HUB"
          parcelId={ratingParcel.id || ratingParcel.shipmentId}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </CustomerLayout>
  );
};
