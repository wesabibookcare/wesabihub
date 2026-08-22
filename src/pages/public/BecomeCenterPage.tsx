import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import {
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Globe,
  ShieldCheck,
  Clock,
  Package,
  BarChart3,
  Users,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BecomeCenterPage = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-slate-900 py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-600/10 blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center lg:text-left">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge className="bg-primary-500/10 text-primary-400 border-primary-500/20">Partnership Program</Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-white font-display tracking-tight leading-tight">
                Turn your business into a <span className="text-primary-400">WeSabiHub.</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                Increase foot traffic, earn additional revenue, and serve your community by becoming a verified Pick-Up & Drop-Off center.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg">Apply to Join</Button>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg border-slate-700 text-white hover:bg-slate-800">
                  View Requirements
                </Button>
              </div>
            </div>
            <div className="relative">
               <div className="grid grid-cols-2 gap-4">
                  <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm text-white">
                     <p className="text-3xl font-bold mb-1">₦250k+</p>
                     <p className="text-sm text-slate-800">Monthly Potential</p>
                  </Card>
                  <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm text-white">
                     <p className="text-3xl font-bold mb-1">30%+</p>
                     <p className="text-sm text-slate-800">Foot Traffic Increase</p>
                  </Card>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Why partner with WeSabiHub?"
            description="We provide the technology and the customers. You provide the space and the trust."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Earn Extra Income",
                desc: "Earn a reliable commission on every single parcel dropped off or picked up at your retail location."
              },
              {
                icon: Users,
                title: "Drive Foot Traffic",
                desc: "New customers visit your storefront daily to manage packages, leading to organic product discovery."
              },
              {
                icon: Truck,
                title: "Rider Collaboration",
                desc: "Direct integration with verified WeSabiDispatch riders who handle quick last-mile dropoffs."
              },
              {
                icon: ShieldCheck,
                title: "Secure Payment Protection",
                desc: "Every package handover is locked behind unique digital codes and QR-scanned identity verification."
              }
            ].map((benefit, i) => (
              <Card key={i} className="p-8 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-8 text-primary-600">
                    <benefit.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 font-display dark:text-white leading-tight">{benefit.title}</h3>
                  <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed font-medium">{benefit.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Simple 4-Step Onboarding"
            description="Our verification process ensures only the most trusted businesses join our network."
          />

          <div className="grid md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-primary-100 dark:bg-primary-900/20 -translate-y-1/2 z-0" />
            {[
              { title: "Application", desc: "Submit your business details and location." },
              { title: "Verification", desc: "Our team conducts a physical site visit." },
              { title: "Training", desc: "Get trained on our parcel handling app." },
              { title: "Go Live", desc: "Start accepting parcels and earning." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold mx-auto shadow-xl shadow-primary-500/30 border-4 border-white dark:border-slate-950">
                  {i + 1}
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold font-display dark:text-white">{step.title}</h4>
                  <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-12 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[40px]">
            <h2 className="text-3xl font-bold mb-8 font-display dark:text-white">Minimum Requirements</h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {[
                "Registered Business (CAC)",
                "Physical Location in a secure area",
                "Dedicated shelf space for parcels",
                "Smartphone with Internet access",
                "Trustworthy staff members",
                "Clean and accessible storefront"
              ].map((req) => (
                <div key={req} className="flex items-center gap-4 text-slate-900 dark:text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-primary-600" />
                  <span className="font-medium">{req}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <Button size="lg" className="h-14 px-12 rounded-2xl">Apply Now</Button>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};
