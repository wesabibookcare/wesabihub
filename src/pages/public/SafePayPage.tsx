import React from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@/src/context/SettingsContext';
import {
  ShieldCheck,
  Video,
  PackageCheck,
  Truck,
  PackageOpen,
  ThumbsUp,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  User,
  FileText,
  Wallet,
  Building2,
} from 'lucide-react';

const flowSteps = [
  { icon: ShoppingBag, title: 'Buyer & seller agree', desc: 'A buyer and seller agree on an item and price, usually right inside WeSabiChat.' },
  { icon: Wallet, title: 'Buyer pays via SafePay', desc: 'The buyer pays through our SafePay checkout, powered by Flutterwave.' },
  { icon: Lock, title: 'Funds are held by Flutterwave', desc: 'Flutterwave secures the payment. WeSabiHub never touches or holds the money itself.' },
  { icon: Video, title: 'Seller records preparation', desc: 'Before packing, the seller records a short in-app video testing and preparing the item.' },
  { icon: PackageCheck, title: 'Seller packs & dispatches', desc: 'The item is sealed and sent through WeSabiHub — by hub drop-off or direct dispatch.' },
  { icon: Truck, title: 'Parcel is delivered', desc: 'The buyer receives the parcel, fully tracked from pickup to delivery.' },
  { icon: PackageOpen, title: 'Buyer records unboxing', desc: 'The buyer records themselves unboxing and inspecting the item, right in WeSabiChat.' },
  { icon: ThumbsUp, title: 'Buyer accepts or disputes', desc: 'If all is well, the buyer releases payment. If there\u2019s a problem, they open a dispute instead.' },
];

const disputeReasons = [
  'The item never arrived',
  'The item arrived damaged',
  'The wrong item was sent',
  'Something is missing from the order',
  'The item is significantly different from what was agreed',
  'Other genuine problems with the transaction',
];

