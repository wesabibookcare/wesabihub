import React, { useState, useEffect } from 'react';
import { PublicLayout } from '@/src/layouts/PublicLayout';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { configurationEngine } from '@/src/engines';
import { FAQ } from '@/src/services/db/FAQRepository';
import { useSettings } from '@/src/context/SettingsContext';

const AccordionItem = ({ question, answer }: { question: string, answer: string, key?: string | number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-800" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-800" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6 animate-fade-in">
          <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

export const FAQPage = () => {
  const { settings } = useSettings();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const countryName = settings?.localization?.countryName || settings?.defaultCountry || 'Nigeria';

  const defaultFaqs = [
    {
      question: 'What is OmorfiHub?',
      answer: 'OmorfiHub is a nationwide Pick-Up & Drop-Off (PUDO) network that connects customers, merchants, and logistics partners through verified neighborhood business centers. We provide a secure way to send and receive parcels without needing home delivery.',
      category: 'General'
    },
    {
      question: 'Is OmorfiHub a courier company?',
      answer: 'No, OmorfiHub is the infrastructure and technology platform. We partner with verified neighborhood businesses to act as hubs and with professional logistics companies to transport parcels between these hubs.',
      category: 'General'
    },
    {
      question: 'In which cities is OmorfiHub available?',
      answer: `We are currently expanding across ${countryName}, including major urban regions and cities. You can find your nearest hub using our "Find a Center" page.`,
      category: 'General'
    },
    {
      question: 'How do I send a parcel?',
      answer: 'Register your parcel on our website or app to get a booking code. Take the parcel to your nearest OmorfiHub center, show the code, and hand over the item. The recipient will be notified once it arrives at their chosen destination hub.',
      category: 'Sending & Receiving'
    },
    {
      question: 'How does the recipient collect the parcel?',
      answer: 'The recipient will receive a unique pickup code via SMS and email when the parcel arrives at the destination hub. They must present this code and a valid ID at the hub to collect the item.',
      category: 'Sending & Receiving'
    },
    {
      question: 'What items are prohibited on OmorfiHub?',
      answer: 'We do not allow the transport of illegal substances, hazardous materials, firearms, perishable goods (without specialized handling), or live animals. Please refer to our full Terms of Service for the complete list.',
      category: 'Sending & Receiving'
    },
    {
      question: 'What is SafePay and how does it protect me?',
      answer: 'SafePay is our protected payment workflow for buyer-seller transactions. Your payment is held securely by our licensed payment partner, Flutterwave, until you confirm the item is exactly what you agreed to -- OmorfiHub itself never holds your money. It includes seller preparation videos, buyer unboxing videos, and a full dispute process if something goes wrong. Using SafePay is entirely optional and chosen per transaction. See our full SafePay guide for details.',
      category: 'Sending & Receiving'
    },
    {
      question: 'How can I become a OmorfiHub center?',
      answer: 'If you have a verified physical business location (shop, pharmacy, etc.), you can apply through our "Become a Hub" page. Our team will conduct a site visit and verification before onboarding you.',
      category: 'Partnership'
    },
    {
      question: 'What are the benefits of being a hub?',
      answer: 'Hubs earn a commission on every parcel handled, benefit from increased foot traffic to their existing business, and get free visibility through our nationwide platform.',
      category: 'Partnership'
    },
    {
      question: 'Who can become a Dispatch Rider?',
      answer: 'Any independent rider or commercial courier business with a valid vehicle (motorcycle, van, or truck), a Class-A driving license, a smartphone, and a verified background check can apply to become a OmorfiHubDispatch Rider.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How does approval work?',
      answer: 'After you register and submit your documents, our regional operations managers conduct a standard verification of your ID, vehicle papers, and guarantor references. You will then complete a training course to fully activate your rider account.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'What documents are required for application?',
      answer: 'You must provide a Government-issued ID (NIN), a valid Driver License (Class-A), proof of vehicle ownership/roadworthiness, emergency contact information, and a signed guarantor reference verification form.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How are riders verified?',
      answer: 'We check your government credentials, driver record, and verify your guarantor references via phone/physical verification. Once cleared, you generate an authorized digital ID card containing an dynamic field QR verification link.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How does the Trust Score system work?',
      answer: 'Riders begin with a baseline Trust Score. Completing successful shipments, receiving high ratings from hubs and customers, and completing Academy courses increases your score (up to 200 PTS). Any transit violations, delay complaints, or cancellations decrease your score, which limits your parcel value capacity.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How are payments made?',
      answer: 'Our SafePay ledger system secures all shipping payments. When a customer pays, the funds route into the OmorfiHub SafePay Wallet. Upon successful recipient delivery confirmation (via QR code scan), the delivery portion of the fee triggers instantly to your rider wallet.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How do weekly settlements work?',
      answer: 'You can withdraw earnings from your secure rider wallet directly into your registered bank account. Payout requests are processed automatically on weekly settlement schedules with zero hassle.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'Can merchants become riders?',
      answer: 'Yes! OmorfiHub features an integrated multi-role architecture. If you are already a verified merchant, you can activate Dispatch Rider capabilities inside your existing profile and handle transit jobs with a single account.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'Can centre owners become riders?',
      answer: 'Absolutely. Verified hub center owners or their designated employees can toggle rider roles to handle deliveries during off-peak hours, increasing hub revenue streams.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'How are parcels protected in transit?',
      answer: 'Parcels are locked inside our secure SafePay workflow. Handover between merchants, hub centers, and dispatch riders is authenticated at every point using secure, single-use PINs and QR scans, ensuring continuous transit custody tracking.',
      category: 'OmorfiHubDispatch & Riders'
    },
    {
      question: 'Can API partners use OmorfiHubDispatch?',
      answer: 'Yes. Our developer and enterprise API platform fully exposes the OmorfiHubDispatch network, allowing third-party apps, websites, and marketplaces to request pickups, track transits, and verify deliveries automatically.',
      category: 'OmorfiHubDispatch & Riders'
    }
  ];

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const data = await configurationEngine.getFAQs();
        if (data && data.length > 0) {
          setFaqs(data);
        } else {
          // Auto-seed default FAQs into Firestore so they are editable
          setFaqs(defaultFaqs as FAQ[]);
          for (let i = 0; i < defaultFaqs.length; i++) {
            const item = defaultFaqs[i];
            await configurationEngine.createFAQ(`faq_seed_${i}`, {
              ...item,
              role: 'ALL',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: false
            } as any);
          }
        }
      } catch (err) {
        console.error("Failed to load FAQs", err);
        setFaqs(defaultFaqs as FAQ[]);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, [countryName]);

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group FAQs by category
  const categories = Array.from(new Set(filteredFaqs.map(f => f.category || 'General')));

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
          <Badge variant="info">Support Center</Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
            Commonly Asked <span className="text-primary-600">Questions.</span>
          </h1>
          <div className="max-w-2xl mx-auto relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
             <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-12 pr-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm text-sm"
             />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <HelpCircle className="mx-auto text-slate-300 w-16 h-16" />
              <h3 className="text-xl font-bold dark:text-white">No questions found</h3>
              <p className="text-slate-900 dark:text-slate-300 max-w-md mx-auto">We couldn't find any FAQs matching "{searchQuery}". Try refining your search query.</p>
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((category) => {
                const items = filteredFaqs.filter(f => (f.category || 'General') === category);
                return (
                  <div key={category} className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display border-l-4 border-primary-600 pl-4">
                      {category}
                    </h2>
                    <Card className="p-2 border-slate-100 dark:border-slate-900">
                      <div className="px-6">
                        {items.map((faq, i) => (
                          <AccordionItem key={faq.id || i} question={faq.question} answer={faq.answer} />
                        ))}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Still need help */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-10 flex gap-6 items-start hover:border-primary-500 transition-colors">
               <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shrink-0">
                  <HelpCircle className="w-8 h-8" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-bold dark:text-white">Need more support?</h3>
                  <p className="text-slate-900 dark:text-slate-300">Our customer happiness team is available 24/7 to help you with any issues.</p>
                  <Button variant="outline" asChild>
                     <Link to="/contact">Contact Support</Link>
                  </Button>
               </div>
            </Card>
            <Card className="p-10 flex gap-6 items-start hover:border-primary-500 transition-colors">
               <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 shrink-0">
                  <MessageSquare className="w-8 h-8" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-bold dark:text-white">Live Chat</h3>
                  <p className="text-slate-900 dark:text-slate-300">Speak directly with an agent right now for immediate assistance.</p>
                  <Button variant="outline">Start Chat</Button>
               </div>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
