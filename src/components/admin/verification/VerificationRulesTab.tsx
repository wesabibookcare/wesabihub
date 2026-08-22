import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { systemSettingsRepository } from '../../../services/db/SystemSettingsRepository';
import {
  Sliders,
  ShieldAlert,
  Save,
  Loader2,
  Sparkles,
  Check,
  Eye,
  Settings,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const VerificationRulesTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for verification rules
  const [ocrAutoVerify, setOcrAutoVerify] = useState(true);
  const [kycCheckThreshold, setKycCheckThreshold] = useState('HIGH_TRUST');
  const [maxSubmissionAttempts, setMaxSubmissionAttempts] = useState(3);
  const [autoApproveCustomers, setAutoApproveCustomers] = useState(true);
  const [reRouteDelayHours, setReRouteDelayHours] = useState(12);
  const [requireSelfieMatch, setRequireSelfieMatch] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const settings = await systemSettingsRepository.getGlobalSettings();
        if (settings?.verificationRules) {
          const rules = settings.verificationRules;
          setOcrAutoVerify(rules.ocrAutoVerify ?? true);
          setKycCheckThreshold(rules.kycCheckThreshold ?? 'HIGH_TRUST');
          setMaxSubmissionAttempts(rules.maxSubmissionAttempts ?? 3);
          setAutoApproveCustomers(rules.autoApproveCustomers ?? true);
          setReRouteDelayHours(rules.reRouteDelayHours ?? 12);
          setRequireSelfieMatch(rules.requireSelfieMatch ?? true);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load global verification rules');
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const handleSaveRules = async () => {
    setSaving(true);
    try {
      const payload = {
        ocrAutoVerify,
        kycCheckThreshold,
        maxSubmissionAttempts,
        autoApproveCustomers,
        reRouteDelayHours,
        requireSelfieMatch
      };

      await systemSettingsRepository.update('global', {
        verificationRules: payload,
        updatedAt: new Date().toISOString()
      });
      toast.success('Global verification engine rules saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save verification rules');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Verification Engine Rules Setup</h2>
        <p className="text-xs text-slate-500">Fine-tune automated pipelines, biometric lookup gates, OCR analyzers and validation policies.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="animate-spin text-primary-600" size={24} />
          <p className="text-xs text-slate-400 font-bold">Loading system rules configuration...</p>
        </div>
      ) : (
        <Card className="border border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-6 space-y-6 text-xs">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Biometrics & AI */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                  <Sparkles size={14} className="text-primary-600" />
                  AI & OCR Automation
                </h3>

                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ocrAutoVerify}
                    onChange={e => setOcrAutoVerify(e.target.checked)}
                    className="rounded text-primary-600 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-slate-800">Automatic OCR Document Inspection</p>
                    <p className="text-[10px] text-slate-400">Trigger neural network scanner to verify document ID numbers and check matches against database.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSelfieMatch}
                    onChange={e => setRequireSelfieMatch(e.target.checked)}
                    className="rounded text-primary-600 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-slate-800">Face Recognition (Selfie vs ID Scan)</p>
                    <p className="text-[10px] text-slate-400">Trigger biometric match. Requires a 90% match threshold before system issues approval status.</p>
                  </div>
                </label>
              </div>

              {/* Policy Thresholds */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                  <ShieldAlert size={14} className="text-amber-600" />
                  Policy Gates & Limits
                </h3>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">KYC Verification Gate Threshold</label>
                  <select
                    value={kycCheckThreshold}
                    onChange={e => setKycCheckThreshold(e.target.value)}
                    className="w-full h-10 px-3 border rounded-xl bg-white focus:outline-none"
                  >
                    <option value="BASIC">Basic Name Match Only (Low Risk)</option>
                    <option value="HIGH_TRUST">NIN / Government Registry Lookup (Standard)</option>
                    <option value="STRICT_SANCTION">Full Background Check & Sanction Scanning (High Risk)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Max Upload Attempts</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxSubmissionAttempts}
                      onChange={e => setMaxSubmissionAttempts(Number(e.target.value))}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Timeout Lock (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={72}
                      value={reRouteDelayHours}
                      onChange={e => setReRouteDelayHours(Number(e.target.value))}
                      className="w-full h-10 px-3 border rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* General Toggles */}
            <div className="pt-4 border-t space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5 pb-1">
                <UserCheck size={14} className="text-slate-500" />
                Additional Onboarding Policies
              </h3>

              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveCustomers}
                  onChange={e => setAutoApproveCustomers(e.target.checked)}
                  className="rounded text-primary-600 h-4 w-4 mt-0.5"
                />
                <div>
                  <p className="font-bold text-slate-800">Auto-Approve Customer Registrations</p>
                  <p className="text-[10px] text-slate-400">If enabled, standard customers are activated instantly on email verification without verification officer audit queues.</p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end border-t pt-4">
              <Button
                onClick={handleSaveRules}
                disabled={saving}
                className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg h-10 min-w-32"
              >
                {saving ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Save size={16} className="mr-1.5" />}
                Publish Rules
              </Button>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
};
