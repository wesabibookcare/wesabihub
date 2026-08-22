import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Wallet,
  GraduationCap,
  QrCode,
  TrendingUp,
  Clock,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Star,
  User,
  Check,
  HelpCircle,
  Truck
} from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';

export const BecomeDispatchPartnerPage = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';
  const currencySymbol = settings?.localization?.currencySymbol || '₦';

  // Key Tiers details
  const tiers = [
    { name: 'Tier 1 (Silver)', limit: `${currencySymbol}50,000 Parcel Limit`, commission: '15% Commission', desc: 'Complete basic profile onboarding to unlock local routes.' },
    { name: 'Tier 2 (Gold)', limit: `${currencySymbol}150,000 Parcel Limit`, commission: '12% Commission', desc: 'Reach 20+ successful trips and a 100+ Trust Score.' },
    { name: 'Tier 3 (Platinum)', limit: `${currencySymbol}500,000 Parcel Limit`, commission: '10% Commission', desc: 'Reach 50+ successful trips and a 150+ Trust Score.' },
    { name: 'Tier 4 (Black Diamond)', limit: 'Unlimited Parcel Limit', commission: '8% Commission', desc: 'Reach 100+ successful trips, a 180+ Trust Score, and have no violations.' },
  ];

  return (
    <PublicLayout>
      <div className="bg-white dark:bg-slate-950">
        {/* Premium Hero Section */}
        <section className="pt-32 pb-24 bg-slate-950 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f62b,transparent_60%)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10" />

          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <Badge className="bg-primary-500/10 text-primary-400 border border-primary-500/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                🚀 Now Recruiting Dispatch Partners
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight leading-[1.1] uppercase italic">
                Ride with Trust. <br />
                <span className="text-primary-500">Earn on Your Own Terms.</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Join WeSabiDispatch—{countryName}'s first decentralized, trust-ledger based logistics partner network. Deliver parcel shipments between verified hubs and customers.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/20 group" asChild>
                  <Link to="/register">
                    Apply as Rider <ChevronRight size={20} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg border-slate-800 text-slate-300 hover:bg-slate-900" onClick={() => navigate('/faq')}>
                  Read Dispatch FAQ
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Value Proposition Cards */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader
              badge="Dispatcher Benefits"
              title="Built for Professional Courier Logistics"
              description="Our platform gives you the tech, volumes, and status credentials needed to elevate your courier business."
              centered={true}
            />

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Wallet,
                  title: 'Secure Payout Settlement',
                  desc: `All earnings route securely through WeSabi SafePay Wallet. Get paid immediately upon successful delivery confirmation. Access fast bank cashouts anytime.`
                },
                {
                  icon: Award,
                  title: 'Dynamic Trust Score System',
                  desc: 'A transparent rating engine from 0 to 200 PTS. Maintain exceptional delivery rates to upgrade your trust tiers and unlock higher payout rates.'
                },
                {
                  icon: QrCode,
                  title: 'Dynamic Digital ID Cards',
                  desc: 'Receive an authorized, on-chain verifiable digital courier credential card with QR scanning to establish quick authenticity with hub merchants.'
                },
                {
                  icon: GraduationCap,
                  title: 'WeSabi Training Academy',
                  desc: 'Access mandatory onboarding courses covering safe transit of parcel valuables, professional dispute resolution, and fuel route optimization.'
                },
                {
                  icon: UserCheck,
                  title: 'Equal Opportunity Account Multi-roles',
                  desc: 'Already a verified merchant or hub centre owner on WeSabiHub? Seamlessly activate independent rider capabilities with one unified dashboard.'
                },
                {
                  icon: ShieldCheck,
                  title: 'Inter-Hub Deliveries',
                  desc: 'Focus on optimized transit between static neighborhood collection hubs rather than searching blindly for remote house street addresses.'
                }
              ].map((b, i) => (
                <Card key={i} className="p-8 border-slate-200 dark:border-slate-800 hover:border-primary-500/50 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-slate-900 flex items-center justify-center mb-6 text-primary-600 group-hover:scale-110 transition-transform">
                    <b.icon size={24} />
                  </div>
                  <h3 className="text-xl font-black mb-3 font-display dark:text-white uppercase italic tracking-tight">{b.title}</h3>
                  <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed font-medium">{b.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Tiers Upgrade Framework */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge variant="info">Professional growth</Badge>
              <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white uppercase italic">
                Trust Tier Progression
              </h2>
              <p className="text-lg text-slate-900 font-medium leading-relaxed">
                As your Trust Score grows through exceptional delivery service and academy training, your Tier status upgrades automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tiers.map((t, idx) => (
                <Card key={idx} className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{t.name}</h3>
                    <div className="space-y-1.5 my-4">
                      <div className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-lg inline-block">
                        {t.limit}
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">
                        {t.commission}
                      </div>
                    </div>
                    <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed font-medium">{t.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Transparent Steps section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Badge variant="warning">Onboarding Process</Badge>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase italic leading-tight">
                  How to Become an <br />
                  <span className="text-primary-600">Active Dispatch Partner</span>
                </h2>
                <p className="text-slate-800 dark:text-slate-300 font-medium">
                  We maintain strict, zero-trust security. You must complete every verification checkpoint step to activate dispatching routing.
                </p>

                <div className="space-y-6">
                  {[
                    { title: '1. Register & Submit Application', desc: 'Create your account and apply for the Dispatch Rider role.' },
                    { title: '2. Complete Core KYC Checklist', desc: 'Provide your vehicle documents, emergency contacts, guarantors declaration, national ID, and Class-A riders license.' },
                    { title: '3. Verification & Academy Training', desc: 'Our regional operations managers review your files. Take mandatory courses inside the Training Academy.' },
                    { title: '4. Sign Partner Agreement', desc: 'E-sign the latest WeSabiDispatch Partner Agreement v2.4 to generate your digital ID card with secure field QR code verification.' }
                  ].map((step, sIdx) => (
                    <div key={sIdx} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white font-black text-xs flex items-center justify-center">
                        {sIdx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h4>
                        <p className="text-xs text-slate-900 font-medium mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirement Card */}
              <Card className="p-10 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                <h3 className="text-2xl font-black mb-6 font-display dark:text-white uppercase italic tracking-tight">Onboarding Credentials Checklist</h3>

                <div className="space-y-4">
                  {[
                    'Government-issued National Identity Number (NIN)',
                    'Valid Rider Driver Licence (Class A Minimum)',
                    'Vehicle Roadworthiness & Ownership Documents',
                    'Signed Guarantor Declaration Verification Form',
                    'Active Commercial Bank Settlement Account details',
                    'Smartphone with GPS and scanning camera functionality',
                    'Zero operational violations record'
                  ].map((req, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <span className="text-xs text-slate-900 dark:text-slate-300 font-bold">{req}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Button className="w-full h-14 rounded-2xl font-bold" asChild>
                    <Link to="/register">Create Your Rider Account Now</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Interactive CTA */}
        <section className="py-20 pb-32">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-slate-950 text-white rounded-[2.5rem] p-12 lg:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,#3b82f62b,transparent_70%)]" />
              <div className="relative z-10 lg:flex items-center justify-between gap-8">
                <div className="max-w-2xl space-y-4">
                  <h2 className="text-3xl lg:text-5xl font-black font-display tracking-tight uppercase italic leading-tight">
                    Start Your Dispatch Journey Today
                  </h2>
                  <p className="text-lg text-slate-300 font-medium">
                    Enjoy transparent commission rates, secure payouts with SafePay holding, dynamic Trust Score ranking, and dynamic QR credential verify page.
                  </p>
                </div>
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-white text-slate-900 hover:bg-slate-100 shrink-0" asChild>
                  <Link to="/register">Register & Apply</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
