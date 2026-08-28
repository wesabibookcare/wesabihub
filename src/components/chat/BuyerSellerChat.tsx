import { toast } from 'sonner';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Send, ShieldAlert, Image, Video, FileText, Smile,
  CheckCheck, Search, PlusCircle, ShoppingBag, ShieldCheck, AlertCircle,
  Maximize2, Eye, Compass, HelpCircle, Sparkles, BookOpen, UserCheck, Check,
  Camera, ArrowLeft, Loader2, UploadCloud, Info, Phone, Video as VideoIcon,
  MoreVertical, Paperclip, MapPin, ExternalLink, Clock, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { communicationService } from '../../services/CommunicationService';
import { conversationRepository } from '../../services/db/ConversationRepository';
import { messageRepository } from '../../services/db/MessageRepository';
import { disputeRepository } from '../../services/db/DisputeRepository';
import { shipmentRepository } from '../../services/db/ShipmentRepository';
import { trackingRepository } from '../../services/db/TrackingRepository';
import { knowledgeRepository, KnowledgeArticle } from '../../services/db/KnowledgeRepository';
import { userRepository } from '../../services/db/UserRepository';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { categoryService, DisputeCategory } from '../../services/CategoryService';
import { Conversation, Message, Dispute, ItemInformation, Parcel, MessageStatus, TrackingEvent, UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { CameraCaptureModal } from './CameraCaptureModal';
import { VerifiedEvidenceCallScreen } from './VerifiedEvidenceCallScreen';
import { ROLES } from '../../constants/roles';
import { paymentProtectionRepository } from '../../services/db/PaymentProtectionRepository';

// Friendly display label for a participant's role badge in chat
const roleLabel = (role?: UserRole | null) => {
  if (!role) return null;
  return ROLES.find(r => r.id === role)?.title || role.replace(/_/g, ' ');
};

export const BuyerSellerChat = () => {
  const { user, fbUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = user?.uid || '';
  const currentUserRole = user?.role || 'CUSTOMER';
  const currentUserName = user?.displayName || 'User';

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Forms
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isCallConsentOpen, setIsCallConsentOpen] = useState(false);
  const [pendingCallType, setPendingCallType] = useState<'VERIFIED_PACKING' | 'VERIFIED_UNPACKING' | null>(null);
  const [activePPId, setActivePPId] = useState<string>('');

  // Loading / Upload states
  const [loading, setLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [allParcels, setAllParcels] = useState<Parcel[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);

  // Selected parcel for new conversation
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [newConvMode, setNewConvMode] = useState<'SHIPMENT' | 'USERNAME'>('SHIPMENT');
  const [usernameSearch, setUsernameSearch] = useState('');

  // Item Info Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCondition, setItemCondition] = useState<'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR'>('NEW');
  const [itemValue, setItemValue] = useState<number>(0);
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [itemVideos, setItemVideos] = useState<string[]>([]);

  // Dispute Form State
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [categories, setCategories] = useState<DisputeCategory[]>([]);

  // Resolution Form State
  const [resolutionText, setResolutionText] = useState('');

  // Active Dispute record (for support/admin review)
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);

  // Emoji Picker Drawer State
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);

  // New Chat Feature States
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [isCallScreenActive, setIsCallScreenActive] = useState(false);

  // Scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Common quick emojis
  const QUICK_EMOJIS = ['🤝', '📦', '💰', '👍', '📝', '📸', '⚖️', '✅', '❌', '😊', '💡', '🌟'];

  // Load user conversations and general app context
  useEffect(() => {
    if (!currentUserId) return;

    // Real-time subscribe to conversations
    const unsubscribe = conversationRepository.subscribeToParticipant(currentUserId, (data) => {
      setConversations(data);
    });

    // Load user's parcels for creating new chats
    const isStaffUser = ['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER', 'DISPUTE_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_OFFICER'].includes(currentUserRole);
    if (isStaffUser) {
      shipmentRepository.getAll().then(parcels => {
        setAllParcels(parcels);
      }).catch(e => {
        console.warn('Could not load all parcels:', e);
      });
    } else {
      shipmentRepository.getBySender(currentUserId).then(parcels => {
        setAllParcels(parcels);
      }).catch(e => {
        console.warn('Could not load parcels:', e);
      });
    }

    // Load Knowledge Center articles
    knowledgeRepository.getAll().then(setKnowledgeArticles);

    // Load dynamic dispute categories
    categoryService.getCategories().then(setCategories);

    return () => unsubscribe();
  }, [currentUserId, user?.email]);

  // Handle Admin Access Logging & message subscriptions
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      setTrackingEvents([]);
      setActiveDispute(null);
      return;
    }

    // 1. Subscribe to Messages
    const unsubscribeMessages = messageRepository.subscribeToMessages(activeConv.id, (data) => {
      setMessages(data);
      scrollToBottom();
    });

    // 1b. Load Tracking Events if applicable
    if (activeConv.parcelId) {
      trackingRepository.getByParcel(activeConv.parcelId).then(events => {
        setTrackingEvents(events);
      });
    } else {
      setTrackingEvents([]);
    }

    // 1c. Resolve the linked SafePay (Payment Protection) record, if any,
    // so evidence recordings can be tied back to the actual transaction
    // instead of only living in chat history.
    if (activeConv.protectionEnabled && activeConv.parcelId) {
      paymentProtectionRepository.getByParcelId(activeConv.parcelId).then(pp => {
        setActivePPId(pp?.id || '');
      }).catch(() => setActivePPId(''));
    } else {
      setActivePPId('');
    }

    // 2. Load Active Dispute if any
    if (activeConv.isDisputed && activeConv.disputeId) {
      disputeRepository.getById(activeConv.disputeId).then(setActiveDispute);
    } else {
      setActiveDispute(null);
    }

    // 3. SECURE ACCESS CONTROL & AUDIT LOGGING FOR CUSTOMER CARE/SUPER ADMIN
    const isAdminReview = ['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER'].includes(currentUserRole);
    const isParticipant = activeConv.buyerId === currentUserId || activeConv.sellerId === currentUserId;

    if (isAdminReview && !isParticipant) {
      // Log access to conversation
      communicationService.logAdminAccess(
        currentUserId,
        activeConv.id,
        activeConv.isDisputed ? 'Reviewing active OmorfiHubChat dispute evidence' : 'Audited OmorfiHubChat Compliance Access'
      );
    }

    // 4. Mark Messages as Read
    communicationService.markMessagesAsRead(activeConv.id, currentUserId);

    // Initialize Item Form State with existing info if available
    if (activeConv.itemInfo) {
      setItemTitle(activeConv.itemInfo.title);
      setItemDesc(activeConv.itemInfo.description);
      setItemQty(activeConv.itemInfo.quantity);
      setItemCondition(activeConv.itemInfo.condition);
      setItemValue(activeConv.itemInfo.estimatedValue);
      setItemImages(activeConv.itemInfo.images || []);
      setItemVideos(activeConv.itemInfo.videos || []);
    } else {
      setItemTitle('');
      setItemDesc('');
      setItemQty(1);
      setItemCondition('NEW');
      setItemValue(0);
      setItemImages([]);
      setItemVideos([]);
    }

  }, [activeConv, currentUserId, currentUserRole]);

  // Typing indicator effect
  useEffect(() => {
    if (!activeConv || !isTyping) return;

    communicationService.setTypingStatus(activeConv.id, currentUserId, true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      communicationService.setTypingStatus(activeConv.id, currentUserId, false);
      setIsTyping(false);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [inputText, activeConv, currentUserId, isTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) setIsTyping(true);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Create new conversation
  const handleCreateNewConversation = async () => {
    if (newConvMode === 'SHIPMENT' && !selectedParcelId) return;
    if (newConvMode === 'USERNAME' && !usernameSearch) return;

    setLoading(true);
    try {
      if (newConvMode === 'SHIPMENT') {
        const parcel = allParcels.find(p => p.id === selectedParcelId || p.parcelId === selectedParcelId);
        if (!parcel) throw new Error('Selected parcel details not found');

        const isMerchant = currentUserRole === 'MERCHANT';
        const buyerId = isMerchant ? (parcel.recipientInfo?.email || 'CUSTOMER_UID') : currentUserId;
        const sellerId = isMerchant ? currentUserId : parcel.senderId;
        const counterpartId = isMerchant ? buyerId : sellerId;
        const counterpartUser = counterpartId && counterpartId !== 'CUSTOMER_UID' && !counterpartId.includes('@')
          ? await userRepository.getById(counterpartId).catch(() => null)
          : null;
        const counterpartRole = counterpartUser?.role || counterpartUser?.roles?.[0];

        const newConv = await communicationService.createShipmentConversation(
          buyerId,
          isMerchant ? parcel.recipientInfo?.name || 'Customer' : currentUserName,
          sellerId,
          isMerchant ? currentUserName : 'Merchant Seller',
          parcel.shipmentId,
          parcel.id,
          parcel.trackingNumber,
          !!parcel.protectionEnabled,
          isMerchant ? counterpartRole : (currentUserRole as UserRole),
          isMerchant ? (currentUserRole as UserRole) : counterpartRole
        );

        setActiveConv(newConv);
        setIsNewConvOpen(false);
      } else {
        const input = usernameSearch.trim();
        let targetUser = await userRepository.getByUsername(input);

        // Also check if input matches any parcel / tracking number
        let matchedParcel = allParcels.find(p =>
          p.id.toLowerCase() === input.toLowerCase() ||
          p.parcelId?.toLowerCase() === input.toLowerCase() ||
          p.trackingNumber.toLowerCase() === input.toLowerCase()
        );

        if (!targetUser && matchedParcel) {
          const isMerchant = currentUserRole === 'MERCHANT';
          const partnerUid = isMerchant ? matchedParcel.recipientInfo?.email : matchedParcel.senderId;
          if (partnerUid) {
            targetUser = await userRepository.getById(partnerUid);
          }
          if (!targetUser) {
            // Find user by email or name
            const allU = await userRepository.getAllUsers();
            targetUser = allU.find(u => u.email === matchedParcel.recipientInfo?.email || u.uid === matchedParcel.senderId) || null;
          }
        }

        if (!targetUser) {
          const allU = await userRepository.getAllUsers();
          targetUser = allU.find(u =>
            u.email?.toLowerCase() === input.toLowerCase() ||
            u.displayName?.toLowerCase().includes(input.toLowerCase()) ||
            u.phoneNumber === input
          ) || null;
        }

        if (!targetUser) throw new Error('User or parcel not found. Check the OmorfiHub username, email, or tracking number and try again.');
        if (targetUser.uid === currentUserId) throw new Error('You cannot start a conversation with yourself.');

        let newConv;
        if (matchedParcel) {
          const isMerchant = currentUserRole === 'MERCHANT';
          const buyerId = isMerchant ? (matchedParcel.recipientInfo?.email || targetUser.uid) : currentUserId;
          const sellerId = isMerchant ? currentUserId : targetUser.uid;
          newConv = await communicationService.createShipmentConversation(
            buyerId,
            isMerchant ? (matchedParcel.recipientInfo?.name || targetUser.displayName) : currentUserName,
            sellerId,
            isMerchant ? currentUserName : targetUser.displayName,
            matchedParcel.shipmentId,
            matchedParcel.id,
            matchedParcel.trackingNumber,
            !!matchedParcel.protectionEnabled,
            isMerchant ? (targetUser.role || targetUser.roles?.[0]) : (currentUserRole as UserRole),
            isMerchant ? (currentUserRole as UserRole) : (targetUser.role || targetUser.roles?.[0])
          );
        } else {
          newConv = await communicationService.createUsernameConversation(
            currentUserId,
            currentUserName,
            targetUser.uid,
            targetUser.displayName,
            user?.wesabiUsername || '',
            targetUser.wesabiUsername || '',
            currentUserRole as UserRole,
            targetUser.role || targetUser.roles?.[0]
          );
        }

        setActiveConv(newConv);
        setIsNewConvOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!activeConv || (!inputText.trim())) return;
    const textToSend = inputText;
    const replyId = replyingTo?.id;
    setInputText('');
    setShowEmojiDrawer(false);
    setReplyingTo(null);

    try {
      await communicationService.sendMessage(
        activeConv.id,
        currentUserId,
        currentUserRole,
        currentUserName,
        textToSend,
        undefined,
        [],
        undefined,
        replyId
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    }
  };

  // Toggle message reaction
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!activeConv) return;
    try {
      // Local optimistic update
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions || {};
          const usersWithEmoji = reactions[emoji] || [];
          let updatedUsers: string[];
          if (usersWithEmoji.includes(currentUserId)) {
            updatedUsers = usersWithEmoji.filter(id => id !== currentUserId);
          } else {
            updatedUsers = [...usersWithEmoji, currentUserId];
          }
          const updatedReactions = { ...reactions };
          if (updatedUsers.length === 0) {
            delete updatedReactions[emoji];
          } else {
            updatedReactions[emoji] = updatedUsers;
          }
          return { ...m, reactions: updatedReactions };
        }
        return m;
      }));

      await communicationService.toggleMessageReaction(activeConv.id, messageId, currentUserId, emoji);
    } catch (err: any) {
      console.error('Failed to toggle reaction', err);
    }
  };

  // Handle camera snapshot & video captures
  const handleCameraCapture = async (attachments: any[]) => {
    if (!activeConv) return;
    try {
      await communicationService.sendMessage(
        activeConv.id,
        currentUserId,
        currentUserRole,
        currentUserName,
        `Captured secure camera evidence: ${attachments[0]?.name || 'media'}`,
        undefined,
        attachments
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to save camera capture');
    }
  };

  // File picker upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE') => {
    if (!activeConv || !e.target.files || e.target.files.length === 0) return;

    // Support multiple files
    const files = Array.from(e.target.files) as File[];

    setMediaUploading(true);
    try {
      const uploadedAttachments = [];
      for (const file of files) {
        const uploaded = await communicationService.uploadMedia(activeConv.id, file);
        uploadedAttachments.push({
          url: uploaded.url,
          type: type,
          name: uploaded.name,
          size: uploaded.size
        });
      }

      await communicationService.sendMessage(
        activeConv.id,
        currentUserId,
        currentUserRole,
        currentUserName,
        `Attached ${files.length} ${type.toLowerCase()}(s)`,
        undefined,
        uploadedAttachments
      );
    } catch (err: any) {
      toast.error(err.message || 'Media upload failed');
    } finally {
      setMediaUploading(false);
    }
  };

  // Save Item Info Details
  const handleSaveItemInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    setLoading(true);

    try {
      await communicationService.updateItemInformation(activeConv.id, currentUserId, {
        title: itemTitle,
        description: itemDesc,
        quantity: itemQty,
        condition: itemCondition,
        estimatedValue: itemValue,
        images: itemImages,
        videos: itemVideos
      });
      setIsItemModalOpen(false);
      // Local state refresh
      const updated = await conversationRepository.getById(activeConv.id);
      setActiveConv(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update item information');
    } finally {
      setLoading(false);
    }
  };

  // Acknowledge item info
  const handleAcknowledgeItems = async () => {
    if (!activeConv) return;
    setLoading(true);
    try {
      await communicationService.acknowledgeItemInformation(activeConv.id, currentUserId);
      const updated = await conversationRepository.getById(activeConv.id);
      setActiveConv(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge items');
    } finally {
      setLoading(false);
    }
  };

  // Submit dispute
  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    setLoading(true);

    try {
      const idToken = fbUser ? await fbUser.getIdToken() : undefined;
      await communicationService.openDispute(
        activeConv.id,
        currentUserId,
        currentUserRole,
        disputeReason,
        disputeDetails,
        idToken
      );
      setIsDisputeModalOpen(false);
      // Refresh conversation state
      const updated = await conversationRepository.getById(activeConv.id);
      setActiveConv(updated);
    } catch (err: any) {
      toast.error(err.message || 'Failed to file dispute');
    } finally {
      setLoading(false);
    }
  };

  // Resolve dispute
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispute) return;
    setLoading(true);

    try {
      await communicationService.resolveDispute(activeDispute.id, resolutionText, currentUserId);
      setIsResolveModalOpen(false);
      // Refresh active conversation
      const updated = await conversationRepository.getById(activeDispute.conversationId);
      setActiveConv(updated);
    } catch (err: any) {
      toast.error(err.message || 'Resolution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSidebarSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = searchQuery.trim();
      if (!term) return;

      setLoading(true);
      try {
        // First, check if there's an active local conversation matching
        const matchedLocal = filteredConversations.find(c => {
          if (c.trackingNumber && c.trackingNumber.toLowerCase() === term.toLowerCase()) return true;
          if (c.type === 'USERNAME') {
            const partnerId = c.participants.find(id => id !== currentUserId) || c.participants[0];
            const username = c.participantUsernames?.[partnerId];
            if (username && username.toLowerCase() === term.toLowerCase()) return true;
          }
          return false;
        });

        if (matchedLocal) {
          setActiveConv(matchedLocal);
          toast.success(`Found active chat matching "${term}"`);
          return;
        }

        // If not found in active chats, search shipments/parcels
        let matchedShipment = null;
        try {
          matchedShipment = await shipmentRepository.getByTrackingNumber(term) || await shipmentRepository.getById(term);
        } catch (e) {
          console.warn('Direct shipment lookup failed, trying fallback from all parcels state:', e);
          matchedShipment = allParcels.find(p =>
            p.trackingNumber?.toLowerCase() === term.toLowerCase() ||
            p.id?.toLowerCase() === term.toLowerCase()
          );
        }

        if (matchedShipment) {
          const isMerchant = currentUserRole === 'MERCHANT';
          const buyerId = isMerchant ? (matchedShipment.recipientInfo?.email || 'CUSTOMER_UID') : currentUserId;
          const sellerId = isMerchant ? currentUserId : matchedShipment.senderId;

          const newConv = await communicationService.createShipmentConversation(
            buyerId,
            isMerchant ? matchedShipment.recipientInfo?.name || 'Customer' : currentUserName,
            sellerId,
            isMerchant ? currentUserName : 'Merchant Seller',
            matchedShipment.shipmentId,
            matchedShipment.id,
            matchedShipment.trackingNumber,
            !!matchedShipment.protectionEnabled
          );
          setActiveConv(newConv);
          toast.success(`Started OmorfiHubChat for shipment ${matchedShipment.trackingNumber}`);
          return;
        }

        // Search by username (with or without @ prefix) or raw search input
        const cleanUsername = term.replace(/^@/, '');
        let targetUser = await userRepository.getByUsername(cleanUsername) || await userRepository.getByUsername(term);
        if (targetUser) {
          if (targetUser.uid === currentUserId) {
            throw new Error('You cannot start a conversation with yourself.');
          }

          const newConv = await communicationService.createUsernameConversation(
            currentUserId,
            currentUserName,
            targetUser.uid,
            targetUser.displayName,
            user?.wesabiUsername || '',
            targetUser.wesabiUsername || ''
          );

          setActiveConv(newConv);
          toast.success(`Started OmorfiHubChat with ${targetUser.displayName}`);
          return;
        }

        // Try raw display name search as a fallback helper
        let matchedUser = null;
        try {
          const allUsers = await userRepository.getAll();
          matchedUser = allUsers.find(u => u.displayName?.toLowerCase() === term.toLowerCase());
        } catch (e) {
          console.warn('Raw display name search bypassed due to PII protection rules:', e);
        }
        if (matchedUser) {
          if (matchedUser.uid === currentUserId) {
            throw new Error('You cannot start a conversation with yourself.');
          }

          const newConv = await communicationService.createUsernameConversation(
            currentUserId,
            currentUserName,
            matchedUser.uid,
            matchedUser.displayName,
            user?.wesabiUsername || '',
            matchedUser.wesabiUsername || ''
          );

          setActiveConv(newConv);
          toast.success(`Started OmorfiHubChat with ${matchedUser.displayName}`);
          return;
        }

        // If nothing matches
        toast.error(`No user or shipment found matching "${term}"`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to search and initialize conversation');
      } finally {
        setLoading(false);
      }
    }
  };

  // Performance Optimization (Bolt ⚡): Memoize conversation filtering to avoid linear search & lowercasing on every render/keystroke
  const filteredConversations = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return conversations;

    return conversations.filter(c => {
      // Support searching by participant names/usernames
      const participantNamesMatch = c.participantNames ? Object.values(c.participantNames).some((n: any) => n.toLowerCase().includes(term)) : false;
      const participantUsernamesMatch = c.participantUsernames ? Object.values(c.participantUsernames).some((u: any) => u.toLowerCase().includes(term)) : false;

      return (
        (c.buyerName && c.buyerName.toLowerCase().includes(term)) ||
        (c.sellerName && c.sellerName.toLowerCase().includes(term)) ||
        (c.lastMessageText && c.lastMessageText.toLowerCase().includes(term)) ||
        (c.trackingNumber && c.trackingNumber.toLowerCase().includes(term)) ||
        (c.shipmentId && c.shipmentId.toLowerCase().includes(term)) ||
        participantNamesMatch ||
        participantUsernamesMatch
      );
    });
  }, [conversations, searchQuery]);

  const isUserParticipant = activeConv && (
    activeConv.buyerId === currentUserId ||
    activeConv.sellerId === currentUserId ||
    (activeConv.participants && activeConv.participants.includes(currentUserId))
  );
  const isUserSupportOrAdmin = ['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER', 'DISPUTE_ADMIN', 'SUPPORT_ADMIN'].includes(currentUserRole);

  // Performance Optimization (Bolt ⚡): Memoize combined chat timeline sorting to prevent O(N log N) date conversions & array allocations during typing
  const timelineItems = useMemo(() => {
    const items = [...messages];
    if (trackingEvents && trackingEvents.length > 0) {
      trackingEvents.forEach(evt => {
        // Inject tracking events as special SYSTEM messages
        items.push({
          id: `trk-${evt.id}`,
          conversationId: activeConv?.id || '',
          senderId: 'SYSTEM',
          senderRole: 'SYSTEM' as UserRole,
          senderName: 'Logistics System',
          text: `Shipment Update: ${evt.status} - ${evt.location || 'Hub'}`,
          status: 'DELIVERED',
          delivered: true,
          timestamp: evt.timestamp,
          metadata: {
            isTrackingEvent: true,
            status: evt.status
          }
        } as any);
      });
    }

    // Sort chronologically once per message/event change
    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, trackingEvents, activeConv?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 h-[calc(100vh-140px)]">

      {/* Sidebar - Conversations list */}
      <div className="lg:col-span-1 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 h-full">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display dark:text-white flex items-center gap-2">
              <Sparkles className="text-primary-600" size={20} />
              OmorfiHubChat
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewConvOpen(true)}
              className="rounded-xl flex items-center gap-1 text-xs"
            >
              <PlusCircle size={14} /> New Chat
            </Button>
          </div>

          <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5">
            <Search className="text-slate-400 mr-2" size={16} />
            <input
              type="text"
              placeholder="Search chats, tracking number, or username..."
              className="bg-transparent border-none focus:outline-none text-xs w-full text-slate-800 dark:text-slate-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSidebarSearchKeyPress}
            />
          </div>
        </div>

        {/* List scroll container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No conversations found. Start a OmorfiHubChat related to your protected shipments!
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConv?.id === c.id;

              let displayPartnerName = '';
              let roleTag = '';
              let usernameDisplay = '';
              let partnerAccountRole: string | null = null;

              if (c.type === 'USERNAME') {
                const partnerId = c.participants.find(id => id !== currentUserId) || c.participants[0];
                displayPartnerName = c.participantNames?.[partnerId] || 'User';
                usernameDisplay = c.participantUsernames?.[partnerId] || '';
                roleTag = 'CHAT';
                partnerAccountRole = roleLabel(c.participantRoles?.[partnerId]);
              } else {
                const isOtherUserBuyer = c.sellerId === currentUserId;
                displayPartnerName = isOtherUserBuyer ? (c.buyerName || 'Buyer') : (c.sellerName || 'Seller');
                roleTag = isOtherUserBuyer ? 'BUYER' : 'SELLER';
                const partnerId = isOtherUserBuyer ? c.buyerId : c.sellerId;
                partnerAccountRole = partnerId ? roleLabel(c.participantRoles?.[partnerId]) : null;
              }

              // Find initials for avatar
              const initials = displayPartnerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className={`p-4 cursor-pointer transition-colors flex items-start gap-3 border-l-4 ${
                    isActive
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-primary-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isActive ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[11px] font-display truncate dark:text-white">
                        {displayPartnerName}
                        {usernameDisplay && <span className="ml-1 text-[9px] font-mono text-slate-400">({usernameDisplay})</span>}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 font-normal">
                        {roleTag}
                      </Badge>
                      {partnerAccountRole && (
                        <Badge variant="info" className="text-[8px] h-3.5 px-1 py-0 font-normal">
                          {partnerAccountRole}
                        </Badge>
                      )}
                      {c.isDisputed && (
                        <Badge variant="error" className="text-[8px] px-1 py-0 h-3.5">
                          DISPUTE
                        </Badge>
                      )}
                      {c.type === 'USERNAME' && c.status === 'PENDING' && (
                        <Badge variant="warning" className="text-[8px] px-1 py-0 h-3.5">
                          PENDING
                        </Badge>
                      )}
                      {c.type === 'USERNAME' && c.linkedShipmentId && (
                        <Badge variant="success" className="text-[8px] px-1 py-0 h-3.5">
                          LINKED
                        </Badge>
                      )}
                    </div>

                    <p className={`text-[10px] truncate ${isActive ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-500'}`}>
                      {c.lastMessageText}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="lg:col-span-3 flex flex-col bg-white dark:bg-slate-900 h-full relative">
        {activeConv ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm z-10 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-bold font-display">
                  {(() => {
                    if (activeConv.type === 'USERNAME') {
                      const partnerId = activeConv.participants.find(id => id !== currentUserId) || activeConv.participants[0];
                      return (activeConv.participantNames?.[partnerId]?.[0] || 'U').toUpperCase();
                    }
                    return (activeConv.sellerId === currentUserId ? activeConv.buyerName?.[0] : activeConv.sellerName?.[0])?.toUpperCase() || 'U';
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-sm dark:text-white font-display flex items-center gap-2 flex-wrap">
                    {(() => {
                      if (activeConv.type === 'USERNAME') {
                        const partnerId = activeConv.participants.find(id => id !== currentUserId) || activeConv.participants[0];
                        const name = activeConv.participantNames?.[partnerId] || 'User';
                        const username = activeConv.participantUsernames?.[partnerId] || '';
                        return <>{name} {username && <span className="text-xs text-slate-400 font-mono font-normal">({username})</span>}</>;
                      }
                      return activeConv.sellerId === currentUserId ? activeConv.buyerName : activeConv.sellerName;
                    })()}

                    {(() => {
                      const partnerId = activeConv.type === 'USERNAME'
                        ? (activeConv.participants.find(id => id !== currentUserId) || activeConv.participants[0])
                        : (activeConv.sellerId === currentUserId ? activeConv.buyerId : activeConv.sellerId);
                      const label = partnerId ? roleLabel(activeConv.participantRoles?.[partnerId]) : null;
                      return label ? (
                        <Badge variant="info" className="text-[9px] h-4 font-bold uppercase tracking-wide">
                          {label}
                        </Badge>
                      ) : null;
                    })()}

                    {activeConv.isDisputed ? (
                      <Badge variant="error" className="flex items-center gap-1 text-[9px] h-4 animate-pulse">
                        <ShieldAlert size={10} /> Disputed (Locked)
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[9px] h-4 bg-emerald-50 text-emerald-600 border-emerald-100">
                        <ShieldCheck size={10} className="mr-1" /> Secure
                      </Badge>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {Object.entries(activeConv.typingStatus || {}).some(([uid, typing]) => uid !== currentUserId && typing) ? (
                      <span className="text-[10px] text-primary-600 font-medium animate-pulse flex items-center gap-1">
                        typing...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons on header */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const isMerchant = currentUserRole === 'MERCHANT';
                      const partnerId = activeConv.type === 'USERNAME'
                        ? (activeConv.participants.find(id => id !== currentUserId) || activeConv.participants[0])
                        : (activeConv.sellerId === currentUserId ? activeConv.buyerId : activeConv.sellerId);

                      const res = await fetch('/api/safepay/workspace/create', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${fbUser ? await fbUser.getIdToken() : ''}`
                        },
                        body: JSON.stringify({
                          buyerId: activeConv.buyerId || currentUserId,
                          buyerName: activeConv.buyerName || currentUserName,
                          sellerId: activeConv.sellerId || partnerId,
                          sellerName: activeConv.sellerName || 'Seller',
                          itemTitle: activeConv.itemInfo?.title || 'Agreed SafePay Purchase',
                          itemPrice: activeConv.itemInfo?.estimatedValue || 10000,
                          conversationId: activeConv.id,
                          logisticsChoice: 'WESABIHUB_HUB'
                        })
                      });
                      const data = await res.json();
                      if (data.success && data.transaction) {
                        navigate(`/safepay/workspace/${data.transaction.transactionId}`);
                      } else {
                        toast.error(data.error || 'Failed to open SafePay Workspace');
                      }
                    } catch (e: any) {
                      toast.error('Could not initialize SafePay Workspace');
                    }
                  }}
                  className="rounded-xl flex items-center gap-1.5 text-[11px] h-8 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  <ShieldCheck size={14} /> SafePay Workspace
                </Button>

                {(activeConv.type === 'SHIPMENT' || activeConv.linkedShipmentId) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tracking/${activeConv.trackingNumber}`)}
                      className="rounded-xl flex items-center gap-1.5 text-[11px] h-8"
                    >
                      <MapPin size={14} className="text-slate-500" /> Track Parcel
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsItemModalOpen(true)}
                      className="rounded-xl flex items-center gap-1.5 text-[11px] h-8"
                    >
                      <ShoppingBag size={14} className="text-slate-500" /> Specs
                    </Button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                  </>
                )}

                {!activeConv.isDisputed && isUserParticipant && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDisputeModalOpen(true)}
                    className="rounded-xl flex items-center gap-1.5 text-[11px] h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <ShieldAlert size={14} /> Dispute
                  </Button>
                )}

                {activeConv.isDisputed && isUserSupportOrAdmin && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setIsResolveModalOpen(true)}
                    className="rounded-xl flex items-center gap-1.5 text-[11px] h-8"
                  >
                    <ShieldCheck size={14} /> Resolve Case
                  </Button>
                )}

                <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {/* SafePay Item spec banner (if attached) */}
            {activeConv.itemInfo && (
              <div className="px-4 py-3 bg-indigo-50/70 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-xs shrink-0 mt-0.5">
                    📦
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">{activeConv.itemInfo.title}</p>
                    <p className="text-[10px] text-indigo-700 dark:text-indigo-300">
                      Qty: {activeConv.itemInfo.quantity} • Condition: <span className="font-bold">{activeConv.itemInfo.condition}</span> • Value: <span className="font-bold">₦{activeConv.itemInfo.estimatedValue.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeConv.itemInfo.buyerAcknowledged ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                      <UserCheck size={12} /> Buyer Accepted Before Shipment
                    </div>
                  ) : activeConv.buyerId === currentUserId ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={handleAcknowledgeItems}
                      className="rounded-xl text-xs flex items-center gap-1 py-1 h-8 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check size={14} /> Acknowledge & Accept Specs
                    </Button>
                  ) : (
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/30 flex items-center gap-1">
                      <AlertCircle size={12} /> Awaiting Buyer Spec Acceptance
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Body & Dispute Metadata Split */}
            <div className="flex-1 flex overflow-hidden">

              {/* Messages viewport */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar flex flex-col">
                {timelineItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Sparkles size={24} />
                    </div>
                    <p className="text-xs font-bold dark:text-white">Premium OmorfiHubChat Active</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Communicate inside OmorfiHubChat to preserve this thread as official protection evidence in case of discrepancies or disputes.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                  {timelineItems.map((msg, idx) => {
                    const isMyMessage = msg.senderId === currentUserId;
                    const isSystemEvent = msg.senderRole === 'SYSTEM' || (msg as any).metadata?.isTrackingEvent;
                    const timestampStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Date Separator logic
                    const showDateSeparator = idx === 0 ||
                      new Date(timelineItems[idx - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                            <span className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 rounded-full py-0.5 border border-slate-100 dark:border-slate-800">
                              {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                          </div>
                        )}

                        {isSystemEvent ? (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-full flex justify-center my-4"
                          >
                            <div className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900 text-[10px] font-bold text-primary-600 dark:text-primary-400 max-w-[80%] text-center">
                              {msg.text}
                              <div className="text-[8px] opacity-70 font-mono mt-1">{timestampStr}</div>
                            </div>
                          </motion.div>
                        ) : (
                        <motion.div
                          key={msg.id}
                          layout
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className={`flex flex-col max-w-[85%] ${isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          {/* Sender info (only for others or groups) */}
                          {!isMyMessage && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[9px] font-bold text-slate-500">{msg.senderName}</span>
                              <Badge variant="outline" className="text-[7px] px-1 py-0 h-3 border-slate-200">{msg.senderRole}</Badge>
                            </div>
                          )}

                          {/* Text / Media content */}
                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm flex flex-col gap-2 relative group border transition-all ${
                            isMyMessage
                              ? 'bg-primary-600 text-white border-primary-500 rounded-tr-none font-sans'
                              : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 rounded-tl-none font-sans'
                          }`}>

                            {/* Quoted Reply Message */}
                            {msg.replyToId && (
                              (() => {
                                const repliedMsg = messages.find(m => m.id === msg.replyToId);
                                if (!repliedMsg) return null;
                                return (
                                  <div className={`p-2 rounded-lg text-[9px] mb-1 border-l-2 text-left shrink-0 ${
                                    isMyMessage
                                      ? 'bg-primary-700 border-white text-primary-100'
                                      : 'bg-slate-100 border-primary-500 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300'
                                  } max-w-full truncate`}>
                                    <p className="font-bold text-[8px] opacity-90">{repliedMsg.senderName}</p>
                                    <p className="truncate opacity-80">{repliedMsg.text || '[Media Attachment]'}</p>
                                  </div>
                                );
                              })()
                            )}

                            {/* Multi-Media / Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-col gap-2">
                                {msg.attachments.map((att, attIdx) => (
                                  <React.Fragment key={attIdx}>
                                    {att.type === 'IMAGE' && (
                                      <div className="rounded-xl overflow-hidden max-w-full border border-black/5 bg-slate-100">
                                        <img src={att.url} alt={att.name || 'Attachment'} className="w-full h-auto object-cover max-h-[300px] cursor-pointer hover:scale-[1.02] transition-transform" referrerPolicy="no-referrer" />
                                      </div>
                                    )}
                                    {att.type === 'VIDEO' && (
                                      <div className="rounded-xl overflow-hidden max-w-full bg-black shadow-lg">
                                        <video src={att.url} controls className="w-full h-auto max-h-[300px]" />
                                      </div>
                                    )}
                                    {att.type === 'FILE' && (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${isMyMessage ? 'bg-primary-700 hover:bg-primary-800 border-primary-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border-slate-200 dark:border-slate-700'}`}>
                                        <FileText size={16} className={isMyMessage ? "text-white" : "text-primary-600"} />
                                        <div className="text-[10px] truncate max-w-[180px] font-medium">
                                          <p className="truncate">{att.name || 'Document'}</p>
                                          {att.size && <p className="text-[8px] opacity-70 font-mono">{(att.size / 1024).toFixed(1)} KB</p>}
                                        </div>
                                      </a>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}

                            {/* Verified Call Info */}
                            {msg.callInfo && (
                              <div className={`flex flex-col gap-2 p-3 rounded-xl border ${msg.callInfo.callType.includes('VERIFIED') ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/30 dark:border-red-900/50 dark:text-red-100' : 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white'}`}>
                                <div className="flex items-center gap-2 font-bold text-xs">
                                  <VideoIcon size={16} />
                                  <span>{msg.callInfo.callType === 'VERIFIED_PACKING' ? 'Seller Packing Evidence Video' : msg.callInfo.callType === 'VERIFIED_UNPACKING' ? 'Buyer Unboxing Evidence Video' : 'Evidence Video'}</span>
                                </div>
                                {msg.callInfo.status === 'RECORDING_SAVED' && msg.callInfo.recordingUrl ? (
                                  <div className="mt-1 space-y-2">
                                    <video src={msg.callInfo.recordingUrl} controls className="w-full rounded-lg max-h-[200px] bg-black" />
                                    <p className="text-[9px] font-mono opacity-80 flex items-center justify-between">
                                      <span>Recording saved</span>
                                      <span>{msg.callInfo.durationSeconds}s</span>
                                    </p>
                                  </div>
                                ) : msg.callInfo.status === 'COMPLETED' ? (
                                  <p className="text-[10px] opacity-80">Call ended. Saving recording to Protection timeline...</p>
                                ) : (
                                  <p className="text-[10px] opacity-80">Status: {msg.callInfo.status}</p>
                                )}
                              </div>
                            )}

                            {/* Text content */}
                            {msg.text && <p className="whitespace-pre-wrap text-left">{msg.text}</p>}

                            {/* Hover Actions Menu */}
                            {!activeConv.isDisputed && (
                              <div className={`absolute top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md px-2 py-0.5 rounded-full ${
                                isMyMessage ? '-left-28' : '-right-28'
                              }`}>
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="p-1 hover:text-primary-500 text-slate-500 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                  title="Reply"
                                >
                                  <ArrowLeft size={10} className="rotate-180" />
                                </button>

                                {['👍', '❤️', '🤝', '📦'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="p-0.5 hover:scale-125 transition-transform text-[11px]"
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Forensic metadata on hover */}
                            {msg.deviceInfo && (
                              <span className="hidden group-hover:block absolute -bottom-8 right-0 bg-slate-950 text-white text-[7px] p-1 rounded z-10 whitespace-nowrap font-mono">
                                Device: {msg.deviceInfo.platform}
                              </span>
                            )}
                          </div>

                          {/* Message reactions badge panel */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-full">
                              {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                                const ids = userIds as string[];
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] border transition-all ${
                                      ids.includes(currentUserId)
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/20 dark:border-primary-900/50'
                                        : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                    title={`Reactions: ${ids.length}`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="font-mono text-[7px]">{ids.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Message status line */}
                          <div className="flex items-center gap-1.5 mt-1 text-[8px] text-slate-400 px-1">
                            <span>{timestampStr}</span>
                            {isMyMessage && (
                              <div className="flex items-center">
                                {msg.status === 'READ' ? (
                                  <CheckCheck size={10} className="text-primary-500" />
                                ) : msg.status === 'DELIVERED' ? (
                                  <CheckCheck size={10} className="text-slate-300" />
                                ) : (
                                  <Check size={10} className="text-slate-300" />
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </React.Fragment>
                    );
                  })}
                  </AnimatePresence>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Dispute Metadata sidebar (for reviewing evidence) */}
              {activeDispute && (
                <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs shrink-0 hidden md:block">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold">
                      <ShieldAlert size={16} />
                      Dispute Case # {activeDispute.id.substring(0, 8)}
                    </div>
                    <p className="text-[10px] text-red-600 dark:text-red-300 font-medium">
                      Status: <span className="font-bold underline">{activeDispute.status}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Opened by: <span className="font-bold">{activeDispute.initiatorRole}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Dispute Reason</p>
                    <p className="font-bold dark:text-white">{activeDispute.reason}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                      {activeDispute.details}
                    </p>
                  </div>

                  {activeDispute.resolution && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-1">
                      <p className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={14} /> Official Resolution
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {activeDispute.resolution}
                      </p>
                    </div>
                  )}

                  {/* Customer care Knowledge Center helper */}
                  {isUserSupportOrAdmin && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-1">
                        <BookOpen size={12} /> Knowledge center helper
                      </p>

                      <div className="space-y-2">
                        {knowledgeArticles.slice(0, 2).map(art => (
                          <div
                            key={art.id}
                            onClick={() => {
                              setInputText(prev => prev + `According to Knowledge Base Article ("${art.title}"): \n${art.content.substring(0, 120)}...`);
                            }}
                            className="p-2 bg-indigo-50/50 dark:bg-indigo-950/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-lg cursor-pointer border border-indigo-100/50 dark:border-indigo-900/20 transition-all"
                          >
                            <p className="font-bold text-[10px] text-primary-600 truncate">{art.title}</p>
                            <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{art.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message composer / Composer block */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2">

              {activeConv.type === 'USERNAME' && activeConv.status === 'PENDING' ? (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  {activeConv.initiatorId === currentUserId ? (
                    <p className="text-sm font-medium text-slate-500">
                      Waiting for the user to accept your chat request...
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {activeConv.participantNames?.[activeConv.initiatorId || ''] || 'A user'} wants to start a conversation with you.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => communicationService.respondToChatRequest(activeConv.id, currentUserId, 'ACTIVE')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => communicationService.respondToChatRequest(activeConv.id, currentUserId, 'DECLINED')}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => communicationService.respondToChatRequest(activeConv.id, currentUserId, 'BLOCKED')}
                        >
                          Block
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : activeConv.type === 'USERNAME' && (activeConv.status === 'DECLINED' || activeConv.status === 'BLOCKED') ? (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-sm font-medium text-red-500">
                    This chat request was {activeConv.status.toLowerCase()}. You cannot send messages.
                  </p>
                </div>
              ) : (
                <>
                  {/* Media uploading progress */}
                  {mediaUploading && (
                    <div className="flex items-center gap-2 text-xs text-primary-600 font-bold p-1 animate-pulse">
                      <Loader2 className="animate-spin" size={14} /> Uploading secure media attachment...
                    </div>
                  )}

              {/* Emoji bar / Drawer */}
              {showEmojiDrawer && (
                <div className="flex gap-2 p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl max-w-max animate-fade-in shadow-inner">
                  {QUICK_EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => setInputText(p => p + em)}
                      className="hover:scale-125 transition-transform text-sm p-1.5"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {/* Replying Preview Block */}
              {replyingTo && (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl mb-2 text-[10px] animate-fade-in">
                  <div className="flex flex-col gap-0.5 truncate flex-1 pr-4">
                    <span className="font-bold text-primary-600 dark:text-primary-400">Replying to {replyingTo.senderName}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate text-[9px]">{replyingTo.text || '[Media Attachment]'}</span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Action bar rows */}
              <div className="flex items-center gap-3">

                {/* Media Attachment buttons */}
                {!activeConv.isDisputed && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl shrink-0">

                    {/* Image Input */}
                    <label className="cursor-pointer p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors relative" title="Upload Photo">
                      <Image size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'IMAGE')}
                        className="hidden"
                      />
                    </label>

                    {/* Camera Capture Modal Trigger */}
                    <button
                      onClick={() => setIsCameraCaptureOpen(true)}
                      title="Capture Live Evidence Photo/Video"
                      className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Camera size={16} />
                    </button>

                    {/* Video Input */}
                    <label className="cursor-pointer p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Upload Video">
                      <Video size={16} />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'VIDEO')}
                        className="hidden"
                      />
                    </label>

                    {/* PDF/File Attachment Input */}
                    <label className="cursor-pointer p-1.5 text-slate-500 hover:text-primary-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Attach Document">
                      <FileText size={16} />
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => handleFileUpload(e, 'FILE')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* SafePay Evidence Recording Action */}
                {!activeConv.isDisputed && activeConv.type === 'SHIPMENT' && (
                  <button
                    onClick={() => {
                      if (currentUserRole === 'MERCHANT' || currentUserRole === 'CENTER_OWNER') {
                        setPendingCallType('VERIFIED_PACKING');
                      } else {
                        setPendingCallType('VERIFIED_UNPACKING');
                      }
                      setIsCallScreenActive(true);
                    }}
                    title="Record SafePay Evidence Video"
                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors shrink-0"
                  >
                    <VideoIcon size={18} />
                  </button>
                )}

                {/* Emoji toggle */}
                <button
                  onClick={() => setShowEmojiDrawer(!showEmojiDrawer)}
                  className="p-2 text-slate-500 hover:text-primary-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                >
                  <Smile size={18} />
                </button>

                {/* Main Input bar */}
                <input
                  type="text"
                  disabled={activeConv.isDisputed}
                  placeholder={activeConv.isDisputed ? "OmorfiHubChat frozen - read only evidence mode" : "Type your message securely..."}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100 disabled:opacity-50 font-sans"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />

                {/* Send Button */}
                <Button
                  disabled={activeConv.isDisputed || !inputText.trim()}
                  onClick={handleSendMessage}
                  className="rounded-xl shrink-0 h-9 w-9 p-0 flex items-center justify-center bg-primary-600 text-white"
                >
                  <Send size={16} />
                </Button>
              </div>
              </>
              )}

            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-slate-800 text-primary-600 flex items-center justify-center shadow-md border border-primary-100 dark:border-slate-700">
              <Sparkles size={32} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold dark:text-white font-display">OmorfiHubChat Premium Comm Center</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Official communication platform for Buyers and Sellers. Discuss products, negotiate, and secure your transactions with immutable evidence logs.
              </p>
            </div>
            <Button onClick={() => setIsNewConvOpen(true)} className="rounded-xl bg-primary-600 hover:bg-primary-700">
              Start OmorfiHubChat
            </Button>
          </div>
        )}
      </div>

      {/* MODAL: START NEW CONVERSATION */}
      <Modal
        isOpen={isNewConvOpen}
        onClose={() => setIsNewConvOpen(false)}
        title="Start OmorfiHubChat Conversation"
        description="Select a shipment tracking number or search for a OmorfiHub Username to initialize a secure official dialogue."
      >
        <div className="space-y-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setNewConvMode('SHIPMENT')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${newConvMode === 'SHIPMENT' ? 'bg-white dark:bg-slate-900 shadow text-primary-600' : 'text-slate-500'}`}
            >
              By Shipment
            </button>
            <button
              onClick={() => setNewConvMode('USERNAME')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${newConvMode === 'USERNAME' ? 'bg-white dark:bg-slate-900 shadow text-primary-600' : 'text-slate-500'}`}
            >
              By Username
            </button>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-2.5 items-start text-[10px] text-indigo-800 dark:text-indigo-300">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {newConvMode === 'SHIPMENT'
                ? 'Shipment conversations are archived as official evidence for payment protection security.'
                : 'Search by OmorfiHub username or email address. New conversations require the recipient to accept your chat request to prevent spam.'}
            </p>
          </div>

          {newConvMode === 'SHIPMENT' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Your Linked Shipments / Parcels</label>
              <select
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs focus:outline-none"
                value={selectedParcelId}
                onChange={e => setSelectedParcelId(e.target.value)}
              >
                <option value="">-- Select a Shipment Tracking Ref --</option>
                {allParcels.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.trackingNumber} - {p.recipientInfo?.name} (Value: ₦{p.pricing.total.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Search by OmorfiHub Username, Email, or Tracking Number</label>
              <Input
                value={usernameSearch}
                onChange={e => setUsernameSearch(e.target.value)}
                placeholder="e.g. john_doe, john@email.com, or TRK-..."
                prefix={<Search size={16} />}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsNewConvOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateNewConversation}
              disabled={(newConvMode === 'SHIPMENT' ? !selectedParcelId : !usernameSearch) || loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? 'Creating...' : 'Initialize OmorfiHubChat'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ATTACH / EDIT ITEM SPECIFICATIONS (Sellers only) */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="OmorfiHubChat Item Specification"
        description="Attach official title, condition, and details of the item inside this conversation."
      >
        <form onSubmit={handleSaveItemInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Item Title</label>
              <Input
                value={itemTitle}
                onChange={e => setItemTitle(e.target.value)}
                placeholder="e.g. MacBook Pro M3 Max"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Condition</label>
              <select
                value={itemCondition}
                onChange={e => setItemCondition(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs"
              >
                <option value="NEW">New - Pristine Sealed</option>
                <option value="LIKE_NEW">Like New - Opened Box</option>
                <option value="GOOD">Good - Standard Wear</option>
                <option value="FAIR">Fair - Light Marks</option>
                <option value="POOR">Poor - Heavy Use</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Quantity</label>
              <Input
                type="number"
                value={itemQty}
                onChange={e => setItemQty(parseInt(e.target.value) || 1)}
                min={1}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Estimated Value (₦)</label>
              <Input
                type="number"
                value={itemValue}
                onChange={e => setItemValue(parseInt(e.target.value) || 0)}
                min={0}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Item Description</label>
            <textarea
              value={itemDesc}
              onChange={e => setItemDesc(e.target.value)}
              placeholder="e.g. 16GB Unified memory, 512GB SSD, Space Gray. Serial: MDX238128"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs min-h-[80px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
            {activeConv && activeConv.sellerId === currentUserId && !activeConv.isDisputed && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Attaching...' : 'Save & Send to Buyer'}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {/* MODAL: FILE DISPUTE */}
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        title="Open OmorfiHubChat Dispute"
        description="WARNING: Filing a dispute will immediately freeze this thread as official read-only compliance evidence. OmorfiHub Customer Care team will receive full custody records."
      >
        <form onSubmit={handleSubmitDispute} className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-2.5 items-start text-[10px] text-amber-800 dark:text-amber-300">
            <Info size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Once opened, both participants are blocked from sending new messages to maintain the integrity of communication evidence. Ensure all relevant pictures and text have been sent in the chat prior to submission.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Primary Reason for Dispute</label>
            <select
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs focus:outline-none"
              required
            >
              <option value="">-- Choose Dispute Category --</option>
              {categories.filter(c => c.isActive !== false).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Supporting Details & Evidence Statement</label>
            <textarea
              value={disputeDetails}
              onChange={e => setDisputeDetails(e.target.value)}
              placeholder="Provide a chronological description of what happened. Be as specific as possible..."
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsDisputeModalOpen(false)}>Cancel</Button>
            <Button variant="danger" type="submit" disabled={loading || !disputeReason}>
              {loading ? 'Submitting Case...' : 'Submit Evidence & Freeze'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESOLVE CASE (Admin/Support only) */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Payment Protection Dispute Case"
        description="Provide the final compliance judgment. This will release, split, or refund the protected custody funds securely."
      >
        <form onSubmit={handleResolveDispute} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Formal Resolution Settlement Details</label>
            <textarea
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              placeholder="Specify fund actions. E.g., '100% refund of ₦45,000 back to Buyer Alex Johnson due to verified hardware defects matching dispute specifications.'"
              className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white rounded-xl text-xs min-h-[120px]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsResolveModalOpen(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={loading || !resolutionText}>
              {loading ? 'Resolving...' : 'Enforce Settlement Decision'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CAMERA CAPTURE MODAL */}
      {activeConv && (
        <CameraCaptureModal
          isOpen={isCameraCaptureOpen}
          onClose={() => setIsCameraCaptureOpen(false)}
          onCapture={handleCameraCapture}
          onUpload={async (blob, name, mimeType) => {
            const file = new File([blob], name, { type: mimeType });
            const uploaded = await communicationService.uploadMedia(activeConv.id, file);
            return { url: uploaded.url, size: uploaded.size };
          }}
        />
      )}

      {/* SAFEPAY EVIDENCE RECORDING OVERLAY */}
      {activeConv && isCallScreenActive && (
        <VerifiedEvidenceCallScreen
          isOpen={isCallScreenActive}
          onClose={() => setIsCallScreenActive(false)}
          conversationId={activeConv.id}
          callType={pendingCallType || 'VERIFIED_PACKING'}
          shipmentId={activeConv.shipmentId || ''}
          parcelId={activeConv.parcelId || ''}
          trackingNumber={activeConv.trackingNumber || ''}
          SafePayId={activePPId}
        />
      )}

    </div>
  );
};
