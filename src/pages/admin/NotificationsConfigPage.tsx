import React, { useState } from 'react';
import {
  Bell, Mail, MessageSquare, Smartphone, Save, ShieldAlert,
  Sliders, Plus, Clock, AlertCircle, Play, Sparkles, Check, ChevronRight, Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '@/src/lib/utils';

// Types for templates & automation
interface NotificationTemplate {
  id: string;
  eventName: string;
  recipientRole: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  variables: string[];
  defaultText: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  trigger: string;
  conditionDays: number;
  actionType: 'SEND_REMINDER' | 'EXPIRE_PIN' | 'CANCEL_SAFEPAY' | 'FLAG_DISPUTE';
}

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  { id: '1', eventName: 'Parcel Received at Destination', recipientRole: 'CUSTOMER', channels: { inApp: true, email: true, sms: true, push: true }, variables: ['{recipientName}', '{trackingNumber}', '{hubPointName}', '{pickupPin}'], defaultText: 'Hello {recipientName}, your package {trackingNumber} has arrived at {hubPointName}! Use PIN {pickupPin} to collect it.' },
  { id: '2', eventName: 'SafePay Dispute Initiated', recipientRole: 'MERCHANT', channels: { inApp: true, email: true, sms: false, push: true }, variables: ['{merchantName}', '{shipmentId}', '{disputeReason}'], defaultText: 'Urgent: Customer initiated a dispute for shipment {shipmentId}. Reason: {disputeReason}. Escalation review is active.' },
  { id: '3', eventName: 'Pickup PIN Expiring Reminder', recipientRole: 'CUSTOMER', channels: { inApp: true, email: false, sms: true, push: true }, variables: ['{recipientName}', '{trackingNumber}', '{hoursLeft}'], defaultText: 'Notice: You have {hoursLeft} hours remaining to pick up package {trackingNumber} before your temporary release PIN expires.' },
  { id: '4', eventName: 'Hub Center Verification Approved', recipientRole: 'CENTER_OWNER', channels: { inApp: true, email: true, sms: false, push: false }, variables: ['{ownerName}', '{hubName}'], defaultText: 'Congratulations {ownerName}! Your logistics hub center "{hubName}" has been successfully verified.' },
];

const INITIAL_RULES: AutomationRule[] = [
  { id: 'rule_1', name: 'Recipient Uncollected Parcel Reminder', description: 'Automatically dispatch SMS & Push notifications to customers with uncollected parcels.', isEnabled: true, trigger: 'When parcel has been ready for pickup at point', conditionDays: 2, actionType: 'SEND_REMINDER' },
  { id: 'rule_2', name: 'Temporary Pickup PIN Invalidation', description: 'Regenerate secure release PIN if the uncollected parcel pickup PIN expires.', isEnabled: true, trigger: 'When parcel has been in READY_FOR_PICKUP state', conditionDays: 5, actionType: 'EXPIRE_PIN' },
  { id: 'rule_3', name: 'SafePay Auto-Release/Holding Timeout', description: 'Auto-cancel the SafePay or trigger automatic escalation review if delivery status is unconfirmed.', isEnabled: true, trigger: 'When merchant ships but no custody receipt exists', conditionDays: 14, actionType: 'CANCEL_SAFEPAY' },
];

