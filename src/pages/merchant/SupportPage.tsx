import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LifeBuoy,
  MessageSquare,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  FileText,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userEngine } from '@/src/engines';
import { SupportTicket } from '@/src/types';
import { toast } from 'sonner';

const AccordionItem = ({ question, answer }: { question: string; answer: string; key?: React.Key }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-bold dark:text-white group-hover:text-primary-600 transition-colors text-sm">{question}</span>
        {isOpen ? <ChevronUp className="text-slate-900" size={18} /> : <ChevronDown className="text-slate-900" size={18} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-800 dark:text-slate-300 text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MerchantSupportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const faqs = [
    { question: 'How do I release SafePay funds?', answer: 'Funds are automatically released to your wallet 24 hours after the customer confirms receipt of the parcel at a WeSabiHub Point or via home delivery.' },
    { question: 'What are the merchant fees?', answer: 'WeSabiHub charges a flat 2.5% service fee on every successful transaction. This covers the SafePay service, tracking, and point-to-point logistics.' },
    { question: 'Can I use my own courier?', answer: 'Currently, all shipments must be dropped off at a WeSabiHub Point to ensure the integrity of our SafePay and tracking system.' },
    { question: 'How do I handle returns?', answer: 'If a customer requests a return, they must drop the parcel back at a WeSabiHub Point. Once you receive and verify the return, you can initiate a refund via the SafePay dashboard.' },
  ];

  const filteredFaqs = faqs.filter(faq =>
    !searchQuery ||
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to create a ticket');
      return;
    }
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = `TKT-${Date.now()}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.uid || user.id,
        subject: ticketSubject,
        category: 'ACCOUNT',
        priority: 'HIGH',
        message: ticketMessage,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      } as SupportTicket;

      await userEngine.createSupportTicket(ticketId, newTicket);

      toast.success('Priority ticket submitted! Our support team will reach out shortly.');
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketMessage('');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactOptions = [
    {
      icon: MessageSquare,
      title: 'Merchant Chat',
      desc: 'Chat with our success team',
      color: 'bg-emerald-500',
      action: 'Start Chat',
      handler: () => window.dispatchEvent(new CustomEvent('open-help-center'))
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Support',
      desc: '+234 800 WESABI (937224)',
      color: 'bg-green-600',
      action: 'Send WhatsApp',
      handler: () => window.open(`https://wa.me/234800937224`, '_blank')
    },
    {
      icon: Mail,
      title: 'Partnership Email',
      desc: 'merchants@wesabihub.com',
      color: 'bg-blue-600',
      action: 'Send Email',
      handler: () => window.location.href = 'mailto:merchants@wesabihub.com'
    },
  ];

  return (
    <MerchantLayout>
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-6">
           <div className="w-16 h-16 rounded-3xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-primary-600/20">
              <LifeBuoy size={32} />
           </div>
           <div className="space-y-2">
              <h1 className="text-4xl font-bold dark:text-white font-display">Merchant Support Center</h1>
              <p className="text-slate-800 text-lg">Everything you need to grow your business on WeSabiHub.</p>
           </div>
           <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900" />
              <input
                type="text"
                placeholder="Search merchant guides, FAQs, or troubleshooting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
              />
           </div>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { title: 'Merchant Handbook', desc: 'Step-by-step guides for store owners', icon: BookOpen, color: 'text-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20', to: '/faq' },
             { title: 'SafePay Guide', desc: 'How protected transactions work', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', to: '/safepay' },
             { title: 'Video Tutorials', desc: 'Watch how to manage your shipments', icon: PlayCircle, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', to: '/how-it-works' },
             { title: 'Developer API', desc: 'Integrate WeSabiHub into your store', icon: ExternalLink, color: 'text-slate-900', bg: 'bg-slate-100 dark:bg-slate-800', to: '/api' },
           ].map((cat, i) => (
             <Card key={i} onClick={() => navigate(cat.to)} className="p-6 border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all cursor-pointer group">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                   <cat.icon size={24} />
                </div>
                <h4 className="font-bold dark:text-white group-hover:text-primary-600 transition-colors">{cat.title}</h4>
                <p className="text-xs text-slate-800 mt-1">{cat.desc}</p>
             </Card>
           ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
           {/* FAQ Section */}
           <div className="lg:col-span-2 space-y-8">
              <Card className="p-8 border-slate-200 dark:border-slate-800">
                 <h2 className="text-2xl font-bold dark:text-white font-display mb-8">Frequently Asked Questions</h2>
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFaqs.length === 0 ? (
                      <p className="py-6 text-sm text-slate-500">No FAQs match your search.</p>
                    ) : filteredFaqs.map((faq, i) => (
                       <AccordionItem key={i} question={faq.question} answer={faq.answer} />
                    ))}
                 </div>
              </Card>

              {/* Submit Ticket */}
              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                 <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                       <FileText size={40} />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                       <h3 className="text-xl font-bold dark:text-white">Priority Merchant Support</h3>
                       <p className="text-sm text-slate-800">As a verified merchant, you get 24/7 priority access to our support engineers.</p>
                       <div className="pt-2">
                          <Button onClick={() => setIsTicketModalOpen(true)} className="rounded-xl px-8 h-12 shadow-lg shadow-primary-500/20">Open Priority Ticket</Button>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>

           {/* Contact Sidebar */}
           <div className="space-y-8">
              <h2 className="text-xl font-bold dark:text-white font-display">Direct Contact</h2>
              <div className="space-y-4">
                 {contactOptions.map((contact, i) => (
                   <Card key={i} onClick={contact.handler} className="p-6 border-slate-200 dark:border-slate-800 group hover:border-primary-500 transition-colors cursor-pointer">
                      <div className="flex gap-4">
                         <div className={cn(
                           "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                           contact.color
                         )}>
                            <contact.icon size={24} />
                         </div>
                         <div className="flex-1 space-y-1">
                            <h4 className="font-bold dark:text-white text-sm">{contact.title}</h4>
                            <p className="text-[10px] text-slate-800">{contact.desc}</p>
                            <div className="pt-2 text-[10px] font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                               {contact.action} <ArrowRight size={14} />
                            </div>
                         </div>
                      </div>
                   </Card>
                 ))}
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-emerald-600">Merchant API: Normal</span>
              </div>
           </div>
        </div>

        {/* Priority Ticket Modal */}
        <Modal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          title="Open Priority Ticket"
          description="As a verified merchant, this reaches our support team directly."
        >
          <form onSubmit={handleCreateTicket} className="space-y-4">
             <div className="space-y-1">
                <label className="text-sm font-bold dark:text-white">Subject</label>
                <input
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Briefly describe the issue"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
             </div>
             <div className="space-y-1">
                <label className="text-sm font-bold dark:text-white">Message</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={5}
                  placeholder="Give as much detail as you can..."
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
             </div>
             <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 mt-2">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Priority Ticket'}
             </Button>
          </form>
        </Modal>
      </div>
    </MerchantLayout>
  );
};
