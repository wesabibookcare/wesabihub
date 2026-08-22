import { pointRuleRepository } from '../services/db/PointRuleRepository';
import { starThresholdRepository } from '../services/db/StarThresholdRepository';
import { auditEngine } from './AuditEngine';

class PointsEngine {
  private static instance: PointsEngine;

  private constructor() {}

  public static getInstance(): PointsEngine {
    if (!PointsEngine.instance) {
      PointsEngine.instance = new PointsEngine();
    }
    return PointsEngine.instance;
  }

  async getAllRules() {
    return pointRuleRepository.getAll();
  }

  async getAllThresholds() {
    return starThresholdRepository.getAll();
  }

  async updateRule(id: string, updates: any, adminId: string) {
    await pointRuleRepository.update(id, updates);
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_POINT_RULE' as any, details: { id, updates }, result: 'SUCCESS' });
  }

  async updateThreshold(id: string, updates: any, adminId: string) {
    await starThresholdRepository.update(id, updates);
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_STAR_THRESHOLD' as any, details: { id, updates }, result: 'SUCCESS' });
  }

  async createThreshold(id: string, data: any, adminId: string) {
    await starThresholdRepository.create(id, data);
    await auditEngine.logEvent({ userId: adminId, action: 'CREATE_STAR_THRESHOLD' as any, details: { id, data }, result: 'SUCCESS' });
  }
}

export const pointsEngine = PointsEngine.getInstance();
