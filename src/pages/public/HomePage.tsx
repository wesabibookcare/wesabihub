import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package,
  Users,
  ShieldCheck,
  Home,
  ShoppingBag,
  Truck,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { HeroCarousel } from '../../components/public/HeroCarousel';
import { Card } from '../../components/ui/Card';
import { PublicLayout } from '../../layouts/PublicLayout';

export const FeatureCard = ({ icon: Icon, title, description, color }: any) => (
  <Card className="group hover:border-primary-500 transition-colors duration-300 p-8">
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300",
      color
    )}>
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-bold mb-3 dark:text-white font-display tracking-tight">{title}</h3>
    <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{description}</p>
  </Card>
);

export const SectionHeader = ({ badge, title, description, centered = true }: any) => (
  <div className={cn("max-w-3xl space-y-4 mb-16", centered ? "mx-auto text-center" : "")}>
    {badge && <Badge variant="info">{badge}</Badge>}
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
      {title}
    </h2>
    <p className="text-lg text-slate-900 dark:text-slate-300 leading-relaxed">
      {description}
    </p>
  </div>
);

export const HomePage = () => {
  const navigate = useNavigate();
  const { settings, loading } = useSettings();
  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PublicLayout>
    );
  }

  const hero = settings?.landingPage?.hero || {
    title: "The Nation's Most Reliable Delivery Network",
    subtitle: "We've built Nigeria's largest network of verified neighborhood centers. Ship, pick up, and return parcels with total peace of mind.",
    ctaText: "Start Shipping",
    ctaLink: "/ship"
  };

  const descriptions = settings?.landingPage?.descriptions || {
    networkSummary: "We leverage a vast network of neighborhood centers to provide the most reliable PUDO (Pick-Up & Drop-Off) service in the country.",
    merchantValueProp: "Scale your business with our reliable delivery infrastructure.",
    logisticsValueProp: "Connect with local hubs to optimize your last-mile delivery.",
    centerValueProp: "Earn extra income by becoming a verified pickup point."
  };

  const stats = [
    { label: 'Verified Centers', value: 'Joining hubs', icon: Home },
    { label: 'Monthly Parcels', value: 'Growing rapidly', icon: Package },
    { label: 'Happy Customers', value: 'Trusted partner', icon: Users },
    { label: 'Delivery Guarantee', value: 'Dedicated', icon: ShieldCheck },
  ];

  const features = [
    {
      title: 'For Merchants',
      description: descriptions.merchantValueProp,
      icon: ShoppingBag,
      link: '/merchants'
    },
    /* PAUSED: WeSabiDispatch homepage card -- restore by uncommenting
    {
      title: 'WeSabiDispatch',
      description: 'Onboard as an authorized independent rider, secure high transit volumes, and cashout weekly.',
      icon: Truck,
      link: '/become-dispatch-partner'
    },
    */
    {
      title: 'Become a Hub',
      description: descriptions.centerValueProp,
      icon: MapPin,
      link: '/centers'
    },
    {
      title: 'API Platform',
      description: 'Developers and enterprises integrate tracking, bulk pickups, and delivery confirmation effortlessly.',
      icon: Package,
      link: '/api'
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-white dark:bg-slate-950">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <HeroCarousel />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="info" className="mb-6 px-4 py-1.5 rounded-full font-bold tracking-wide">
                  🚀 {settings?.tagline || 'Nigeria\'s Largest PUDO Network'}
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-black font-display tracking-tight text-white leading-[1.1] mb-8 italic uppercase drop-shadow-lg">
                  {hero.title}
                </h1>
                <p className="text-lg lg:text-xl text-slate-200 font-bold leading-relaxed mb-10 max-w-3xl mx-auto drop-shadow">
                  {hero.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" className="h-14 px-10 rounded-2xl text-base font-bold shadow-xl shadow-primary-500/25 group" onClick={() => navigate(hero.ctaLink)}>
                    {hero.ctaText}
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-10 rounded-2xl text-base font-bold border-2 border-white/40 text-white hover:bg-white/10" onClick={() => navigate('/how-it-works')}>
                    See How It Works
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust & Stats Section */}
        <section className="py-20 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center text-primary-600 mx-auto mb-4">
                    <stat.icon size={24} />
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-900 uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Feature Cards */}
        <section className="py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl lg:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white mb-6 uppercase italic">
                One Network, <span className="text-primary-600">Infinite Solutions</span>
              </h2>
              <p className="text-lg text-slate-800 dark:text-slate-300 font-medium">
                {descriptions.networkSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="p-8 h-full hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-300 border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 mb-8">
                      <feature.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase italic tracking-tight">{feature.title}</h3>
                    <p className="text-slate-800 dark:text-slate-300 font-medium mb-8 flex-grow">
                      {feature.description}
                    </p>
                    <Button variant="ghost" className="justify-start p-0 h-auto hover:bg-transparent text-primary-600 font-bold group" onClick={() => navigate(feature.link)}>
                      Learn More <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Unified Platform Ecosystem Block */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <Badge variant="info">Ecosystem Architecture</Badge>
              <h2 className="text-3xl lg:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white uppercase italic">
                How WeSabiHub Supports Everyone
              </h2>
              <p className="text-lg text-slate-800 dark:text-slate-300 font-medium">
                Our platform bridges verified merchants, neighborhood centers, independent dispatchers, and API enterprise partners inside one secure payment protection ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2 text-primary-600">
                  <ShoppingBag size={20} />
                  Merchants & Self-Delivery Solutions
                </h3>
                <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  Merchants are fully in control. Create bulk shipments and seamlessly choose between:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Professional WeSabiDispatch independent riders
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Approved corporate third-party logistics (3PL) partners
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Self-delivery routes for localized customer drop-offs
                  </li>
                </ul>
                <Button variant="outline" size="sm" onClick={() => navigate('/merchants')}>Explore Merchant Solutions</Button>
              </Card>

              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2 text-primary-600">
                  <Home size={20} />
                  Hub Centre Owner & Dispatch Collaborations
                </h3>
                <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  Neighborhood pickup centers serve as secure holding lockers. Hub operators collaborate naturally with dispatch riders to:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Receive, scan, and audit arrive-at-hub packages securely
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Validate dispatch rider identity cards via real-time QR scans
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Release verified packets to riders via single-use protection PINs
                  </li>
                </ul>
                <Button variant="outline" size="sm" onClick={() => navigate('/centers')}>Learn About Hub Centers</Button>
              </Card>

              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2 text-primary-600">
                  <ShieldCheck size={20} />
                  Payment Protection & Security Ledgers
                  {settings?.featureFlags?.enableSafePay === false && (
                    <Badge variant="warning" className="text-[10px] h-5">Coming Soon</Badge>
                  )}
                </h3>
                <p className="text-slate-800 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  We guarantee total parcel safety. SafePay releases merchant payouts only after recipient verification, backed by:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Rider dynamic Trust Scores tracking ratings and course completions
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Dynamic Field Verification QR codes for public security audits
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Payment protection payouts triggered exclusively upon valid recipient confirmation
                  </li>
                </ul>
                <Button variant="outline" size="sm" onClick={() => navigate('/safepay')}>See How SafePay Works</Button>
              </Card>

              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2 text-primary-600">
                  <Package size={20} />
                  Enterprise API Integrations
                </h3>
                <p className="text-sm leading-relaxed mb-4 text-slate-800 dark:text-slate-300">
                  Empower external developer marketplaces to tap directly into the largest localized delivery network in {countryName}:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Query neighborhood center rates and live capacities instantly
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Create shipments, request rider pickup, and monitor tracking states
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    Receive webhook alerts on packet handovers and recipient releases
                  </li>
                </ul>
                <Button variant="outline" size="sm" onClick={() => navigate('/api')}>Read Developer Docs</Button>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 dark:bg-primary-950 rounded-[2.5rem] p-8 lg:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,#3b82f633,transparent_70%)]" />

              <div className="relative z-10 lg:flex items-center justify-between gap-12">
                <div className="lg:max-w-2xl mb-8 lg:mb-0">
                  <h2 className="text-4xl lg:text-6xl font-black text-white font-display tracking-tight mb-6 uppercase italic">
                    {settings?.landingPage?.cta?.title || 'Ready to transform your logistics?'}
                  </h2>
                  <p className="text-xl text-slate-300 font-medium">
                    {settings?.landingPage?.cta?.description || 'Join thousands of businesses and centers across the nation. Start today.'}
                  </p>
                </div>
                <Button size="lg" className="h-16 px-12 rounded-2xl text-lg font-black bg-white text-slate-900 hover:bg-slate-100 shadow-2xl shadow-white/10" onClick={() => navigate(settings?.landingPage?.cta?.buttonLink || '/register')}>
                  {settings?.landingPage?.cta?.buttonText || 'Join the Network'}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
