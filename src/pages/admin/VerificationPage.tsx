import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { motion } from 'motion/react';
import {
  Users,
  FileText,
  CheckCircle,
  Sliders,
  Globe,
  Bell,
  History,
  ShieldAlert,
  Loader2
} from 'lucide-react';

// Import modular tabs
import { RolesTab } from '../../components/admin/verification/RolesTab';
import { DocumentRequirementsTab } from '../../components/admin/verification/DocumentRequirementsTab';
import { ApprovalWorkflowTab } from '../../components/admin/verification/ApprovalWorkflowTab';
import { VerificationRulesTab } from '../../components/admin/verification/VerificationRulesTab';
import { CountriesTab } from '../../components/admin/verification/CountriesTab';
import { NotificationsTab } from '../../components/admin/verification/NotificationsTab';
import { AuditLogsTab } from '../../components/admin/verification/AuditLogsTab';

import { userEngine } from '@/src/engines';

type TabId = 'ROLES' | 'DOCUMENTS' | 'WORKFLOW' | 'RULES' | 'COUNTRIES' | 'NOTIFICATIONS' | 'LOGS';

export const VerificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('WORKFLOW');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to applications to show live badge count of pending applications
    const unsubscribe = userEngine.roles.subscribeToQuery([], (apps) => {
      const pending = apps.filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
      setPendingCount(pending);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const tabItems = [
    { id: 'WORKFLOW', label: 'Review Queue', icon: CheckCircle, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'ROLES', label: 'Roles Setup', icon: Users },
    { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
    { id: 'RULES', label: 'System Rules', icon: Sliders },
    { id: 'COUNTRIES', label: 'Localization', icon: Globe },
    { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
    { id: 'LOGS', label: 'Audit Trail', icon: History }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-primary-600 font-bold uppercase tracking-widest text-[9px] mb-1">Super Admin Controls</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Registration & Verification Management</h1>
            <p className="text-xs text-slate-900 font-medium">Configure roles, country localization overrides, custom verification flows, and audit candidate credentials.</p>
          </div>
        </div>

        {/* Tab Headers selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/50">
          {tabItems.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 shrink-0 select-none ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-900 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Icon size={14} className={active ? 'text-primary-600' : 'text-slate-800'} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-primary-500 text-white' : 'bg-slate-200 text-slate-900'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'WORKFLOW' && <ApprovalWorkflowTab />}
          {activeTab === 'ROLES' && <RolesTab />}
          {activeTab === 'DOCUMENTS' && <DocumentRequirementsTab />}
          {activeTab === 'RULES' && <VerificationRulesTab />}
          {activeTab === 'COUNTRIES' && <CountriesTab />}
          {activeTab === 'NOTIFICATIONS' && <NotificationsTab />}
          {activeTab === 'LOGS' && <AuditLogsTab />}
        </div>

      </div>
    </AdminLayout>
  );
};
export default VerificationPage;