export const NotificationsConfigPage = () => {
  const [activeTab, setActiveTab] = useState<'channels' | 'rules' | 'test'>('rules');
  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Rule draft state
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState('When parcel is awaiting drop-off');
  const [newRuleDays, setNewRuleDays] = useState(3);
  const [newRuleAction, setNewRuleAction] = useState<AutomationRule['actionType']>('SEND_REMINDER');

  // Toggle channel
  const toggleChannel = (templateId: string, channel: 'inApp' | 'email' | 'sms' | 'push') => {
    setTemplates(prev => prev.map(t => {
      if (t.id === templateId) {
        return {
          ...t,
          channels: {
            ...t.channels,
            [channel]: !t.channels[channel]
          }
        };
      }
      return t;
    }));
  };

  // Toggle Automation Rule Enable/Disable
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  // Update rule day parameter
  const updateRuleDays = (ruleId: string, days: number) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, conditionDays: days } : r));
  };

  // Add a new custom rule
  const handleAddRule = () => {
    if (!newRuleName || !newRuleDesc) return;
    const rule: AutomationRule = {
      id: `rule_custom_${Date.now()}`,
      name: newRuleName,
      description: newRuleDesc,
      isEnabled: true,
      trigger: newRuleTrigger,
      conditionDays: newRuleDays,
      actionType: newRuleAction
    };
    setRules(prev => [...prev, rule]);
    setNewRuleName('');
    setNewRuleDesc('');
  };

  // Save Config to DB (Simulated repo update)
  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <p className="text-primary-600 dark:text-primary-400 font-bold uppercase tracking-widest text-[10px] mb-1">
              Automated Dispatch & Timeline Guards
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-display">
              Automation & Notifications
            </h1>
            <p className="text-sm text-slate-900 font-medium">
              Configure system holding rules, auto-expirations, and multi-channel role templates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl flex items-center border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('rules')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'rules' ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-900 hover:text-slate-950"
                )}
              >
                <Sliders size={14} className="inline mr-1.5 mb-0.5" /> Automation Rules
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  activeTab === 'channels' ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-900 hover:text-slate-950"
                )}
              >
                <Bell size={14} className="inline mr-1.5 mb-0.5" /> Dispatch Templates
              </button>
            </div>

            <Button
              onClick={handleSaveAll}
              isLoading={isSaving}
              className="rounded-xl font-bold shadow-lg shadow-primary-500/10 px-6 py-2.5"
            >
              <Save size={16} className="mr-2" /> Save Rule System
            </Button>
          </div>
        </div>

        {/* Saved Alert Toast */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-3">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>Success: Saved notification templates and automation rules to OmorfiHub configuration repository.</span>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 1: AUTOMATION RULES ENGINE PANEL                       */}
        {/* ========================================================== */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left: Active Automation Rules */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                      Cron Automation Timeline Rules
                    </h3>
                    <p className="text-xs text-slate-800 mt-0.5">
                      Operational background checks enforcing SafePay validity and pin timers.
                    </p>
                  </div>
                  <Badge className="bg-primary-100 text-primary-700 hover:bg-primary-100 border-none px-2.5 py-1 font-bold">
                    ACTIVE DAEMON
                  </Badge>
                </div>

                <div className="space-y-6">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all relative overflow-hidden",
                        rule.isEnabled
                          ? "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800"
                          : "bg-slate-100/30 dark:bg-slate-900/10 border-slate-200/30 dark:border-slate-800/40 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              rule.actionType === 'SEND_REMINDER' ? 'bg-blue-500' :
                              rule.actionType === 'EXPIRE_PIN' ? 'bg-amber-500' :
                              'bg-red-500'
                            )} />
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{rule.name}</h4>
                          </div>
                          <p className="text-xs text-slate-900 font-medium leading-relaxed max-w-xl">{rule.description}</p>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={rule.isEnabled}
                            onChange={() => toggleRule(rule.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-4" />

                      {/* Rule configuration parameters */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[11px] text-slate-900 font-bold">
                          <Clock size={12} />
                          <span>Trigger:</span>
                          <span className="text-slate-900 dark:text-slate-300 italic">{rule.trigger}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Duration Limit:</span>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={rule.conditionDays}
                            onChange={(e) => updateRuleDays(rule.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-black rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100 text-center font-mono"
                          />
                          <span className="text-[10px] font-bold text-slate-900">Days</span>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Custom Rule Creator */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={16} className="text-primary-600" /> New Automation Rule
                  </h3>
                  <p className="text-[10px] text-slate-800 mt-0.5">Extend the daemon system with custom timeouts.</p>
                </div>

                <div className="space-y-4">

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Rule Label Name</label>
                    <input
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. Carrier Transit Deadline"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Operational Description</label>
                    <textarea
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      placeholder="Triggers a security alert if logistics transit takes too long."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-medium dark:text-white"
                    />
                  </div>

                  {/* Trigger event selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Core Trigger Event</label>
                    <select
                      value={newRuleTrigger}
                      onChange={(e) => setNewRuleTrigger(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    >
                      <option value="When parcel is awaiting drop-off">When parcel is awaiting drop-off</option>
                      <option value="When driver initiates IN_TRANSIT">When driver initiates IN_TRANSIT</option>
                      <option value="When support team triggers dispute hold">When support team triggers dispute hold</option>
                    </select>
                  </div>

                  {/* Core action parameter selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">Systemic Daemon Action</label>
                    <select
                      value={newRuleAction}
                      onChange={(e) => setNewRuleAction(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    >
                      <option value="SEND_REMINDER">Dispatch Alert/Reminder</option>
                      <option value="EXPIRE_PIN">Invalidate Security PIN</option>
                      <option value="CANCEL_SAFEPAY">Cancel SafePay (Refund Merchant)</option>
                      <option value="FLAG_DISPUTE">Escalate Flag as Security Dispute</option>
                    </select>
                  </div>

                  {/* Days */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">SLA Limit (Days)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={newRuleDays}
                      onChange={(e) => setNewRuleDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold dark:text-white"
                    />
                  </div>

                  <Button
                    onClick={handleAddRule}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-850 shadow-md border-none text-white mt-2"
                  >
                    Add custom Rule
                  </Button>

                </div>
              </Card>
            </div>

          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: DISPATCH CHANNEL TEMPLATES PANEL                    */}
        {/* ========================================================== */}
        {activeTab === 'channels' && (
          <Card className="p-6 border-slate-100 dark:border-slate-800 shadow-md">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                Multi-Channel Notification Dispatcher
              </h3>
              <p className="text-xs text-slate-800 mt-0.5">
                Manage automated system text patterns and active delivery channels by user roles.
              </p>
            </div>

            <div className="space-y-6">
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{tmpl.eventName}</h4>
                      <Badge className="bg-indigo-50 text-indigo-700 border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Recipient: {tmpl.recipientRole}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-800 uppercase tracking-widest block">Message Template</label>
                      <textarea
                        value={tmpl.defaultText}
                        onChange={(e) => {
                          const updatedText = e.target.value;
                          setTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, defaultText: updatedText } : t));
                        }}
                        rows={2}
                        className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl text-slate-900 dark:text-slate-300 font-sans focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>

                    {/* Supported tags variable list */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-slate-800">
                      <span className="font-bold font-sans uppercase tracking-widest mr-1 text-slate-800">Supported variables:</span>
                      {tmpl.variables.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-300">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Channel selectors toggles row */}
                  <div className="flex flex-row md:flex-col gap-4 border-l border-slate-100 dark:border-slate-800/80 pl-6 shrink-0 justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-800 hidden md:block">Operational channels</div>

                    <div className="space-y-2">
                      {[
                        { key: 'inApp', label: 'In-App Alert', icon: Bell },
                        { key: 'email', label: 'Email SMTP', icon: Mail },
                        { key: 'sms', label: 'SMS Carrier', icon: MessageSquare },
                        { key: 'push', label: 'Push (FCM)', icon: Smartphone },
                      ].map(chan => {
                        const Icon = chan.icon;
                        const isChecked = tmpl.channels[chan.key as keyof typeof tmpl.channels];
                        return (
                          <div key={chan.key} className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                              <Icon size={12} className={isChecked ? "text-primary-600" : "text-slate-800"} />
                              {chan.label}
                            </span>

                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleChannel(tmpl.id, chan.key as any)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Informational tip */}
            <div className="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl mt-6">
              <Info size={16} className="text-primary-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-primary-700 dark:text-primary-300 leading-normal">
                Multi-channel templates utilize external microservice handlers (Amazon SES for SMTP, Twilio API for global SMS carriers, and Firebase Cloud Messaging for Push payloads). Disabling a specific channel halts message emission pipeline execution immediately.
              </p>
            </div>

          </Card>
        )}

      </div>
    </AdminLayout>
  );
};