export const SafePayPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isSafePayEnabled = settings?.featureFlags?.enableSafePay !== false;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b82f625,transparent_60%)]" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <Badge className="bg-primary-500/10 text-primary-400 border border-primary-500/20 mb-6 uppercase tracking-widest gap-2">
            <ShieldCheck size={14} /> {isSafePayEnabled ? 'Protected Transactions' : 'Coming Soon'}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-white font-display tracking-tight leading-[1.1] mb-8">
            Buy and sell <span className="text-primary-500">without the worry.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            SafePay is WeSabiHub's protected payment workflow for buyers and sellers. Your money stays secure with our licensed payment partner until you confirm the item is exactly what you agreed to.
          </p>
          {!isSafePayEnabled && (
            <p className="text-amber-400 font-bold mt-6 max-w-xl mx-auto">
              SafePay isn't active on WeSabiHub just yet — we're putting the finishing touches on it. Here's how it will work once it launches.
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button size="lg" onClick={() => navigate('/register')}>Get Started <ArrowRight size={18} className="ml-2" /></Button>
            <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-900" onClick={() => navigate('/how-it-works')}>See Full Ecosystem</Button>
          </div>
        </div>
      </section>

      {/* Financial separation callout */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/10 text-center space-y-3">
            <Lock className="mx-auto text-primary-600" size={32} />
            <h2 className="text-xl font-bold dark:text-white font-display">WeSabiHub never holds your money</h2>
            <p className="text-slate-800 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              SafePay payments are processed and held by <strong>Flutterwave</strong>, our licensed payment partner \u2014 not by WeSabiHub. WeSabiHub manages the rules of the transaction: parcel tracking, video evidence, inspection windows, and dispute resolution. The actual movement of funds is always handled by Flutterwave.
            </p>
          </Card>
        </div>
      </section>

      {/* Flow */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            badge="How It Works"
            title="One protected transaction, start to finish"
            description="Every SafePay transaction follows the same clear, evidence-backed process for both sides."
            centered={true}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {flowSteps.map((step, i) => (
              <Card key={step.title} className="p-6 border-slate-200 dark:border-slate-800 relative">
                <span className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-slate-800">{i + 1}</span>
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 mb-4">
                  <step.icon size={22} />
                </div>
                <h3 className="font-bold dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Buyers / For Sellers */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <Card className="p-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
              <User size={26} />
            </div>
            <h3 className="text-2xl font-bold dark:text-white font-display">For Buyers</h3>
            <ul className="space-y-4">
              {[
                'Your payment is held securely by Flutterwave until you confirm the item is right.',
                'You get a full inspection window after delivery before you have to decide anything.',
                'Record an unboxing video right in WeSabiChat \u2014 it\u2019s your strongest evidence if something is wrong.',
                'If there\u2019s a genuine problem, you can open a dispute instead of releasing payment.',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
              <Building2 size={26} />
            </div>
            <h3 className="text-2xl font-bold dark:text-white font-display">For Sellers</h3>
            <ul className="space-y-4">
              {[
                'Get paid with confidence \u2014 the buyer\u2019s funds are already secured before you dispatch.',
                'Record your own preparation/packing video as proof of the item\u2019s condition before it ships.',
                'SafePay is entirely optional \u2014 use it for the transactions where trust matters most.',
                'Your evidence video is your protection too if a dispute is ever raised.',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Video Evidence */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeader
            badge="Evidence That Protects You"
            title="Video evidence, right inside WeSabiChat"
            description="This feature is specific to SafePay transactions and does not apply to ordinary WeSabiHub parcels picked up from a hub."
            centered={true}
          />
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-slate-200 dark:border-slate-800">
              <Badge variant="info" className="mb-4">Seller</Badge>
              <h3 className="font-bold dark:text-white mb-3">Preparation video</h3>
              <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                Testing/preparation \u2192 packaging \u2192 sealing and dispatch, recorded in one continuous clip inside WeSabiChat.
              </p>
            </Card>
            <Card className="p-8 border-slate-200 dark:border-slate-800">
              <Badge variant="info" className="mb-4">Buyer</Badge>
              <h3 className="font-bold dark:text-white mb-3">Unboxing video</h3>
              <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                Parcel receipt \u2192 unboxing \u2192 unwrapping \u2192 inspection, recorded in one continuous clip inside WeSabiChat.
              </p>
            </Card>
          </div>
          <p className="text-center text-sm text-slate-500 mt-8">
            If one party isn't available at the same time, recordings can be made independently and watched anytime by the other side.
          </p>
        </div>
      </section>

      {/* Disputes */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeader
            badge="Dispute Protection"
            title="Structured protection when something goes wrong"
            description="SafePay disputes are backed by the evidence collected throughout the transaction."
            centered={true}
          />
          <Card className="p-8 border-slate-200 dark:border-slate-800">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {disputeReasons.map(reason => (
                <div key={reason} className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-300">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  {reason}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-6">
              When a dispute is opened, WeSabiHub reviews the evidence \u2014 tracking history, seller preparation video, and buyer inspection video \u2014 to manage the dispute workflow. The applicable settlement or refund is then processed through Flutterwave according to the outcome.
            </p>
          </Card>
        </div>
      </section>

      {/* Financial separation detail */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <SectionHeader
            badge="Important Distinction"
            title="SafePay vs. ordinary WeSabiHub payments"
            description="These are two separate things, and it matters to understand the difference."
            centered={true}
          />
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-900/10">
              <ShieldCheck className="text-primary-600 mb-4" size={28} />
              <h3 className="font-bold dark:text-white mb-2">SafePay</h3>
              <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                A protected buyer-seller transaction for the item itself. Optional, chosen per-transaction, funds held by Flutterwave until the buyer confirms.
              </p>
            </Card>
            <Card className="p-8 border-slate-200 dark:border-slate-800">
              <FileText className="text-slate-600 dark:text-slate-400 mb-4" size={28} />
              <h3 className="font-bold dark:text-white mb-2">Ordinary Platform Payments</h3>
              <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                Hub/service fees, registration fees, platform charges, and other operational payments. These are unrelated to SafePay.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-950 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-display mb-4">Ready to trade with confidence?</h2>
          <p className="text-slate-300 mb-8">Whether you're buying or selling, SafePay gives both sides real protection.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/register')}>Create a Free Account</Button>
            <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-900" onClick={() => navigate('/faq')}>Read the FAQ</Button>
          </div>
          <p className="text-xs text-slate-500 mt-8">
            SafePay is a WeSabiHub protection workflow. Payment processing and funds holding are provided by Flutterwave. See our <Link to="/terms" className="underline hover:text-primary-400">Terms of Service</Link> for full details.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
};
