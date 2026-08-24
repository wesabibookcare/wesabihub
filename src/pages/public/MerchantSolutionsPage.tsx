import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  ShoppingBag,
  Globe,
  BarChart3,
  Smartphone,
  ShieldCheck,
  Code,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useSettings } from '@/src/context/SettingsContext';

export const MerchantSolutionsPage = () => {
  const { settings } = useSettings();

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/10 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8">
            <Badge className="bg-primary-500/10 text-primary-400 border-primary-500/20">For E-commerce & Retail</Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-display tracking-tight leading-[1.1]">
              Scale Your Sales with <br />
              <span className="text-primary-400">Nationwide Pickup.</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Offer your customers convenient pickup at over 1,000+ verified neighborhood hubs across {countryName}. Eliminate missed deliveries and build lasting customer trust.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="h-16 px-10 rounded-2xl text-lg" asChild>
                <Link to="/register">Partner with Us</Link>
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg border-slate-700 text-white hover:bg-slate-800" asChild>
                <Link to="/api">API Documentation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            badge="Why OmorfiHub"
            title="The Smart Choice for Modern Merchants"
            description="Traditional door-to-door delivery is expensive and prone to failure. OmorfiHub provides a more reliable alternative."
          />

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: '99% Delivery Rate',
                desc: 'Say goodbye to "recipient not reachable" calls. Parcels stay secure at hubs until recipients are ready.'
              },
              {
                icon: ShoppingBag,
                title: 'Lower Shipping Costs',
                desc: 'Consolidate deliveries to single hubs and save up to 40% on logistics costs compared to home delivery.'
              },
              {
                icon: ShieldCheck,
                title: 'Payment Protection',
                desc: 'Use our SafePay system to ensure you get paid as soon as the customer picks up their item.'
              }
            ].map((benefit, i) => (
              <Card key={i} className="p-10 border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-8 text-primary-600">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-display dark:text-white">{benefit.title}</h3>
                <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{benefit.desc}</p>
                {benefit.title === 'Payment Protection' && (
                  <Link to="/safepay" className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:underline mt-4">
                    Learn how SafePay works <ArrowRight size={14} />
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                   Tailored Solutions for <br />
                   <span className="text-primary-600">Every Business Size.</span>
                </h2>

                <div className="space-y-8">
                   {[
                      {
                         title: 'Small Businesses & Social Sellers',
                         desc: 'Use our web portal to book shipments manually and give your Instagram or WhatsApp customers professional pickup options.'
                      },
                      {
                         title: 'OmorfiHubDispatch & Courier Fulfillment',
                         desc: 'Instantly assign bulk shipments to verified independent dispatch riders with live tracking and secure SafePay payment protections.'
                      },
                      {
                         title: 'E-commerce Platforms & APIs',
                         desc: 'Integrate our API directly into your checkout flow. Show a map of nearest hubs and automate tracking for your users.'
                      },
                      {
                         title: 'Enterprise & Retailers',
                         desc: 'Custom logistics dashboards, dedicated account managers, and bulk shipping tools for high-volume operations.'
                      }
                   ].map((item, i) => (
                      <div key={i} className="flex gap-6 group">
                         <div className="shrink-0 w-1.5 h-12 bg-primary-200 dark:bg-primary-800 group-hover:bg-primary-600 transition-colors rounded-full" />
                         <div className="space-y-2">
                            <h4 className="text-xl font-bold dark:text-white">{item.title}</h4>
                            <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="relative">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                   <Card className="p-8 space-y-4">
                      <BarChart3 className="w-10 h-10 text-blue-500" />
                      <h4 className="font-bold dark:text-white">Growth Analytics</h4>
                      <p className="text-sm text-slate-900">Track delivery performance across all regions.</p>
                   </Card>
                   <Card className="p-8 space-y-4 mt-12">
                      <Globe className="w-10 h-10 text-emerald-500" />
                      <h4 className="font-bold dark:text-white">Region Heatmap</h4>
                      <p className="text-sm text-slate-900">Identify your most active customer locations.</p>
                   </Card>
                   <Card className="p-8 space-y-4">
                      <Code className="w-10 h-10 text-amber-500" />
                      <h4 className="font-bold dark:text-white">API Health</h4>
                      <p className="text-sm text-slate-900">Monitor your integration performance 24/7.</p>
                   </Card>
                   <Card className="p-8 space-y-4 mt-12">
                      <Smartphone className="w-10 h-10 text-purple-500" />
                      <h4 className="font-bold dark:text-white">Mobile Tracking</h4>
                      <p className="text-sm text-slate-900">Real-time alerts for you and your customers.</p>
                   </Card>
                </div>
                <div className="absolute -inset-10 bg-primary-500/5 blur-3xl rounded-full -z-10" />
             </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="p-16 bg-slate-900 border-slate-800 shadow-2xl rounded-[48px] overflow-hidden relative">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-600/10 blur-[120px]" />
             <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="space-y-8">
                   <h2 className="text-4xl md:text-5xl font-bold text-white font-display leading-tight">
                      Ready to integrate <br />
                      <span className="text-primary-400">OmorfiHub?</span>
                   </h2>
                   <p className="text-xl text-slate-800 leading-relaxed">
                      Our API is built by developers, for developers. Get up and running in minutes with our comprehensive SDKs and documentation.
                   </p>
                   <div className="space-y-4">
                      {['JSON REST API', 'Webhook support', 'Pre-built SDKs', 'Sandbox Environment'].map(f => (
                         <div key={f} className="flex items-center gap-3 text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-primary-500" />
                            <span>{f}</span>
                         </div>
                      ))}
                   </div>
                   <Button size="lg" className="h-14 px-8 rounded-xl" asChild>
                      <Link to="/api">Get API Access</Link>
                   </Button>
                </div>
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 font-mono text-sm shadow-2xl">
                   <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
                      <div className="flex gap-1.5">
                         <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                         <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                         <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                      </div>
                      <span className="text-slate-900 text-xs">Merchant Integration</span>
                   </div>
                   <pre className="text-primary-400 overflow-x-auto">
                      <code>{`// Initialize OmorfiHub
const hub = new OmorfiHub({
  apiKey: 'wsh_live_...'
});

// Create a pickup order
const order = await hub.orders.create({
  merchant_id: 'store_001',
  destination_hub: 'HUB-ABJ-022',
  package: {
    weight: '1.2kg',
    description: 'Electronics'
  }
});`}</code>
                   </pre>
                </div>
             </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};
