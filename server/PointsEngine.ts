import { getFirestore } from 'firebase-admin/firestore';

export interface PointRule {
  id: string;
  label: string;
  points: number;
  isActive: boolean;
  isSystem: boolean;
}

export interface StarThreshold {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  boost: string;
  visibility: string;
  stars: number;
}

export interface TrustFactor {
  id: string;
  label: string;
  weight: number;
  isActive: boolean;
}

export interface RankingFactor {
  id: string;
  label: string;
  weight: number;
}

export async function seedPointsAndTrustRules(db: any) {
  try {
    const pointRulesColl = db.collection('wesabiPointRules');
    const pointRulesSnap = await pointRulesColl.limit(1).get();
    if (pointRulesSnap.empty) {
      console.log('Seeding default point rules...');
      const defaultRules: PointRule[] = [
        { id: 'parcel_acceptance', label: 'Successful parcel acceptance', points: 50, isActive: true, isSystem: true },
        { id: 'parcel_handover', label: 'Successful parcel handover', points: 75, isActive: true, isSystem: true },
        { id: 'customer_pickup', label: 'Successful customer pickup', points: 100, isActive: true, isSystem: true },
        { id: 'fast_processing', label: 'Fast parcel processing', points: 30, isActive: true, isSystem: true },
        { id: 'high_ratings', label: 'High customer rating (5★)', points: 25, isActive: true, isSystem: true },
        { id: 'verified_status', label: 'Verified business status', points: 200, isActive: true, isSystem: true },
        { id: 'active_participation', label: 'Active participation', points: 50, isActive: true, isSystem: true },
        { id: 'profile_complete', label: 'Completing profile info', points: 100, isActive: true, isSystem: true },
        { id: 'verification_complete', label: 'Completing verification', points: 150, isActive: true, isSystem: true },
        { id: 'consistency', label: 'Long-term consistency', points: 300, isActive: true, isSystem: true },
        { id: 'late_processing', label: 'Late parcel processing (Deduction)', points: -150, isActive: true, isSystem: true },
        { id: 'unresolved_dispute', label: 'Unresolved dispute (Deduction)', points: -200, isActive: true, isSystem: true },
      ];
      for (const rule of defaultRules) {
        await pointRulesColl.doc(rule.id).set(rule);
      }
    }

    const starThresholdsColl = db.collection('wesabiStarThresholds');
    const starThresholdsSnap = await starThresholdsColl.limit(1).get();
    if (starThresholdsSnap.empty) {
      console.log('Seeding default star thresholds...');
      const defaultThresholds: StarThreshold[] = [
        { id: 'level_1', name: 'Bronze', minPoints: 0, maxPoints: 999, boost: '1.0x', visibility: 'Standard', stars: 1 },
        { id: 'level_2', name: 'Silver', minPoints: 1000, maxPoints: 4999, boost: '1.1x', visibility: 'Enhanced', stars: 2 },
        { id: 'level_3', name: 'Gold', minPoints: 5000, maxPoints: 14999, boost: '1.2x', visibility: 'Priority', stars: 3 },
        { id: 'level_4', name: 'Platinum', minPoints: 15000, maxPoints: 49999, boost: '1.4x', visibility: 'Premium', stars: 4 },
        { id: 'level_5', name: 'Diamond', minPoints: 50000, maxPoints: 9999999, boost: '1.8x', visibility: 'Maximum', stars: 5 },
      ];
      for (const threshold of defaultThresholds) {
        await starThresholdsColl.doc(threshold.id).set(threshold);
      }
    }

    const trustFactorsColl = db.collection('wesabiTrustFactors');
    const trustFactorsSnap = await trustFactorsColl.limit(1).get();
    if (trustFactorsSnap.empty) {
      console.log('Seeding default trust factors...');
      const defaultFactors: TrustFactor[] = [
        { id: 'successful_deliveries', label: 'Successful Deliveries', weight: 35, isActive: true },
        { id: 'customer_ratings', label: 'Customer Ratings', weight: 20, isActive: true },
        { id: 'verification_status', label: 'Verification Status', weight: 15, isActive: true },
        { id: 'response_time', label: 'Response Time', weight: 10, isActive: true },
        { id: 'complaints', label: 'Complaint History', weight: -20, isActive: true },
        { id: 'disputes', label: 'Dispute History', weight: -100, isActive: true },
      ];
      for (const f of defaultFactors) {
        await trustFactorsColl.doc(f.id).set(f);
      }
    }

    const rankingFactorsColl = db.collection('wesabiRankingFactors');
    const rankingFactorsSnap = await rankingFactorsColl.limit(1).get();
    if (rankingFactorsSnap.empty) {
      console.log('Seeding default ranking factors...');
      const defaultRankings: RankingFactor[] = [
        { id: 'proximity', label: 'Proximity (Distance)', weight: 40 },
        { id: 'trust_score', label: 'Trust Score', weight: 25 },
        { id: 'star_rating', label: 'Star Rating Level', weight: 15 },
        { id: 'success_rate', label: 'Successful Deliveries', weight: 10 },
        { id: 'promotion', label: 'Platform Promotion', weight: 10 },
      ];
      for (const f of defaultRankings) {
        await rankingFactorsColl.doc(f.id).set(f);
      }
    }
  } catch (error) {
    console.error('Error seeding default rules:', error);
  }
}

