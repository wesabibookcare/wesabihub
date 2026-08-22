import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  MoreVertical,
  ChevronRight,
  Zap,
  Building2,
  Smartphone,
  CheckCircle2,
  Lock,
  Star
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { paymentEngine } from '@/src/engines';
import { PaymentMethod } from '@/src/services/db/PaymentMethodRepository';
import { useAuth } from '@/src/context/AuthContext';
import { AddPaymentMethodModal } from '@/src/components/customer/AddPaymentMethodModal';
import { toast } from 'sonner';

export const PaymentMethodsPage = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadMethods();
    }
  }, [user]);

  const loadMethods = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let data = await paymentEngine.getPaymentMethods(user.id);

      // No fake/demo payment methods are seeded here anymore -- customers
      // see an honest empty state and add their real bank account themselves.
      // (Card payments are not offered; WeSabiHub is bank-transfer only.)
      setMethods(data);
    } catch (error) {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt' | 'isDefault'>) => {
    if (!user) return;
    try {
      const id = `PM-${Date.now()}`;
      const newMethod: PaymentMethod = {
        ...formData,
        id,
        userId: user.id,
        isDefault: methods.length === 0,
        createdAt: new Date().toISOString()
      };
      await paymentEngine.addPaymentMethod(id, newMethod);
      toast.success('Payment method added successfully');
      loadMethods();
    } catch (error) {
      toast.error('Failed to add payment method');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const toDelete = methods.find(m => m.id === id);
      await paymentEngine.deletePaymentMethod(id);
      toast.success('Payment method removed');

      if (toDelete?.isDefault && methods.length > 1) {
        const remaining = methods.filter(m => m.id !== id);
        if (remaining.length > 0) {
          await paymentEngine.setDefaultPaymentMethod(user!.id, remaining[0].id);
        }
      }
      loadMethods();
    } catch (error) {
      toast.error('Failed to remove payment method');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      await paymentEngine.setDefaultPaymentMethod(user.id, id);
      toast.success('Default payment method updated');
      loadMethods();
    } catch (error) {
      toast.error('Failed to set default method');
    }
  };

  const cards = methods.filter(m => m.type === 'card');
  const otherMethods = methods.filter(m => m.type !== 'card');

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold dark:text-white font-display">Payment Methods</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage your cards, bank accounts, and other payment options.</p>
          </div>
          <Button className="rounded-xl h-12 px-6" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" /> Add New Method
          </Button>
        </div>

        {/* Policy Notification Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-center gap-3">
          <Lock className="shrink-0 text-amber-600 dark:text-amber-400" size={20} />
          <div className="text-sm">
            <p className="font-bold">Card Payments Temporarily Disabled</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              For normal platform payments and wallet funding, Bank Transfer is the active payment method. Card processing is temporarily disabled.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6 animate-pulse">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
          </div>
        ) : (
          <div className="grid gap-10">
            {/* Credit/Debit Cards */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                <CreditCard size={20} className="text-primary-600" /> Credit & Debit Cards
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {cards.map((card) => (
                  <Card key={card.id} className={cn(
                    "p-8 border-none text-white overflow-hidden relative group transition-all duration-300",
                    card.isDefault ? "ring-4 ring-primary-500/50 bg-slate-950" : "bg-slate-900"
                  )}>
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-all" />
                    <div className="space-y-10 relative z-10">
                      <div className="flex justify-between items-start">
                        <Zap className="text-primary-400" size={32} />
                        <div className="text-right">
                          <p className="text-lg font-black italic tracking-tighter">{card.brand}</p>
                          {card.isDefault && <Badge className="bg-white/10 text-white border-white/20 mt-1">Default</Badge>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-mono tracking-[0.2em]">{card.number}</p>
                        <div className="flex justify-between items-end pt-2">
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Card Holder</p>
                            <p className="font-bold text-sm">{card.name}</p>
                          </div>
                          {card.expiry && (
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Expires</p>
                              <p className="font-bold text-sm">{card.expiry}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      {!card.isDefault && (
                        <button
                          onClick={() => handleSetDefault(card.id)}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-bold flex items-center gap-1"
                          title="Set as Default"
                        >
                          <Star size={14} className="fill-current" /> Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-600 hover:text-white text-slate-300 transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                ))}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="h-60 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-primary-500 hover:bg-primary-50/10 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all">
                    <Plus size={28} />
                  </div>
                  <p className="font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600">Add New Card</p>
                </button>
              </div>
            </div>

            {/* Other Methods */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                <Building2 size={20} className="text-primary-600" /> Bank Accounts & Mobile Money
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {otherMethods.map((method) => (
                  <Card key={method.id} className={cn(
                    "p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between group hover:border-primary-500 transition-all",
                    method.isDefault ? "ring-2 ring-primary-500 bg-primary-50/50 dark:bg-primary-950/20" : ""
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-600">
                        {method.type === 'bank' ? <Building2 size={24} /> : <Smartphone size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {method.brand}
                          {method.isDefault && <Badge variant="info" className="text-[10px] h-5">Default</Badge>}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{method.number} • {method.type === 'bank' ? 'Bank Account' : 'Mobile Money'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          className="text-primary-600 font-bold"
                        >
                          Make Default
                        </Button>
                      )}
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={18} className="text-slate-500 hover:text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 hover:border-primary-500 hover:bg-primary-50/10 transition-all group w-full"
                >
                  <Plus size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-primary-600" />
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary-600">Link New Account</span>
                </button>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid sm:grid-cols-3 gap-6 pt-10">
              {[
                { icon: ShieldCheck, title: 'Safe & Secure', desc: 'PCI-DSS compliant systems.' },
                { icon: Lock, title: 'Encrypted', desc: 'Data is protected by 256-bit SSL.' },
                { icon: CheckCircle2, title: 'Verified', desc: 'Partners with Paystack & Flutterwave.' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <item.icon size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AddPaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </CustomerLayout>
  );
};
