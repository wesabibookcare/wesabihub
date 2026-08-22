import React, { useState } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { CreditCard, Building2, Smartphone } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PaymentMethod } from '@/src/services/db/PaymentMethodRepository';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (method: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt' | 'isDefault'>) => Promise<void>;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'momo'>('bank');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');

  const [bankName, setBankName] = useState('GTBank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [momoProvider, setMomoProvider] = useState('MTN Mobile Money');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === 'bank') {
        const masked = accountNumber.length > 4 ? `***${accountNumber.slice(-4)}` : accountNumber;
        await onSave({
          type: 'bank',
          brand: bankName,
          number: masked,
          name: accountName || 'Account Name'
        });
      } else {
        const masked = momoNumber.length > 4 ? `***${momoNumber.slice(-4)}` : momoNumber;
        await onSave({
          type: 'momo',
          brand: momoProvider,
          number: masked,
          name: momoName || 'Provider Owner'
        });
      }
      onClose();
      // Reset form
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setAccountNumber('');
      setAccountName('');
      setMomoNumber('');
      setMomoName('');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Payment Method"
      description="Link a new card or financial account to WeSabiHub."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'bank', label: 'Bank Account', icon: Building2 },
            { id: 'momo', label: 'Mobile Money', icon: Smartphone }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                activeTab === tab.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 text-primary-600"
                  : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200"
              )}
            >
              <tab.icon size={20} />
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Bank Name</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none text-slate-900 dark:text-white"
                >
                  <option value="GTBank">GTBank (Guaranty Trust Bank)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="UBA">UBA (United Bank for Africa)</option>
                  <option value="Sterling Bank">Sterling Bank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Account Number</label>
                <Input
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                <Input
                  placeholder="Alex Johnson"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'momo' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Provider</label>
                <select
                  value={momoProvider}
                  onChange={(e) => setMomoProvider(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm outline-none text-slate-900 dark:text-white"
                >
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="Opay">Opay</option>
                  <option value="Palmpay">Palmpay</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <Input
                  placeholder="0802345678"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                <Input
                  placeholder="Alex Johnson"
                  value={momoName}
                  onChange={(e) => setMomoName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Add Method
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
