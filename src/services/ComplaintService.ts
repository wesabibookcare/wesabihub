import { complaintRepository } from './db/ComplaintRepository';
import { Complaint, UserRole } from '../types';
import { alertService } from './AlertService';
import { doc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export class ComplaintService {
  async createComplaint(data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'priority' | 'status'>) {
    const priority = this.calculatePriority(data.userRole, data.category, data.title + ' ' + data.description);
    const id = doc(collection(db, 'complaints')).id;

    const complaint: Complaint = {
      ...data,
      id,
      priority,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await complaintRepository.create(id, complaint);

    // Send Telegram Alert for high priority complaints
    if (priority === 'HIGH' || priority === 'CRITICAL') {
      await alertService.sendTelegramAlert(
        `New ${priority} Complaint: ${data.title}`,
        `User: ${data.userName} (${data.userRole})\nCategory: ${data.category}\n\n${data.description}`,
        priority
      );
    }

    // Trigger AI resolution attempt
    this.attemptAIResolution(id, complaint);

    return id;
  }

  private calculatePriority(role: UserRole, category: string, text: string): Complaint['priority'] {
    // Centre Owner complaints automatically receive High priority
    if (role === 'CENTER_OWNER') {
      return 'HIGH';
    }

    const lowerText = text.toLowerCase();
    if (lowerText.includes('fraud') || lowerText.includes('stolen') || lowerText.includes('critical') || lowerText.includes('security')) {
      return 'CRITICAL';
    }

    if (lowerText.includes('payment') || lowerText.includes('money') || lowerText.includes('SafePay') || category === 'PAYMENT') {
      return 'HIGH';
    }

    if (lowerText.includes('urgent') || lowerText.includes('delay')) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private async attemptAIResolution(id: string, complaint: Complaint) {
    // Mocking AI resolution logic
    // In a real app, this would call Gemini API
    const aiCanResolve = Math.random() > 0.7; // 30% chance AI can resolve directly

    if (aiCanResolve) {
      const aiResponse = "I have analyzed your request. Based on our policies, I have initiated a review. Your issue should be resolved within 24 hours. (AI Auto-Resolution)";
      await complaintRepository.update(id, {
        aiResponse,
        status: 'RESOLVED_AI',
        updatedAt: new Date().toISOString()
      });
    } else {
      // If unresolved, it stays OPEN (or PENDING_ADMIN)
      await complaintRepository.update(id, {
        status: 'OPEN',
        updatedAt: new Date().toISOString()
      });
    }
  }
}

export const complaintService = new ComplaintService();
