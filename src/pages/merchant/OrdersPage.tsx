import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Search,
  Eye,
  FileText,
  Loader2,
  Download
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn, exportToCsv } from '@/src/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/src/context/AuthContext';
import { parcelEngine } from '@/src/engines';
import { Parcel } from '@/src/types';
import { Link } from 'react-router-dom';

export const OrdersPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Parcel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await parcelEngine.getParcelsBySender(user!.uid);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }
    setIsExporting(true);
    try {
      const csvData = orders.map(o => ({
        OrderID: o.id,
        TrackingNumber: o.trackingNumber,
        Customer: o.recipientInfo.name,
        Status: o.status,
        Date: new Date(o.createdAt || '').toLocaleDateString(),
        Amount: o.pricing.total
      }));

      exportToCsv(`Orders_${user?.uid}_${new Date().toISOString()}.csv`, csvData);

      toast.success('Orders exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export orders');
    } finally {
      setIsExporting(false);
    }
  };

  // Status groupings for the filter tabs. Matching by raw substring (e.g.
  // status.includes('PENDING')) was broken -- none of the real parcel
  // statuses contain "PENDING" except the rare REFUND_PENDING, so the
  // "Pending" tab always showed an empty list even when orders were
  // genuinely awaiting payment or drop-off.
  const PENDING_STATUSES = ['DRAFT', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'AWAITING_DROP_OFF'];
  const IN_TRANSIT_STATUSES = ['RECEIVED_AT_ORIGIN', 'AWAITING_DISPATCH', 'IN_TRANSIT', 'TRANSFERRED_BETWEEN_POINTS', 'ARRIVED_AT_DESTINATION', 'READY_FOR_PICKUP'];
  const DELIVERED_STATUSES = ['DELIVERED', 'COMPLETED', 'COLLECTED'];

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && PENDING_STATUSES.includes(order.status);
    if (activeTab === 'in-transit') return matchesSearch && IN_TRANSIT_STATUSES.includes(order.status);
    if (activeTab === 'delivered') return matchesSearch && DELIVERED_STATUSES.includes(order.status);
    return matchesSearch;
  });

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Customer Orders</h1>
            <p className="text-slate-600 dark:text-slate-400">Track customer orders, mark handovers, and print parcel flyers.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl flex items-center gap-2" asChild>
               <Link to="/merchant/flyer">
                 <FileText size={18} /> Parcel Flyer Studio
               </Link>
             </Button>
             <Button variant="outline" className="rounded-xl flex items-center gap-2" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Export Orders
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
              {['all', 'pending', 'in-transit', 'delivered'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold text-xs capitalize transition-all",
                    activeTab === tab ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                   {tab}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                 <Input
                   placeholder="Search by order ID, customer, or tracking..."
                   className="pl-10 h-11"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
           {loading ? (
              <Card className="p-12 text-center border-slate-200 dark:border-slate-800">
                <Loader2 size={24} className="animate-spin mx-auto text-primary-600 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Loading orders...</p>
              </Card>
           ) : filteredOrders.length === 0 ? (
              <Card className="p-12 text-center border-slate-200 dark:border-slate-800">
                <ShoppingBag size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold dark:text-white">No orders found</p>
                <p className="text-xs text-slate-500 mt-1">Create a shipment to start receiving orders.</p>
              </Card>
           ) : (
              filteredOrders.map((order) => (
               <Card key={order.id} className="p-0 border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary-500 transition-all group">
                  <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-6">
                     {/* Order Info */}
                     <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-10">
                        <div className="space-y-1 w-40">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order ID</p>
                           <p className="font-bold text-sm dark:text-white font-mono">{order.id.substr(-8).toUpperCase()}</p>
                        </div>

                        <div className="space-y-1 w-48">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</p>
                           <p className="font-bold text-sm dark:text-white">{order.recipientInfo?.name || 'Customer'}</p>
                           <p className="text-[10px] text-slate-500">{new Date(order.createdAt || '').toLocaleDateString()}</p>
                        </div>

                        <div className="space-y-1 flex-1">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tracking Number</p>
                           <p className="font-bold text-sm dark:text-white truncate font-mono">{order.trackingNumber}</p>
                           <p className="font-black text-sm text-primary-600">₦{(order.pricing?.total || 0).toLocaleString()}</p>
                        </div>

                        <div className="w-32">
                           <Badge
                             variant={
                               order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'success' :
                               order.status === 'CANCELLED' ? 'error' :
                               order.status === 'IN_TRANSIT' ? 'info' : 'warning'
                             }
                             className="rounded-lg h-7 capitalize"
                           >
                              {order.status.toLowerCase().replace(/_/g, ' ')}
                           </Badge>
                        </div>
                     </div>

                     {/* Quick Actions */}
                     <div className="flex items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          className="rounded-xl h-10 px-3 text-xs font-bold gap-1.5 text-primary-600 border-primary-200 hover:bg-primary-50 dark:border-primary-800"
                          asChild
                        >
                          <Link to={`/merchant/flyer?parcelId=${order.id}`}>
                            <FileText size={15} /> Parcel Flyer
                          </Link>
                        </Button>
                        <Button variant="outline" className="rounded-xl h-10 w-10 p-0 text-slate-600 dark:text-slate-300" asChild>
                           <Link to={`/merchant/shipments/track?id=${order.trackingNumber}`}>
                             <Eye size={18} />
                           </Link>
                        </Button>
                     </div>
                  </div>
               </Card>
             ))
           )}
        </div>

        {/* Order Count */}
        <div className="flex flex-col items-center gap-4 pt-10">
           <p className="text-xs text-slate-600 dark:text-slate-400">Showing {filteredOrders.length} of {orders.length} orders</p>
        </div>
      </div>
    </MerchantLayout>
  );
};
