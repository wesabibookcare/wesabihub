import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Package, Shield, Globe, Users, Target, Heart } from 'lucide-react';
import { configurationEngine } from '@/src/engines';

import { useSettings } from '@/src/context/SettingsContext';

export const AboutPage = () => {
  const { settings } = useSettings();
  const [aboutText, setAboutText] = useState('');

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';
  const defaultText = settings?.landingPage?.aboutUsText || `OmorfiHub is ${countryName}'s trusted Pick-Up & Drop-Off (PUDO) network, connecting millions through a secure platform of verified neighborhood centers. By turning verified local businesses—pharmacies, supermarkets, and shops—into secure pickup points, we've created a network that is as reliable as it is accessible.`;

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await configurationEngine.getPageContent('about');
        if (data && data.content) {
          setAboutText(data.content);
        } else {
          setAboutText(defaultText);
          await configurationEngine.updatePageContent('about', {
            title: 'About Us',
            content: defaultText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to load About Us content", err);
        setAboutText(defaultText);
      }
    };
    loadContent();
  }, [countryName, defaultText]);

  if (!settings) return null;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge variant="info" className="mb-6">Our Mission</Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-[1.1] mb-8">
            Building the Infrastructure for <br />
            <span className="text-primary-600">Nationwide Logistics.</span>
          </h1>
          <p className="text-xl text-slate-800 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed whitespace-pre-wrap">
            {aboutText}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Verified Centers', value: '1,000+' },
              { label: 'Regions Covered', value: '36' },
              { label: 'Active Users', value: '50k+' },
              { label: 'Parcels Delivered', value: '250k+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <p className="text-4xl font-bold text-primary-600 font-display tracking-tight">{stat.value}</p>
                <p className="text-sm font-medium text-slate-900 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white font-display tracking-tight">The OmorfiHub Story</h2>
              <div className="space-y-6 text-lg text-slate-800 dark:text-slate-300 leading-relaxed">
                <p>
                  In a rapidly evolving digital economy, the "last mile" remains the biggest hurdle for e-commerce and logistics. High costs, security concerns, and unpredictable delivery times have slowed growth for businesses and frustrated customers.
                </p>
                <p>
                  OmorfiHub was born from a simple yet powerful idea: Use existing neighborhood trust and infrastructure to solve the logistics gap. By turning verified local businesses—pharmacies, supermarkets, and shops—into secure pickup points, we've created a network that is as reliable as it is accessible.
                </p>
                <p>
                  Today, we are more than just a tech platform. We are an ecosystem that empowers small business owners, enables e-commerce growth, and provides individuals with a safe, affordable way to send and receive goods anywhere.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-primary-600 rounded-[48px] overflow-hidden rotate-3 shadow-2xl">
                 <div className="absolute inset-0 bg-slate-900/20" />
                 {/* This would be an image of a hub or team */}
                 <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <Package size={200} />
                 </div>
              </div>
              <Card className="absolute -bottom-10 -left-10 p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-xs -rotate-3">
                 <p className="text-lg font-bold dark:text-white mb-2">{`"Our goal is to be within a 10-minute walk of everyone."`}</p>
                 <p className="text-sm text-primary-600 font-bold">— Founder & CEO</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Ecosystem Components */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="info">Platform Ecosystem</Badge>
            <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white uppercase italic">
              Our Core Architecture
            </h2>
            <p className="text-lg text-slate-900 font-medium leading-relaxed">
              OmorfiHub operates an interconnected suite of tools and services designed to power robust, nationwide logistics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Smart Marketplace Support',
                desc: 'Empowering merchants to register inventories, manage client orders, generate batch shipping sheets, and utilize automated client chat notifications.'
              },
              {
                title: 'OmorfiHub Centres',
                desc: 'A decentralized network of verified neighborhood retail locations serving as secure pick-up, drop-off, and parcel return locker points.'
              },
              {
                title: 'OmorfiHubDispatch',
                desc: 'Onboarding verified independent courier riders equipped with real-time route optimization, dynamic digital identity QR checks, and SafePay wallets.'
              },
              {
                title: 'Payment Protection',
                desc: 'Securing buyers and sellers via integrated transaction SafePay. Delivery payouts are released to merchants and riders only after secure receipt verification.'
              },
              {
                title: 'Returns Infrastructure',
                desc: 'Providing unified parcel return procedures. Customers can easily drop back incorrect items at any local hub for instant merchant returns processing.'
              },
              {
                title: 'Training Academy',
                desc: 'Providing rigorous educational courses and tests for dispatch riders and hub managers to guarantee top-tier standard operating procedures.'
              },
              {
                title: 'API Platform',
                desc: 'Developers and enterprise marketplaces integrate OmorfiHub directly into checkout portals to power seamless inter-hub delivery capabilities.'
              }
            ].map((comp, idx) => (
              <Card key={idx} className="p-8 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold mb-4 text-xs">
                  0{idx + 1}
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{comp.title}</h4>
                <p className="text-xs text-slate-900 dark:text-slate-300 leading-relaxed font-medium">{comp.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-32 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="What we stand for"
            description="Our core values guide every decision we make and every hub we verify."
          />
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Security & Trust',
                desc: 'We verify every center and use advanced tracking to ensure your parcels are always safe.'
              },
              {
                icon: Globe,
                title: 'Accessibility',
                desc: 'Building a network that reaches every corner of the nation, not just major cities.'
              },
              {
                icon: Users,
                title: 'Empowerment',
                desc: 'Providing small businesses with the tools to earn more and grow within our network.'
              },
              {
                icon: Target,
                title: 'Precision',
                desc: 'Real-time updates and clear communication at every stage of the delivery journey.'
              },
              {
                icon: Heart,
                title: 'Community',
                desc: 'Leveraging existing neighborhood connections to build a better logistics future.'
              },
              {
                icon: Package,
                title: 'Simplicity',
                desc: 'Removing the complexity from logistics for both businesses and everyday users.'
              }
            ].map((value, i) => (
              <Card key={i} className="p-10 hover:border-primary-500 transition-colors duration-300">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary-600 mb-6 shadow-sm">
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">{value.title}</h3>
                <p className="text-slate-900 dark:text-slate-300 leading-relaxed">{value.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
