import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MapPin,
  Home,
  Briefcase,
  Trash2,
  Edit2,
  Star,
  BookMarked
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { userEngine } from '@/src/engines';
import { auditEngine } from '@/src/engines';
import { useAuth } from '@/src/context/AuthContext';
import { SavedAddress } from '@/src/types/customer';
import { AddressModal } from '@/src/components/customer/AddressModal';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/src/components/ui/ConfirmationDialog';

export const SavedAddressesPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const data = await userEngine.getAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Partial<SavedAddress>) => {
    if (!user) return;

    // Save previous state for rollback
    const previousAddresses = [...addresses];

    try {
      if (editingAddress) {
        // Optimistic update
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...formData } as SavedAddress : a));

        await userEngine.updateAddress(editingAddress.id, formData);
        await auditEngine.logEvent({ userId: user.id, action: 'UPDATE_ADDRESS', details: { label: formData.label }, result: 'SUCCESS', targetId: editingAddress.id });
        toast.success('Address updated successfully');
      } else {
        const id = `ADDR-${Date.now()}`;
        const newAddress = {
          ...formData,
          id,
          userId: user.id,
          isDefault: addresses.length === 0
        } as SavedAddress;

        // Optimistic update
        setAddresses(prev => [...prev, newAddress]);

        await userEngine.addAddress(id, newAddress);
        await auditEngine.logEvent({ userId: user.id, action: 'CREATE_ADDRESS', details: { label: formData.label }, result: 'SUCCESS', targetId: id });
        toast.success('Address added successfully');
      }
      loadAddresses();
    } catch (error) {
      // Rollback
      setAddresses(previousAddresses);
      toast.error('Failed to save address');
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete || !user) return;

    // Save previous state for rollback
    const previousAddresses = [...addresses];
    const addrToDelete = addresses.find(a => a.id === addressToDelete);

    try {
      // Optimistic update
      setAddresses(prev => {
        const filtered = prev.filter(a => a.id !== addressToDelete);
        if (addrToDelete?.isDefault && filtered.length > 0) {
          filtered[0].isDefault = true;
        }
        return filtered;
      });

      await userEngine.deleteAddress(addressToDelete);
      await auditEngine.logEvent({ userId: user.id, action: 'DELETE_ADDRESS', details: { label: addrToDelete?.label }, result: 'SUCCESS', targetId: addressToDelete });

      // If we deleted the default address, set the first remaining one as default in DB
      if (addrToDelete?.isDefault && previousAddresses.length > 1) {
        const firstRemaining = previousAddresses.find(a => a.id !== addressToDelete);
        if (firstRemaining) {
          await userEngine.setDefaultAddress(user.id, firstRemaining.id);
        }
      }

      toast.success('Address deleted successfully');
      loadAddresses();
      setAddressToDelete(null);
    } catch (error) {
      // Rollback
      setAddresses(previousAddresses);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    // Save previous state for rollback
    const previousAddresses = [...addresses];

    try {
      // Optimistic update
      setAddresses(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id
      })));

      await userEngine.setDefaultAddress(user.id, id);
      await auditEngine.logEvent({ userId: user.id, action: 'SET_DEFAULT_ADDRESS', details: {}, result: 'SUCCESS', targetId: id });
      toast.success('Default address updated');
      loadAddresses();
    } catch (error) {
      // Rollback
      setAddresses(previousAddresses);
      toast.error('Failed to update default address');
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Saved Addresses</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage your frequently used delivery and pickup addresses.</p>
          </div>
          <Button
            className="rounded-xl h-12 px-6"
            onClick={() => {
              setEditingAddress(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} className="mr-2" /> Add New Address
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "p-6 border-slate-200 dark:border-slate-800 transition-all group relative h-full flex flex-col",
                  addr.isDefault ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg shadow-primary-500/5" : "hover:border-primary-500"
                )}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                            addr.type === 'home' ? "bg-blue-500" : addr.type === 'work' ? "bg-amber-500" : "bg-purple-500"
                          )}>
                            {addr.type === 'home' ? <Home size={24} /> : addr.type === 'work' ? <Briefcase size={24} /> : <MapPin size={24} />}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                {addr.label}
                                {addr.isDefault && <Badge variant="info" className="text-[10px] h-5">Default</Badge>}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{addr.name}</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 text-slate-600 dark:text-slate-300 hover:text-primary-600 border-slate-200 dark:border-slate-800"
                            onClick={() => {
                              setEditingAddress(addr);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 p-0 text-slate-600 dark:text-slate-300 hover:text-red-600 border-slate-200 dark:border-slate-800"
                            onClick={() => setAddressToDelete(addr.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-primary-600 mt-1 shrink-0" />
                          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {addr.address}, {addr.city}, {addr.state}
                          </p>
                      </div>
                      <div className="flex items-center gap-3">
                          <Star size={18} className="text-primary-600 shrink-0" />
                          <p className="text-slate-600 dark:text-slate-300 text-sm">{addr.phone}</p>
                      </div>
                    </div>

                    {!addr.isDefault && (
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="text"
                          size="sm"
                          className="text-primary-600 font-bold p-0"
                          onClick={() => handleSetDefault(addr.id)}
                        >
                            Set as Default
                        </Button>
                      </div>
                    )}
                </Card>
              </motion.div>
            ))}

            <button
              onClick={() => {
                setEditingAddress(null);
                setIsModalOpen(true);
              }}
              className="h-full min-h-[220px] p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:bg-primary-50/10 transition-all flex flex-col items-center justify-center gap-4 group"
            >
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all">
                  <Plus size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold dark:text-white group-hover:text-primary-600 transition-colors">Add New Address</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Save another pickup/delivery location</p>
                </div>
            </button>
          </div>
        )}

        {addresses.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <BookMarked size={64} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold dark:text-white">No addresses saved yet</h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-sm">Save your home, office, and other frequent locations for faster shipment creation.</p>
              </div>
              <Button
                size="lg"
                className="rounded-xl px-10 h-12"
                onClick={() => setIsModalOpen(true)}
              >
                Add Your First Address
              </Button>
          </div>
        )}

        <AddressModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingAddress}
        />

        <ConfirmationDialog
          isOpen={!!addressToDelete}
          onClose={() => setAddressToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Address"
          description="Are you sure you want to delete this address? This action cannot be undone."
          variant="danger"
        />
      </div>
    </CustomerLayout>
  );
};
