import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  Truck,
  MapPin,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Zap
} from 'lucide-react';

import { useSettings } from '@/src/context/SettingsContext';

export const LogisticsPartnerPage = () => {
  const { settings } = useSettings();

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-24 bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-8">
            <Badge className="bg-primary-500/20 text-primary-300 border-primary-500/30">For Fleet Owners & Couriers</Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-display tracking-tight leading-[1.1]">
              Move More. <br />
              <span className="text-primary-400">Earn More.</span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Join {countryName}'s fastest-growing logistics infrastructure. Focus on moving parcels between verified hubs while we handle the technology, security, and customer demand.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="h-16 px-10 rounded-2xl text-lg bg-white text-primary-900 hover:bg-slate-100">Become a Partner</Button>
              <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg border-white/20 text-white hover:bg-white/10">
                View Network Map
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            badge="The Opportunity"
            title="Maximize Your Fleet Efficiency"
            description="OmorfiHub provides the volume and the route density you need to keep your vehicles moving profitably."
          />

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Consistent Volume',
                desc: `Access thousands of daily parcel movements between our verified neighborhood centers across ${countryName}.`
              },
              {
                icon: MapPin,
                title: 'Optimized Routes',
                desc: 'Move goods between fixed hubs instead of searching for individual house addresses. Save time and fuel.'
              },
              {
                icon: ShieldCheck,
                title: 'Secure Payments',
                desc: 'Get paid promptly through our automated billing system. No more chasing payments for individual deliveries.'
              }
            ].map((benefit, i) => (
              <Card key={i} className="p-10 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-8 text-primary-600">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-display dark:text-white">{benefit.title}</h3>
                <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{benefit.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                 <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                    How it works for <br />
                    <span className="text-primary-600">Logistics Partners.</span>
                 </h2>

                 <div className="space-y-10">
                    {[
                       {
                          icon: Smartphone,
                          title: 'Accept Assignments',
                          desc: 'Receive bulk parcel movement requests from hub A to hub B directly on your partner dashboard.'
                       },
                       {
                          icon: Package,
                          title: 'Bulk Pickup',
                          desc: 'Collect multiple parcels from a single verified hub center. No more single-item pickups.'
                       },
                       {
                          icon: Truck,
                          title: 'Inter-Hub Transport',
                          desc: 'Move the goods through our optimized inter-state or intra-city hub routes.'
                       },
                       {
                          icon: CheckCircle2,
                          title: 'Hub Delivery',
                          desc: 'Drop off the batch at the destination hub and get instant verification through QR scanning.'
                       }
                    ].map((step, i) => (
                       <div key={i} className="flex gap-6">
                          <div className="shrink-0 w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-primary-600 font-bold border border-slate-100 dark:border-slate-800">
                             {i + 1}
                          </div>
                          <div className="space-y-2">
                             <h4 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                <step.icon className="w-5 h-5 text-primary-500" />
                                {step.title}
                             </h4>
                             <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{step.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="relative">
                 <Card className="p-12 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[48px] relative z-10">
                    <h3 className="text-2xl font-bold mb-8 font-display dark:text-white">Partner Requirements</h3>
                    <div className="space-y-6">
                       {[
                          "Registered Logistics/Courier Company",
                          "Verified Vehicle Fleet (Bikes, Vans, or Trucks)",
                          "Goods in Transit (GIT) Insurance",
                          "Smartphone-equipped drivers",
                          "Ability to provide real-time GPS tracking",
                          "Clean operational track record"
                       ].map(r => (
                          <div key={r} className="flex items-center gap-4 text-slate-900 dark:text-slate-300">
                             <div className="w-6 h-6 rounded-full bg-success-100 text-success-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                             </div>
                             <span className="font-medium">{r}</span>
                          </div>
                       ))}
                    </div>
                    <div className="mt-12">
                       <Button className="w-full h-16 rounded-2xl text-lg">Submit Partnership Inquiry</Button>
                    </div>
                 </Card>
                 <div className="absolute -inset-10 bg-primary-600/5 blur-3xl rounded-full -z-10" />
              </div>
           </div>
        </div>
      </section>

      {/* States Covered */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <SectionHeader
            title="Nationwide Coverage"
            description={`Our network spans all major regions and cities in ${countryName}. We move parcels between any two points in our network.`}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {['Lagos', 'Abuja', 'Kano', 'Port Harcourt', 'Ibadan', 'Enugu', 'Benin City', 'Kaduna', 'Jos', 'Uyo', 'Warri', 'Abeokuta'].map(city => (
                <div key={city} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                   {city}
                </div>
             ))}
          </div>
          <div className="mt-12">
             <p className="text-slate-900">And over 100+ other major towns and local governments.</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
