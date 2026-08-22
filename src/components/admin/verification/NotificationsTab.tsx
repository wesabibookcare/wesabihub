import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { systemSettingsRepository } from '../../../services/db/SystemSettingsRepository';
import {
  Bell,
  Save,
  Loader2,
  MessageSquare,
  Mail,
  RefreshCw,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  title: string;
  body: string;
  enabled: boolean;
}

export const NotificationsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for templates
  const [received, setReceived] = useState<Template>({
    title: 'Application Received ⏳',
    body: 'Thank you for submitting your onboarding details. Our compliance team is currently auditing your credentials. We will notify you of status changes within 24 hours.',
    enabled: true
  });
  const [approved, setApproved] = useState<Template>({
    title: 'Role Application Approved 🎉',
    body: 'Congratulations! Your application to register has been successfully approved by our Verification desk. You now have full unlocked access to all specialized partner workflows.',
    enabled: true
  });
  const [rejected, setRejected] = useState<Template>({
    title: 'Application Rejected ⚠️',
    body: 'We regret to inform you that your registration application has been rejected. Details regarding this decision are attached. Please resolve these issues and resubmit.',
    enabled: true
  });
  const [reupload, setReupload] = useState<Template>({
    title: 'Document Re-upload Required 📝',
    body: 'One or more of your uploaded files failed our authenticity scans. Please sign back into your profile completion portal and submit a clearer copy as requested.',
    enabled: true
  });
  const [suspended, setSuspended] = useState<Template>({
    title: 'Verification Suspended ⏳',
    body: 'Your credentials validation has been suspended temporarily pending strict national compliance verification. No action is required from you at this moment.',
    enabled: true
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const settings = await systemSettingsRepository.getGlobalSettings();
        if (settings?.notificationTemplates) {
          const t = settings.notificationTemplates;
          if (t.received) setReceived(t.received);
          if (t.approved) setApproved(t.approved);
          if (t.rejected) setRejected(t.rejected);
          if (t.reupload) setReupload(t.reupload);
          if (t.suspended) setSuspended(t.suspended);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load notification templates');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSaveTemplates = async () => {
    setSaving(true);
    try {
      const templatesPayload = {
        received,
        approved,
        rejected,
        reupload,
        suspended
      };

      await systemSettingsRepository.update('global', {
        notificationTemplates: templatesPayload,
        updatedAt: new Date().toISOString()
      });
      toast.success('Automated notification templates published');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Onboarding Automated Notifications</h2>
          <p className="text-xs text-slate-500">Customize the headers and body messages pushed automatically to applicants during the verification process.</p>
        </div>
        <Button
          onClick={handleSaveTemplates}
          disabled={saving}
          className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md h-10 min-w-32 text-xs"
        >
          {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
          Publish Templates
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="animate-spin text-primary-600" size={24} />
          <p className="text-xs text-slate-400 font-bold">Loading notification models...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Received Template */}
          <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-600" size={16} />
                  <span className="font-bold text-slate-800">Trigger: Onboarding Form Submitted</span>
                </div>
                <input
                  type="checkbox"
                  checked={received.enabled}
                  onChange={e => setReceived({ ...received, enabled: e.target.checked })}
                  className="rounded text-primary-600 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Notification Header / Title</label>
                    <input
                      type="text"
                      value={received.title}
                      onChange={e => setReceived({ ...received, title: e.target.value })}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Push Message Body</label>
                    <textarea
                      value={received.body}
                      onChange={e => setReceived({ ...received, body: e.target.value })}
                      rows={3}
                      className="w-full p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col justify-center">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Live Inbox Push Simulation:</h4>
                  <div className="bg-white p-3 rounded-xl border shadow-sm space-y-1">
                    <p className="font-bold text-slate-800 text-xs">{received.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{received.body}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approved Template */}
          <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-600" size={16} />
                  <span className="font-bold text-slate-800">Trigger: Onboarding Approved</span>
                </div>
                <input
                  type="checkbox"
                  checked={approved.enabled}
                  onChange={e => setApproved({ ...approved, enabled: e.target.checked })}
                  className="rounded text-primary-600 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Notification Header / Title</label>
                    <input
                      type="text"
                      value={approved.title}
                      onChange={e => setApproved({ ...approved, title: e.target.value })}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Push Message Body</label>
                    <textarea
                      value={approved.body}
                      onChange={e => setApproved({ ...approved, body: e.target.value })}
                      rows={3}
                      className="w-full p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col justify-center">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Live Inbox Push Simulation:</h4>
                  <div className="bg-white p-3 rounded-xl border shadow-sm space-y-1">
                    <p className="font-bold text-slate-800 text-xs">{approved.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{approved.body}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejected Template */}
          <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-600" size={16} />
                  <span className="font-bold text-slate-800">Trigger: Onboarding Rejected</span>
                </div>
                <input
                  type="checkbox"
                  checked={rejected.enabled}
                  onChange={e => setRejected({ ...rejected, enabled: e.target.checked })}
                  className="rounded text-primary-600 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Notification Header / Title</label>
                    <input
                      type="text"
                      value={rejected.title}
                      onChange={e => setRejected({ ...rejected, title: e.target.value })}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Push Message Body</label>
                    <textarea
                      value={rejected.body}
                      onChange={e => setRejected({ ...rejected, body: e.target.value })}
                      rows={3}
                      className="w-full p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col justify-center">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Live Inbox Push Simulation:</h4>
                  <div className="bg-white p-3 rounded-xl border shadow-sm space-y-1">
                    <p className="font-bold text-slate-800 text-xs">{rejected.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{rejected.body}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Re-upload template */}
          <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-blue-500" size={16} />
                  <span className="font-bold text-slate-800">Trigger: Document Re-upload Request</span>
                </div>
                <input
                  type="checkbox"
                  checked={reupload.enabled}
                  onChange={e => setReupload({ ...reupload, enabled: e.target.checked })}
                  className="rounded text-primary-600 h-4 w-4"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Notification Header / Title</label>
                    <input
                      type="text"
                      value={reupload.title}
                      onChange={e => setReupload({ ...reupload, title: e.target.value })}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Push Message Body</label>
                    <textarea
                      value={reupload.body}
                      onChange={e => setReupload({ ...reupload, body: e.target.value })}
                      rows={3}
                      className="w-full p-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border rounded-2xl flex flex-col justify-center">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-2">Live Inbox Push Simulation:</h4>
                  <div className="bg-white p-3 rounded-xl border shadow-sm space-y-1">
                    <p className="font-bold text-slate-800 text-xs">{reupload.title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{reupload.body}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
