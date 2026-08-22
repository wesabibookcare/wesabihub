import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { documentRequirementRepository } from '../../../services/db/DocumentRequirementRepository';
import { DocumentRequirement, UserRole } from '../../../types';
import {
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Check,
  X,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const DocumentRequirementsTab: React.FC = () => {
  const [docReqs, setDocReqs] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewRole, setPreviewRole] = useState<UserRole>('DISPATCH_RIDER');
  const [previewCountry, setPreviewCountry] = useState<string>('NG');

  // Form states
  const [formState, setFormState] = useState<Partial<DocumentRequirement>>({
    name: '',
    description: '',
    isRequired: true,
    applicableRoles: ['DISPATCH_RIDER'],
    applicableCountries: ['NG'],
    acceptedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'],
    maxFileSizeMb: 5,
    requiresExpiryDate: false,
    renewalReminderDays: 30,
    adminVerificationRequired: true,
    autoApprovalAllowed: false,
    displayOrder: 1,
    helpText: '',
    isActive: true
  });

  const loadDocReqs = async () => {
    setLoading(true);
    try {
      const data = await documentRequirementRepository.getAll();
      const active = data.filter(d => !d.isDeleted);
      active.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setDocReqs(active);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocReqs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      name: '',
      description: '',
      isRequired: true,
      applicableRoles: ['DISPATCH_RIDER'],
      applicableCountries: ['NG'],
      acceptedFileTypes: ['pdf', 'png', 'jpg', 'jpeg'],
      maxFileSizeMb: 5,
      requiresExpiryDate: false,
      renewalReminderDays: 30,
      adminVerificationRequired: true,
      autoApprovalAllowed: false,
      displayOrder: docReqs.length + 1,
      helpText: '',
      isActive: true
    });
  };

  const handleEdit = (req: DocumentRequirement) => {
    setEditingId(req.id);
    setFormState({ ...req });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) {
      toast.error('Document name is required');
      return;
    }

    try {
      if (editingId) {
        await documentRequirementRepository.update(editingId, {
          ...formState,
          updatedAt: new Date().toISOString()
        });
        toast.success('Document requirement updated successfully');
      } else {
        const id = `DOCREQ-${Date.now()}`;
        await documentRequirementRepository.create(id, {
          ...formState,
          id,
          displayOrder: formState.displayOrder || docReqs.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as DocumentRequirement);
        toast.success('Document requirement created successfully');
      }
      resetForm();
      loadDocReqs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save document requirement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document requirement?')) return;
    try {
      await documentRequirementRepository.update(id, { isDeleted: true, updatedAt: new Date().toISOString() });
      toast.success('Document requirement deleted');
      loadDocReqs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete document requirement');
    }
  };

  const handleToggleActive = async (req: DocumentRequirement) => {
    try {
      const nextActive = !req.isActive;
      await documentRequirementRepository.update(req.id, { isActive: nextActive, updatedAt: new Date().toISOString() });
      toast.success(`${req.name} ${nextActive ? 'enabled' : 'disabled'}`);
      loadDocReqs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle active status');
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= docReqs.length) return;

    const newList = [...docReqs];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    // Save Display Orders
    try {
      setDocReqs(newList);
      await Promise.all(
        newList.map((item, idx) =>
          documentRequirementRepository.update(item.id, { displayOrder: idx + 1, updatedAt: new Date().toISOString() })
        )
      );
      toast.success('Display order updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save display order');
      loadDocReqs();
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    const current = formState.applicableRoles || [];
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    setFormState({ ...formState, applicableRoles: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dynamic Document Requirement Engine</h2>
          <p className="text-xs text-slate-500">Create, edit, and order document upload requests required during profile completion.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewing(!isPreviewing)}
            className="rounded-xl flex items-center gap-1.5"
          >
            <Eye size={16} />
            {isPreviewing ? 'Hide Preview' : 'Preview Registration Flow'}
          </Button>
          {editingId && (
            <Button size="sm" variant="outline" onClick={resetForm} className="rounded-xl">
              Cancel Edit
            </Button>
          )}
        </div>
      </div>

      {isPreviewing && (
        <Card className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 shadow-inner rounded-3xl overflow-hidden animate-in fade-in duration-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-600" size={20} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Onboarding Form Preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={previewRole}
                  onChange={e => setPreviewRole(e.target.value as UserRole)}
                  className="h-8 text-xs font-bold px-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MERCHANT">Merchant</option>
                  <option value="CENTER_OWNER">Hub Owner</option>
                  <option value="CENTER_STAFF">Hub Staff</option>
                  <option value="LOGISTICS_COMPANY">Logistics Company</option>
                  <option value="DRIVER">Driver</option>
                  <option value="DISPATCH_RIDER">Dispatch Rider</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="API_MERCHANT_PARTNER">API Merchant Partner</option>
                  <option value="SUPPORT_OFFICER">Support Officer</option>
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <select
                  value={previewCountry}
                  onChange={e => setPreviewCountry(e.target.value)}
                  className="h-8 text-xs font-bold px-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900"
                >
                  <option value="NG">Nigeria (NG)</option>
                  <option value="GH">Ghana (GH)</option>
                  <option value="KE">Kenya (KE)</option>
                  <option value="ZA">South Africa (ZA)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Form Render Simulation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 p-6 shadow-sm max-w-md mx-auto space-y-4">
              <h4 className="text-sm font-black text-slate-800 dark:text-white text-center border-b pb-2">Complete Profile ({previewRole})</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Simulated Field: Full/Business Name</label>
                  <input disabled placeholder="Jane Doe / Acme Ltd" className="w-full h-10 px-3 rounded-xl border border-slate-100 bg-slate-50 text-xs" />
                </div>

                {/* Filter and render matching docs */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Required Onboarding Documents</h5>
                  {docReqs
                    .filter(d => d.isActive && d.applicableRoles.includes(previewRole) && d.applicableCountries.includes(previewCountry))
                    .map(d => (
                      <div key={d.id} className="p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-1">
                        <p className="text-xs font-bold text-slate-700 flex justify-between">
                          <span>{d.name} {d.isRequired && <span className="text-red-500">*</span>}</span>
                          <span className="text-[9px] text-slate-400 font-medium">max {d.maxFileSizeMb}MB</span>
                        </p>
                        {d.description && <p className="text-[10px] text-slate-500">{d.description}</p>}
                        <div className="h-8 border border-slate-200 bg-white rounded-lg flex items-center justify-center text-[10px] text-primary-600 font-bold cursor-pointer">
                          Upload file ({d.acceptedFileTypes.join(', ').toUpperCase()})
                        </div>
                      </div>
                    ))}
                  {docReqs.filter(d => d.isActive && d.applicableRoles.includes(previewRole) && d.applicableCountries.includes(previewCountry)).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No documents required for this combination.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <Card className="lg:col-span-1 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden h-fit">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-950 dark:text-white text-sm mb-4">
              {editingId ? 'Edit Document Requirement' : 'Add Document Requirement'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Driver's License, CAC Certificate"
                  value={formState.name || ''}
                  onChange={e => setFormState({ ...formState, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400">Description / Guidelines</label>
                <textarea
                  placeholder="Tell applicant what is expected (e.g. valid, clear colored scan of front page)"
                  value={formState.description || ''}
                  onChange={e => setFormState({ ...formState, description: e.target.value })}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 dark:text-slate-400">Applicable Roles (Select multiple)</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                  {([
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
                    'SUPER_ADMIN'
                  ] as UserRole[]).map(r => {
                    const active = (formState.applicableRoles || []).includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleToggle(r)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border text-left truncate transition ${
                          active
                            ? 'bg-primary-50 border-primary-200 text-primary-700 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Check size={12} className={active ? 'opacity-100' : 'opacity-0'} />
                        <span className="text-[10px]">{r.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Max File Size (MB)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formState.maxFileSizeMb || 5}
                    onChange={e => setFormState({ ...formState, maxFileSizeMb: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formState.displayOrder || 1}
                    onChange={e => setFormState({ ...formState, displayOrder: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isRequired ?? true}
                    onChange={e => setFormState({ ...formState, isRequired: e.target.checked })}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  <span>This document is strictly required</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.requiresExpiryDate ?? false}
                    onChange={e => setFormState({ ...formState, requiresExpiryDate: e.target.checked })}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  <span>Requires expiration date</span>
                </label>

                <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isActive ?? true}
                    onChange={e => setFormState({ ...formState, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-primary-600"
                  />
                  <span>Active (applicant can see and upload)</span>
                </label>
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-black text-white h-10 rounded-xl font-bold">
                <Save size={16} className="mr-1.5" />
                {editingId ? 'Update Requirement' : 'Publish Requirement'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Requirements List */}
        <Card className="lg:col-span-2 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-950 dark:text-white text-sm mb-4">Active Requirements Queue</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Plus className="animate-spin text-primary-600" size={24} />
                <p className="text-xs text-slate-400">Loading requirements...</p>
              </div>
            ) : docReqs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
                <AlertCircle className="text-slate-300 mx-auto mb-2" size={32} />
                <p className="text-xs font-bold text-slate-400">No document requirements defined yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {docReqs.map((req, idx) => (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                      req.isActive
                        ? 'bg-white border-slate-100 hover:border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === docReqs.length - 1}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{req.name}</h4>
                          <Badge className={req.isRequired ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}>
                            {req.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                          {!req.isActive && (
                            <Badge className="bg-amber-50 text-amber-600">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{req.description || 'No description provided.'}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {req.applicableRoles.slice(0, 3).map(r => (
                            <span key={r} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 font-bold">
                              {r.replace('_', ' ')}
                            </span>
                          ))}
                          {req.applicableRoles.length > 3 && (
                            <span className="text-[9px] text-slate-400">+{req.applicableRoles.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleActive(req)}
                        className={`h-8 w-8 rounded-lg ${req.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        <Check size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(req)} className="h-8 w-8 rounded-lg text-slate-600">
                        <Edit size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(req.id)} className="h-8 w-8 rounded-lg text-red-600">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
