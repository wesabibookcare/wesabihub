import { Shift, ShiftLocation, ShiftStatus } from '../types';
import { shiftRepository } from '../services/db/ShiftRepository';
import { auditEngine } from './AuditEngine';
import { orderBy, limit } from 'firebase/firestore';

/**
 * OmorfiHub Shift Engine
 * Authoritative lifecycle & audit controller for operational staff shifts across Hubs.
 */
class ShiftEngine {
  private static instance: ShiftEngine;

  private constructor() {}

  public static getInstance(): ShiftEngine {
    if (!ShiftEngine.instance) {
      ShiftEngine.instance = new ShiftEngine();
    }
    return ShiftEngine.instance;
  }

  /**
   * Start a new shift for an authorized staff member
   */
  async startShift(params: {
    staffId: string;
    staffName: string;
    hubId: string;
    hubName: string;
    role: string;
    startLocation?: ShiftLocation;
    notes?: string;
  }): Promise<Shift> {
    const { staffId, staffName, hubId, hubName, role, startLocation, notes } = params;

    if (!staffId || !hubId) {
      throw new Error('Staff ID and Hub ID are required to start a shift.');
    }

    // 1. Verify if staff already has an active shift
    const existingActive = await shiftRepository.getActiveShiftByStaff(staffId);
    if (existingActive) {
      await auditEngine.logEvent({
        userId: staffId,
        userRole: role,
        action: 'SHIFT_START_REJECTED',
        details: { hubId, reason: 'Staff already has an active shift.', existingShiftId: existingActive.id },
        result: 'FAILURE',
        targetId: existingActive.id
      });
      throw new Error(`Cannot start shift: Staff member already has an active shift (${existingActive.id}) at Hub ${existingActive.hubName}.`);
    }

    // 2. Build shift object
    const shiftId = `SHF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const newShift: Shift = {
      id: shiftId,
      shiftId,
      hubId,
      hubName: hubName || 'Hub Center',
      staffId,
      staffName: staffName || 'Staff Member',
      role: role || 'CENTER_STAFF',
      startTime: nowIso,
      status: 'ACTIVE',
      startLocation,
      parcelsProcessed: 0,
      parcelsReceived: 0,
      parcelsReleased: 0,
      exceptionsRecorded: 0,
      custodyActionsPerformed: 0,
      totalOperationalActions: 0,
      notes: notes || '',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 3. Persist shift
    await shiftRepository.create(shiftId, newShift);

    // 4. Audit Log
    await auditEngine.logEvent({
      userId: staffId,
      userRole: role,
      action: 'SHIFT_STARTED',
      details: { shiftId, hubId, hubName, startTime: nowIso },
      result: 'SUCCESS',
      targetId: shiftId
    });

    return newShift;
  }

  /**
   * End an active shift
   */
  async endShift(params: {
    shiftId: string;
    actorId: string;
    actorRole?: string;
    endLocation?: ShiftLocation;
    notes?: string;
  }): Promise<Shift> {
    const { shiftId, actorId, actorRole, endLocation, notes } = params;

    const shift = await shiftRepository.getById(shiftId);
    if (!shift) {
      throw new Error(`Shift record ${shiftId} not found.`);
    }

    if (shift.status !== 'ACTIVE') {
      throw new Error(`Shift ${shiftId} is already completed or cancelled.`);
    }

    // RBAC Check: Staff ending their own shift OR Hub Owner / Management
    const isOwner = shift.staffId === actorId;
    const isAuthorizedMgmt = ['CENTER_OWNER', 'OPERATIONS_MANAGER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(actorRole || '');

    if (!isOwner && !isAuthorizedMgmt) {
      await auditEngine.logEvent({
        userId: actorId,
        userRole: actorRole,
        action: 'SHIFT_END_REJECTED',
        details: { shiftId, targetStaffId: shift.staffId, reason: 'Unauthorized actor attempting to end shift.' },
        result: 'FAILURE',
        targetId: shiftId
      });
      throw new Error('Unauthorized: You can only end your own shift unless you are an authorized Hub Owner or Operations Manager.');
    }

    const nowIso = new Date().toISOString();
    const updates: Partial<Shift> = {
      status: 'COMPLETED',
      endTime: nowIso,
      endLocation,
      notes: notes ? `${shift.notes || ''} | ${notes}` : shift.notes,
      updatedAt: nowIso
    };

    await shiftRepository.update(shiftId, updates);

    const updatedShift = { ...shift, ...updates };

    await auditEngine.logEvent({
      userId: actorId,
      userRole: actorRole || shift.role,
      action: 'SHIFT_ENDED',
      details: {
        shiftId,
        hubId: shift.hubId,
        staffId: shift.staffId,
        durationMs: new Date(nowIso).getTime() - new Date(shift.startTime).getTime(),
        totalActions: shift.totalOperationalActions
      },
      result: 'SUCCESS',
      targetId: shiftId
    });

    return updatedShift as Shift;
  }

  /**
   * Get active shift for a staff member
   */
  async getActiveShiftForStaff(staffId: string): Promise<Shift | null> {
    return await shiftRepository.getActiveShiftByStaff(staffId);
  }

  /**
   * Get active shifts for a hub
   */
  async getActiveShiftsForHub(hubId: string): Promise<Shift[]> {
    return await shiftRepository.getActiveShiftsByHub(hubId);
  }

  /**
   * Get all shift history for a hub
   */
  async getShiftHistoryForHub(hubId: string, limitCount: number = 100): Promise<Shift[]> {
    return await shiftRepository.getShiftsByHub(hubId, limitCount);
  }

  /**
   * Get shift history for a specific staff member
   */
  async getShiftHistoryForStaff(staffId: string, limitCount: number = 100): Promise<Shift[]> {
    return await shiftRepository.getShiftsByStaff(staffId, limitCount);
  }

  /**
   * Get all platform shifts for Super Admin / Global Monitoring
   */
  async getAllShifts(limitCount: number = 200): Promise<Shift[]> {
    return await shiftRepository.getAll([
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  }

  /**
   * Realtime listener for Hub staff shifts
   */
  subscribeToHubShifts(hubId: string, callback: (shifts: Shift[]) => void) {
    return shiftRepository.subscribeToHubShifts(hubId, callback);
  }

  /**
   * Realtime listener for Staff member shifts
   */
  subscribeToStaffShifts(staffId: string, callback: (shifts: Shift[]) => void) {
    return shiftRepository.subscribeToStaffShifts(staffId, callback);
  }

  /**
   * Increment operational metric when an action is performed during shift
   */
  async incrementShiftMetrics(
    shiftId: string,
    metric: 'parcelsProcessed' | 'parcelsReceived' | 'parcelsReleased' | 'exceptionsRecorded' | 'custodyActionsPerformed',
    incrementBy: number = 1
  ): Promise<void> {
    if (!shiftId) return;

    try {
      const shift = await shiftRepository.getById(shiftId);
      if (!shift || shift.status !== 'ACTIVE') return;

      const currentValue = shift[metric] || 0;
      const totalActions = (shift.totalOperationalActions || 0) + incrementBy;

      await shiftRepository.update(shiftId, {
        [metric]: currentValue + incrementBy,
        totalOperationalActions: totalActions,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Failed to increment shift metric ${metric} for shift ${shiftId}:`, err);
    }
  }

  /**
   * Audited shift correction mechanism
   */
  async recordShiftCorrection(params: {
    shiftId: string;
    actorId: string;
    actorRole?: string;
    reason: string;
    notes?: string;
  }): Promise<void> {
    const { shiftId, actorId, actorRole, reason, notes } = params;

    const isAuthorized = ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'CENTER_OWNER'].includes(actorRole || '');
    if (!isAuthorized) {
      await auditEngine.logEvent({
        userId: actorId,
        userRole: actorRole,
        action: 'UNAUTHORIZED_SHIFT_ACCESS',
        details: { shiftId, reason: 'Unauthorized shift correction attempt.' },
        result: 'FAILURE',
        targetId: shiftId
      });
      throw new Error('Unauthorized: Only Hub Owners and Operations Managers can issue shift corrections.');
    }

    const shift = await shiftRepository.getById(shiftId);
    if (!shift) {
      throw new Error(`Shift ${shiftId} not found.`);
    }

    const updatedNotes = `${shift.notes || ''} | Correction by ${actorId}: ${reason} ${notes ? `(${notes})` : ''}`;

    await shiftRepository.update(shiftId, {
      notes: updatedNotes,
      updatedAt: new Date().toISOString()
    });

    await auditEngine.logEvent({
      userId: actorId,
      userRole: actorRole,
      action: 'SHIFT_CORRECTION',
      details: { shiftId, reason, notes },
      result: 'SUCCESS',
      targetId: shiftId
    });
  }
}

export const shiftEngine = ShiftEngine.getInstance();
