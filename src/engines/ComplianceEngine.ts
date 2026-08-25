import { policyVersionRepository } from '../services/db/PolicyVersionRepository';
import { PolicyVersion, UserConsent, UserRole } from '../types';
import { userConsentRepository } from '../services/db/UserConsentRepository';
import { configurationEngine } from './ConfigurationEngine';
import { auditEngine } from './AuditEngine';
import { auth } from '../lib/firebase';

/**
 * OmorfiHub Compliance & Legal Engine
 * Manages legal documents, KYC states, and user consents.
 */
class ComplianceEngine {
  private static instance: ComplianceEngine;

  private constructor() {}

  public static getInstance(): ComplianceEngine {
    if (!ComplianceEngine.instance) {
      ComplianceEngine.instance = new ComplianceEngine();
    }
    return ComplianceEngine.instance;
  }

  async getLatestPolicy(policyKey: string): Promise<PolicyVersion | null> {
    const policies = await policyVersionRepository.getAll();
    return policies
      .filter(p => p.policyKey === policyKey && p.status === 'PUBLISHED')
      .sort((a, b) => {
        const vA = (a.version || '0').split('.').map(Number);
        const vB = (b.version || '0').split('.').map(Number);
        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
          if ((vB[i] || 0) > (vA[i] || 0)) return 1;
          if ((vB[i] || 0) < (vA[i] || 0)) return -1;
        }
        return 0;
      })[0] || null;
  }

  async recordConsent(userId: string, policyKey: string, version: string, options: {
    country?: string;
    accountType?: UserRole;
    registrationMethod?: 'EMAIL' | 'GOOGLE' | 'PHONE';
    ipAddress?: string;
  } = {}) {
    // Registration can race Firebase Auth state propagation. Verify the caller
    // before writing consent so we never write a consent for a different user.
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Your sign-in session is not ready. Please wait a moment and try again.');
    }
    try {
      await currentUser.getIdToken(true);
    } catch (tokenError) {
      console.warn('Could not refresh Firebase Auth token before consent write.', tokenError);
    }

    const id = `CONSENT-${userId}-${policyKey}-${Date.now()}`;
    // Give Firebase Auth a short opportunity to propagate the refreshed token
    // before the first protected Firestore write. This is especially important
    // on Android/Google sign-in and immediately after account creation.
    const waitForAuth = async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        if (auth.currentUser?.uid === userId) return;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      throw new Error('Your sign-in session is not ready. Please wait a moment and try again.');
    };
    const consentRecord: UserConsent = {
      id,
      userId,
      policyKey,
      policyVersion: version,
      acceptedAt: new Date().toISOString(),
      deviceInfo: typeof window !== 'undefined' ? window.navigator.userAgent : 'WOS_SYSTEM',
      ipAddress: options.ipAddress || 'UNKNOWN',
      country: options.country || 'NG',
      accountType: options.accountType || 'CUSTOMER',
      registrationMethod: options.registrationMethod || 'EMAIL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as UserConsent;

    let success = false;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await waitForAuth();
        await userConsentRepository.create(id, consentRecord);
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} to write consent record failed:`, error?.message || error);
        if (attempt < 3) {
          try {
            if (auth.currentUser) {
              await auth.currentUser.getIdToken(true);
            }
          } catch (tErr) {
            console.warn('Token refresh during retry failed:', tErr);
          }
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }
    }

    if (!success) {
      console.error(`Failed to record consent for UID ${userId} after 3 attempts.`, lastError);
      // Non-blocking fallback: log audit warning instead of crashing sign up
      await auditEngine.logEvent({
        userId,
        action: 'ACCEPT_POLICY_FAILED',
        details: { policyKey, policyVersion: version, error: lastError?.message || String(lastError), ...options },
        result: 'FAILURE'
      }).catch(aErr => console.warn('Audit log error:', aErr));
      return;
    }

    await auditEngine.logEvent({
      userId,
      action: 'ACCEPT_POLICY',
      details: { policyKey, policyVersion: version, ...options },
      result: 'SUCCESS'
    });
  }

  async getConsentHistory(userId: string): Promise<UserConsent[]> {
    return await userConsentRepository.query([{ field: 'userId', operator: '==', value: userId }]);
  }

  async checkUserCompliance(userId: string, role: UserRole, country: string): Promise<{ compliant: boolean; missing: string[] }> {
    const requiredPolicies = await this.getRequiredPoliciesForRole(role, country);
    const history = await this.getConsentHistory(userId);
    const missing: string[] = [];

    for (const key of requiredPolicies) {
      const latest = await this.getLatestPolicy(key);
      if (!latest) continue;

      const hasAcceptedLatest = history.some(h => h.policyKey === key && h.policyVersion === latest.version);
      if (!hasAcceptedLatest) {
        missing.push(key);
      }
    }

    return { compliant: missing.length === 0, missing };
  }

  async getRequiredPoliciesForRole(role: UserRole, country: string): Promise<string[]> {
    const config = await configurationEngine.getComplianceConfig();
    const policies = [
      ...config.mandatoryPolicies,
      ...(config.roleSpecificPolicies[role] || []),
      ...(config.countrySpecificPolicies[country] || [])
    ];

    return Array.from(new Set(policies));
  }

  async getAgreementTemplates() {
    return [
      { key: 'TERMS_AND_CONDITIONS', label: 'Terms & Conditions' },
      { key: 'PRIVACY_POLICY', label: 'Privacy Policy' },
      { key: 'COOKIE_POLICY', label: 'Cookie Policy' },
      { key: 'MERCHANT_AGREEMENT', label: 'Merchant Agreement' },
      { key: 'CENTRE_AGREEMENT', label: 'Centre Agreement' },
      { key: 'DISPATCH_PARTNER_AGREEMENT', label: 'Dispatch Partner Agreement' },
      { key: 'LOGISTICS_COMPANY_AGREEMENT', label: 'Logistics Company Agreement' },
      { key: 'API_PARTNER_AGREEMENT', label: 'API Partner Agreement' },
      { key: 'TRAINING_ACCEPTANCE', label: 'Training Acceptance' }
    ];
  }
}

export const complianceEngine = ComplianceEngine.getInstance();
