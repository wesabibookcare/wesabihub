import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { policyVersionRepository } from '../../services/db/PolicyVersionRepository';
import { PolicyVersion, UserRole } from '../../types';
import { FileText, Plus, History, Archive, Check, Edit3, Globe, Shield, UserCheck, AlertTriangle, Eye, Save } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { complianceEngine } from '../../engines/ComplianceEngine';
import { toast } from 'sonner';
import { configurationEngine } from '../../engines/ConfigurationEngine';

export const LegalManagementTab = () => {
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyVersion>>({
    policyKey: 'TERMS_AND_CONDITIONS',
    version: '1.0.1',
    content: '',
    requiresReAcceptance: false,
    status: 'PUBLISHED'
  });

  const [complianceConfig, setComplianceConfig] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'versions' | 'config'>('versions');

  useEffect(() => {
    fetchPolicies();
    fetchConfig();
  }, []);

  const fetchPolicies = async () => {
    const data = await policyVersionRepository.getAll();
    setPolicies(data.sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)));
    setLoading(false);
  };

  const fetchConfig = async () => {
    const config = await configurationEngine.getComplianceConfig();
    setComplianceConfig(config);
  };

  const handlePublish = async () => {
    if (!editingPolicy.policyKey || !editingPolicy.version || !editingPolicy.content) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const id = `${editingPolicy.policyKey}-${Date.now()}`;
      await policyVersionRepository.create(id, {
        ...editingPolicy,
        id,
        publishedBy: 'ADMIN',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as PolicyVersion);

      toast.success(`Published ${editingPolicy.policyKey} v${editingPolicy.version}`);
      setShowEditor(false);
      fetchPolicies();
    } catch (err) {
      toast.error('Failed to publish policy');
    }
  };

  const archivePolicy = async (id: string) => {
    try {
      await policyVersionRepository.update(id, { status: 'ARCHIVED', updatedAt: new Date().toISOString() });
      toast.success('Policy archived');
      fetchPolicies();
    } catch (err) {
      toast.error('Failed to archive policy');
    }
  };

  const saveConfig = async () => {
    try {
      const currentSettings = await configurationEngine.getGlobalSettings();
      await configurationEngine.updateSystemSettings('global', {
        ...currentSettings,
        complianceConfig
      });
      toast.success('Compliance configuration updated');
    } catch (err) {
      toast.error('Failed to update configuration');
    }
  };

  const availableKeys = [
    { key: 'TERMS_AND_CONDITIONS', label: 'Terms & Conditions' },
    { key: 'PRIVACY_POLICY', label: 'Privacy Policy' },
    { key: 'MERCHANT_AGREEMENT', label: 'Merchant Agreement' },
    { key: 'CENTRE_AGREEMENT', label: 'Hub Center Agreement' },
    { key: 'TRAINING_ACCEPTANCE', label: 'Training Acceptance' },
    { key: 'LOGISTICS_COMPANY_AGREEMENT', label: 'Logistics Company Agreement' },
    { key: 'DISPATCH_PARTNER_AGREEMENT', label: 'Dispatch Partner Agreement' },
    { key: 'API_PARTNER_AGREEMENT', label: 'API Partner Agreement' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('versions')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'versions' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-500'}`}
        >
          Agreement Versions
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'config' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary-600' : 'text-slate-500'}`}
        >
          Role Compliance Mapping
        </button>
      </div>

      {activeSubTab === 'versions' && (
        <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-6 shadow-xl rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <FileText className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="font-black dark:text-white text-base tracking-tight uppercase italic">Legal Policy Management</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Version Control & Content Lifecycle</p>
              </div>
            </div>
            {!showEditor && (
              <Button size="sm" className="rounded-xl font-bold" onClick={() => setShowEditor(true)}>
                <Plus size={16} className="mr-2" /> Publish New Version
              </Button>
            )}
          </div>

          {showEditor && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-primary-100 dark:border-primary-900/30 space-y-6 animate-in fade-in slide-in-from-top-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Policy Agreement Type</label>
                  <select
                    value={editingPolicy.policyKey}
                    onChange={(e) => setEditingPolicy({...editingPolicy, policyKey: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {availableKeys.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Version Number (SemVer)</label>
                  <input
                    value={editingPolicy.version}
                    onChange={(e) => setEditingPolicy({...editingPolicy, version: e.target.value})}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 1.0.1"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Agreement Content (Markdown Supported)</label>
                <textarea
                  rows={10}
                  value={editingPolicy.content}
                  onChange={(e) => setEditingPolicy({...editingPolicy, content: e.target.value})}
                  className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-mono leading-relaxed focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="# Enter Policy Content..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={editingPolicy.requiresReAcceptance}
                    onChange={(e) => setEditingPolicy({...editingPolicy, requiresReAcceptance: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors">Force Re-acceptance</span>
                    <p className="text-[10px] text-slate-500 font-medium">Logged-in users must accept this specific version before proceeding.</p>
                  </div>
                </label>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => setShowEditor(false)}>Cancel</Button>
                  <Button size="sm" className="rounded-xl font-bold" onClick={handlePublish}>
                    <Check size={16} className="mr-2" /> Confirm Publication
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {policies.map(policy => (
              <div key={policy.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary-500/30 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${policy.status === 'PUBLISHED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black dark:text-white tracking-tight italic uppercase">{policy.policyKey.replace(/_/g, ' ')}</h4>
                      <Badge variant="outline" className="bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-800 font-mono text-[9px]">v{policy.version}</Badge>
                      {policy.requiresReAcceptance && (
                        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-900/10 text-rose-600 border-rose-200 dark:border-rose-800 text-[9px] flex items-center gap-1">
                          <AlertTriangle size={10} /> FORCE RE-ACCEPT
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Published: {new Date(policy.publishedAt).toLocaleString()} by {policy.publishedBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge className={`${policy.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-slate-500'} text-[9px] rounded-lg px-2`}>{policy.status}</Badge>
                   <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl"><Eye size={14} /></Button>
                   {policy.status === 'PUBLISHED' && (
                     <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-200" onClick={() => archivePolicy(policy.id)}>
                       <Archive size={14} />
                     </Button>
                   )}
                </div>
              </div>
            ))}
            {policies.length === 0 && (
              <div className="py-20 text-center space-y-3 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <FileText size={40} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 font-medium">No policy agreements found. Publish your first version above.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeSubTab === 'config' && complianceConfig && (
        <Card className="p-8 border-slate-200 dark:border-slate-800 space-y-8 shadow-xl rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 font-display">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                <UserCheck className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="font-black dark:text-white text-base tracking-tight uppercase italic">Role Compliance Configuration</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Map Legal Agreements to User Roles</p>
              </div>
            </div>
            <Button size="sm" className="rounded-xl font-bold" onClick={saveConfig}>
              <Save size={16} className="mr-2" /> Save Configuration
            </Button>
          </div>

          <div className="space-y-8">
            {/* Mandatory Global Policies */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Globe size={14} /> Universal Mandatory Policies
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableKeys.map(k => (
                  <label key={k.key} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-primary-500 transition-all">
                    <input
                      type="checkbox"
                      checked={complianceConfig.mandatoryPolicies.includes(k.key)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...complianceConfig.mandatoryPolicies, k.key]
                          : complianceConfig.mandatoryPolicies.filter((p: string) => p !== k.key);
                        setComplianceConfig({...complianceConfig, mandatoryPolicies: next});
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-bold dark:text-white uppercase tracking-tight">{k.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Role Specific Policies */}
            <div className="space-y-4 pt-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Shield size={14} /> Role-Specific Agreements
              </h4>
              <div className="space-y-6">
                {(['MERCHANT', 'CENTER_OWNER', 'CENTER_STAFF', 'LOGISTICS_COMPANY', 'DISPATCH_RIDER', 'DEVELOPER'] as UserRole[]).map(role => (
                  <div key={role} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-sm font-black dark:text-white uppercase italic">{role.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest">Requires Specific Acceptance</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {availableKeys.map(k => (
                        <label key={k.key} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(complianceConfig.roleSpecificPolicies[role] || []).includes(k.key)}
                            onChange={(e) => {
                              const current = complianceConfig.roleSpecificPolicies[role] || [];
                              const next = e.target.checked
                                ? [...current, k.key]
                                : current.filter((p: string) => p !== k.key);
                              setComplianceConfig({
                                ...complianceConfig,
                                roleSpecificPolicies: {
                                  ...complianceConfig.roleSpecificPolicies,
                                  [role]: next
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-[10px] font-bold dark:text-white uppercase tracking-tight">{k.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
