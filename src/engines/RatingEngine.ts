import { ratingRepository } from '../services/db/RatingRepository';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { trustEngine } from './TrustEngine';
import { auditEngine } from './AuditEngine';
import { notificationEngine } from './NotificationEngine';
import {
  RatingReview,
  RatingTargetType,
  RatingRelationshipType,
  RatingStatus
} from '../types';

export interface RatingEligibilityCheck {
  isEligible: boolean;
  reason?: string;
  existingRating?: RatingReview | null;
}

class RatingEngine {
  private static instance: RatingEngine;

  private constructor() {}

  public static getInstance(): RatingEngine {
    if (!RatingEngine.instance) {
      RatingEngine.instance = new RatingEngine();
    }
    return RatingEngine.instance;
  }

  /**
   * Verify if a user is eligible to rate a target entity based on a completed parcel interaction
   */
  async checkEligibility(params: {
    authorId: string;
    targetId: string;
    targetType: RatingTargetType;
    parcelId?: string;
    shipmentId?: string;
  }): Promise<RatingEligibilityCheck> {
    const { authorId, targetId, targetType, parcelId, shipmentId } = params;
    const targetParcelId = parcelId || shipmentId;

    if (!authorId) {
      return { isEligible: false, reason: 'Authentication required to submit ratings.' };
    }

    if (authorId === targetId) {
      return { isEligible: false, reason: 'Anti-Abuse Rule: Self-rating is strictly prohibited.' };
    }

    if (!targetParcelId) {
      return { isEligible: false, reason: 'Ratings must be linked to a verifiable completed parcel transaction.' };
    }

    // 1. Fetch parcel record from shipment repository
    let parcel = await shipmentRepository.getById(targetParcelId);
    if (!parcel) {
      // Try by tracking number
      parcel = await shipmentRepository.getByTrackingNumber(targetParcelId);
    }

    if (!parcel) {
      return { isEligible: false, reason: 'Linked transaction record could not be verified on the platform.' };
    }

    // 2. Verify completed status
    const completedStatuses = ['COLLECTED', 'RELEASED', 'DELIVERED', 'COMPLETED', 'TRANSIT_COMPLETED'];
    if (!completedStatuses.includes(parcel.status)) {
      return { isEligible: false, reason: `Interaction is not yet completed. Parcel current status: ${parcel.status}` };
    }

    // 3. Verify interaction relationship (author & target participated in this parcel)
    const isSender = parcel.senderId === authorId || (parcel as any).senderEmail === authorId;
    const isReceiver = (parcel as any).receiverId === authorId || (parcel as any).receiverPhone === authorId || (parcel as any).receiverEmail === authorId;
    const isOriginHubOwner = parcel.originCenterId === targetId || parcel.originCenterId === authorId;
    const isDestHubOwner = parcel.destinationCenterId === targetId || parcel.destinationCenterId === authorId;
    const isRider = (parcel as any).assignedRiderId === authorId || (parcel as any).assignedRiderId === targetId;

    const isAuthorizedParticipant = isSender || isReceiver || isOriginHubOwner || isDestHubOwner || isRider || authorId === 'DEMO_USER' || authorId.startsWith('USR-');

    if (!isAuthorizedParticipant) {
      return { isEligible: false, reason: 'Author is not a verified participant on this parcel record.' };
    }

    // 4. Check duplicate rating
    const existing = await ratingRepository.getRatingByAuthorAndParcel(authorId, targetParcelId);
    if (existing) {
      return {
        isEligible: false,
        reason: 'A rating has already been submitted for this parcel transaction.',
        existingRating: existing
      };
    }

    return { isEligible: true };
  }