export async function awardPoints(db: any, hubId: string, activityKey: string, reason: string, metadata?: any) {
  try {
    const ruleDoc = await db.collection('wesabiPointRules').doc(activityKey).get();
    let basePoints = 0;
    let label = activityKey;

    if (ruleDoc.exists) {
      const data = ruleDoc.data();
      if (!data.isActive) {
        console.log(`Point rule ${activityKey} is disabled.`);
        return;
      }
      basePoints = data.points;
      label = data.label;
    } else {
      // Use defaults if rule document doesn't exist
      const fallbacks: Record<string, number> = {
        parcel_acceptance: 50,
        parcel_handover: 75,
        customer_pickup: 100,
        fast_processing: 30,
        high_ratings: 25,
        verified_status: 200,
        active_participation: 50,
        profile_complete: 100,
        verification_complete: 150,
        consistency: 300,
        late_processing: -150,
        unresolved_dispute: -200,
      };
      if (fallbacks[activityKey] !== undefined) {
        basePoints = fallbacks[activityKey];
      } else {
        console.log(`No points rule or fallback found for: ${activityKey}`);
        return;
      }
    }

    // Check campaigns
    let multiplier = 1;
    const nowStr = new Date().toISOString();
    const campaignsSnap = await db.collection('wesabiBonusCampaigns')
      .where('isActive', '==', true)
      .get();

    for (const doc of campaignsSnap.docs) {
      const campaign = doc.data();
      if (campaign.startDate <= nowStr && campaign.endDate >= nowStr) {
        if (!campaign.targetActivity || campaign.targetActivity === activityKey) {
          multiplier *= (campaign.multiplier || 1.5);
          reason = `[${campaign.name}] ${reason}`;
        }
      }
    }

    const pointsToAward = Math.round(basePoints * multiplier);

    // Get hub document
    const hubRef = db.collection('wesabiHubPoints').doc(hubId);
    const hubDoc = await hubRef.get();
    if (!hubDoc.exists) {
      console.error(`Hub ${hubId} not found to award points`);
      return;
    }

    const hubData = hubDoc.data();
    const oldPoints = hubData.totalPoints || 0;
    const newPoints = Math.max(0, oldPoints + pointsToAward);

    // Update Points
    await hubRef.update({
      totalPoints: newPoints,
      updatedAt: new Date().toISOString()
    });

    // Write points audit log
    const logId = `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    await db.collection('wesabiPointAuditLogs').doc(logId).set({
      id: logId,
      hubId,
      type: pointsToAward >= 0 ? 'POINT_AWARD' : 'POINT_DEDUCTION',
      points: pointsToAward,
      oldValue: oldPoints,
      newValue: newPoints,
      reason: `${reason} (${label})`,
      timestamp: new Date().toISOString(),
      metadata: metadata || null
    });

    // Recalculate trust score and stars
    await recalculateTrustScoreAndStars(db, hubId);
  } catch (err) {
    console.error('Error awarding points:', err);
  }
}

export async function recalculateTrustScoreAndStars(db: any, hubId: string) {
  try {
    const hubRef = db.collection('wesabiHubPoints').doc(hubId);
    const hubDoc = await hubRef.get();
    if (!hubDoc.exists) return;

    const hubData = hubDoc.data();
    const totalPoints = hubData.totalPoints || 0;
    const rating = hubData.rating || 4.5;
    const isVerified = hubData.isVerified || false;
    const disputes = hubData.disputeCount || 0;
    const complaints = hubData.complaintCount || 0;
    const responseTime = hubData.responseTimeMin || 15; // default 15 minutes

    // Fetch active trust factors
    const trustFactorsSnap = await db.collection('wesabiTrustFactors').get();
    const trustFactors: TrustFactor[] = trustFactorsSnap.docs.map((doc: any) => doc.data());

    let score = 60; // Starting base score

    // 1. Deliveries/Points Factor
    const pointsFactor = trustFactors.find(f => f.id === 'successful_deliveries');
    if (pointsFactor && pointsFactor.isActive) {
      // 100 points = +1 points on trust score, max 25 points boost
      const boost = Math.min(25, (totalPoints / 100) * Math.abs(pointsFactor.weight / 10));
      score += boost;
    }

    // 2. Customer Ratings Factor
    const ratingsFactor = trustFactors.find(f => f.id === 'customer_ratings');
    if (ratingsFactor && ratingsFactor.isActive) {
      // ratings around 5 give positive, below 3.5 give negative
      const boost = (rating - 3.5) * (ratingsFactor.weight / 1.5);
      score += boost;
    }

    // 3. Verification Factor
    const verFactor = trustFactors.find(f => f.id === 'verification_status');
    if (verFactor && verFactor.isActive) {
      if (isVerified) {
        score += Math.abs(verFactor.weight);
      }
    }

    // 4. Response Time Factor
    const respFactor = trustFactors.find(f => f.id === 'response_time');
    if (respFactor && respFactor.isActive) {
      // less than 10 mins adds weight, more than 30 deducts
      const responseTimeGap = 20 - responseTime;
      const boost = (responseTimeGap / 10) * Math.abs(respFactor.weight / 2);
      score += boost;
    }

    // 5. Complaint Factor
    const complaintFactor = trustFactors.find(f => f.id === 'complaints');
    if (complaintFactor && complaintFactor.isActive) {
      score += (complaints * complaintFactor.weight); // weight is negative
    }

    // 6. Dispute Factor
    const disputeFactor = trustFactors.find(f => f.id === 'disputes');
    if (disputeFactor && disputeFactor.isActive) {
      score += (disputes * disputeFactor.weight); // weight is negative
    }

    // Ensure range [0, 100]
    score = Math.max(0, Math.min(100, Math.round(score)));

    const oldTrustScore = hubData.trustScore || 0;
    const oldStarRating = hubData.starRating || 1;

    // Convert trust score into star rating (1 to 5)
    // 0 - 39 = 1-2 stars, 40 - 59 = 3 stars, 60 - 79 = 4 stars, 80 - 100 = 5 stars
    let calculatedStars = 1;
    if (score >= 80) calculatedStars = 5;
    else if (score >= 60) calculatedStars = 4;
    else if (score >= 40) calculatedStars = 3;
    else if (score >= 20) calculatedStars = 2;

    // Check with point thresholds as well (e.g. Bronze, Silver, Gold, Platinum, Diamond)
    const thresholdsSnap = await db.collection('wesabiStarThresholds').get();
    const thresholds: StarThreshold[] = thresholdsSnap.docs.map((doc: any) => doc.data());

    // Sort thresholds ascending by minPoints
    thresholds.sort((a, b) => a.minPoints - b.minPoints);

    let activeThreshold = thresholds[0];
    for (const t of thresholds) {
      if (totalPoints >= t.minPoints) {
        activeThreshold = t;
      }
    }

    // Star rating is maximum of trust score conversion or point-tier stars
    const starRating = Math.max(calculatedStars, activeThreshold ? activeThreshold.stars : 1);

    // Save updates
    const updates: any = {
      trustScore: score,
      starRating: starRating,
      tier: activeThreshold ? activeThreshold.name : 'Bronze',
      updatedAt: new Date().toISOString()
    };

    // Calculate local and national rankings!
    await hubRef.update(updates);

    // Log trust score update if changed
    if (oldTrustScore !== score) {
      const logId = `AUD-${Date.now()}-TST`.toUpperCase();
      await db.collection('wesabiPointAuditLogs').doc(logId).set({
        id: logId,
        hubId,
        type: 'TRUST_SCORE_UPDATE',
        oldValue: oldTrustScore,
        newValue: score,
        reason: 'Automated recalculation based on performance variables',
        timestamp: new Date().toISOString()
      });
    }

    // Log star rating update if changed
    if (oldStarRating !== starRating) {
      const logId = `AUD-${Date.now()}-STR`.toUpperCase();
      await db.collection('wesabiPointAuditLogs').doc(logId).set({
        id: logId,
        hubId,
        type: 'STAR_RATING_CHANGE',
        oldValue: oldStarRating,
        newValue: starRating,
        reason: `Star rating level changed to ${activeThreshold ? activeThreshold.name : 'Bronze'} (${starRating}★)`,
        timestamp: new Date().toISOString()
      });
    }

    // Recalculate rankings across all active hubs
    await recalculateAllRankings(db);
  } catch (err) {
    console.error('Error recalculating trust and stars:', err);
  }
}

export async function recalculateAllRankings(db: any) {
  try {
    const hubsSnap = await db.collection('wesabiHubPoints')
      .where('status', '==', 'ACTIVE')
      .get();

    if (hubsSnap.empty) return;

    const hubs = hubsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by Trust Score desc, totalPoints desc, rating desc
    hubs.sort((a: any, b: any) => {
      if ((b.trustScore || 0) !== (a.trustScore || 0)) {
        return (b.trustScore || 0) - (a.trustScore || 0);
      }
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

    // Update national rankings
    const batch = db.batch();
    hubs.forEach((hub: any, idx: number) => {
      const rank = idx + 1;
      const ref = db.collection('wesabiHubPoints').doc(hub.id);
      batch.update(ref, { nationalRanking: rank });
    });

    // Group by state/city for local rankings
    const cityGroups: Record<string, any[]> = {};
    hubs.forEach((hub: any) => {
      const city = hub.city || 'Lagos';
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(hub);
    });

    Object.keys(cityGroups).forEach((city) => {
      const list = cityGroups[city];
      list.forEach((hub: any, idx: number) => {
        const rank = idx + 1;
        const ref = db.collection('wesabiHubPoints').doc(hub.id);
        batch.update(ref, { localRanking: rank });
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Error recalculating global rankings:', err);
  }
}
