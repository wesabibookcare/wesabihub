import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { CheckCircle2, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import { complianceEngine, auditEngine } from '../../engines';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const LegalConsentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [policies, setPolicies] = useState<{ key: string; label: string; version: string }[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!user) return;
      try {
        const templates = await complianceEngine.getAgreementTemplates();
        const requiredKeys = await complianceEngine.getRequiredPoliciesForRole(user.role || 'CUSTOMER', user.country || 'NG');

        const results = await Promise.all(requiredKeys.map(async key => {
            const p = await complianceEngine.getLatestPolicy(key);
            const label = templates.find(t => t.key === key)?.label || key;
            return { key, label, version: p?.version || '1.0.0' };
        }));
        setPolicies(results);
      } catch (err) {
        console.error('Failed to fetch policies:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchPolicies();
  }, [user]);

  const handleAccept = async () => {
    if (!user) return;
    setLoading(true);
    try {
      for (const p of policies) {
        await complianceEngine.recordConsent(user.id, p.key, p.version, {
          country: user.country,
          accountType: user.role,
          registrationMethod: user.authMethod as any || 'EMAIL'
        });
      }

      await auditEngine.logEvent({
        userId: user.id,
        action: 'LEGAL_CONSENT_ACCEPTED',
        details: { policies: policies.map(p => p.key) },
        result: 'SUCCESS'
      });

      toast.success('Thank you for accepting our policies.');
      window.location.reload(); // Refresh to trigger route guard update
    } catch (err: any) {
      toast.error('Failed to record consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-800" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-600 p-3 rounded-2xl shadow-lg shadow-primary-500/20">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 font-display">
          Legal Review Required
        </h2>
        <p className="mt-2 text-center text-sm text-slate-800 max-w-xs mx-auto">
          To continue using OmorfiHub, please review and accept our updated policies.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-none shadow-xl overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              {policies.map(p => (
                <div key={p.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      <ExternalLink size={14} className="text-slate-800" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{p.label}</div>
                      <div className="text-[10px] text-slate-800 font-medium">Version {p.version}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={18} />
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-2">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="agree"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                    />
                    <label htmlFor="agree" className="text-xs text-amber-900 leading-relaxed">
                        I have read and I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>.
                        I understand that these documents govern my use of the OmorfiHub platform.
                    </label>
                </div>
            </div>

            <Button
                onClick={handleAccept}
                disabled={!agreed || loading}
                className="w-full h-12 rounded-xl font-bold text-sm bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20"
            >
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Accept & Continue'}
            </Button>

            <p className="text-[10px] text-center text-slate-800 italic">
                Refusing to accept will restrict your account access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
