import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  Calculator,
  Info,
  ArrowRight,
  CheckCircle2,
  Package,
  MapPin,
  Scaling,
  Globe
} from 'lucide-react';

import { useSettings } from '@/src/context/SettingsContext';

export const PricingPage = () => {
  const { settings } = useSettings();

  if (!settings) return null;

  const countryName = settings.localization?.countryName || settings.defaultCountry || 'Nigeria';
  const currency = settings.localization?.currencySymbol || '₦';

  return (
    <PublicLayout>
      <section className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            badge="Pricing Transparency"
            title="Fair, Dynamic, and Competitive."
            description="Our pricing model is designed to be fair for customers while ensuring sustainability for hubs and logistics partners."
          />

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Card className="p-10 border-primary-100 dark:border-primary-900/30 bg-primary-50/30 dark:bg-primary-900/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold font-display dark:text-white">Dynamic Calculation</h3>
                    <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                      Shipping fees are not fixed. They are calculated in real-time based on a set of intelligent business rules:
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Parcel Weight",
                        "Dimensions",
                        "Service Level",
                        "Delivery Distance",
                        "Destination Risk",
                        "Platform Policies"
                      ].map(rule => (
                        <li key={rule} className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-primary-600" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="p-6 border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold mb-2 dark:text-white">No Hidden Fees</h4>
                  <p className="text-sm text-slate-900">What you see at checkout is exactly what you pay. No extra hub charges.</p>
                </Card>
                <Card className="p-6 border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold mb-2 dark:text-white">Volume Discounts</h4>
                  <p className="text-sm text-slate-900">Merchants sending bulk parcels enjoy significantly lower platform commissions.</p>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold font-display dark:text-white mb-6">Price Estimates (Example)</h3>
              {[
                { label: 'Small Parcel (0-2kg)', price: `${currency}1,500 - ${currency}2,500`, icon: Package },
                { label: 'Medium Parcel (2-5kg)', price: `${currency}3,000 - ${currency}5,000`, icon: Scaling },
                { label: 'Large Parcel (5kg+)', price: 'Custom Quote', icon: Scaling },
              ].map((item, i) => (
                <Card key={i} className="p-6 flex items-center justify-between hover:border-primary-500 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold dark:text-white">{item.label}</span>
                  </div>
                  <span className="text-primary-600 font-bold">{item.price}</span>
                </Card>
              ))}
              <div className="pt-6">
                <Card variant="flat" className="p-6 bg-slate-900 text-white flex items-center gap-4">
                  <Info className="w-6 h-6 text-primary-400 shrink-0" />
                  <p className="text-sm text-slate-800 italic leading-relaxed">
                    Estimates are based on standard deliveries. Intra-state and inter-state fees vary by distance and logistics partner.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Section */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <Globe className="w-16 h-16 text-primary-600 mx-auto animate-pulse" />
            <h2 className="text-4xl font-bold font-display dark:text-white">Designed for the World.</h2>
            <p className="text-xl text-slate-800 dark:text-slate-300 leading-relaxed">
              OmorfiHub is a global infrastructure. While we are active in {countryName}, our currency and pricing engine supports multi-country deployment with local tax configurations.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
