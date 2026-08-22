import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { configurationEngine } from '../../../engines/ConfigurationEngine';
import { countryRepository } from '../../../services/db/CountryRepository';
import { documentRequirementRepository } from '../../../services/db/DocumentRequirementRepository';
import { Country, UserRole, DocumentRequirement } from '../../../types';
import {
  Globe,
  Plus,
  Save,
  Trash2,
  Check,
  Loader2,
  Settings,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const CountriesTab: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [docReqs, setDocReqs] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  // Form state for adding/editing countries
  const [countryForm, setCountryForm] = useState<Partial<Country>>({
    name: '',
    code: '',
    phoneCode: '',
    currency: '',
    currencySymbol: '',
    active: true,
    cities: [],
    states: [],
    supportedLanguages: ['en'],
    phoneNumberFormat: '',
    addressFormat: '',
    postalCodeRules: '',
    weightUnits: 'kg',
    measurementUnits: 'metric',
    dateFormat: 'YYYY-MM-DD'
  });

  // Country-specific Registration Rules overrides
  const [enabledRoles, setEnabledRoles] = useState<string[]>(['CUSTOMER', 'MERCHANT', 'DISPATCH_RIDER']);
  const [manualRoles, setManualRoles] = useState<string[]>(['MERCHANT', 'DISPATCH_RIDER']);
  const [kycRequired, setKycRequired] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCountries, allDocs] = await Promise.all([
        configurationEngine.getAllCountries(),
        documentRequirementRepository.getAll()
      ]);
      setCountries(allCountries);
      setDocReqs(allDocs.filter(d => d.isActive && !d.isDeleted));

      if (allCountries.length > 0 && !selectedCountryId) {
        handleSelectCountry(allCountries[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load localized country settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountryId(country.id);
    setCountryForm({ ...country });

    // Load registration rules overrides
    if (country.registrationRules) {
      setEnabledRoles(country.registrationRules.enabledRoles || []);
      setManualRoles(country.registrationRules.manualApprovalOnlyRoles || []);
      setKycRequired(country.registrationRules.kycVerificationRequired ?? true);
    } else {
      setEnabledRoles(['CUSTOMER', 'MERCHANT', 'DISPATCH_RIDER']);
      setManualRoles(['MERCHANT', 'DISPATCH_RIDER']);
      setKycRequired(true);
    }
  };

  const handleCreateNewCountry = () => {
    setSelectedCountryId(null);
    setCountryForm({
      name: '',
      code: '',
      phoneCode: '',
      currency: '',
      currencySymbol: '',
      active: true,
      cities: [],
      states: [],
      supportedLanguages: ['en'],
      phoneNumberFormat: '+{code} (0) 000 000 0000',
      addressFormat: '{street}, {city}, {state}, {country}',
      postalCodeRules: '',
      weightUnits: 'kg',
      measurementUnits: 'metric',
      dateFormat: 'DD/MM/YYYY'
    });
    setEnabledRoles(['CUSTOMER', 'MERCHANT', 'DISPATCH_RIDER']);
    setManualRoles(['MERCHANT', 'DISPATCH_RIDER']);
    setKycRequired(true);
  };

  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryForm.name || !countryForm.code) {
      toast.error('Country name and code are mandatory fields');
      return;
    }

    setSaving(true);
    try {
      const formattedCode = countryForm.code.toUpperCase();
      const rules = {
        enabledRoles,
        manualApprovalOnlyRoles: manualRoles,
        kycVerificationRequired: kycRequired,
        requiredDocuments: {} // empty dictionary for custom requirements maps
      };

      const payload = {
        ...countryForm,
        code: formattedCode,
        registrationRules: rules,
        updatedAt: new Date().toISOString()
      };

      if (selectedCountryId) {
        await countryRepository.update(selectedCountryId, payload);
        toast.success(`Settings for ${countryForm.name} updated successfully`);
      } else {
        const id = `COUNTRY-${formattedCode}`;
        await countryRepository.create(id, {
          ...payload,
          id,
          createdAt: new Date().toISOString()
        } as Country);
        toast.success(`Country ${countryForm.name} added to localized registries`);
      }
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to persist country localization profiles');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiveCountry = async (country: Country) => {
    try {
      const nextActive = !country.active;
      await countryRepository.update(country.id, { active: nextActive, updatedAt: new Date().toISOString() });
      toast.success(`${country.name} localization flow ${nextActive ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to change active status');
    }
  };

  const handleRoleToggle = (role: string) => {
    setEnabledRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleManualRoleToggle = (role: string) => {
    setManualRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar selection column */}
      <Card className="lg:col-span-1 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden h-fit">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="font-bold text-slate-950 dark:text-white text-xs uppercase tracking-wider text-slate-400">Localized Regions</h3>
            <Button size="icon" variant="ghost" onClick={handleCreateNewCountry} className="h-7 w-7 rounded-lg">
              <Plus size={14} />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary-600" size={16} />
            </div>
          ) : (
            <div className="space-y-1">
              {countries.map(c => {
                const active = c.id === selectedCountryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition ${
                      active
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={14} className={active ? 'text-white' : 'text-slate-400'} />
                      <span>{c.name} ({c.code})</span>
                    </div>
                    {!c.active && (
                      <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Offline</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Form Column */}
      <Card className="lg:col-span-3 border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSaveCountry} className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {selectedCountryId ? `Localization Settings: ${countryForm.name}` : 'Setup New Country Region'}
                </h3>
                <p className="text-[10px] text-slate-500">Configure address inputs, phone prefixes, KYC rules, and permitted onboarding roles.</p>
              </div>
              <div className="flex gap-2">
                {selectedCountryId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActiveCountry(countryForm as Country)}
                    className="rounded-xl"
                  >
                    {countryForm.active ? 'Disable Region' : 'Enable Region'}
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl"
                >
                  {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                  Publish Local Settings
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Country Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghana, Kenya"
                  value={countryForm.name || ''}
                  onChange={e => setCountryForm({ ...countryForm, name: e.target.value })}
                  className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">ISO Country Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GH, KE"
                  maxLength={2}
                  value={countryForm.code || ''}
                  onChange={e => setCountryForm({ ...countryForm, code: e.target.value })}
                  className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Dialing Phone Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 233, 254"
                  value={countryForm.phoneCode || ''}
                  onChange={e => setCountryForm({ ...countryForm, phoneCode: e.target.value })}
                  className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">National Currency *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GHS, KES, ZAR"
                  value={countryForm.currency || ''}
                  onChange={e => setCountryForm({ ...countryForm, currency: e.target.value })}
                  className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">Currency Symbol *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₵, KSh, R"
                  value={countryForm.currencySymbol || ''}
                  onChange={e => setCountryForm({ ...countryForm, currencySymbol: e.target.value })}
                  className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Region specific registration policies */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Settings size={14} className="text-slate-400" />
                Localized Registration Rules Override
              </h4>

              <div className="p-4 border rounded-2xl bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Mandatory Government KYC gates</p>
                    <p className="text-[10px] text-slate-400">Lock high-level onboarding behind governent digital identity queries.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={kycRequired}
                    onChange={e => setKycRequired(e.target.checked)}
                    className="rounded text-primary-600 h-4 w-4"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
                  {/* Allowed Roles */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Permitted Registration Roles:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'CUSTOMER',
                        'MERCHANT',
                        'DISPATCH_RIDER',
                        'LOGISTICS_COMPANY',
                        'CENTER_OWNER',
                        'CENTER_STAFF',
                        'DRIVER',
                        'DEVELOPER',
                        'API_MERCHANT_PARTNER',
                        'SUPPORT_OFFICER',
                        'OPERATIONS_MANAGER',
                        'SUPER_ADMIN'
                      ].map(role => {
                        const enabled = enabledRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleRoleToggle(role)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              enabled
                                ? 'bg-primary-50 border-primary-200 text-primary-600'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {role.replace(/_/g, ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual Approval Override */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700">Roles Requiring Manual Officer Sign-off:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'CUSTOMER',
                        'MERCHANT',
                        'DISPATCH_RIDER',
                        'LOGISTICS_COMPANY',
                        'CENTER_OWNER',
                        'CENTER_STAFF',
                        'DRIVER',
                        'DEVELOPER',
                        'API_MERCHANT_PARTNER',
                        'SUPPORT_OFFICER',
                        'OPERATIONS_MANAGER',
                        'SUPER_ADMIN'
                      ].map(role => {
                        const manual = manualRoles.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleManualRoleToggle(role)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                              manual
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {role.replace(/_/g, ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};
