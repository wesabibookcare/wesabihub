import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowRight,
  LifeBuoy,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Inbox,
  RefreshCw,
  Send
} from 'lucide-react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { cn } from '@/src/lib/utils';
import { configurationEngine, userEngine, auditEngine, notificationEngine } from '@/src/engines';
import { faqRepository } from '@/src/services/db/FAQRepository';
import { supportTicketRepository } from '@/src/services/db/SupportTicketRepository';
import { SupportTicket, SystemSettings } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { Modal } from '@/src/components/ui/Modal';
import { toast } from 'sonner';

const AccordionItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 transition-colors text-base">{question}</span>
        {isOpen ? <ChevronUp className="text-slate-600 dark:text-slate-400 shrink-0" /> : <ChevronDown className="text-slate-600 dark:text-slate-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TicketItem: React.FC<{ ticket: SupportTicket }> = ({ ticket }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'RESOLVED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'CLOSED': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
      default: return 'bg-slate-500/10 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500/10 text-red-600 border border-red-200 dark:border-red-800';
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border border-orange-200 dark:border-orange-800';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-200 dark:border-yellow-800';
      default: return 'bg-slate-500/10 text-slate-600 border border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:shadow-md transition-all overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-[10px] font-bold uppercase", getStatusColor(ticket.status))}>
              {ticket.status}
            </Badge>
            <Badge className={cn("text-[10px] font-bold uppercase", getPriorityColor(ticket.priority))}>
              {ticket.priority} Priority
            </Badge>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">#{ticket.id}</span>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base hover:text-primary-600 transition-colors">
            {ticket.subject}
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Category: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{ticket.category}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt || '').toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-sm font-bold text-primary-600 hidden md:inline">View Message</span>
          {isOpen ? <ChevronUp className="text-slate-500" size={18} /> : <ChevronDown className="text-slate-500" size={18} />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
          >
            <div className="p-6 space-y-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Your Message Details</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ticket.message}
                </p>
              </div>

              {ticket.status === 'OPEN' && (
                <div className="p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-xl flex items-start gap-3">
                  <Clock className="text-primary-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-primary-900/70 dark:text-primary-400/70 leading-relaxed">
                    <strong>Awaiting Assignment:</strong> Our support engineers have received this ticket and will provide a status update or resolution directly inside this thread shortly.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SupportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('faq');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic FAQs from DB & Defaults
  const [dbFaqs, setDbFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  // Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Ticket Modal State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'SHIPMENT' as SupportTicket['category'],
    priority: 'MEDIUM' as SupportTicket['priority'],
    message: ''
  });

  const defaultFaqs = [
    { question: 'How do I track my parcel?', answer: 'You can track your parcel by entering the tracking number provided during shipment creation in the "Track Parcel" section of your dashboard.' },
    { question: 'What is a WeSabiHub Point?', answer: 'A WeSabiHub Point is a verified local pickup and drop-off location (PUDO), such as a pharmacy or supermarket, where you can safely hand over or collect parcels.' },
    { question: 'How long will my parcel stay at a Hub?', answer: 'Parcels are held at WeSabiHub Points for up to 7 days. After 3 days, small storage fees may apply. After 7 days, the parcel will be returned to the origin hub.' },
    { question: 'Is my parcel insured?', answer: 'Yes, all shipments on WeSabiHub come with basic insurance coverage. You can opt for additional coverage during the shipment creation process.' },
    { question: 'What payment methods are supported?', answer: 'WeSabiHub supports secure online payments including credit/debit cards, bank transfers, and mobile money. Cash on pickup is not accepted to maintain transaction safety.' }
  ];

  useEffect(() => {
    // Load dynamic settings
    configurationEngine.getGlobalSettings().then(allSettings => {
      if (allSettings) {
        setSettings(allSettings);
      }
    });

    // Load FAQs
    const fetchFaqs = async () => {
      try {
        const fetchedFaqs = await faqRepository.getAll();
        const activeFaqs = fetchedFaqs.filter(faq => !faq.isDeleted);
        setDbFaqs(activeFaqs);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      } finally {
        setFaqsLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const fetchTickets = async () => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const userTickets = await supportTicketRepository.getByUser(user.uid || user.id);
      // Sort newest first
      userTickets.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setTickets(userTickets);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      toast.error('Failed to load your support tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab, user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create a ticket");
      return;
    }
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast.error("Subject and Message are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = `TKT-${Date.now()}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.uid || user.id,
        subject: ticketForm.subject,
        category: ticketForm.category,
        priority: ticketForm.priority,
        message: ticketForm.message,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      // 1. Persist support ticket in database
      await userEngine.createSupportTicket(ticketId, newTicket);

      // 2. Log audit log event for traceability
      await auditEngine.logEvent({
        userId: user.uid || user.id,
        userRole: user.role || 'customer',
        action: 'SUPPORT_TICKET_CREATED',
        details: { ticketId, subject: ticketForm.subject, category: ticketForm.category, priority: ticketForm.priority },
        targetId: ticketId,
        result: 'SUCCESS'
      });

      // 3. Trigger automated customer notification
      await notificationEngine.send(
        user.uid || user.id,
        'Support Ticket Created 🎟️',
        `Your support ticket "${ticketForm.subject}" has been logged successfully. We are on it!`,
        'INFO',
        '/customer/support',
        'SYSTEM'
      );

      toast.success("Support ticket created successfully!");
      setIsTicketModalOpen(false);
      setTicketForm({ subject: '', category: 'SHIPMENT', priority: 'MEDIUM', message: '' });

      if (activeTab === 'tickets') {
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactOptions = [
    {
      icon: MessageSquare,
      title: 'Live Chat Support',
      desc: 'Chat with our agents now',
      color: 'bg-emerald-500',
      action: 'Start Live Chat',
      handler: () => navigate('/customer/chat')
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Support',
      desc: settings?.contactInfo?.whatsapp || '+234 800 123 4567',
      color: 'bg-green-600',
      action: 'Open WhatsApp',
      handler: () => {
        const number = settings?.contactInfo?.whatsapp?.replace(/\D/g, '') || '2348001234567';
        window.open(`https://wa.me/${number}`, '_blank');
      }
    },
    {
      icon: Mail,
      title: 'Email Support Team',
      desc: settings?.contactInfo?.supportEmail || 'support@wesabihub.com',
      color: 'bg-blue-600',
      action: 'Send Email',
      handler: () => {
        window.location.href = `mailto:${settings?.contactInfo?.supportEmail || 'support@wesabihub.com'}`;
      }
    },
  ];

  const allFaqs = dbFaqs.length > 0 ? dbFaqs : defaultFaqs;
  const filteredFaqs = allFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto space-y-12">

        {/* Hero Area */}
        <div className="text-center space-y-6">
           <div className="w-16 h-16 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-primary-600/20">
              <LifeBuoy size={32} />
           </div>
           <div className="space-y-2">
              <h1 className="text-4xl font-black dark:text-white font-display">How can we help you?</h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg">Search our knowledge base or track your created tickets.</p>
           </div>

           {activeTab === 'faq' && (
             <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for articles, questions, or topics..."
                  className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white"
                />
             </div>
           )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md mx-auto shadow-sm">
           {[
             { id: 'faq', label: 'Help & FAQs' },
             { id: 'tickets', label: 'My Support Tickets' }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                 activeTab === tab.id
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
               )}
             >
                {tab.label}
             </button>
           ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
           {/* Left Content Column */}
           <div className="lg:col-span-2 space-y-8">

              {activeTab === 'faq' ? (
                <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Frequently Asked Questions</h2>
                     {faqsLoading && <Loader2 className="animate-spin text-primary-600" size={18} />}
                   </div>

                   <div className="divide-y divide-slate-100 dark:divide-slate-800">
                     {filteredFaqs.length > 0 ? (
                       filteredFaqs.map((faq, i) => (
                         <AccordionItem key={faq.id || i} question={faq.question} answer={faq.answer} />
                       ))
                     ) : (
                       <div className="py-12 text-center text-slate-500">
                         No FAQs matched your search term. Try another keywords!
                       </div>
                     )}
                   </div>
                </Card>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">My Support Tickets</h2>
                     <Button
                       variant="outline"
                       size="sm"
                       className="rounded-xl h-10 gap-2 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                       onClick={fetchTickets}
                       disabled={ticketsLoading}
                     >
                       <RefreshCw className={cn("text-slate-500", ticketsLoading && "animate-spin")} size={14} />
                       Refresh
                     </Button>
                   </div>

                   {ticketsLoading ? (
                     <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                       <Loader2 className="animate-spin text-primary-600 mb-2" size={28} />
                       <p className="text-sm">Loading tickets...</p>
                     </div>
                   ) : tickets.length > 0 ? (
                     <div className="space-y-4">
                       {tickets.map((ticket) => (
                         <TicketItem key={ticket.id} ticket={ticket} />
                       ))}
                     </div>
                   ) : (
                     <Card className="p-12 text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
                       <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                         <Inbox size={28} />
                       </div>
                       <div className="space-y-1">
                         <h3 className="font-bold text-slate-900 dark:text-white text-lg">No tickets found</h3>
                         <p className="text-slate-500 dark:text-slate-400 text-sm">You haven't opened any support tickets yet.</p>
                       </div>
                       <div className="pt-2">
                         <Button onClick={() => setIsTicketModalOpen(true)} className="rounded-xl">
                           Create Your First Ticket
                         </Button>
                       </div>
                     </Card>
                   )}
                </div>
              )}

              {/* Submit Ticket Banner */}
              <Card className="p-8 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                 <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary-600 shrink-0">
                       <FileText size={32} />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">Submit a Support Ticket</h3>
                       <p className="text-sm text-slate-600 dark:text-slate-300">Can't find what you are looking for? Open a ticket and our team will get back to you within 2 hours.</p>
                       <div className="pt-2">
                          <Button
                            className="rounded-xl px-8 h-12"
                            onClick={() => setIsTicketModalOpen(true)}
                          >
                            Create New Ticket
                          </Button>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>

           {/* Right Contact Sidebar */}
           <div className="space-y-8">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">Contact Us</h2>
              <div className="space-y-4">
                 {contactOptions.map((contact, i) => (
                   <Card key={i} onClick={contact.handler} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-primary-500 transition-colors cursor-pointer shadow-sm">
                      <div className="flex gap-4">
                         <div className={cn(
                           "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                           contact.color
                         )}>
                            <contact.icon size={24} />
                         </div>
                         <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{contact.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{contact.desc}</p>
                            <div className="pt-2 text-xs font-bold text-primary-600 flex items-center gap-1 group-hover:gap-2 transition-all">
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
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">All systems operational</span>
              </div>

              {/* Resource Links */}
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resources</h4>
                 <div className="space-y-3">
                    {[
                      { label: 'Shipping Guidelines', to: '/faq' },
                      { label: 'Prohibited Items', to: '/faq' },
                      { label: 'How SafePay Works', to: '/safepay' },
                      { label: 'Terms of Service', to: '/terms' },
                      { label: 'Privacy Policy', to: '/privacy' },
                    ].map(link => (
                      <button
                        key={link.label}
                        type="button"
                        onClick={() => navigate(link.to)}
                        className="w-full flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors group"
                      >
                         {link.label}
                         <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-all text-slate-400" />
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Ticket Creation Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Create Support Ticket"
        description="Explain your issue clearly for faster resolution."
      >
        <form onSubmit={handleCreateTicket} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Subject</label>
              <input
                type="text"
                placeholder="e.g. Delayed Delivery, Payment Issue"
                value={ticketForm.subject}
                required
                onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({...ticketForm, category: e.target.value as any})}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white text-sm"
                >
                  <option value="SHIPMENT">Shipment</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="ACCOUNT">Account</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Priority</label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value as any})}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-300 uppercase tracking-widest">Message</label>
              <textarea
                rows={4}
                placeholder="Describe your issue in detail..."
                value={ticketForm.message}
                required
                onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white text-sm resize-none"
              />
            </div>

            <div className="p-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 rounded-xl flex items-start gap-2.5">
              <LifeBuoy className="text-primary-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-primary-900/80 dark:text-primary-300 leading-relaxed">
                <strong>Where does your complaint go?</strong> Your support ticket is routed directly to the official <strong>WeSabiHub Support & Operations Centre</strong>. An assigned Support Officer will review and reply in real-time.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl h-12"
              onClick={() => setIsTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl h-12 shadow-lg shadow-primary-600/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Submitting...
                </>
              ) : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </CustomerLayout>
  );
};