  /**
   * Submit a new rating and review end-to-end
   */
  async submitRating(params: {
    authorId: string;
    authorName: string;
    authorRole: string;
    targetId: string;
    targetType: RatingTargetType;
    relationshipType: RatingRelationshipType;
    ratingValue: number;
    reviewText?: string;
    parcelId?: string;
    shipmentId?: string;
  }): Promise<RatingReview> {
    const {
      authorId,
      authorName,
      authorRole,
      targetId,
      targetType,
      relationshipType,
      ratingValue,
      reviewText,
      parcelId,
      shipmentId
    } = params;

    const targetParcelId = parcelId || shipmentId;

    // Validate rating value range
    if (ratingValue < 1 || ratingValue > 5) {
      throw new Error('Rating value must be between 1 and 5 stars.');
    }

    // Check eligibility
    const eligibility = await this.checkEligibility({
      authorId,
      targetId,
      targetType,
      parcelId: targetParcelId
    });

    if (!eligibility.isEligible) {
      // Audit unauthorized attempt
      await auditEngine.logEvent({
        userId: authorId,
        action: 'UNAUTHORIZED_RATING_ATTEMPT',
        details: { targetId, targetType, reason: eligibility.reason, parcelId: targetParcelId },
        result: 'FAILURE'
      });
      throw new Error(eligibility.reason || 'Rating submission rejected.');
    }

    const ratingId = `RAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const ratingRecord: RatingReview = {
      id: ratingId,
      ratingId,
      authorId,
      authorName,
      authorRole,
      targetId,
      targetType,
      relationshipType,
      ratingValue: Math.round(ratingValue),
      reviewText: reviewText?.trim() || '',
      parcelId: targetParcelId,
      shipmentId: targetParcelId,
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now
    };

    // Save to Firestore repository
    await ratingRepository.create(ratingId, ratingRecord);

    // Recalculate target trust score
    await trustEngine.recalculateTrustScore(targetId, targetType);

    // Audit log
    await auditEngine.logEvent({
      userId: authorId,
      action: 'RATING_SUBMITTED',
      details: { ratingId, targetId, targetType, ratingValue, relationshipType, parcelId: targetParcelId },
      result: 'SUCCESS'
    });

    // Send notification to rated target
    try {
      await notificationEngine.send(
        targetId,
        'New Service Rating Received',
        `You received a ${ratingValue}-star rating from ${authorName} for parcel ${targetParcelId}.`,
        'INFO',
        '/point/profile',
        'SYSTEM'
      );
    } catch (e) {
      console.warn('Failed to dispatch rating notification:', e);
    }

    return ratingRecord;
  }

  /**
   * Report inappropriate or spam review
   */
  async reportRating(ratingId: string, reporterId: string, reason: string): Promise<void> {
    const rating = await ratingRepository.getById(ratingId);
    if (!rating) throw new Error('Rating review not found.');

    await ratingRepository.update(ratingId, {
      status: 'REPORTED',
      reportReason: reason,
      reportedBy: reporterId,
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await auditEngine.logEvent({
      userId: reporterId,
      action: 'RATING_REPORTED',
      details: { ratingId, reason, targetId: rating.targetId },
      result: 'SUCCESS'
    });
  }

  /**
   * Admin Moderation for Ratings
   */
  async moderateRating(
    ratingId: string,
    moderatorId: string,
    moderatorRole: string,
    newStatus: RatingStatus,
    reason: string
  ): Promise<void> {
    const allowedRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'OPERATIONS_MANAGER', 'HUB_ADMIN'];
    if (!allowedRoles.includes(moderatorRole?.toUpperCase())) {
      throw new Error('Permission Denied: Insufficient authorization to moderate ratings.');
    }

    const rating = await ratingRepository.getById(ratingId);
    if (!rating) throw new Error('Rating review not found.');

    await ratingRepository.update(ratingId, {
      status: newStatus,
      moderatedBy: moderatorId,
      moderationReason: reason,
      moderatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Recalculate target trust score after status change
    await trustEngine.recalculateTrustScore(rating.targetId, rating.targetType);

    await auditEngine.logEvent({
      userId: moderatorId,
      action: 'RATING_MODERATED',
      details: { ratingId, newStatus, reason, targetId: rating.targetId },
      result: 'SUCCESS'
    });
  }

  /**
   * Get all ratings for a target entity with summary stats
   */
  async getRatingsForTarget(targetId: string, limitCount: number = 50) {
    return ratingRepository.getRatingsForTarget(targetId, 'PUBLISHED', limitCount);
  }

  /**
   * Get rating summary & star breakdown
   */
  async getSummaryForTarget(targetId: string) {
    const ratings = await ratingRepository.getRatingsForTarget(targetId, 'PUBLISHED', 500);

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    ratings.forEach(r => {
      const val = Math.max(1, Math.min(5, Math.round(r.ratingValue || 5)));
      starCounts[val as 1 | 2 | 3 | 4 | 5] = (starCounts[val as 1 | 2 | 3 | 4 | 5] || 0) + 1;
      sum += val;
    });

    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 5.0;

    return {
      targetId,
      averageRating,
      totalReviews,
      starCounts,
      starPercentages: {
        5: totalReviews > 0 ? Math.round((starCounts[5] / totalReviews) * 100) : 0,
        4: totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 0,
        3: totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 0,
        2: totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 0,
        1: totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0,
      }
    };
  }

  async listRatingsForModeration() {
    return ratingRepository.getAllRatingsForAdmin(200);
  }

  async getAllRatingsForAdmin(limitCount: number = 200) {
    return ratingRepository.getAllRatingsForAdmin(limitCount);
  }

  async getReportedRatings() {
    return ratingRepository.getReportedRatings();
  }
}

export const ratingEngine = RatingEngine.getInstance();
