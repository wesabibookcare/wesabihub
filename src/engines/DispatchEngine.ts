import { User, UserRole } from '../types';
import { userRepository } from '../services/db/UserRepository';
import { auditEngine, notificationEngine } from './index';

/**
 * OmorfiHub Dispatch Engine
 * Manages Dispatch Riders, Fleet, and Delivery Assignments.
 */
class DispatchEngine {
  private static instance: DispatchEngine;

  private constructor() {}

  public static getInstance(): DispatchEngine {
    if (!DispatchEngine.instance) {
      DispatchEngine.instance = new DispatchEngine();
    }
    return DispatchEngine.instance;
  }

  async getRider(riderId: string): Promise<User | null> {
    const user = await userRepository.getById(riderId);
    if (user && user.role === 'DISPATCH_RIDER') return user;
    return null;
  }

  async updateRiderAvailability(riderId: string, isAvailable: boolean): Promise<void> {
    await userRepository.update(riderId, {
      isAvailable,
      updatedAt: new Date().toISOString()
    });

    await auditEngine.logEvent({
      userId: riderId,
      userRole: 'DISPATCH_RIDER',
      action: 'UPDATE_AVAILABILITY',
      details: { isAvailable },
      result: 'SUCCESS'
    });
  }

  async listActiveRidersInRegion(region: string): Promise<User[]> {
    // Basic implementation
    const riders = await userRepository.getByRole('DISPATCH_RIDER');
    return riders.filter(r => r.status === 'ACTIVE' && r.isAvailable);
  }

  /**
   * Calculates dynamic payout for a SendOmorfi rider based on delivery base fare
   * and admin-configured transit mode payout multipliers.
   */
  calculatePayout(baseFare: number, transitMode?: string, rates?: { onFootMultiplier?: number; bicycleMultiplier?: number; otherVehiclesMultiplier?: number }): number {
    const validBaseFare = Math.max(0, baseFare || 0);
    const mode = transitMode || 'On foot';

    let multiplier = rates?.onFootMultiplier ?? 1.0;
    if (mode === 'Bicycle') {
      multiplier = rates?.bicycleMultiplier ?? 1.25;
    } else if (mode === 'Other Vehicles') {
      multiplier = rates?.otherVehiclesMultiplier ?? 1.6;
    }

    return Math.round(validBaseFare * multiplier);
  }
}

export const dispatchEngine = DispatchEngine.getInstance();
