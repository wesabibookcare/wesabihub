import { shipmentRepository } from '../services/db/ShipmentRepository';
import { hubPointRepository } from '../services/db/HubPointRepository';
import { disputeRepository } from '../services/db/DisputeRepository';
import { conversationRepository } from '../services/db/ConversationRepository';
import { notificationRepository } from '../services/db/NotificationRepository';
import { complaintRepository } from '../services/db/ComplaintRepository';
import { userRepository } from '../services/db/UserRepository';
import { auditEngine } from './AuditEngine';
import { db } from '../lib/firebase';
import { collection, getCountFromServer, orderBy, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

class AdminEngine {
  private static instance: AdminEngine;

  private constructor() {}

  public static getInstance(): AdminEngine {
    if (!AdminEngine.instance) {
      AdminEngine.instance = new AdminEngine();
    }
    return AdminEngine.instance;
  }

  async getDashboardStats() {
    try {
      const [shipments, hubs, notifications, complaints] = await Promise.all([
        shipmentRepository.getAll().catch(() => []),
        hubPointRepository.getAll().catch(() => []),
        notificationRepository.getAll().catch(() => []),
        complaintRepository.getRecentComplaints(5).catch(() => [])
      ]);

      return {
        shipments,
        hubs,
        notifications,
        complaints
      };
    } catch (error) {
      console.error("Error fetching dashboard stats", error);
      return { shipments: [], hubs: [], notifications: [], complaints: [] };
    }
  }

  async runDatabaseIntegrityCheck() {
    try {
      const shipSnap = await getCountFromServer(collection(db, 'shipments'));
      const dispSnap = await getCountFromServer(collection(db, 'disputes'));
      const auditSnap = await getCountFromServer(collection(db, 'auditLogs'));

      return {
        totalShipments: shipSnap.data().count,
        totalDisputes: dispSnap.data().count,
        totalAudits: auditSnap.data().count
      };
    } catch (error) {
      console.error("Error running database integrity check", error);
      return { totalShipments: 0, totalDisputes: 0, totalAudits: 0 };
    }
  }

  async purgeAllData(adminId: string) {
    try {
      await Promise.all([
        shipmentRepository.deleteAll().catch(() => {}),
        hubPointRepository.deleteAll().catch(() => {}),
        disputeRepository.deleteAll().catch(() => {}),
        conversationRepository.deleteAll().catch(() => {}),
        notificationRepository.deleteAll().catch(() => {}),
        complaintRepository.deleteAll().catch(() => {})
      ]);

      await auditEngine.logEvent({
        userId: adminId,
        action: 'SYSTEM_PURGE_DATA' as any,
        details: {},
        result: 'SUCCESS'
      });
      return true;
    } catch (error) {
      console.error("Error purging data", error);
      return false;
    }
  }

  subscribeToComplaints(callback: any) {
    return complaintRepository.subscribeToQuery([orderBy('createdAt', 'desc')], callback);
  }

  async updateComplaint(id: string, updates: any, adminId: string) {
    await complaintRepository.update(id, updates);
    await auditEngine.logEvent({ userId: adminId, action: 'UPDATE_COMPLAINT' as any, details: { id, updates }, result: 'SUCCESS' });
  }

  async getAdminRoles() {
    try {
      const snap = await getDocs(collection(db, 'adminRoles'));
      return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching admin roles", error);
      return [];
    }
  }

  async saveAdminRole(roleId: string, payload: any) {
    await setDoc(doc(db, 'adminRoles', roleId), payload, { merge: true });
  }

  async deleteAdminRole(roleId: string) {
    await deleteDoc(doc(db, 'adminRoles', roleId));
  }

  async getAllUsers() {
    return await userRepository.getAllUsers().catch(() => []);
  }

  async saveAdminUser(adminId: string, payload: any) {
    await setDoc(doc(db, 'users', adminId), payload, { merge: true });
  }

}

export const adminEngine = AdminEngine.getInstance();
