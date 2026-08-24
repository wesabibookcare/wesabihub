import { UserRole } from '../types';
import { invitationRepository } from '../services/db/InvitationRepository';
import { auditEngine } from './index';

/**
 * OmorfiHub Invitation Engine
 * Manages recruitment, company invites, and affiliation.
 */
class InvitationEngine {
  private static instance: InvitationEngine;

  private constructor() {}

  public static getInstance(): InvitationEngine {
    if (!InvitationEngine.instance) {
      InvitationEngine.instance = new InvitationEngine();
    }
    return InvitationEngine.instance;
  }

  async validateCode(code: string, role: UserRole): Promise<any | null> {
    const invites = await invitationRepository.query([
      { field: 'code', operator: '==', value: code.toUpperCase() },
      { field: 'role', operator: '==', value: role },
      { field: 'status', operator: '==', value: 'PENDING' }
    ]);

    return invites.length > 0 ? invites[0] : null;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    await invitationRepository.update(invitationId, {
      status: 'ACCEPTED',
      acceptedBy: userId,
      updatedAt: new Date().toISOString()
    } as any);

    await auditEngine.logEvent({
      userId,
      action: 'ACCEPT_INVITATION',
      details: { invitationId },
      result: 'SUCCESS'
    });
  }

  async generateInviteCode(senderId: string, role: UserRole, metadata?: any): Promise<any> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = `INV-${Date.now()}-${code}`;

    const invitation: any = {
      id,
      code,
      senderId,
      role,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (metadata?.hubId) invitation.hubId = metadata.hubId;
    if (metadata?.companyId) invitation.companyId = metadata.companyId;

    await invitationRepository.create(id, invitation);

    await auditEngine.logEvent({
      userId: senderId,
      action: 'GENERATE_INVITATION',
      details: { code, role },
      result: 'SUCCESS'
    });

    return invitation;
  }

  async createInvitation(data: any): Promise<any> {
    const id = `INV-${Date.now()}`;
    const invitation = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any;
    await invitationRepository.create(id, invitation);
    return invitation;
  }

  async getInvitationsBySender(senderId: string): Promise<any[]> {
    return await invitationRepository.query([{ field: 'senderId', operator: '==', value: senderId }]);
  }

  async getInvitationsByEmail(email: string): Promise<any[]> {

    return await invitationRepository.getByEmail(email);
  }

}

export const invitationEngine = InvitationEngine.getInstance();
