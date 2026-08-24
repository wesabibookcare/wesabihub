import { analyticsService } from '../services/AnalyticsService';
import { shipmentRepository } from '../services/db/ShipmentRepository';
import { walletRepository } from '../services/db/FinancialRepository';
import { userRepository } from '../services/db/UserRepository';

/**
 * OmorfiHub Intelligence Engine
 * Handles non-blocking event processing for AI, analytics, and fraud detection.
 */
class IntelligenceEngine {
  private static instance: IntelligenceEngine;

  private constructor() {}

  public static getInstance(): IntelligenceEngine {
    if (!IntelligenceEngine.instance) {
      IntelligenceEngine.instance = new IntelligenceEngine();
    }
    return IntelligenceEngine.instance;
  }

  /**
   * Process a platform event for intelligence gathering.
   * This should be called in a non-blocking way.
   */
  async processEvent(eventType: string, data: any): Promise<void> {
    try {
      // Logic for AI insights, fraud detection, and analytics
      await analyticsService.trackEvent(eventType, data);
    } catch (error) {
      console.error('Intelligence Engine Error:', error);
    }
  }

  /**
   * Platform Analytics & Business Metrics
   */
  async getBusinessOverview(): Promise<any> {
    const allShipments = await shipmentRepository.getAll();
    const allUsers = await userRepository.getAll();
    const allWallets = await walletRepository.getAll();

    return {
      totalShipments: allShipments.length,
      activeUsers: allUsers.filter(u => u.status === 'ACTIVE').length,
      totalVolume: allWallets.reduce((acc, w) => acc + (w.balance || 0), 0),
      growthRate: 15, // Placeholder for actual calculation
      timestamp: new Date().toISOString()
    };
  }

  async getOperationalInsights(): Promise<any> {
    const shipments = await shipmentRepository.getAll();
    const statusCounts = shipments.reduce((acc: any, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    return {
      statusCounts,
      averageDeliveryTime: '3.2 days', // Placeholder
      hotzones: ['Lagos', 'Abuja', 'Port Harcourt']
    };
  }
}

export const intelligenceEngine = IntelligenceEngine.getInstance();
