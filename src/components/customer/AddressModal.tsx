import React, { useState, useEffect } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { SavedAddress } from '@/src/types/customer';
import { Home, Briefcase, MapPin } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Partial<SavedAddress>) => Promise<void>;
  initialData?: SavedAddress | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<SavedAddress>>({
    label: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    type: 'home',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        label: '',
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        type: 'home',
        isDefault: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save address:', error);
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'other', label: 'Other', icon: MapPin },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Address' : 'Add New Address'}
      description="Save a frequently used location for faster shipments."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFormData({ ...formData, type: t.id as any })}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                formData.type === t.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600"
                  : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200"
              )}
            >
              <t.icon size={24} />
              <span className="text-xs font-bold">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Address Label</label>
            <Input
              placeholder="e.g. My Apartment"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Contact Name</label>
            <Input
              placeholder="Alex Johnson"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
          <Input
            placeholder="+234 ..."
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Street Address</label>
          <Input
            placeholder="123 Example Street"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">City</label>
            <Input
              placeholder="Lagos"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">State</label>
            <Input
              placeholder="Lagos"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Address' : 'Save Address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
