import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Phone,
  Mail,
  LifeBuoy,
  Search,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PointLayout } from '@/src/layouts/PointLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';

export const SupportPage = () => {
  const navigate = useNavigate();
  const [faqSearch, setFaqSearch] = useState('');

  const faqs = [
    { q: 'How do I handle a damaged parcel?', a: 'Document the damage with photos immediately and mark the status as "Damaged" in the intake workflow.' },
    { q: 'What if a customer forgets their release code?', a: 'Customers can resend the code to their registered phone number via the OmorfiHub app or website.' },
    { q: 'How are weekly payouts calculated?', a: 'Payouts are the sum of all successful intake and release commissions minus any disputed transaction adjustments.' },
  ];

  const filteredFaqs = faqs.filter(f =>
    !faqSearch.trim() ||
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <PointLayout>
      <div className="space-y-10 max-w-5xl mx-auto pb-20">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge variant="info" className="h-7 px-4 rounded-full uppercase tracking-widest text-[10px] font-black">Point Support</Badge>
          <h1 className="text-4xl font-black dark:text-white font-display">How can we help you?</h1>
          <p className="text-slate-900">Access exclusive support resources for OmorfiHub Point operators.</p>

          <div className="relative mt-8">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-800" />
             <Input placeholder="Search help articles..." className="h-14 pl-12 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800" value={faqSearch} onChange={e => setFaqSearch(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { title: 'Live Chat', desc: 'Average response: 2 mins', icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', handler: () => window.dispatchEvent(new CustomEvent('open-help-center')) },
             { title: 'WhatsApp Hub', desc: 'Real-time hub support', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', handler: () => window.open(`https://wa.me/234800937224`, '_blank') },
             { title: 'Email Tickets', desc: 'For complex disputes', icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', handler: () => window.location.href = 'mailto:points@omorfihub.com' },
           ].map((channel, i) => (
             <Card key={i} onClick={channel.handler} className="p-8 border-slate-200 dark:border-slate-800 text-center space-y-4 group cursor-pointer hover:border-primary-500 transition-all">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110", channel.bg, channel.color)}>
                   <channel.icon size={28} />
                </div>
                <div>
                   <h3 className="font-bold dark:text-white font-display">{channel.title}</h3>
                   <p className="text-xs text-slate-900">{channel.desc}</p>
                </div>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-bold dark:text-white font-display flex items-center gap-2">
                 <HelpCircle size={20} className="text-primary-600" />
                 Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                 {filteredFaqs.length === 0 ? (
                   <p className="text-sm text-slate-500">No FAQs match your search.</p>
                 ) : filteredFaqs.map((faq, i) => (
                   <Card key={i} className="p-6 border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-sm dark:text-white flex items-start gap-3">
                         <span className="text-primary-600 font-black">Q.</span> {faq.q}
                      </h4>
                      <p className="text-sm text-slate-900 leading-relaxed pl-6">{faq.a}</p>
                   </Card>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-slate-900 text-white space-y-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
                    <LifeBuoy size={24} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display">Point Hub Guide</h3>
                    <p className="text-slate-800 text-xs leading-relaxed">
                       Read our guides on running a OmorfiHub Point smoothly, from intake to release.
                    </p>
                 </div>
                 <Button onClick={() => navigate('/faq')} className="w-full rounded-xl h-12 font-bold bg-white text-slate-900 hover:bg-slate-50 flex items-center justify-center gap-2">
                    View Guides <ExternalLink size={16} />
                 </Button>
              </Card>
           </div>
        </div>
      </div>
    </PointLayout>
  );
};
