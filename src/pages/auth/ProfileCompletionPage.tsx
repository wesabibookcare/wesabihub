import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, CheckCircle2, FileUp, X, Camera, ShieldCheck } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { ROLE_REDIRECTS } from '../../services/authService';
import { invitationEngine, complianceEngine } from '@/src/engines';
import { workflowEngine, configurationEngine } from '../../engines';
import { UserRole, DocumentRequirement, RoleApplicationConfig, ApplicationFieldConfig } from '../../types';
import { toast } from 'sonner';
import { countryRepository } from '../../services/db/CountryRepository';
import { FALLBACK_COUNTRIES, NIGERIA_STATES } from '../../data/fallbackGeography';
import { LiveFaceScanModal } from '../../components/common/LiveFaceScanModal';

const FileUploadInput: React.FC<{
  fieldName: string;
  label: string;
  required: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  acceptedTypes?: string[];
  maxSizeMb?: number;
}> = ({ fieldName, label, required, file, onChange, acceptedTypes = ['pdf', 'png', 'jpg', 'jpeg'], maxSizeMb = 5 }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedTypes.includes(ext)) {
      toast.error(`Invalid file format. Accepted types: ${acceptedTypes.join(', ').toUpperCase()}`);
      return;
    }
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File is too large. Max size allowed: ${maxSizeMb}MB`);
      return;
    }
    onChange(selectedFile);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {file ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 truncate">
                {file.name}
              </span>
              <span className="text-[8px] text-emerald-600 dark:text-emerald-500 font-medium">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 hover:bg-emerald-100 rounded-full transition"
          >
            <X size={14} className="text-emerald-700" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          onClick={() => document.getElementById(`file-${fieldName}`)?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
            dragActive
              ? 'border-primary-500 bg-primary-50/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            id={`file-${fieldName}`}
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <FileUp className="text-slate-300 dark:text-slate-300" size={24} />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                Drag & drop or <span className="text-primary-600">click to select</span>
              </p>
              <p className="text-[10px] text-slate-800">
                {acceptedTypes.join(', ').toUpperCase()} (max {maxSizeMb}MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfileCompletionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = (location.state as any)?.role as UserRole;

  const [profileData, setProfileData] = useState<any>({});
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [faceScanModalOpen, setFaceScanModalOpen] = useState(false);
  const [faceScanCaptured, setFaceScanCaptured] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingCountries(true);
      try {
        const list = await countryRepository.getActiveCountries();
        if (active) setCountries(list);
      } catch (error) {
        console.warn('Unable to load countries; using bundled list.', error);
        if (active) setCountries(FALLBACK_COUNTRIES as any);
      } finally {
        if (active) setLoadingCountries(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedCountry = countries.find((c: any) =>
    c.code === profileData.country || c.name === profileData.country
  );
  const selectedCountryCode = selectedCountry?.code || profileData.country;
  const stateOptions: string[] = selectedCountryCode === 'NG'
    ? Object.keys(NIGERIA_STATES)
    : (Array.isArray(selectedCountry?.states) ? selectedCountry.states : []);
  const cityOptions: string[] = selectedCountryCode === 'NG' && profileData.state
    ? (NIGERIA_STATES[profileData.state] || [])
    : (Array.isArray(selectedCountry?.cities) ? selectedCountry.cities : []);

  const [filesToUpload, setFilesToUpload] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docReqs, setDocReqs] = useState<DocumentRequirement[]>([]);
  const [roleConfig, setRoleConfig] = useState<RoleApplicationConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // If role is missing, redirect back to role selection
  useEffect(() => {
    if (!role) {
      navigate('/role-selection');
    }
  }, [role, navigate]);

  // Load configs and document requirements dynamically
  useEffect(() => {
    const fetchConfigsAndDocs = async () => {
      if (!role) return;
      setLoadingConfig(true);
      try {
        const [config, filteredDocs] = await Promise.all([
          configurationEngine.getRoleRegistrationConfig(role),
          configurationEngine.getDocumentRequirements(role)
        ]);
        setRoleConfig(config);
        setDocReqs(filteredDocs);
      } catch (err) {
        console.error('Failed to load configs and document requirements:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfigsAndDocs();
  }, [role]);

  // Auto-check for invitations for staff roles
  useEffect(() => {
    const checkInvite = async () => {
      const email = auth.currentUser?.email;
      if (role === 'CENTER_STAFF' && email) {
        setCheckingInvite(true);
        try {
          const invs = await invitationEngine.getInvitationsByEmail(email);
          if (invs.length > 0) {
            const inv = invs[0];
            setProfileData(prev => ({
              ...prev,
              hubId: inv.hubId,
              isInvited: true,
              invitationId: inv.id
            }));
          }
        } catch (err) {
          console.error('Invite check error:', err);
        } finally {
          setCheckingInvite(false);
        }
      }
    };
    checkInvite();
  }, [role]);

  const getDefaultConfigFields = (userRole: UserRole): ApplicationFieldConfig[] => {
    switch (userRole) {
      case 'CUSTOMER':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'wesabiUsername', label: 'OmorfiHub Username', type: 'text', required: false },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true },
          { name: 'country', label: 'Country', type: 'geography-country', required: true },
          { name: 'state', label: 'State / Province', type: 'geography-state', required: true },
          { name: 'city', label: 'City', type: 'geography-city', required: true },
        ];
      case 'MERCHANT':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'nin', label: 'NIN (National ID Number)', type: 'text', required: true },
          { name: 'ninName', label: 'Name on NIN (Must match Full Name)', type: 'text', required: true },
          { name: 'businessName', label: 'Business Name', type: 'text', required: true },
          { name: 'wesabiUsername', label: 'OmorfiHub Username', type: 'text', required: false },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true },
          { name: 'country', label: 'Country', type: 'geography-country', required: true },
          { name: 'state', label: 'State / Province', type: 'geography-state', required: true },
          { name: 'city', label: 'City', type: 'geography-city', required: true },
        ];
      case 'CENTER_OWNER':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'nin', label: 'NIN (National ID Number)', type: 'text', required: true },
          { name: 'ninName', label: 'Name on NIN (Must match Full Name)', type: 'text', required: true },
          { name: 'businessName', label: 'Hub/Business Name', type: 'text', required: true },
          { name: 'cacNumber', label: 'CAC Registration Number', type: 'text', required: true },
          { name: 'businessAddress', label: 'Business Address', type: 'text', required: true },
          { name: 'wesabiUsername', label: 'OmorfiHub Username', type: 'text', required: false },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true },
          { name: 'country', label: 'Country', type: 'geography-country', required: true },
          { name: 'state', label: 'State / Province', type: 'geography-state', required: true },
          { name: 'city', label: 'City', type: 'geography-city', required: true },
        ];
      case 'LOGISTICS_COMPANY':
        return [
          { name: 'companyName', label: 'Company Legal Name', type: 'text', required: true },
          { name: 'cacNumber', label: 'CAC / Registration Number', type: 'text', required: true },
          { name: 'tinNumber', label: 'TIN (Tax ID Number)', type: 'text', required: true },
        ];
      case 'FLEET_MANAGER':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'nin', label: 'NIN (National ID Number)', type: 'text', required: true },
        ];
      case 'DRIVER':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'nin', label: 'NIN (National ID Number)', type: 'text', required: true },
          { name: 'driverLicense', label: 'Driver License Number', type: 'text', required: true },
        ];
      case 'CENTER_STAFF':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'hubId', label: 'Hub ID / Invite Code', type: 'text', required: true },
        ];
      case 'DEVELOPER':
        return [
          { name: 'developerName', label: 'Platform/Developer Name', type: 'text', required: true },
          { name: 'apiEmail', label: 'Primary Email for API Notifications', type: 'text', required: true },
        ];
      case 'API_MERCHANT_PARTNER':
        return [
          { name: 'businessName', label: 'Partner/Business Name', type: 'text', required: true },
          { name: 'apiKeyEmail', label: 'Primary Email for API Management', type: 'text', required: true },
          { name: 'apiUsagePurpose', label: 'Intended API Usage Purpose', type: 'text', required: true },
        ];
      case 'SUPPORT_OFFICER':
      case 'VERIFICATION_OFFICER':
      case 'FINANCE_OFFICER':
      case 'OPERATIONS_MANAGER':
      case 'SUPER_ADMIN':
      case 'DISPUTE_ADMIN':
      case 'SUPPORT_ADMIN':
      case 'OPERATIONS_ADMIN':
      case 'VERIFICATION_ADMIN':
      case 'SECURITY_ADMIN':
      case 'FINANCE_ADMIN':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'employeeId', label: 'Employee ID (Optional)', type: 'text', required: false },
          { name: 'department', label: 'Department', type: 'text', required: true },
        ];
      case 'DISPATCH_COMPANY':
        return [
          { name: 'companyName', label: 'Dispatch Company Name', type: 'text', required: true },
          { name: 'cacNumber', label: 'Registration (CAC) Number', type: 'text', required: true },
          { name: 'officeAddress', label: 'Head Office Address', type: 'text', required: true },
          { name: 'fleetSize', label: 'Initial Fleet Size', type: 'number', required: true },
        ];
      case 'DISPATCH_RIDER':
        return [
          { name: 'fullName', label: 'Full Name', type: 'text', required: true },
          { name: 'phone', label: 'Phone Number', type: 'text', required: true },
          { name: 'dob', label: 'Date of Birth', type: 'date', required: true },
          { name: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
          { name: 'address', label: 'Residential Address', type: 'text', required: true },
          { name: 'vehicleType', label: 'Vehicle Type', type: 'select', required: true, options: ['Motorcycle', 'Bicycle', 'Car', 'Van'] },
          { name: 'vehicleBrand', label: 'Vehicle Brand/Model', type: 'text', required: false },
          { name: 'vehicleReg', label: 'Reg. Number (Plate)', type: 'text', required: true },
          { name: 'vehicleColor', label: 'Vehicle Color', type: 'text', required: false },
          { name: 'nin', label: 'NIN (National ID No.)', type: 'text', required: true },
          { name: 'driverLicense', label: 'Driver License No.', type: 'text', required: false },
          { name: 'guarantor1Name', label: 'Primary Guarantor Full Name', type: 'text', required: true },
          { name: 'guarantor1Phone', label: 'Primary Guarantor Phone Number', type: 'text', required: true },
          { name: 'guarantor1Relation', label: 'Primary Guarantor Relationship', type: 'text', required: false },
          { name: 'guarantor2Name', label: 'Secondary Guarantor Full Name', type: 'text', required: false },
          { name: 'guarantor2Phone', label: 'Secondary Guarantor Phone Number', type: 'text', required: false },
          { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
          { name: 'bankAccountNo', label: 'Account Number', type: 'text', required: true },
          { name: 'bankAccountName', label: 'Account Name', type: 'text', required: true },
        ];
      default:
        return [];
    }
  };

  const getFields = (): ApplicationFieldConfig[] => {
    const configured = roleConfig && roleConfig.fields && roleConfig.fields.length > 0
      ? roleConfig.fields
      : getDefaultConfigFields(role);

    // Geography is a core registration requirement for customers. Preserve it
    // even when an older admin configuration does not contain the fields.
    if (role === 'CUSTOMER') {
      const byName = new Map(configured.map(field => [field.name, field]));
      const geography: ApplicationFieldConfig[] = [
        { name: 'country', label: 'Country', type: 'geography-country', required: true },
        { name: 'state', label: 'State / Province', type: 'geography-state', required: true },
        { name: 'city', label: 'City', type: 'geography-city', required: true }
      ];
      for (const field of geography) byName.set(field.name, field);
      return [...configured.filter(field => !['country', 'state', 'city'].includes(field.name)), ...geography];
    }
    return configured;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fbUser = auth.currentUser;
      if (!fbUser) {
        throw new Error('Authentication session lost. Please log in again.');
      }

      const isApprovalRole = !['CUSTOMER', 'CENTER_STAFF'].includes(role);
      const missingFields: string[] = [];
      const fields = getFields();

      // Validate fields dynamically
      for (const field of fields) {
        if (field.required && !profileData[field.name]) {
          missingFields.push(field.label);
        }
      }

      // Check Name on NIN matching
      if (isApprovalRole && profileData.ninName && profileData.fullName) {
        const cleanFullName = String(profileData.fullName).trim().toLowerCase();
        const cleanNinName = String(profileData.ninName).trim().toLowerCase();
        if (cleanFullName !== cleanNinName) {
          throw new Error(`Your Full Name ("${profileData.fullName}") must match your Name on NIN ("${profileData.ninName}") exactly.`);
        }
      }

      // Approval roles require NIN Card Front & Back and Live Face Scan
      if (isApprovalRole) {
        if (!filesToUpload['document_nin_front']) {
          missingFields.push('NIN Card Front Photo');
        }
        if (!filesToUpload['document_nin_back']) {
          missingFields.push('NIN Card Back Photo');
        }
        if (!faceScanCaptured) {
          missingFields.push('Live Face Camera Scan');
        }
      }

      // Validate document requirements dynamically
      for (const docReq of docReqs) {
        if (docReq.isRequired && !filesToUpload[`document_${docReq.id}`]) {
          missingFields.push(`${docReq.name} Upload`);
        }
      }

      if (missingFields.length > 0) {
        throw new Error(`Please fill in required fields: ${missingFields.join(', ')}`);
      }

      const displayName = profileData.fullName ||
        profileData.businessName ||
        profileData.companyName ||
        profileData.developerName ||
        fbUser.displayName ||
        'User';

      // 1. Record Consent if required
      if (profileData.acceptedConsent) {
        const mandatoryPolicies = await complianceEngine.getRequiredPoliciesForRole(role, profileData.country || 'NG');
        for (const policyKey of mandatoryPolicies) {
          const latest = await complianceEngine.getLatestPolicy(policyKey);
          await complianceEngine.recordConsent(fbUser.uid, policyKey, latest?.version || '1.0.0', {
            country: profileData.country,
            accountType: role,
            registrationMethod: (fbUser.providerData[0]?.providerId === 'google.com' ? 'GOOGLE' : 'EMAIL')
          });
        }
      } else {
        throw new Error('You must accept the terms and conditions to continue.');
      }

      const response = await workflowEngine.runRegistrationWorkflow({
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName,
        role,
        profileData,
        files: filesToUpload
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      const user = response.data!;
      toast.success('Profile registration complete!');

      if (user.status === 'UNDER_REVIEW') {
        navigate('/account-restricted', { state: { reason: 'PENDING_APPROVAL', role } });
      } else {
        const redirectPath = ROLE_REDIRECTS[role] || '/dashboard';
        navigate(redirectPath);
      }
    } catch (err: any) {
      console.error('Registration completion error:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
      toast.error('Registration failed. Check required fields.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold font-display text-center">Complete Your Profile</CardTitle>
          <p className="text-center text-sm text-slate-900">Tell us a bit more about you as a <span className="font-bold text-primary-600">{role.replace('_', ' ')}</span></p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          {loadingConfig ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="animate-spin text-primary-600" size={24} />
              <p className="text-xs text-slate-800">Loading form requirements...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 pb-2 scrollbar-thin">
                {getFields().map(field => {
                  const isReadOnly = (field.name === 'hubId' && profileData.isInvited);

                  if (field.type === 'geography-country') {
                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900">Country <span className="text-red-500">*</span></label>
                        <select
                          required
                          disabled={loadingCountries}
                          value={profileData.country || ''}
                          onChange={e => setProfileData({...profileData, country: e.target.value, state: '', city: ''})}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">{loadingCountries ? 'Loading countries…' : 'Select country'}</option>
                          {countries.map((c: any) => (
                            <option key={c.code || c.id} value={c.code || c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'geography-state') {
                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900">State / Province <span className="text-red-500">*</span></label>
                        <select
                          required
                          disabled={!profileData.country || stateOptions.length === 0}
                          value={profileData.state || ''}
                          onChange={e => setProfileData({...profileData, state: e.target.value, city: ''})}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">{!profileData.country ? 'Select country first' : stateOptions.length ? 'Select state / province' : 'States will appear when available'}</option>
                          {stateOptions.map((value: string) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'geography-city') {
                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900">City <span className="text-red-500">*</span></label>
                        <select
                          required
                          disabled={!profileData.state || cityOptions.length === 0}
                          value={profileData.city || ''}
                          onChange={e => setProfileData({...profileData, city: e.target.value})}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">{!profileData.state ? 'Select state / province first' : cityOptions.length ? 'Select city' : 'Cities will appear when available'}</option>
                          {cityOptions.map((value: string) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === 'file') {
                    return (
                      <FileUploadInput
                        key={field.name}
                        fieldName={field.name}
                        label={field.label}
                        required={field.required}
                        file={filesToUpload[field.name] || null}
                        onChange={file => setFilesToUpload({...filesToUpload, [field.name]: file as File})}
                      />
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-900">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          required={field.required}
                          value={profileData[field.name] || ''}
                          onChange={e => setProfileData({...profileData, [field.name]: e.target.value})}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select {field.label}</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={field.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-900">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        readOnly={isReadOnly}
                        value={profileData[field.name] || ''}
                        onChange={e => setProfileData({...profileData, [field.name]: e.target.value})}
                        className={isReadOnly ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 pr-10" : ""}
                      />
                      {field.name === 'hubId' && checkingInvite && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin text-primary-600" size={16} />
                        </div>
                      )}
                      {field.name === 'hubId' && profileData.isInvited && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">Invitation verified! Linked successfully.</p>
                      )}
                    </div>
                  );
                })}

                {/* Mandatory Identity Documents & Live Scan for Approval Roles */}
                {!['CUSTOMER', 'CENTER_STAFF'].includes(role) && (
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Required Identity Verification Documents</h3>

                    {/* Live Face Scan */}
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Camera size={14} className="text-primary-500" /> Live Face Camera Scan <span className="text-red-500">*</span>
                          </p>
                          <p className="text-[10px] text-slate-500">Must be a live camera scan (no photo uploads permitted)</p>
                        </div>
                        {faceScanCaptured ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                            <ShieldCheck size={12} /> Captured
                          </span>
                        ) : null}
                      </div>

                      {faceScanCaptured ? (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg">
                          <img src={faceScanCaptured} alt="Face scan" className="w-12 h-12 rounded-full object-cover border border-emerald-500" />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFaceScanModalOpen(true)}
                            className="text-xs rounded-lg"
                          >
                            Retake Scan
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFaceScanModalOpen(true)}
                          className="w-full text-xs font-bold py-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Camera size={14} /> Start Live Face Scan
                        </Button>
                      )}
                    </div>

                    {/* NIN Card Front & Back */}
                    <FileUploadInput
                      fieldName="document_nin_front"
                      label="NIN Card Front Photo"
                      required={true}
                      file={filesToUpload['document_nin_front'] || null}
                      onChange={file => setFilesToUpload({ ...filesToUpload, document_nin_front: file as File })}
                      acceptedTypes={['png', 'jpg', 'jpeg', 'pdf']}
                    />
                    <FileUploadInput
                      fieldName="document_nin_back"
                      label="NIN Card Back Photo"
                      required={true}
                      file={filesToUpload['document_nin_back'] || null}
                      onChange={file => setFilesToUpload({ ...filesToUpload, document_nin_back: file as File })}
                      acceptedTypes={['png', 'jpg', 'jpeg', 'pdf']}
                    />
                  </div>
                )}

                {/* Custom active document requirements section from Admin */}
                {docReqs.length > 0 && (
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Additional Required Documents</h3>
                    {docReqs.map(docReq => (
                      <FileUploadInput
                        key={docReq.id}
                        fieldName={`document_${docReq.id}`}
                        label={docReq.name}
                        required={docReq.isRequired}
                        file={filesToUpload[`document_${docReq.id}`] || null}
                        onChange={file => setFilesToUpload({...filesToUpload, [`document_${docReq.id}`]: file as File})}
                        acceptedTypes={docReq.acceptedFileTypes}
                        maxSizeMb={docReq.maxFileSizeMb}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptedConsent"
                    checked={profileData.acceptedConsent || false}
                    onChange={(e) => setProfileData({...profileData, acceptedConsent: e.target.checked})}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                    required
                  />
                  <label htmlFor="acceptedConsent" className="text-[10px] text-slate-900 leading-relaxed">
                    I have read and I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                    I understand that these documents govern my use of the OmorfiHub platform.
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 h-11 rounded-xl font-bold shadow-lg shadow-primary-500/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Finalizing Profile...
                    </>
                  ) : 'Complete Registration'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <LiveFaceScanModal
        isOpen={faceScanModalOpen}
        onClose={() => setFaceScanModalOpen(false)}
        onCapture={(dataUrl, blob) => {
          setFaceScanCaptured(dataUrl);
          // Convert dataUrl into a File object for submission
          const file = new File([blob], `live_face_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFilesToUpload(prev => ({ ...prev, document_live_face_scan: file }));
        }}
      />
    </div>
  );
};
