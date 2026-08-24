import React, { useState } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { SectionHeader } from './HomePage';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useSettings } from '@/src/context/SettingsContext';
import { toast } from 'sonner';

export const ContactPage = () => {
  const { settings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';
  const email = settings?.contactEmail || 'hello@omorfihub.com';
  const phone = settings?.contactPhone || '+234 800 WESABI';
  const address = settings?.contactAddress || 'Victoria Island, Lagos, Nigeria';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Message sent! We'll get back to you shortly.");
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <PublicLayout>
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="We'd love to hear from you."
            description="Whether you have a question about shipping, partnering, or just want to say hello, we're here to help."
          />

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <Card className="p-10 md:p-16 border-slate-200 dark:border-slate-800 shadow-2xl rounded-[40px] space-y-8">
              <h3 className="text-2xl font-bold font-display dark:text-white">Send us a message</h3>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input label="First Name" placeholder="John" required />
                  <Input label="Last Name" placeholder="Doe" required />
                </div>
                <Input label="Email Address" placeholder="john@example.com" type="email" required />
                <Input label="Phone Number" placeholder="+234..." required />

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-300 ml-0.5">Message</label>
                  <textarea
                    required
                    className="flex min-h-[150px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="How can we help you?"
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full h-14 rounded-2xl text-lg"
                  rightIcon={<Send className="w-5 h-5" />}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Card>

            <div className="space-y-12">
              <div className="space-y-8">
                <h3 className="text-2xl font-bold font-display dark:text-white">Contact Information</h3>
                <div className="space-y-6">
                  {[
                    { icon: Mail, label: 'Email', value: email },
                    { icon: Phone, label: 'Phone', value: phone },
                    { icon: MapPin, label: 'HQ', value: address },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 shrink-0">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">{item.label}</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card variant="flat" className="p-8 bg-primary-600 text-white rounded-[32px]">
                <h4 className="text-xl font-bold mb-4 font-display">Live Support</h4>
                <p className="text-primary-100 leading-relaxed mb-6">
                  Chat with our customer success team in real-time between 8 AM - 6 PM (WAT).
                </p>
                <Button className="bg-white text-primary-600 hover:bg-slate-50 h-12 rounded-xl w-full font-bold" leftIcon={<MessageCircle className="w-5 h-5" />}>
                  Start Live Chat
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
