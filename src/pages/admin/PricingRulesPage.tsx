import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Calculator,
  Save,
  History,
  Globe,
  Truck,
  Zap,
  Package,
  ShieldCheck,
  Percent,
  TrendingUp,
  Sliders,
  Check,
  Trash2
} from 'lucide-react';
import { BusinessRulesLayout } from '../../layouts/BusinessRulesLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { toast } from 'sonner';

export interface HubVolumeTier {
  id: string;
  minParcels: number;
  maxParcels: number; // e.g. 50, 200, or 999999 for infinity (500+)
  hubPercentage: number;
  omorfiPercentage: number;
}

export const PricingRulesPage = () => {
  const [activeTab, setActiveTab] = useState<'TIERS' | 'LOGISTICS_API' | 'SAFEPAY' | 'BASE_PRICING' | 'SEND_OMORFI'>('TIERS');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hub Revenue Volume Split Tiers
  const [tiers, setTiers] = useState<HubVolumeTier[]>([
    { id: '1', minParcels: 1, maxParcels: 50, hubPercentage: 50, omorfiPercentage: 50 },
    { id: '2', minParcels: 51, maxParcels: 200, hubPercentage: 55, omorfiPercentage: 45 },
    { id: '3', minParcels: 201, maxParcels: 99999, hubPercentage: 60, omorfiPercentage: 40 },
  ]);

  // Logistics API Rate Markup
  const [logisticsMarkup, setLogisticsMarkup] = useState({
    markupPercentage: 10,
    enableMarkup: true,
    minMarkupAmount: 200,
  });

  // SafePay Charges
  const [safePayConfig, setSafePayConfig] = useState({
    buyerFeePercent: 1.5,
    sellerFeePercent: 1.5,
    minEscrowFee: 500,
    maxEscrowFee: 15000,
  });

  // SendOmorfi Payout Multipliers
  const [sendOmorfiRates, setSendOmorfiRates] = useState({
    onFootMultiplier: 1.0,
    bicycleMultiplier: 1.25,
    otherVehiclesMultiplier: 1.6,
  });

  // Base Pricing Configuration
  const [basePricing, setBasePricing] = useState({
    minShippingFee: 500,
    baseWeightKg: 1.0,
    hubBaseRatePerKg: 300,
    weightMultiplier: 1.5,
    oversizedFee: 1000,
    fragileFee: 500,
    weekendSurchargePercent: 15,
  });

  useEffect(() => {
    const fetchFinancialConfig = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'systemSettings', 'financialRules');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.tiers) setTiers(data.tiers);
          if (data.logisticsMarkup) setLogisticsMarkup(data.logisticsMarkup);
          if (data.safePayConfig) setSafePayConfig(data.safePayConfig);
          if (data.basePricing) setBasePricing(data.basePricing);
          if (data.sendOmorfiRates) setSendOmorfiRates(data.sendOmorfiRates);
        }
      } catch (err) {
        console.error('Failed to load financial rules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancialConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'systemSettings', 'financialRules'), {
        tiers,
        logisticsMarkup,
        safePayConfig,
        basePricing,
        sendOmorfiRates,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast.success('Financial & Pricing rules updated successfully!');
    } catch (err) {
      console.error('Failed to save rules:', err);
      toast.error('Failed to save configuration rules');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? lastTier.maxParcels + 1 : 1;
    const newTier: HubVolumeTier = {
      id: Date.now().toString(),
      minParcels: newMin,
      maxParcels: newMin + 150,
      hubPercentage: 65,
      omorfiPercentage: 35,
    };
    setTiers([...tiers, newTier]);
  };

  const handleRemoveTier = (id: string) => {
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleUpdateTier = (id: string, field: keyof HubVolumeTier, value: number) => {
    setTiers(tiers.map(t => {
      if (t.id === id) {
        const updated = { ...t, [field]: value };
        if (field === 'hubPercentage') {
          updated.omorfiPercentage = Math.max(0, 100 - value);
        } else if (field === 'omorfiPercentage') {
          updated.hubPercentage = Math.max(0, 100 - value);
        }
        return updated;
      }
      return t;
    }));
  };

  return (
    <BusinessRulesLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px] mb-2">Money & Financial Management</p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Financial & Pricing Engine</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Configure hub volume revenue splits, logistics API rate markups, SafePay escrow charges, and base parcel pricing.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button
               onClick={handleSaveConfig}
               disabled={saving}
               className="rounded-xl font-bold shadow-lg shadow-primary-600/20 bg-primary-600 hover:bg-primary-700 text-white"
             >
               <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Financial Rules'}
             </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit gap-1">
          <button
            onClick={() => setActiveTab('TIERS')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeTab === 'TIERS' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
            )}
          >
            <TrendingUp size={16} /> Hub Revenue Split Tiers
          </button>
          <button
            onClick={() => setActiveTab('LOGISTICS_API')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeTab === 'LOGISTICS_API' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
            )}
          >
            <Truck size={16} /> Logistics API Markup
          </button>
          <button
            onClick={() => setActiveTab('SAFEPAY')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeTab === 'SAFEPAY' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
            )}
          >
            <ShieldCheck size={16} /> SafePay Charges
          </button>
          <button
            onClick={() => setActiveTab('BASE_PRICING')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeTab === 'BASE_PRICING' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
            )}
          >
            <DollarSign size={16} /> Base Shipping Rates
          </button>
          <button
            onClick={() => setActiveTab('SEND_OMORFI')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2",
              activeTab === 'SEND_OMORFI' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400"
            )}
          >
            <Package size={16} /> SendOmorfi Payouts
          </button>
        </div>

        {/* TAB 1: Hub Volume Tiers */}
        {activeTab === 'TIERS' && (
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Hub Volume Split Tiers</h3>
                <p className="text-xs font-medium text-slate-500">Set automatic revenue sharing split based on monthly parcel volume processed by hubs.</p>
              </div>
              <Button onClick={handleAddTier} variant="outline" className="rounded-xl font-bold text-xs">
                <Plus size={16} className="mr-1" /> Add Volume Tier
              </Button>
            </div>

            <div className="space-y-4">
              {tiers.map((tier, idx) => (
                <div key={tier.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Tier #{idx + 1}</span>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {tier.minParcels} – {tier.maxParcels >= 99999 ? '∞ (Unlimited)' : tier.maxParcels} Parcels
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Min Parcels</label>
                    <input
                      type="number"
                      value={tier.minParcels}
                      onChange={(e) => handleUpdateTier(tier.id, 'minParcels', parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Max Parcels</label>
                    <input
                      type="number"
                      value={tier.maxParcels}
                      onChange={(e) => handleUpdateTier(tier.id, 'maxParcels', parseInt(e.target.value) || 99999)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hub / Omorfi Split (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tier.hubPercentage}
                        onChange={(e) => handleUpdateTier(tier.id, 'hubPercentage', parseFloat(e.target.value) || 0)}
                        className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-600"
                      />
                      <span className="text-xs font-bold text-slate-400">% Hub / {tier.omorfiPercentage}% Omorfi</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleRemoveTier(tier.id)}
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 2: Logistics API Rate Markup */}
        {activeTab === 'LOGISTICS_API' && (
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Logistics API Automatic Rate Markup</h3>
              <p className="text-xs font-medium text-slate-500">Automatically add your platform profit margin percentage to rates returned by external logistics API providers (e.g. DHL, GIG, Fez) without user notice.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Markup Percentage (%)</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Percent size={18} className="text-slate-400" />
                  <input
                    type="number"
                    value={logisticsMarkup.markupPercentage}
                    onChange={(e) => setLogisticsMarkup({ ...logisticsMarkup, markupPercentage: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent border-none font-black text-lg w-full focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-400">% added to rate</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Markup Amount (₦)</label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-400">₦</span>
                  <input
                    type="number"
                    value={logisticsMarkup.minMarkupAmount}
                    onChange={(e) => setLogisticsMarkup({ ...logisticsMarkup, minMarkupAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent border-none font-black text-lg w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Example Calculation: If an external logistics partner API returns a rate of ₦2,000, with a {logisticsMarkup.markupPercentage}% markup, the final displayed rate to the user will be ₦{(2000 * (1 + logisticsMarkup.markupPercentage / 100)).toLocaleString()}.
              </p>
            </div>
          </Card>
        )}

        {/* TAB 3: SafePay Charges */}
        {activeTab === 'SAFEPAY' && (
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">SafePay Escrow Transaction Fees</h3>
              <p className="text-xs font-medium text-slate-500">Configure fee percentages and limits for SafePay buyer-seller escrow transactions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Buyer Escrow Fee (%)</label>
                <input
                  type="number"
                  value={safePayConfig.buyerFeePercent}
                  onChange={(e) => setSafePayConfig({ ...safePayConfig, buyerFeePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Seller Escrow Fee (%)</label>
                <input
                  type="number"
                  value={safePayConfig.sellerFeePercent}
                  onChange={(e) => setSafePayConfig({ ...safePayConfig, sellerFeePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Escrow Fee (₦)</label>
                <input
                  type="number"
                  value={safePayConfig.minEscrowFee}
                  onChange={(e) => setSafePayConfig({ ...safePayConfig, minEscrowFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Maximum Cap Fee (₦)</label>
                <input
                  type="number"
                  value={safePayConfig.maxEscrowFee}
                  onChange={(e) => setSafePayConfig({ ...safePayConfig, maxEscrowFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: Base Pricing */}
        {activeTab === 'BASE_PRICING' && (
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Base Parcel Shipping Rates</h3>
              <p className="text-xs font-medium text-slate-500">Configure global base shipping rates, weight adders, and special parcel surcharges.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Shipping Fee (₦)</label>
                <input
                  type="number"
                  value={basePricing.minShippingFee}
                  onChange={(e) => setBasePricing({ ...basePricing, minShippingFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-primary-600 dark:text-primary-400 font-bold">Hub Center Rate per Kg (₦/kg)</label>
                <input
                  type="number"
                  value={basePricing.hubBaseRatePerKg || 300}
                  onChange={(e) => setBasePricing({ ...basePricing, hubBaseRatePerKg: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-primary-500 rounded-xl p-3 font-black text-base text-primary-600"
                />
                <p className="text-[10px] text-slate-500">Rate charged per kilogram for parcel processing across Hub Centers.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Oversized Parcel Fee (₦)</label>
                <input
                  type="number"
                  value={basePricing.oversizedFee}
                  onChange={(e) => setBasePricing({ ...basePricing, oversizedFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fragile Handling Fee (₦)</label>
                <input
                  type="number"
                  value={basePricing.fragileFee}
                  onChange={(e) => setBasePricing({ ...basePricing, fragileFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
              </div>
            </div>
          </Card>
        )}

        {/* TAB 5: SendOmorfi Payout Multipliers */}
        {activeTab === 'SEND_OMORFI' && (
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 space-y-6">
            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">SendOmorfi Transit Mode Payout Rules</h3>
              <p className="text-xs font-medium text-slate-500">Set payout rates and multipliers for SendOmorfi delivery partners based on transit mode ("Other Vehicles" gets higher pay than "Bicycle" and "On foot").</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">On Foot Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={sendOmorfiRates.onFootMultiplier}
                  onChange={(e) => setSendOmorfiRates({ ...sendOmorfiRates, onFootMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
                <p className="text-[10px] text-slate-500">Base rate payout multiplier for walking deliveries.</p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Bicycle Multiplier</label>
                <input
                  type="number"
                  step="0.05"
                  value={sendOmorfiRates.bicycleMultiplier}
                  onChange={(e) => setSendOmorfiRates({ ...sendOmorfiRates, bicycleMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-base"
                />
                <p className="text-[10px] text-slate-500">Rate multiplier for cycling deliveries.</p>
              </div>

              <div className="space-y-2 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800">
                <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Other Vehicles Multiplier (Higher Pay)</label>
                <input
                  type="number"
                  step="0.05"
                  value={sendOmorfiRates.otherVehiclesMultiplier}
                  onChange={(e) => setSendOmorfiRates({ ...sendOmorfiRates, otherVehiclesMultiplier: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3 font-black text-base text-emerald-600"
                />
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Higher pay rate for motorcycle, car, and van couriers.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </BusinessRulesLayout>
  );
};
