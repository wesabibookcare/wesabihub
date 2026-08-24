import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { roleApplicationConfigRepository } from '../../../services/db/RoleApplicationConfigRepository';
import { documentRequirementRepository } from '../../../services/db/DocumentRequirementRepository';
import { RoleApplicationConfig, UserRole, ApplicationFieldConfig, DocumentRequirement } from '../../../types';
import {
  Save,
  Plus,
  Trash2,
  Check,
  User,
  Shield,
  Sliders,
  Loader2,
  BookOpen,
  FileText,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export const RolesTab: React.FC = () => {
  const [configs, setConfigs] = useState<RoleApplicationConfig[]>([]);
  const [docReqs, setDocReqs] = useState<DocumentRequirement[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('DISPATCH_RIDER');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active edit state for the selected role
  const [formState, setFormState] = useState<Partial<RoleApplicationConfig>>({
    role: 'DISPATCH_RIDER',
    fields: [],
    registrationEnabled: true,
    approvalType: 'MANUAL',
    requiredDocuments: [],
    optionalDocuments: [],
    trainingRequired: false,
    agreementsToAccept: ['TERMS_AND_CONDITIONS'],
    onboardingInstructions: '',
    defaultPermissions: []
  });

  // Dynamic field editor helper state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<ApplicationFieldConfig['type']>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allConfigs, allDocs] = await Promise.all([
        roleApplicationConfigRepository.getAll(),
        documentRequirementRepository.getAll()
      ]);
      setConfigs(allConfigs);
      setDocReqs(allDocs.filter(d => d.isActive && !d.isDeleted));

      // Load or set default configuration for the selected role
      const matched = allConfigs.find(c => c.role === selectedRole);
      if (matched) {
        setFormState({
          ...matched,
          registrationEnabled: matched.registrationEnabled ?? true,
          approvalType: matched.approvalType ?? 'MANUAL',
          requiredDocuments: matched.requiredDocuments ?? [],
          optionalDocuments: matched.optionalDocuments ?? [],
          trainingRequired: matched.trainingRequired ?? false,
          agreementsToAccept: matched.agreementsToAccept ?? ['TERMS_AND_CONDITIONS'],
          onboardingInstructions: matched.onboardingInstructions ?? '',
          defaultPermissions: matched.defaultPermissions ?? []
        });
      } else {
        // Build an elegant default empty config if not in DB
        setFormState({
          role: selectedRole,
          fields: [
            { name: 'fullName', label: 'Full Name', type: 'text', required: true },
            { name: 'phone', label: 'Phone Number', type: 'text', required: true }
          ],
          registrationEnabled: true,
          approvalType: 'MANUAL',
          requiredDocuments: [],
          optionalDocuments: [],
          trainingRequired: false,
          agreementsToAccept: ['TERMS_AND_CONDITIONS'],
          onboardingInstructions: 'Please fill in all requirements to activate your account.',
          defaultPermissions: []
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load role configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRole]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const matched = configs.find(c => c.role === selectedRole);
      const dataToSave = {
        ...formState,
        role: selectedRole,
        updatedAt: new Date().toISOString()
      };

      if (matched && matched.id) {
        await roleApplicationConfigRepository.update(matched.id, dataToSave);
      } else {
        const id = `CONFIG-${selectedRole}-${Date.now()}`;
        await roleApplicationConfigRepository.create(id, {
          ...dataToSave,
          id,
          createdAt: new Date().toISOString()
        } as RoleApplicationConfig);
      }
      toast.success(`Onboarding settings for ${selectedRole} saved successfully`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save onboarding settings');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      toast.error('Field key and label are both required');
      return;
    }

    const fieldKey = newFieldName.trim().replace(/\s+/g, '');
    const currentFields = formState.fields || [];
    if (currentFields.some(f => f.name === fieldKey)) {
      toast.error('A field with this identifier already exists');
      return;
    }

    const newField: ApplicationFieldConfig = {
      name: fieldKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: newFieldOptions ? newFieldOptions.split(',').map(o => o.trim()) : undefined
    };

    setFormState({
      ...formState,
      fields: [...currentFields, newField]
    });

    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldOptions('');
    toast.success('Onboarding field question added');
  };

  const removeField = (name: string) => {
    const currentFields = formState.fields || [];
    setFormState({
      ...formState,
      fields: currentFields.filter(f => f.name !== name)
    });
    toast.info('Onboarding field question removed');
  };

  const toggleRequiredDoc = (docId: string) => {
    const current = formState.requiredDocuments || [];
    const next = current.includes(docId)
      ? current.filter(id => id !== docId)
      : [...current, docId];
    setFormState({ ...formState, requiredDocuments: next });
  };

  const toggleOptionalDoc = (docId: string) => {
    const current = formState.optionalDocuments || [];
    const next = current.includes(docId)
      ? current.filter(id => id !== docId)
      : [...current, docId];
    setFormState({ ...formState, optionalDocuments: next });
  };

  const toggleAgreement = (agreement: string) => {
    const current = formState.agreementsToAccept || [];
    const next = current.includes(agreement)
      ? current.filter(a => a !== agreement)
      : [...current, agreement];
    setFormState({ ...formState, agreementsToAccept: next });
  };

  const togglePermission = (permission: string) => {
    const current = formState.defaultPermissions || [];
    const next = current.includes(permission)
      ? current.filter(p => p !== permission)
      : [...current, permission];
    setFormState({ ...formState, defaultPermissions: next });
  };

  const rolesList: UserRole[] = [
    'CUSTOMER',
    'MERCHANT',
    'CENTER_OWNER',
    'CENTER_STAFF',
    'LOGISTICS_COMPANY',
    'DRIVER',
    'DISPATCH_RIDER',
    'DEVELOPER',
    'API_MERCHANT_PARTNER',
    'SUPPORT_OFFICER',
    'VERIFICATION_OFFICER',
    'FINANCE_OFFICER',
    'OPERATIONS_MANAGER',
    'SUPER_ADMIN',
    'DISPUTE_ADMIN',
    'SUPPORT_ADMIN',
    'OPERATIONS_ADMIN',
    'VERIFICATION_ADMIN',
    'SECURITY_ADMIN',
    'FINANCE_ADMIN',
    'DISPATCH_COMPANY',
    'FLEET_MANAGER'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar role selector */}
      <Card className="lg:col-span-1 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden h-fit">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-bold text-slate-950 dark:text-white text-xs px-2 mb-3 uppercase tracking-wider text-slate-400">Select Partner Role</h3>
          <div className="space-y-1">
            {rolesList.map(r => {
              const active = r === selectedRole;
              const hasConfig = configs.some(c => c.role === r);
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition text-xs font-bold ${
                    active
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <User size={14} className={active ? 'text-white' : 'text-slate-400'} />
                    <span>{r.replace('_', ' ')}</span>
                  </div>
                  {hasConfig && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${
                      active ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      Configured
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Details Panel */}
      <Card className="lg:col-span-3 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedRole.replace('_', ' ')} Onboarding Settings</h3>
              <p className="text-xs text-slate-500">Fine-tune verification standards, forms, legal agreements and mandatory courses.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 font-bold"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
              Save Config
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-primary-600" size={24} />
              <p className="text-xs text-slate-400 font-bold">Fetching settings from cloud...</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs">

              {/* Toggle row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-2xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Enable Registrations</span>
                    <input
                      type="checkbox"
                      checked={formState.registrationEnabled ?? true}
                      onChange={e => setFormState({ ...formState, registrationEnabled: e.target.checked })}
                      className="rounded text-primary-600 h-4 w-4"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">If disabled, new applicants won't be able to register for this role.</p>
                </div>

                <div className="p-4 border rounded-2xl bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Verification Engine Approval Mode</span>
                    <select
                      value={formState.approvalType || 'MANUAL'}
                      onChange={e => setFormState({ ...formState, approvalType: e.target.value as any })}
                      className="h-8 px-2 font-bold rounded-lg border bg-white text-xs focus:outline-none"
                    >
                      <option value="MANUAL">Manual Review Required</option>
                      <option value="AUTOMATIC">Automatic Approval</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400">Automatic mode bypasses admin review queue if all fields and documents are supplied.</p>
                </div>
              </div>

              {/* Dynamic Profile Fields Form Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders size={14} className="text-slate-400" />
                    Dynamic Form Questions
                  </h4>
                  <Badge className="bg-slate-100 text-slate-600 font-bold">
                    {(formState.fields || []).length} Fields
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border">
                  <div className="space-y-3">
                    <h5 className="font-bold text-slate-700">Add custom profile question:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Field Identifier Key *</label>
                        <input
                          type="text"
                          placeholder="e.g. businessReg"
                          value={newFieldName}
                          onChange={e => setNewFieldName(e.target.value)}
                          className="w-full h-8 px-2 border rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Label / Question text *</label>
                        <input
                          type="text"
                          placeholder="e.g. Registration No."
                          value={newFieldLabel}
                          onChange={e => setNewFieldLabel(e.target.value)}
                          className="w-full h-8 px-2 border rounded-lg bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Answer Type</label>
                        <select
                          value={newFieldType}
                          onChange={e => setNewFieldType(e.target.value as any)}
                          className="w-full h-8 px-2 border rounded-lg bg-white"
                        >
                          <option value="text">Single Line Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Dropdown Select</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Requirement</label>
                        <select
                          value={newFieldRequired ? 'yes' : 'no'}
                          onChange={e => setNewFieldRequired(e.target.value === 'yes')}
                          className="w-full h-8 px-2 border rounded-lg bg-white"
                        >
                          <option value="yes">Mandatory Question</option>
                          <option value="no">Optional Question</option>
                        </select>
                      </div>
                    </div>

                    {newFieldType === 'select' && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Options (Comma separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Male, Female, Other"
                          value={newFieldOptions}
                          onChange={e => setNewFieldOptions(e.target.value)}
                          className="w-full h-8 px-2 border rounded-lg bg-white"
                        />
                      </div>
                    )}

                    <Button type="button" size="sm" onClick={addField} className="w-full bg-slate-900 text-white rounded-lg h-8">
                      <Plus size={14} className="mr-1" /> Add Question Field
                    </Button>
                  </div>

                  <div className="border-l pl-4 space-y-2 max-h-48 overflow-y-auto">
                    <h5 className="font-bold text-slate-700">Form Structure Preview:</h5>
                    {(formState.fields || []).map((f, index) => (
                      <div key={f.name} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span>{f.label}</span>
                            {f.required && <span className="text-red-500">*</span>}
                            <span className="text-[8px] bg-slate-100 text-slate-400 px-1 rounded uppercase font-black">{f.type}</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">Key: {f.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeField(f.name)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {(formState.fields || []).length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-4">No fields defined yet. Add some questions above.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Document Selection */}
              <div className="space-y-3">
                <div className="border-b pb-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-400" />
                    Required & Optional Documents Mapping
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required Docs column */}
                  <div className="p-4 border border-slate-200 bg-white rounded-2xl space-y-2 max-h-60 overflow-y-auto">
                    <h5 className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Mandatory Document Uploads:</h5>
                    {docReqs.map(doc => {
                      const selected = (formState.requiredDocuments || []).includes(doc.id);
                      return (
                        <label key={doc.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleRequiredDoc(doc.id)}
                            className="rounded text-primary-600 h-3.5 w-3.5"
                          />
                          <div>
                            <p className="font-bold text-slate-700">{doc.name}</p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[200px]">{doc.description}</p>
                          </div>
                        </label>
                      );
                    })}
                    {docReqs.length === 0 && <p className="text-[10px] text-slate-400 italic">No dynamic documents configured yet.</p>}
                  </div>

                  {/* Optional Docs column */}
                  <div className="p-4 border border-slate-200 bg-white rounded-2xl space-y-2 max-h-60 overflow-y-auto">
                    <h5 className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Optional Document Uploads:</h5>
                    {docReqs.map(doc => {
                      const selected = (formState.optionalDocuments || []).includes(doc.id);
                      return (
                        <label key={doc.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOptionalDoc(doc.id)}
                            className="rounded text-primary-600 h-3.5 w-3.5"
                          />
                          <div>
                            <p className="font-bold text-slate-700">{doc.name}</p>
                            <p className="text-[9px] text-slate-400 truncate max-w-[200px]">{doc.description}</p>
                          </div>
                        </label>
                      );
                    })}
                    {docReqs.length === 0 && <p className="text-[10px] text-slate-400 italic">No dynamic documents configured yet.</p>}
                  </div>
                </div>
              </div>

              {/* Onboarding instructions and legal agreements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Onboarding customization */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                    <Info size={14} className="text-slate-400" />
                    Onboarding Guidance
                  </h4>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-600">Onboarding Instructions for Signup Form:</label>
                    <textarea
                      placeholder="e.g. Please supply valid national KYC cards and bank settlement details to complete your application."
                      value={formState.onboardingInstructions || ''}
                      onChange={e => setFormState({ ...formState, onboardingInstructions: e.target.value })}
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-slate-50 rounded-xl">
                    <input
                      type="checkbox"
                      checked={formState.trainingRequired ?? false}
                      onChange={e => setFormState({ ...formState, trainingRequired: e.target.checked })}
                      className="rounded border-slate-300 text-primary-600"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Assign Mandatory Training Course</p>
                      <p className="text-[9px] text-slate-400">Rider/Driver must pass OmorfiHubAcademy course before activation.</p>
                    </div>
                  </label>
                </div>

                {/* Legal and default permissions */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                      <Lock size={14} className="text-slate-400" />
                      Agreements & Permissions
                    </h4>
                    <div className="space-y-2">
                      <h5 className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Legal Agreements to Accept:</h5>
                      {['TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'LIABILITY_WAIVER', 'NON_DISCLOSURE_AGREEMENT'].map(agreement => {
                        const active = (formState.agreementsToAccept || []).includes(agreement);
                        return (
                          <label key={agreement} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleAgreement(agreement)}
                              className="rounded text-primary-600 h-3.5 w-3.5"
                            />
                            <span className="font-semibold text-slate-700">{agreement.replace(/_/g, ' ')}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-black text-slate-700 uppercase tracking-widest text-[9px]">Default Platform Roles Granted:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {['USER', 'MEMBER', 'VERIFIED_PARTNER', 'TRIAL_ACCESS'].map(perm => {
                        const active = (formState.defaultPermissions || []).includes(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePermission(perm)}
                            className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition ${
                              active
                                ? 'bg-primary-50 border-primary-200 text-primary-600'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {perm}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
