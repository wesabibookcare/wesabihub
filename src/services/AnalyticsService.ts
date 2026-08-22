import { shipmentRepository } from './db/ShipmentRepository';
import { userRepository } from './db/UserRepository';
import { hubPointRepository } from './db/HubPointRepository';
import { disputeRepository } from './db/DisputeRepository';
import { conversationRepository } from './db/ConversationRepository';
import { returnRepository } from './db/ReturnRepository';

export class AnalyticsService {
  async getControlCenterDashboard() {
    const fetchSafe = async (fn: () => Promise<any[]>) => {
      try {
        return await fn();
      } catch (err) {
        console.warn('Dashboard fetch failed for repository:', err);
        return [];
      }
    };

    const [shipments, points, users, disputes, conversations, returns] = await Promise.all([
      fetchSafe(() => shipmentRepository.getAll()),
      fetchSafe(() => hubPointRepository.getAll()),
      fetchSafe(() => userRepository.getAll()),
      fetchSafe(() => disputeRepository.getAll()),
      fetchSafe(() => conversationRepository.getAll()),
      fetchSafe(() => returnRepository.getAll())
    ]);

    return {
      totalShipments: shipments.length,
      activeShipments: shipments.filter(s => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(s.status)).length,
      totalPoints: points.length,
      totalUsers: users.length,
      onlineUsers: Math.floor(users.length * 0.15), // Simulated online count
      registeredCustomers: users.filter(u => u.role === 'CUSTOMER').length,
      registeredMerchants: users.filter(u => u.role === 'MERCHANT').length,
      centreOwners: users.filter(u => u.role === 'CENTER_OWNER').length,
      centreStaff: users.filter(u => u.role === 'CENTER_STAFF').length,
      logisticsPartners: users.filter(u => u.role === 'LOGISTICS_COMPANY' || u.role === 'LOGISTICS_OWNER' || u.role === 'DRIVER').length,
      developers: users.filter(u => u.role === 'DEVELOPER').length,
      activeSafePay: shipments.filter(s => s.SafePayStatus === 'HELD').length,
      pendingPickups: shipments.filter(s => s.status === 'READY_FOR_PICKUP' || s.status === 'ARRIVED_AT_DESTINATION').length,
      activeReturns: returns.filter(r => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status)).length,
      itemsInStorage: shipments.filter(s => s.status === 'RECEIVED_AT_ORIGIN' || s.status === 'ARRIVED_AT_DESTINATION').length,
      activeDisputes: disputes.filter(d => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(d.status)).length,
      aiConversations: conversations.length, // Simplified or use metadata check if exists
      apiUsage: 12450, // Mocked
      systemErrors: 3, // Mocked
      recentShipments: shipments.slice(0, 5)
    };
  }

  async getPointOwnerDashboard(centerId: string) {
    const [shipments] = await Promise.all([
      shipmentRepository.getByCenter(centerId, 'destination')
    ]);

    return {
      parcelCount: shipments.length,
      pendingPickups: shipments.filter(p => p.status === 'READY_FOR_PICKUP').length
    };
  }

  async getMerchantDashboard(merchantId: string) {
    const shipments = await shipmentRepository.getByMerchant(merchantId);
    return {
      totalShipments: shipments.length,
      completedDeliveries: shipments.filter(p => p.status === 'DELIVERED').length,
      pendingShipments: shipments.filter(p => p.status === 'AWAITING_DROP_OFF').length,
      cancelledShipments: shipments.filter(p => p.status === 'CANCELLED').length
    };
  }

  async trackEvent(eventType: string, data: any) {
    // In production, this would send to BigQuery, Mixpanel, or a specialized Audit collection
    console.log(`[Analytics] Event Tracked: ${eventType}`, data);
  }
}

export const analyticsService = new AnalyticsService();
