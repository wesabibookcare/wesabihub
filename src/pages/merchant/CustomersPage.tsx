import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  Star,
  MessageSquare,
  Package,
  MoreVertical,
  UserPlus,
  ArrowRight,
  Phone,
  Mail,
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  User,
  ShieldCheck,
  Edit
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Avatar } from '@/src/components/ui/Avatar';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ConfirmationDialog } from '@/src/components/ui/ConfirmationDialog';
import { cn } from '@/src/lib/utils';
import { merchantCustomerEngine } from '@/src/engines';
import { authService } from '@/src/services/authService';
import { toast } from 'sonner';
import { MerchantCustomer } from '@/src/types';
import { useNavigate } from 'react-router-dom';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'active'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<MerchantCustomer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchCustomers = async () => {
    const user = authService.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const data = await merchantCustomerEngine.getCustomers(user.uid);
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();

    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSync = async () => {
    const user = authService.currentUser;
    if (!user) return;

    try {
      setSyncing(true);
      toast.info('Synchronizing customers from shipments...');
      await merchantCustomerEngine.syncCustomersFromShipments(user.uid);
      await fetchCustomers();
      toast.success('Customer list synchronized successfully!');
    } catch (error) {
      console.error('Error syncing customers:', error);
      toast.error('Failed to sync customers');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    try {
      await merchantCustomerEngine.toggleFavorite(id, !current);
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !current } : c));
      toast.success(current ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      await merchantCustomerEngine.deleteCustomer(customerToDelete);
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
      toast.success('Customer removed from database');
      setCustomerToDelete(null);
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleEditCustomer = async () => {
    if (!customerToEdit) return;
    try {
      await merchantCustomerEngine.updateCustomer(customerToEdit.id, {
        name: editName,
        email: editEmail,
        phone: editPhone
      });
      setCustomers(prev => prev.map(c => c.id === customerToEdit.id ? { ...c, name: editName, email: editEmail, phone: editPhone } : c));
      toast.success('Customer details updated');
      setCustomerToEdit(null);
    } catch (error) {
      toast.error('Failed to update customer');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery);

    if (filter === 'favorites') return matchesSearch && customer.isFavorite;
    if (filter === 'active') return matchesSearch && customer.totalShipments > 5;
    return matchesSearch;
  });

  const handleExport = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Name,Email,Phone,Shipments,Total Spent"].join(",") + "\n"
      + customers.map(c => [c.name, c.email || '', c.phone, c.totalShipments, c.totalSpent].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Customers exported to CSV');
  };

  return (
    <MerchantLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Customers</h1>
            <p className="text-slate-800">View and manage your customer database and order history.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button
               variant="outline"
               onClick={handleSync}
               disabled={syncing}
               className="rounded-xl px-6 flex items-center gap-2"
             >
                <RefreshCw size={18} className={cn(syncing && "animate-spin")} />
                {syncing ? 'Syncing...' : 'Sync Customers'}
             </Button>
             <Button
               onClick={handleExport}
               variant="outline"
               className="rounded-xl px-6 flex items-center gap-2"
             >
                <Download size={18} /> Export
             </Button>
             <Button
               onClick={() => navigate('/merchant/shipments/create')}
               className="rounded-xl px-8 shadow-lg shadow-primary-500/20 flex items-center gap-2"
             >
                <UserPlus size={18} /> Add New Customer
             </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex items-center gap-3 flex-1 lg:max-w-md">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900 w-4 h-4" />
                 <Input
                   placeholder="Search name, email, or phone..."
                   className="pl-10 h-11"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold text-xs transition-all",
                  filter === 'all' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
                )}
              >
                All Customers
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold text-xs transition-all",
                  filter === 'favorites' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
                )}
              >
                Favorites
              </button>
              <button
                onClick={() => setFilter('active')}
                className={cn(
                  "px-6 py-2 rounded-xl font-bold text-xs transition-all",
                  filter === 'active' ? "bg-white dark:bg-slate-800 text-primary-600 shadow-sm" : "text-slate-800"
                )}
              >
                Repeat Customers
              </button>
           </div>
        </div>

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-6 h-48 animate-pulse bg-slate-50 dark:bg-slate-900/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all group relative overflow-hidden">
                  <div className="flex items-start gap-6 relative z-10">
                    <Avatar
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`}
                      name={customer.name}
                      className="w-20 h-20 border-2 border-primary-500/10"
                    />
                    <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                {customer.name}
                                {customer.isFavorite && <Star className="fill-amber-400 text-amber-400" size={16} />}
                              </h3>
                              <p className="text-sm text-slate-800 uppercase tracking-tighter font-bold">ID: {customer.id}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleFavorite(customer.id, customer.isFavorite)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                customer.isFavorite ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                              )}
                            >
                              <Star size={18} fill={customer.isFavorite ? "currentColor" : "none"} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenu(activeMenu === customer.id ? null : customer.id);
                                }}
                                className="p-2 text-slate-900 hover:text-primary-600 transition-colors"
                              >
                                  <MoreVertical size={20} />
                              </button>

                              {activeMenu === customer.id && (
                                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                                  <button
                                    onClick={() => {
                                      setCustomerToEdit(customer);
                                      setEditName(customer.name);
                                      setEditEmail(customer.email || '');
                                      setEditPhone(customer.phone);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                  >
                                    <Edit size={16} className="text-slate-900" /> Edit Contact
                                  </button>
                                  <button
                                    onClick={() => navigate(`/merchant/shipments/history?customer=${customer.phone}`)}
                                    className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                  >
                                    <Package size={16} className="text-slate-900" /> Shipment History
                                  </button>
                                  <button
                                    onClick={() => navigate(`/merchant/chat?customerPhone=${customer.phone}`)}
                                    className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                                  >
                                    <MessageSquare size={16} className="text-slate-900" /> Send Message
                                  </button>
                                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                  <button
                                    onClick={() => setCustomerToDelete(customer.id)}
                                    className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-red-50 text-red-600 flex items-center gap-3"
                                  >
                                    <Trash2 size={16} /> Delete Customer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2 text-xs text-slate-800">
                              <Phone size={14} className="text-slate-900" />
                              {customer.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-800">
                              <Mail size={14} className="text-slate-900" />
                              <span className="truncate max-w-[120px]">{customer.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-800">
                              <Package size={14} className="text-slate-900" />
                              {customer.totalShipments} Shipments
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-800">
                              <Badge variant="success" className="h-5 px-1.5 text-[10px]">₦{customer.totalSpent.toLocaleString()} Total</Badge>
                          </div>
                        </div>

                        <div className="pt-4 flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => navigate(`/merchant/chat?customerPhone=${customer.phone}`)}
                            className="flex-1 rounded-xl h-10 text-xs font-bold gap-2"
                          >
                              <MessageSquare size={14} /> Message
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCustomerToEdit(customer);
                              setEditName(customer.name);
                              setEditEmail(customer.email || '');
                              setEditPhone(customer.phone);
                            }}
                            className="flex-1 rounded-xl h-10 text-xs font-bold gap-2"
                          >
                              <Edit size={14} /> Edit
                          </Button>
                        </div>
                    </div>
                  </div>

                  {/* Aesthetic Background Accents */}
                  <div className="absolute -right-4 -bottom-4 text-primary-500/5 group-hover:text-primary-500/10 transition-colors pointer-events-none">
                    <Users size={120} />
                  </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCustomers.length === 0 && (
          <Card className="py-20 border-dashed border-2">
            <EmptyState
              icon={Users}
              title={searchQuery ? "No matching customers" : "No customers yet"}
              description={searchQuery ? "Try adjusting your search terms." : "Your customer list will grow as you create more shipments. Click 'Sync Customers' to refresh from your shipment history."}
              action={
                <div className="flex gap-4">
                  <Button
                    onClick={handleSync}
                    variant="outline"
                    className="rounded-xl px-10 h-12"
                  >
                    Sync From Shipments
                  </Button>
                  <Button
                    onClick={() => navigate('/merchant/shipments/create')}
                    className="rounded-xl px-10 h-12 shadow-lg shadow-primary-500/20"
                  >
                    Add Your First Customer
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={handleDeleteCustomer}
          title="Delete Customer"
          description="Are you sure you want to remove this customer from your database? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

        <ConfirmationDialog
          isOpen={!!customerToEdit}
          onClose={() => setCustomerToEdit(null)}
          onConfirm={handleEditCustomer}
          title="Edit Customer"
          confirmText="Save Changes"
          cancelText="Cancel"
        >
          <div className="space-y-4 py-4">
             <div className="space-y-1">
                <label className="text-sm font-bold">Name</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold">Email</label>
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold">Phone</label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} />
             </div>
          </div>
        </ConfirmationDialog>
      </div>
    </MerchantLayout>
  );
};
