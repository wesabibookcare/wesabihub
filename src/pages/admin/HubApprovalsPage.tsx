import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Inbox
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { centreEngine } from '../../engines';
import { HubCenter } from '../../types';

export interface HubPayoutRequest {
  id: string;
  hubId: string;
  hubName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export const HubApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<'APPROVALS' | 'PAYOUTS'>('APPROVALS');
  const [pendingHubs, setPendingHubs] = useState<HubCenter[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<HubPayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadPendingHubs = async () => {
    setIsLoading(true);
    try {
      const hubs = await centreEngine.getPendingHubs();
      setPendingHubs(hubs);
    } catch (err) {
      console.error('Failed to load pending hubs:', err);
      toast.error('Could not load pending hub applications.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayoutRequests = async () => {
    setIsLoading(true);
    try {
      // In production, fetch live hub payout requests from database/centreEngine
      setPayoutRequests([]);
    } catch (err) {
      console.error('Failed to load payout requests:', err);
      toast.error('Could not load payout requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'APPROVALS') {
      loadPendingHubs();
    } else {
      loadPayoutRequests();
    }
  }, [activeTab]);

  const handleApprovePayout = async (req: HubPayoutRequest) => {
    // Bank details validation
    if (!req.accountNumber || !/^\d{10}$/.test(req.accountNumber.trim())) {
      toast.error('Invalid Bank Account Number: Must be a valid 10-digit NUBAN number.');
      return;
    }
    if (!req.bankName || req.bankName.trim().length < 2) {
      toast.error('Invalid Bank Name: Must specify a valid financial institution.');
      return;
    }
    if (!req.accountName || req.accountName.trim().length < 3) {
      toast.error('Invalid Account Name: Account holder name must be verified.');
      return;
    }
    if (!req.amount || req.amount <= 0) {
      toast.error('Invalid Payout Amount.');
      return;
    }

    setActioningId(req.id);
    try {
      setPayoutRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'APPROVED', processedAt: new Date().toISOString() } : p));
      toast.success(`Payout of ₦${req.amount.toLocaleString()} for "${req.hubName}" approved successfully.`);
    } catch (err: any) {
      toast.error('Failed to approve payout request.');
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectPayout = async (req: HubPayoutRequest) => {
    const reason = window.prompt(`Reason for rejecting ₦${req.amount.toLocaleString()} payout to "${req.hubName}"?`);
    if (reason === null) return;
    setActioningId(req.id);
    try {
      setPayoutRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'REJECTED', rejectionReason: reason, processedAt: new Date().toISOString() } : p));
      toast.success(`Payout request rejected.`);
    } catch (err: any) {
      toast.error('Failed to reject payout request.');
    } finally {
      setActioningId(null);
    }
  };

  const handleApprove = async (hub: HubCenter) => {
    setActioningId(hub.id);
    try {
      await centreEngine.approveHub(hub.id);
      toast.success(`"${hub.name}" is now approved and visible to customers.`);
      setPendingHubs(prev => prev.filter(h => h.id !== hub.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve this hub.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (hub: HubCenter) => {
    const reason = window.prompt(`Why are you rejecting "${hub.name}"? (This will be visible to the hub owner)`);
    if (reason === null) return; // Cancelled
    setActioningId(hub.id);
    try {
      await centreEngine.rejectHub(hub.id, reason);
      toast.success(`"${hub.name}" has been rejected.`);
      setPendingHubs(prev => prev.filter(h => h.id !== hub.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject this hub.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-16">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black dark:text-white font-display flex items-center gap-2.5">
              Hub Approvals & Payout Center
            </h1>
            <p className="text-slate-900 text-sm mt-1">
              Review hub registrations and process Hub Center revenue withdrawal/payout requests ("Request for Pay").
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 w-fit">
            <button
              onClick={() => setActiveTab('APPROVALS')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'APPROVALS' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600"
              )}
            >
              Hub Registrations
              {pendingHubs.length > 0 && <Badge variant="warning" className="text-[10px] py-0 px-1.5 h-4">{pendingHubs.length}</Badge>}
            </button>
            <button
              onClick={() => setActiveTab('PAYOUTS')}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                activeTab === 'PAYOUTS' ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600"
              )}
            >
              Hub Pay Requests
              {payoutRequests.filter(p => p.status === 'PENDING').length > 0 && (
                <Badge variant="warning" className="text-[10px] py-0 px-1.5 h-4">
                  {payoutRequests.filter(p => p.status === 'PENDING').length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'PAYOUTS' && (
          <div className="space-y-6">
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Hub Withdrawal & Payout Requests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Request Date</th>
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Hub Center</th>
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Amount (₦)</th>
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Bank Details</th>
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payoutRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-mono text-[11px]">{new Date(req.requestedAt).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{req.hubName}</td>
                        <td className="px-4 py-3 font-black text-emerald-600 text-sm">₦{req.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{req.accountName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{req.bankName} • {req.accountNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}>
                            {req.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectPayout(req)}
                                disabled={actioningId === req.id}
                                className="h-8 text-xs font-bold text-red-600 border-red-200"
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleApprovePayout(req)}
                                disabled={actioningId === req.id}
                                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve Payout
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payoutRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">No payout requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'APPROVALS' && (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-slate-800">
                <Loader2 size={20} className="animate-spin" /> Loading pending hubs...
              </div>
            ) : pendingHubs.length === 0 ? (
              <Card className="p-12 flex flex-col items-center text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Inbox size={28} className="text-slate-600" />
                </div>
                <h2 className="text-xl font-bold dark:text-white font-display mb-1">No pending hubs</h2>
                <p className="text-slate-900 text-sm">New hub registrations will show up here for your approval.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingHubs.map(hub => (
                  <Card key={hub.id} className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold dark:text-white">{hub.name}</h3>
                          <p className="text-xs text-slate-800">{hub.type?.replace('_', ' ') || 'Other'}</p>
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 text-slate-900">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-slate-600" />
                        <span>{hub.address}, {hub.city}, {hub.state}{hub.lga ? `, ${hub.lga}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Phone size={15} className="shrink-0 text-slate-600" />
                        <span>{hub.contactPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Clock size={15} className="shrink-0 text-slate-600" />
                        <span>{hub.operatingHours || 'Not provided'}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(hub)}
                        disabled={actioningId === hub.id}
                        className="flex-1 rounded-xl h-11 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
                      >
                        <XCircle size={16} /> Reject
                      </Button>
                      <Button
                        onClick={() => handleApprove(hub)}
                        disabled={actioningId === hub.id}
                        className="flex-1 rounded-xl h-11 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={16} /> {actioningId === hub.id ? 'Approving...' : 'Approve'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
