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
import { centreEngine } from '../../engines';
import { HubCenter } from '../../types';

export const HubApprovalsPage = () => {
  const [pendingHubs, setPendingHubs] = useState<HubCenter[]>([]);
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

  useEffect(() => {
    loadPendingHubs();
  }, []);

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
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-black dark:text-white font-display flex items-center gap-2.5">
            Hub Approvals
            {pendingHubs.length > 0 && (
              <Badge variant="warning" className="h-7 px-3">{pendingHubs.length} pending</Badge>
            )}
          </h1>
          <p className="text-slate-900 text-sm mt-1">
            Review new hub/PUDO point registrations. A hub only becomes visible to customers and merchants after it's approved here.
          </p>
        </div>

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
    </AdminLayout>
  );
};
