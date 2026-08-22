import { trustFactorRepository } from '../services/db/TrustFactorRepository';
import { rankingFactorRepository } from '../services/db/RankingFactorRepository';
import { trustService } from '../services/TrustService';
import { auditEngine } from './AuditEngine';

/**
 * WeSabiHub Trust & Risk Engine
 * Manages fraud detection, trust scores, and compliance monitoring.
 */
class RiskEngine {
  private static instance: RiskEngine;

  private constructor() {}

  public static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  async getTrustScore(userId: string): Promise<number> {
    const factors = await trustFactorRepository.query([{ field: 'userId', operator: '==', value: userId }]);
    if (factors.length === 0) return 50; // Neutral starting score

    let totalWeight = 0;
    let weightedScore = 0;

    factors.forEach(f => {
      const weight = (f as any).weight || 1;
      weightedScore += (f as any).score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
  }

  async getRiskLevel(userId: string): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    const score = await this.getTrustScore(userId);
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  async validateTransaction(transactionId: string): Promise<boolean> {
    // Logic to validate if a transaction is risky
    // e.g. check for rapid successive transactions, high value from new users, etc.
    return true;
  }

  async flagSuspiciousActivity(userId: string, activityType: string, details: any): Promise<void> {
    // Log suspicious activity for admin review
    const id = `FRAUD-${Date.now()}`;
    // This could go into a dedicated collection or audit log
    await trustFactorRepository.create(id, {
      id,
      userId,
      type: 'NEGATIVE',
      score: 10, // Drastic reduction
      reason: `SUSPICIOUS_ACTIVITY: ${activityType}`,
      metadata: details,
      createdAt: new Date().toISOString()
    } as any);
  }

  async getTierConstraints(userId: string): Promise<any> {
    const risk = await this.getRiskLevel(userId);
    const constraints = {
      'LOW': { maxParcelValue: 1000000, maxDailyWithdrawal: 500000, requiredKYC: 'NONE' },
      'MEDIUM': { maxParcelValue: 200000, maxDailyWithdrawal: 100000, requiredKYC: 'BASIC' },
      'HIGH': { maxParcelValue: 50000, maxDailyWithdrawal: 20000, requiredKYC: 'ENHANCED' },
      'CRITICAL': { maxParcelValue: 0, maxDailyWithdrawal: 0, requiredKYC: 'FULL' }
    };
    return constraints[risk];
  }

  async getAllTrustFactors() {
    return trustFactorRepository.getAll();
  }

  async getAllRankingFactors() {
    return rankingFactorRepository.getAll();
  }

  async updateTrustFactor(id: string, updates: any, adminId: string) {
    await trustFactorRepository.update(id, updates);

    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_TRUST_FACTOR', details: { id, updates }, result: 'SUCCESS' });
  }

  async updateRankingFactor(id: string, updates: any, adminId: string) {
    await rankingFactorRepository.update(id, updates);

    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_RANKING_FACTOR', details: { id, updates }, result: 'SUCCESS' });
  }

}

export const riskEngine = RiskEngine.getInstance();
