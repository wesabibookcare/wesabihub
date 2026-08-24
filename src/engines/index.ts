// OmorfiHub Operating System (WOS) - Core Engines Entry Point

export { workflowEngine } from './WorkflowEngine';
export { configurationEngine } from './ConfigurationEngine';
export { userEngine } from './UserEngine';
export { paymentEngine } from './PaymentEngine';
export { riskEngine } from './RiskEngine';
export { integrationEngine } from './IntegrationEngine';
export { parcelEngine } from './ParcelEngine';
export { inventoryEngine } from './InventoryEngine';
export { bulkIntakeEngine } from './BulkIntakeEngine';
export { merchantEngine } from './MerchantEngine';
export { merchantCustomerEngine } from './MerchantCustomerEngine';
export { flyerEngine } from './FlyerEngine';
export { centreEngine } from './CentreEngine';
export { dispatchEngine } from './DispatchEngine';
export { complianceEngine } from './ComplianceEngine';
export { intelligenceEngine } from './IntelligenceEngine';
export { logisticsEngine } from './LogisticsEngine';
export { auditEngine } from './AuditEngine';
export { notificationEngine } from './NotificationEngine';
export { storageEngine } from './StorageEngine';
export { invitationEngine } from './InvitationEngine';
export { shiftEngine } from './ShiftEngine';
export { ratingEngine } from './RatingEngine';
export { trustEngine } from './TrustEngine';
export { timelineEngine } from './TimelineEngine';
export { trackingEngine } from '../services/TrackingEngine';

// Note: infrastructureEngine and monitoringEngine are server-only and excluded from index
// to prevent client-side build pollution.

// Domain mapping for specialized modules (keeping for backward compatibility if needed, but primarily use engines)
export { operationalNotificationService } from '../services/OperationalNotificationService';
export { profileUpdateAuditService } from '../services/ProfileUpdateAuditService';
