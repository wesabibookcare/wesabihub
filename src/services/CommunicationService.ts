import { conversationRepository } from './db/ConversationRepository';
import { messageRepository } from './db/MessageRepository';
import { disputeRepository } from './db/DisputeRepository';
import { shipmentRepository } from './db/ShipmentRepository';
import { trackingRepository } from './db/TrackingRepository';
import { paymentProtectionRepository } from './db/PaymentProtectionRepository';
import { auditRepository } from './db/AuditRepository';
import { notificationService } from './NotificationService';
import { StorageService } from './StorageService';
import { Conversation, Message, Dispute, ItemInformation, UserRole } from '../types';
import { where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

class CommunicationService {
  /**
   * Create a secure Omorfi Chat conversation for a Shipment
   */
  async createShipmentConversation(
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    shipmentId: string,
    parcelId: string,
    trackingNumber: string,
    protectionEnabled: boolean = false,
    buyerRole?: UserRole,
    sellerRole?: UserRole
  ): Promise<Conversation> {
    // If conversation already exists for this shipment, return it
    const existing = await conversationRepository.getByShipment(shipmentId);
    if (existing) return existing;

    const conversation: Conversation = {
      id: crypto.randomUUID(),
      type: 'SHIPMENT',
      participants: [buyerId, sellerId],
      participantNames: {
        [buyerId]: buyerName,
        [sellerId]: sellerName,
      },
      ...((buyerRole || sellerRole) && {
        participantRoles: {
          ...(buyerRole && { [buyerId]: buyerRole }),
          ...(sellerRole && { [sellerId]: sellerRole }),
        }
      }),
      shipmentId,
      parcelId,
      trackingNumber,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      status: 'ACTIVE',
      initiatorId: buyerId,
      protectionEnabled,
      isDisputed: false,
      lastMessageText: 'Omorfi Chat started',
      lastMessageAt: new Date().toISOString(),
      lastMessageStatus: 'SENT',
      typingStatus: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await conversationRepository.create(conversation.id, conversation);

    // Log the action
    await auditRepository.logAction(buyerId, 'WESABICHAT_CREATED', {
      conversationId: conversation.id,
      type: 'SHIPMENT',
      buyerId,
      sellerId,
      shipmentId,
      trackingNumber
    }, conversation.id);

    return conversation;
  }

  /**
   * Create a Omorfi Chat via Username (Chat Request)
   */
  async createUsernameConversation(
    initiatorId: string,
    initiatorName: string,
    recipientId: string,
    recipientName: string,
    initiatorUsername: string,
    recipientUsername: string,
    initiatorRole?: UserRole,
    recipientRole?: UserRole
  ): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      type: 'USERNAME',
      participants: [initiatorId, recipientId],
      participantNames: {
        [initiatorId]: initiatorName,
        [recipientId]: recipientName,
      },
      participantUsernames: {
        [initiatorId]: initiatorUsername,
        [recipientId]: recipientUsername,
      },
      ...((initiatorRole || recipientRole) && {
        participantRoles: {
          ...(initiatorRole && { [initiatorId]: initiatorRole }),
          ...(recipientRole && { [recipientId]: recipientRole }),
        }
      }),
      status: 'PENDING',
      initiatorId,
      isDisputed: false,
      lastMessageText: 'Chat Request Sent',
      lastMessageAt: new Date().toISOString(),
      lastMessageStatus: 'SENT',
      typingStatus: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await conversationRepository.create(conversation.id, conversation);

    // Log the action
    await auditRepository.logAction(initiatorId, 'WESABICHAT_REQUEST_SENT', {
      conversationId: conversation.id,
      type: 'USERNAME',
      initiatorId,
      recipientId
    }, conversation.id);

    return conversation;
  }

  /**
   * Respond to a Username Chat Request
   */
  async respondToChatRequest(conversationId: string, userId: string, response: 'ACTIVE' | 'DECLINED' | 'BLOCKED'): Promise<void> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.type !== 'USERNAME') throw new Error('Invalid conversation type');
    if (!conversation.participants.includes(userId) || conversation.initiatorId === userId) {
      throw new Error('Only the recipient can respond to a chat request');
    }

    await conversationRepository.update(conversationId, {
      status: response,
      lastMessageText: `Chat Request ${response}`,
      lastMessageAt: new Date().toISOString()
    });

    let action = 'WESABICHAT_REQUEST_ACCEPTED';
    if (response === 'DECLINED') action = 'WESABICHAT_REQUEST_DECLINED';
    if (response === 'BLOCKED') action = 'WESABICHAT_USER_BLOCKED';

    await auditRepository.logAction(userId, action, {
      conversationId,
      response
    }, conversationId);
  }

  /**
   * Link an existing Username Conversation to a Shipment
   */
  async linkConversationToShipment(
    conversationId: string,
    userId: string,
    shipmentId: string,
    parcelId: string,
    trackingNumber: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string
  ): Promise<void> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    if (conversation.type !== 'USERNAME') throw new Error('Only Username conversations can be linked');

    await conversationRepository.update(conversationId, {
      linkedShipmentId: shipmentId,
      shipmentId,
      parcelId,
      trackingNumber,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
    });

    await auditRepository.logAction(userId, 'WESABICHAT_LINKED_TO_SHIPMENT', {
      conversationId,
      shipmentId,
      trackingNumber
    }, conversationId);
  }

  /**
   * Send a text message, image, video, file, or voice message inside Omorfi Chat
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: UserRole,
    senderName: string,
    text: string,
    media?: { url: string; type: Message['mediaType']; fileName?: string; fileSize?: number },
    attachments?: import('../types').MediaAttachment[],
    callInfo?: import('../types').Message['callInfo'],
    replyToId?: string
  ): Promise<Message> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.isDisputed || conversation.status === 'CLOSED') {
      throw new Error('Conversation is read-only.');
    }

    if (conversation.type === 'USERNAME' && conversation.status !== 'ACTIVE') {
      throw new Error(`Cannot send messages in a ${conversation.status.toLowerCase()} conversation.`);
    }

    // Handle backward compatibility for media
    let mappedAttachments = attachments || [];
    if (media && mappedAttachments.length === 0) {
      mappedAttachments.push({
        url: media.url,
        type: media.type as 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE',
        name: media.fileName,
        size: media.fileSize
      });
    }

    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      senderRole,
      senderName,
      text,
      attachments: mappedAttachments,
      mediaUrl: media?.url,
      mediaType: media?.type,
      fileName: media?.fileName,
      fileSize: media?.fileSize,
      callInfo,
      replyToId,
      status: 'SENT',
      delivered: true,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      }
    };

    // Save message to nested subcollection
    await messageRepository.createMessage(conversationId, message);

    // Update parent conversation
    await conversationRepository.update(conversationId, {
      lastMessageText: media ? `[${media.type}] ${text || media.fileName || ''}` : text,
      lastMessageAt: message.timestamp,
      lastMessageStatus: 'SENT'
    });

    // Notify receiver
    let recipientId: string | undefined;
    if (conversation.type === 'USERNAME' && conversation.participants) {
      recipientId = conversation.participants.find(id => id !== senderId);
    } else {
      recipientId = senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
    }

    if (recipientId) {
      await notificationService.send(
        recipientId,
        `Omorfi Chat: Message from ${senderName}`,
        text || `Sent an attachment: ${media?.fileName || media?.type}`,
        'INFO',
        `/conversations/${conversationId}`
      );
    }

    // Audit Log
    await auditRepository.logAction(senderId, 'WESABICHAT_MESSAGE_SENT', {
      conversationId,
      messageId: message.id,
      hasAttachment: !!media,
      attachmentType: media?.type
    }, message.id);

    return message;
  }

  /**
   * Update typing status in real-time
   */
  async setTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) return;

    const currentStatus = conversation.typingStatus || {};
    if (currentStatus[userId] === isTyping) return;

    await conversationRepository.update(conversationId, {
      [`typingStatus.${userId}`]: isTyping
    });
  }

  /**
   * Attach/Update Item Information inside the conversation (Sellers only)
   */
  async updateItemInformation(
    conversationId: string,
    sellerId: string,
    itemInfo: Omit<ItemInformation, 'buyerAcknowledged' | 'acknowledgedAt'>
  ): Promise<void> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (conversation.isDisputed) {
      throw new Error('Cannot update item details when conversation is in dispute.');
    }

    const updatedItemInfo: ItemInformation = {
      ...itemInfo,
      buyerAcknowledged: false,
    };

    await conversationRepository.update(conversationId, {
      itemInfo: updatedItemInfo
    });

    // Notify Buyer
    await notificationService.send(
      conversation.buyerId,
      'Item Information Updated',
      `Seller attached new item details: "${itemInfo.title}". Please review and acknowledge.`,
      'WARNING',
      `/conversations/${conversationId}`
    );

    // Audit Log
    await auditRepository.logAction(sellerId, 'ITEM_INFO_UPDATED', {
      conversationId,
      itemTitle: itemInfo.title,
      estimatedValue: itemInfo.estimatedValue
    }, conversationId);
  }

  /**
   * Buyer acknowledges and accepts item details before shipment
   */
  async acknowledgeItemInformation(conversationId: string, buyerId: string): Promise<void> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (!conversation.itemInfo) {
      throw new Error('No item information exists to acknowledge.');
    }

    if (conversation.isDisputed) {
      throw new Error('Cannot acknowledge items during a dispute.');
    }

    const updatedItemInfo: ItemInformation = {
      ...conversation.itemInfo,
      buyerAcknowledged: true,
      acknowledgedAt: new Date().toISOString()
    };

    await conversationRepository.update(conversationId, {
      itemInfo: updatedItemInfo
    });

    // Notify Seller
    await notificationService.send(
      conversation.sellerId,
      'Buyer Accepted Item Details',
      `Buyer ${conversation.buyerName} acknowledged item information for "${conversation.itemInfo.title}"`,
      'SUCCESS',
      `/conversations/${conversationId}`
    );

    // Audit Log
    await auditRepository.logAction(buyerId, 'ITEM_INFO_ACKNOWLEDGED', {
      conversationId,
      itemTitle: conversation.itemInfo.title
    }, conversationId);
  }

  /**
   * Mark all unread messages as read in a conversation
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const messages = await messageRepository.getMessages(conversationId);
    const unreadMessages = messages.filter(m => m.senderId !== userId && m.status !== 'READ');

    if (unreadMessages.length === 0) return;

    for (const msg of unreadMessages) {
      await messageRepository.updateMessage(conversationId, msg.id, {
        status: 'READ'
      });
    }

    // Update last message status in conversation if it was one of the read messages
    const conversation = await conversationRepository.getById(conversationId);
    if (conversation && conversation.lastMessageStatus !== 'READ') {
      await conversationRepository.update(conversationId, {
        lastMessageStatus: 'READ'
      });
    }
  }

  /**
   * Open an SafePay Dispute and lock the conversation as secure immutable evidence
   */
  async openDispute(
    conversationId: string,
    initiatorId: string,
    initiatorRole: UserRole,
    reason: string,
    details: string,
    idToken?: string
  ): Promise<Dispute> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (conversation.isDisputed) {
      throw new Error('A dispute has already been opened on this conversation.');
    }

    // 1. Gather all evidence: Conversation messages list
    const messages = await messageRepository.getMessages(conversationId);

    // 2. Fetch shipment and tracking history
    let shipmentInfo = null;
    let trackingHistory: any[] = [];

    if (conversation.shipmentId) {
      shipmentInfo = await shipmentRepository.getById(conversation.shipmentId);
      if (conversation.parcelId) {
        trackingHistory = await trackingRepository.getByParcel(conversation.parcelId);
      }
    }

    // 3. Find and freeze Payment Protection Record
    let ppRecord = null;
    if (conversation.shipmentId) {
      ppRecord = await paymentProtectionRepository.getByShipmentId(conversation.shipmentId);
    }
    if (!ppRecord && conversation.parcelId) {
      ppRecord = await paymentProtectionRepository.getByParcelId(conversation.parcelId);
    }

    if (ppRecord) {
      await paymentProtectionRepository.update(ppRecord.id, {
        status: 'DISPUTE_OPENED'
      });
      // reload updated record
      ppRecord = await paymentProtectionRepository.getById(ppRecord.id);
    }

    // Determine auto-priority based on severity keywords
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    const lowReason = (reason || '').toLowerCase() + ' ' + (details || '').toLowerCase();
    if (lowReason.includes('fraud') || lowReason.includes('counterfeit') || lowReason.includes('scam') || lowReason.includes('tamper')) {
      priority = 'CRITICAL';
    } else if (lowReason.includes('damage') || lowReason.includes('missing') || lowReason.includes('wrong')) {
      priority = 'HIGH';
    }

    // 4. Create the dispute object with frozen evidence snapshots
    const disputeId = `DSP-${Date.now()}`;
    const dispute: Dispute = {
      id: disputeId,
      conversationId,
      shipmentId: conversation.shipmentId || 'UNKNOWN',
      parcelId: conversation.parcelId || 'UNKNOWN',
      trackingNumber: conversation.trackingNumber || 'UNKNOWN',
      initiatorId,
      initiatorRole,
      reason,
      details,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      priority,
      category: reason,
      buyerId: conversation.buyerId,
      buyerName: conversation.buyerName,
      merchantId: conversation.sellerId,
      merchantName: conversation.sellerName,
      latestActivity: 'Dispute filed. Payment Protection frozen and chat secured as evidence.',
      protectionStatus: ppRecord ? ppRecord.status : 'NO_PAYMENT_PROTECTION',
      evidence: {
        conversationSnapshot: messages,
        itemInfo: conversation.itemInfo,
        shipmentInfo,
        trackingHistory
      }
    };

    // 5. Generate AI Pre-assessment by invoking the backend API securely
    try {
      if (!idToken) {
        throw new Error('Not authenticated');
      }
      const response = await fetch("/api/disputes/pre-assess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          disputeId: dispute.id,
          reason: dispute.reason,
          details: dispute.details,
          initiatorRole: dispute.initiatorRole,
          conversationSnapshot: messages,
          shipmentInfo,
          trackingHistory,
          SafePayRecord: ppRecord
        })
      });
      if (response.ok) {
        const data = await response.json();
        dispute.aiAssessment = data.assessment;
      } else {
        dispute.aiAssessment = "AI Pre-assessment pending review.";
      }
    } catch (e) {
      console.error("Failed to generate AI pre-assessment at dispute open:", e);
      dispute.aiAssessment = "AI Pre-assessment temporarily offline. Human review required.";
    }

    // 6. Save Dispute in Firestore
    await disputeRepository.create(dispute.id, dispute);

    // 7. Set conversation as disputed (locks down further messaging in both rules and client)
    await conversationRepository.update(conversationId, {
      isDisputed: true,
      status: 'DISPUTED',
      disputeId: dispute.id
    });

    // 8. Send notifications to both participants
    await notificationService.send(
      conversation.buyerId,
      'Dispute Opened',
      `An SafePay dispute has been opened for this transaction. The conversation has been frozen for review.`,
      'ERROR',
      `/conversations/${conversationId}`
    );

    await notificationService.send(
      conversation.sellerId,
      'Dispute Opened',
      `An SafePay dispute has been opened for this transaction. The conversation has been frozen for review.`,
      'ERROR',
      `/conversations/${conversationId}`
    );

    // 9. Audit Log
    await auditRepository.logAction(initiatorId, 'WESABICHAT_DISPUTE_OPENED', {
      conversationId,
      disputeId: dispute.id,
      reason
    }, dispute.id);

    return dispute;
  }

  /**
   * Resolve an SafePay Dispute (Super Admin or Support Officer)
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolvedByUserId: string
  ): Promise<void> {
    const dispute = await disputeRepository.getById(disputeId);
    if (!dispute) throw new Error('Dispute not found');

    // Update dispute status
    await disputeRepository.update(disputeId, {
      status: 'RESOLVED',
      resolution,
      resolvedBy: resolvedByUserId,
      resolvedAt: new Date().toISOString()
    });

    // Re-activate or mark conversation as closed
    await conversationRepository.update(dispute.conversationId, {
      status: 'CLOSED',
      isDisputed: false, // Releases the freeze for read-only to allow viewing resolution message
    });

    const conversation = await conversationRepository.getById(dispute.conversationId);
    if (conversation) {
      // Notify participants of resolution
      await notificationService.send(
        conversation.buyerId,
        'Dispute Resolved',
        `Dispute resolved: ${resolution}`,
        'SUCCESS',
        `/conversations/${conversation.id}`
      );

      await notificationService.send(
        conversation.sellerId,
        'Dispute Resolved',
        `Dispute resolved: ${resolution}`,
        'SUCCESS',
        `/conversations/${conversation.id}`
      );
    }

    // Log the resolution audit
    await auditRepository.logAction(resolvedByUserId, 'WESABICHAT_DISPUTE_RESOLVED', {
      disputeId,
      resolution
    }, disputeId);
  }

  /**
   * Search conversations by multiple criteria (Participant / Admin)
   */
  async searchConversations(
    userId: string,
    userRole: UserRole,
    queryText: string
  ): Promise<Conversation[]> {
    let list: Conversation[] = [];

    // Admins and Support officers can search ALL conversations
    if (userRole === 'SUPER_ADMIN' || userRole === 'SUPPORT_OFFICER' || userRole === 'OPERATIONS_MANAGER') {
      list = await conversationRepository.getAll();
    } else {
      // Regular participants can only search their own
      list = await conversationRepository.getByParticipant(userId);
    }

    const term = queryText.toLowerCase().trim();
    if (!term) return list;

    // Filter conversations based on search text, shipment, tracking, merchant or buyer names
    return list.filter(c => {
      const buyerMatch = c.buyerName.toLowerCase().includes(term) || c.buyerId.includes(term);
      const sellerMatch = c.sellerName.toLowerCase().includes(term) || c.sellerId.includes(term);
      const shipmentMatch = c.shipmentId?.toLowerCase().includes(term);
      const parcelMatch = c.parcelId?.toLowerCase().includes(term);
      const trackingMatch = c.trackingNumber?.toLowerCase().includes(term);
      const lastMsgMatch = c.lastMessageText.toLowerCase().includes(term);
      const itemTitleMatch = c.itemInfo?.title.toLowerCase().includes(term);
      const itemDescMatch = c.itemInfo?.description.toLowerCase().includes(term);

      return (
        buyerMatch ||
        sellerMatch ||
        shipmentMatch ||
        parcelMatch ||
        trackingMatch ||
        lastMsgMatch ||
        itemTitleMatch ||
        itemDescMatch
      );
    });
  }

  /**
   * Log Customer Care access to a Omorfi Chat conversation for privacy compliance
   */
  async logAdminAccess(adminId: string, conversationId: string, reason: string): Promise<void> {
    await auditRepository.logAction(adminId, 'WESABICHAT_ADMIN_ACCESS', {
      conversationId,
      reason,
      timestamp: new Date().toISOString()
    }, conversationId);
  }

  /**
   * Start a SafePay Evidence Recording (single-party, not a live call)
   */
  async startVerifiedCall(
    conversationId: string,
    initiatorId: string,
    initiatorRole: UserRole,
    initiatorName: string,
    callType: 'VERIFIED_PACKING' | 'VERIFIED_UNPACKING'
  ): Promise<Message> {
    const conversation = await conversationRepository.getById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const messageText = callType === 'VERIFIED_PACKING'
      ? 'Started recording Seller Packing Evidence'
      : 'Started recording Buyer Unboxing Evidence';

    return await this.sendMessage(
      conversationId,
      initiatorId,
      initiatorRole,
      initiatorName,
      messageText,
      undefined,
      [],
      {
        callType,
        status: 'COMPLETED',
        consentedParties: [initiatorId],
      }
    );
  }

  /**
   * End and Save Verified Evidence Call
   */
  async saveVerifiedCallRecording(
    messageId: string,
    conversationId: string,
    recordingUrl: string,
    durationSeconds: number
  ): Promise<void> {
    const msg = await messageRepository.getMessage(conversationId, messageId);
    if (!msg || msg.conversationId !== conversationId) throw new Error('Message not found');

    if (msg.callInfo) {
      await messageRepository.updateMessage(conversationId, messageId, {
        callInfo: {
          ...msg.callInfo,
          status: 'RECORDING_SAVED',
          recordingUrl,
          durationSeconds
        }
      });

      await auditRepository.logAction('SYSTEM', 'EVIDENCE_RECORDING_SAVED', {
        messageId,
        conversationId,
        durationSeconds
      }, conversationId);
    }
  }

  /**
   * Log Evidence Viewed Event
   */
  async logEvidenceViewed(viewerId: string, viewerRole: UserRole, messageId: string, evidenceType: string): Promise<void> {
    await auditRepository.logAction(viewerId, `VIEWED_${evidenceType.toUpperCase()}_EVIDENCE`, {
      messageId,
      role: viewerRole
    }, messageId);
  }

  /**
   * Toggle message reaction (emoji)
   */
  async toggleMessageReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    const msg = await messageRepository.getMessage(conversationId, messageId);
    if (!msg) throw new Error('Message not found');

    const reactions = msg.reactions || {};
    const usersWithEmoji = reactions[emoji] || [];

    let updatedUsers: string[];
    if (usersWithEmoji.includes(userId)) {
      updatedUsers = usersWithEmoji.filter(id => id !== userId);
    } else {
      updatedUsers = [...usersWithEmoji, userId];
    }

    const updatedReactions = { ...reactions };
    if (updatedUsers.length === 0) {
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = updatedUsers;
    }

    await messageRepository.updateMessage(conversationId, messageId, {
      reactions: updatedReactions
    });

    await auditRepository.logAction(userId, 'WESABICHAT_REACTION_TOGGLED', {
      conversationId,
      messageId,
      emoji
    }, messageId);
  }

  /**
   * Helper to upload media securely and retrieve a public URL
   */
  async uploadMedia(conversationId: string, file: File): Promise<{ url: string; name: string; size: number }> {
    const securePath = `conversations/${conversationId}/media/${Date.now()}_${file.name}`;
    const url = await StorageService.uploadFile(securePath, file);
    return {
      url,
      name: file.name,
      size: file.size
    };
  }
}

export const communicationService = new CommunicationService();
