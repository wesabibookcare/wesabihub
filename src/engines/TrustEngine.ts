import { ratingRepository } from '../services/db/RatingRepository';
import { hubPointRepository } from '../services/db/HubPointRepository';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { disputeRepository } from '../services/db/DisputeRepository';
import { userRepository } from '../services/db/UserRepository';
import { logisticsRepository } from '../services/db/LogisticsRepository';
import { auditEngine } from './AuditEngine';
import { RatingTargetType, TrustScoreBreakdown, TrustTier } from '../types';

class TrustEngine {
  private static instance: TrustEngine;

  private constructor() {}

  public static getInstance(): TrustEngine {
    if (!TrustEngine.instance) {
      TrustEngine.instance = new TrustEngine();
    }
    return TrustEngine.instance;
  }

  /**
   * Recalculates and persists authoritative Trust Score and Star Rating for any platform entity.
   */
  async recalculateTrustScore(entityId: string, entityType: RatingTargetType): Promise<TrustScoreBreakdown> {
    // 1. Fetch published ratings
    const ratings = await ratingRepository.getRatingsForTarget(entityId, 'PUBLISHED', 500);
    const totalRatingsCount = ratings.length;
    let averageRating = 5.0; // Default baseline if no ratings yet

    if (totalRatingsCount > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.ratingValue || 5), 0);
      averageRating = Number((sum / totalRatingsCount).toFixed(1));
    }

    // 2. Fetch completed shipments/parcels count
    let completedTransactions = 0;
    let totalTransactions = 0;
    try {
      if (entityType === 'HUB') {
        const allParcels = await shipmentRepository.getByHub(entityId);
        totalTransactions = allParcels.length;
        completedTransactions = allParcels.filter(p => p.status === 'COLLECTED' || p.status === 'DELIVERED' || p.status === 'COMPLETED').length;
      } else if (entityType === 'MERCHANT' || entityType === 'CUSTOMER') {
        const parcels = await shipmentRepository.getBySender(entityId);
        totalTransactions = parcels.length;
        completedTransactions = parcels.filter(p => p.status === 'COLLECTED' || p.status === 'DELIVERED').length;
      }
    } catch (e) {
      console.warn('Unable to query completed transactions for trust score calculation:', e);
    }

    // 3. Fetch disputes
    let disputeCount = 0;
    try {
      const disputes = await disputeRepository.getAll();
      disputeCount = disputes.filter(d => (d as any).hubId === entityId || (d as any).complainantId === entityId || (d as any).respondentId === entityId).length;
    } catch (e) {
      console.warn('Unable to query disputes for trust score calculation:', e);
    }

    const successRatePercent = totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 100;

    // 4. Calculate Trust Score (0 to 100 scale)
    let score = 50; // Neutral base score

    // Rating contribution: -25 to +25 points
    if (totalRatingsCount > 0) {
      const ratingContribution = Math.round(((averageRating - 3.0) / 2.0) * 25);
      score += ratingContribution;
    } else {
      score += 10; // Baseline rating score for new active account
    }

    // Rating volume contribution: up to +10 points
    const volumeBonus = Math.min(totalRatingsCount * 2, 10);
    score += volumeBonus;

    // Transaction volume contribution: up to +15 points
    const transactionBonus = Math.min(completedTransactions * 1, 15);
    score += transactionBonus;

    // Success rate contribution: up to +10 points
    const successBonus = Math.round((successRatePercent / 100) * 10);
    score += successBonus;

    // Dispute penalty: -10 points per dispute
    score -= disputeCount * 10;

    // Clamp score between 10 and 100
    const trustScore = Math.max(10, Math.min(100, Math.round(score)));

    // Determine Trust Tier
    let tier: TrustTier = 'BRONZE';
    if (trustScore >= 90) tier = 'DIAMOND';
    else if (trustScore >= 80) tier = 'PLATINUM';
    else if (trustScore >= 70) tier = 'GOLD';
    else if (trustScore >= 60) tier = 'SILVER';

    const starRating = Math.max(1, Math.min(5, Math.round(averageRating)));

    const breakdown: TrustScoreBreakdown = {
      entityId,
      entityType,
      trustScore,
      tier,
      averageRating,
      totalRatingsCount,
      completedTransactions,
      successRatePercent,
      disputeCount,
      cancellationCount: 0,
      identityVerified: true,
      calculatedAt: new Date().toISOString()
    };

    // 5. Persist score to respective target document
    try {
      if (entityType === 'HUB') {
        await hubPointRepository.update(entityId, {
          rating: averageRating,
          reviews: totalRatingsCount,
          trustScore,
          starRating
        });
      } else if (entityType === 'MERCHANT' || entityType === 'CUSTOMER') {
        const user = await userRepository.getById(entityId);
        if (user) {
          await userRepository.update(entityId, {
            rating: averageRating,
            trustScore
          } as any);
        }
      } else if (entityType === 'LOGISTICS') {
        const company = await logisticsRepository.getById(entityId);
        if (company) {
          await logisticsRepository.update(entityId, {
            rating: averageRating,
            trustScore
          } as any);
        }
      }
    } catch (e) {
      console.error('Failed to persist entity trust score updates:', e);
    }

    // Audit log
    await auditEngine.logEvent({
      userId: 'SYSTEM_TRUST_ENGINE',
      action: 'TRUST_SCORE_RECALCULATED',
      details: { entityId, entityType, breakdown },
      result: 'SUCCESS'
    });

    return breakdown;
  }

  /**
   * Get formatted trust score breakdown
   */
  async getTrustScoreBreakdown(entityId: string, entityType: RatingTargetType): Promise<TrustScoreBreakdown> {
    return this.recalculateTrustScore(entityId, entityType);
  }
}

export const trustEngine = TrustEngine.getInstance();
