import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  User,
  ShieldAlert,
  Send,
  Bot,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  FileText
} from 'lucide-react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '@/src/lib/utils';
import { adminEngine } from '../../engines/AdminEngine';
import { auditEngine, notificationEngine } from '../../engines';
import { supportTicketRepository } from '../../services/db/SupportTicketRepository';
import { Complaint, SupportTicket } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const ComplaintCentrePage = () => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'COMPLAINTS'>('TICKETS');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED' | 'CRITICAL'>('ALL');
  const [adminResponse, setAdminResponse] = useState('');
  const [ticketResponseStatus, setTicketResponseStatus] = useState<'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to Complaints
  useEffect(() => {
    setLoading(true);
    const unsubscribeComplaints = adminEngine.subscribeToComplaints((data: any) => {
      setComplaints(data || []);
      setLoading(false);
    });

    return () => unsubscribeComplaints();
  }, []);

  // Subscribe to Support Tickets
  useEffect(() => {
    const unsubscribeTickets = supportTicketRepository.subscribeToAll((data) => {
      setTickets(data || []);
    });

    return () => unsubscribeTickets();
  }, []);

  const handleResolveComplaint = async (id: string) => {
    if (!adminResponse.trim()) {
      toast.error('Please enter a response message');
      return;
    }
    setIsSubmitting(true);

    try {
      await adminEngine.updateComplaint(id, {
        status: 'RESOLVED_ADMIN',
        adminNotes: adminResponse,
        updatedAt: new Date().toISOString()
      }, 'admin');

      setAdminResponse('');
      setSelectedComplaint(null);
      toast.success('Complaint resolved successfully!');
    } catch (error) {
      console.error('Error resolving complaint:', error);
      toast.error('Failed to resolve complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicket = async (ticket: SupportTicket) => {
    if (!adminResponse.trim()) {
      toast.error('Please enter a response message');
      return;
    }
    setIsSubmitting(true);

    try {
      const updatedTicket: Partial<SupportTicket> = {
        status: ticketResponseStatus,
        updatedAt: new Date().toISOString(),
      };

      await supportTicketRepository.update(ticket.id, updatedTicket);

      // Trigger notification to customer
      if (ticket.userId) {
        await notificationEngine.send(
          ticket.userId,
          `Support Ticket Response #${ticket.id}`,
          `Our Support Officer has updated your ticket (${ticket.subject}) to ${ticketResponseStatus}. Note: "${adminResponse}"`,
          'INFO',
          '/customer/support',
          'SYSTEM'
        );
      }

      await auditEngine.logEvent({
        userId: 'ADMIN',
        userRole: 'SUPER_ADMIN',
        action: 'SUPPORT_TICKET_UPDATED',
        details: { ticketId: ticket.id, status: ticketResponseStatus, response: adminResponse },
        targetId: ticket.id,
        result: 'SUCCESS'
      });

      setAdminResponse('');
      setSelectedTicket(null);
      toast.success(`Ticket #${ticket.id} updated to ${ticketResponseStatus}`);
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'OPEN' && t.status !== 'OPEN' && t.status !== 'IN_PROGRESS') return false;
    if (filter === 'RESOLVED' && t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
    if (filter === 'CRITICAL' && t.priority !== 'URGENT' && t.priority !== 'HIGH') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (t.subject || '').toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredComplaints = complaints.filter(c => {
    if (filter === 'OPEN' && c.status === 'RESOLVED_ADMIN') return false;
    if (filter === 'RESOLVED' && c.status !== 'RESOLVED_ADMIN' && c.status !== 'RESOLVED_AI') return false;
    if (filter === 'CRITICAL' && c.priority !== 'CRITICAL') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.title || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q) || (c.userName || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">Support & Complaint Centre</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
              Official WeSabiHub Operations Command for resolving customer support tickets and platform disputes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => { setActiveTab('TICKETS'); setSelectedComplaint(null); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'TICKETS'
                    ? "bg-white dark:bg-slate-900 text-primary-600 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <LifeBuoy size={14} /> Support Tickets ({tickets.length})
              </button>
              <button
                onClick={() => { setActiveTab('COMPLAINTS'); setSelectedTicket(null); }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === 'COMPLAINTS'
                    ? "bg-white dark:bg-slate-900 text-primary-600 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <FileText size={14} /> Complaints & Disputes ({complaints.length})
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['ALL', 'OPEN', 'CRITICAL', 'RESOLVED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  filter === f
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/10"
                    : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 w-full sm:w-72">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets & complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-medium w-full text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Content Section */}
        {activeTab === 'TICKETS' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Tickets List */}
            <div className={cn("space-y-4 transition-all duration-300", selectedTicket ? "lg:col-span-5" : "lg:col-span-12")}>
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">No support tickets found matching your criteria.</div>
                  ) : (
                    filteredTickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={cn(
                          "p-6 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative group",
                          selectedTicket?.id === ticket.id ? "bg-primary-50/40 dark:bg-primary-950/20 border-l-4 border-primary-600" : "bg-white dark:bg-slate-900"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-[9px] font-black px-2 py-0.5 border-none",
                              ticket.priority === 'URGENT' ? 'bg-red-500 text-white' :
                              ticket.priority === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                            )}>
                              {ticket.priority}
                            </Badge>
                            <Badge className={cn("text-[9px] font-black px-2 py-0.5 border-none",
                              ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            )}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{ticket.id}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors mb-1">{ticket.subject}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ticket.message}</p>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                          <span>Category: <strong className="text-slate-700 dark:text-slate-300">{ticket.category}</strong></span>
                          <span>{new Date(ticket.createdAt || '').toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Ticket Details Panel */}
            <AnimatePresence>
              {selectedTicket && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-7"
                >
                  <Card className="border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[700px] sticky top-24 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 hover:bg-slate-200 rounded-xl">
                          <ArrowLeft size={18} />
                        </button>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white tracking-tight">{selectedTicket.subject}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket #{selectedTicket.id} • User: {selectedTicket.userId}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary-100 text-primary-800 border-none font-bold">{selectedTicket.status}</Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">User Support Complaint Message</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.message}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-300">Ticket Route Info:</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          This complaint was logged directly from the user's Support Portal. Responding will update the user's ticket status in real-time and send an instant notification.
                        </p>
                      </div>
                    </div>

                    {/* Reply / Resolution */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Ticket Status:</label>
                        <select
                          value={ticketResponseStatus}
                          onChange={(e) => setTicketResponseStatus(e.target.value as any)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </div>

                      <textarea
                        placeholder="Type official Support Officer response to user..."
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-primary-500 focus:border-primary-500 min-h-[90px] text-slate-900 dark:text-white"
                      />

                      <div className="flex justify-end gap-3">
                        <Button variant="ghost" className="font-bold text-xs" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                        <Button
                          className="font-bold text-xs rounded-xl px-8"
                          isLoading={isSubmitting}
                          onClick={() => handleUpdateTicket(selectedTicket)}
                        >
                          <Send size={16} className="mr-2" /> Send Response & Update Ticket
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Complaints View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className={cn("space-y-4 transition-all duration-300", selectedComplaint ? "lg:col-span-5" : "lg:col-span-12")}>
              <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredComplaints.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">No complaints found matching criteria.</div>
                  ) : (
                    filteredComplaints.map(complaint => (
                      <div
                        key={complaint.id}
                        onClick={() => setSelectedComplaint(complaint)}
                        className={cn(
                          "p-6 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative group",
                          selectedComplaint?.id === complaint.id ? "bg-primary-50/40 border-l-4 border-primary-600" : "bg-white dark:bg-slate-900"
                        )}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <Badge className="bg-amber-500 text-white text-[9px] font-black">{complaint.priority}</Badge>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">{complaint.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{complaint.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {selectedComplaint && (
              <div className="lg:col-span-7">
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-bold text-lg dark:text-white">{selectedComplaint.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.description}</p>
                  <textarea
                    placeholder="Type official resolution notes..."
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    className="w-full p-4 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                  <Button onClick={() => handleResolveComplaint(selectedComplaint.id)} isLoading={isSubmitting}>
                    Resolve Complaint
                  </Button>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
