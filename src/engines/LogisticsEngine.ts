import { LogisticsCompany, User } from '../types';
import { Vehicle, TransportJob } from '../types/logistics';
import { logisticsRepository } from '../services/db/LogisticsRepository';
import { vehicleRepository } from '../services/db/VehicleRepository';
import { transportJobRepository } from '../services/db/TransportJobRepository';
import { userRepository } from '../services/db/UserRepository';
import { auditEngine } from './AuditEngine';
import { where } from 'firebase/firestore';

/**
 * WeSabiHub Logistics Engine
 * Manages Logistics Companies, Fleets, and Business Metrics.
 */
class LogisticsEngine {
  private static instance: LogisticsEngine;

  private constructor() {}

  public static getInstance(): LogisticsEngine {
    if (!LogisticsEngine.instance) {
      LogisticsEngine.instance = new LogisticsEngine();
    }
    return LogisticsEngine.instance;
  }

  async getCompanyByOwner(ownerId: string): Promise<LogisticsCompany | null> {
    return await logisticsRepository.getByOwner(ownerId);
  }

  async updateCompany(id: string, data: Partial<LogisticsCompany>): Promise<void> {
    await logisticsRepository.update(id, data);

    const company = await logisticsRepository.getById(id);
    if (company) {
      await auditEngine.logEvent({
        userId: company.ownerId,
        userRole: 'LOGISTICS_COMPANY',
        action: 'COMPANY_UPDATE',
        details: { id, ...data },
        result: 'SUCCESS'
      });
    }
  }

  // Vehicle Management
  async getFleet(companyId: string): Promise<Vehicle[]> {
    return await vehicleRepository.getAll([where('companyId', '==', companyId)]);
  }

  async addVehicle(companyId: string, data: Omit<Vehicle, 'id'>): Promise<string> {
    // Generate a random ID since BaseRepository.create requires one
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await vehicleRepository.create(id, { ...data, id, companyId } as any);
    return id;
  }

  // Transport Job Management
  async getJobs(companyId: string): Promise<TransportJob[]> {
    return await transportJobRepository.getAll([where('companyId', '==', companyId)]);
  }

  async createJob(companyId: string, data: Omit<TransportJob, 'id'>): Promise<string> {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await transportJobRepository.create(id, { ...data, id, companyId } as any);
    return id;
  }

  // Staff Management
  async getStaff(companyId: string): Promise<User[]> {
    return await userRepository.getAll([where('companyId', '==', companyId)]);
  }

  async updateStaffStatus(staffId: string, status: string, actorId: string): Promise<void> {
    await userRepository.update(staffId, { status } as any);

    await auditEngine.logEvent({
      userId: actorId,
      userRole: 'LOGISTICS_COMPANY',
      action: 'STAFF_STATUS_UPDATE',
      details: { staffId, status },
      result: 'SUCCESS'
    });
  }
}

export const logisticsEngine = LogisticsEngine.getInstance();
