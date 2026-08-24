import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import {
  User,
  ShoppingBag,
  Home,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  Code,
  QrCode,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksPage = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-slate-950 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f625,transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <Badge className="bg-primary-500/10 text-primary-400 border border-primary-500/20 mb-6 uppercase tracking-widest">ECOSYSTEM DIAGRAM</Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight leading-[1.1] mb-8 uppercase italic">
            A Fully Integrated <br />
            <span className="text-primary-500">Logistics Workflow.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            OmorfiHub connects merchants, physical neighborhood hubs, independent dispatch riders, and enterprise API systems through a unified secure payment protection ledger.
          </p>
        </div>
      </section>

      {/* Multi-Stakeholder Ecosystem Participants */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            badge="The Six Pillars"
            title="Ecosystem Roles & Workflow Integration"
            description="Our platform coordinates multiple verified participants transparently to eliminate delivery failure and payment fraud."
            centered={true}
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShoppingBag,
                title: '1. The Merchant',
                desc: 'Uploads store inventories, manages customer orders, registers bulk parcel shipments, and chooses between OmorfiHubDispatch, corporate logistics, or self-delivery methods.'
              },
              {
                icon: Code,
                title: '2. The API Partner',
                desc: 'Integrates our localized logistics directly into online checkout engines. Instantly automates tracking creation, schedules hub pickups, and receives live webhook notifications.'
              },
              {
                icon: User,
                title: '3. The Customer',
                desc: 'Registers secure peer-to-peer parcel shipping, makes payments protected by secure holdings with Flutterwave or Paystack, and selects convenient neighborhood collection locker spots.'
              },
              {
                icon: Home,
                title: '4. The Hub Centre',
                desc: 'Local merchant stores act as verified secure collection locks. Staff scan inbound parcels, verify dispatch rider credentials, and hold items safely.'
              },
              {
                icon: Truck,
                title: '5. The Dispatch Rider',
                desc: 'Onboards via verified KYC, completes training classes, accepts optimized transit routes, and picks up/drops off bundles at hubs using secure QR codes.'
              },
              {
                icon: Users,
                title: '6. The Recipient',
                desc: 'Receives automated real-time SMS tracking updates and secure release PINs. Handovers require showing the unique PIN to unlock cash payouts.'
              }
            ].map((p, i) => (
              <Card key={i} className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-slate-950/40 flex items-center justify-center text-primary-600 mb-6">
                    <p.icon size={24} />
                  </div>
                  <h3 className="text-lg font-black dark:text-white mb-3 uppercase tracking-tight">{p.title}</h3>
                  <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed font-medium">{p.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Parcel Custody Chain Diagram */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge variant="success">End-to-End Custody Chain</Badge>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase italic leading-tight">
                Secure Payment <br />
                <span className="text-primary-600">Verification Ledger</span>
              </h2>
              <p className="text-lg text-slate-800 dark:text-slate-300 font-medium">
                Our secure payment flow locks down parcels from creation to pickup. Every handover event requires cryptographic authorization to protect the value of your goods.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Payment Lock Activation',
                    desc: 'When a merchant or API partner books a delivery, shipping fees and parcel payouts are securely held by Flutterwave or Paystack.'
                  },
                  {
                    icon: QrCode,
                    title: 'On-Field Rider ID Scans',
                    desc: 'Before handing over parcels, hub owners scan the dispatch rider\'s dynamic digital ID to verify their active on-field credentials.'
                  },
                  {
                    icon: Smartphone,
                    title: 'Code-Locked Collection',
                    desc: 'Recipients receive a single-use pickup PIN on their smartphone. Sharing this PIN with the destination hub releases payouts instantly.'
                  }
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-primary-600">
                      <f.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{f.title}</h4>
                      <p className="text-xs text-slate-900 font-medium mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Tracking Flow Diagram */}
            <div className="relative">
              <Card className="p-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] relative z-10">
                <h3 className="text-xl font-black mb-8 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                  <Smartphone size={18} className="text-primary-600" />
                  Ecosystem Parcel Timeline
                </h3>

                <div className="space-y-8 relative">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800" />
                  {[
                    { role: 'API / Merchant', label: 'Parcel Created & Payment Held', time: 'Phase 1: Initial Booking', icon: Code },
                    { role: 'Origin Hub Center', label: 'Package Drop-off & QR Scan Check', time: 'Phase 2: Center Intake', icon: Home },
                    { role: 'Dispatch Rider', label: 'Field Verification & Courier Transit', time: 'Phase 3: Active Transit', icon: Truck },
                    { role: 'Destination Center', label: 'Inbound Scanning & Locker Storage', time: 'Phase 4: Hub Arrival', icon: Home },
                    { role: 'Recipient Release', label: 'Secure PIN Entry & Payment Payout', time: 'Phase 5: Delivery Settled', icon: CheckCircle2 }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-slate-950 text-primary-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                        <s.icon size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-primary-600 tracking-wider bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded">
                            {s.role}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-1">{s.label}</h4>
                        <p className="text-xs text-slate-800 font-semibold mt-0.5">{s.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="absolute -inset-10 bg-primary-600/5 blur-3xl rounded-full -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-8">
            <Zap size={32} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-black dark:text-white font-display mb-6 uppercase italic tracking-tight">Ready to leverage OmorfiHub?</h2>
          <p className="text-lg text-slate-900 mb-10 font-medium">Join our growing ecosystem as a customer, merchant, hub, or dispatcher today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold" asChild>
              <Link to="/find-center">Find a Center</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
