export type UserRole =
  | 'CUSTOMER'
  | 'MERCHANT'
  | 'CENTER_OWNER'
  | 'CENTER_STAFF'
  | 'LOGISTICS_COMPANY'
  | 'DRIVER'
  | 'DEVELOPER'
  | 'API_MERCHANT_PARTNER'
  | 'SUPPORT_OFFICER'
  | 'VERIFICATION_OFFICER'
  | 'FINANCE_OFFICER'
  | 'OPERATIONS_MANAGER'
  | 'SUPER_ADMIN'
  | 'DISPUTE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'VERIFICATION_ADMIN'
  | 'SECURITY_ADMIN'
  | 'FINANCE_ADMIN'
  | 'DISPATCH_RIDER'
  | 'DISPATCH_COMPANY'
  | 'FLEET_MANAGER';

export type UserStatus =
  | 'PENDING'
  | 'EMAIL_UNVERIFIED'
  | 'PHONE_UNVERIFIED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'DISABLED'
  | 'INACTIVE'
  | 'BLOCKED';

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface User extends BaseEntity {
  uid: string;
  displayName: string;
  wesabiUsername?: string; // New: Unique across platform starting with "OmorfiHub"
  email: string;
  phoneNumber?: string;
  phone?: string;
  roles: UserRole[]; // Changed from role: UserRole
  role?: UserRole; // Backward compatibility
  requestedRole?: UserRole; // Requested role pending approval
  pendingRoleApplication?: boolean; // Flag indicating role application is under review
  knownDevices?: string[]; // List of recognized device IDs
  status: UserStatus;
  country?: string;
  lastLogin?: string;
  verificationStatus?: {
    email: boolean;
    phone: boolean;
    kyc: boolean;
  };
  businessType?: string;
  customPermissions?: string[];
  delegatedPermissions?: {
    canBookShipments?: boolean;
    canProcessIntake?: boolean;
    canProcessRelease?: boolean;
  };
  hubId?: string;
  isInvited?: boolean;
  photoURL?: string;
  photoUrl?: string;
  telegramChatId?: string; // New: Linked Telegram chat ID for recovery and alerts
  inviteCode?: string; // For FLEET_MANAGER and DRIVER to join a company
  companyId?: string; // Link to LOGISTICS_COMPANY
  managerId?: string; // Link to FLEET_MANAGER for DRIVERS
  isAvailable?: boolean; // New: Availability status for riders
  address?: string; // New: HQ or physical business address
  trustLevel?: string;
  trustScore?: number;
  academyTrainingStatus?: string;
  availableBalance?: number;
  pendingBalance?: number;
  tripsCount?: number;
  dispatchId?: string;
  violationsCount?: number;
  completedCourses?: string[];
  preferences?: {
    push?: boolean;
    email?: boolean;
    public?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    [key: string]: any;
  };
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MORE_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface RoleApplication extends BaseEntity {
  userId: string;
  role: UserRole;
  status: ApplicationStatus;
  data: Record<string, any>; // Dynamically stored data based on config
  documents: string[]; // Storage paths
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface RegistrationPayload {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  profileData: Record<string, any>;
  files?: Record<string, File | string>; // key: document_ID, value: File or base64
}

export interface ApplicationFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'geography-country' | 'geography-state' | 'geography-city';
  required: boolean;
  options?: string[]; // for select
}

export interface RoleApplicationConfig extends BaseEntity {
  role: UserRole;
  fields: ApplicationFieldConfig[];
  registrationEnabled?: boolean;
  approvalType?: 'MANUAL' | 'AUTOMATIC';
  requiredDocuments?: string[];
  optionalDocuments?: string[];
  trainingRequired?: boolean;
  agreementsToAccept?: string[];
  onboardingInstructions?: string;
  defaultPermissions?: string[];
}

export interface SupportTicket extends BaseEntity {
  userId: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'SHIPMENT' | 'PAYMENT' | 'ACCOUNT' | 'OTHER';
  attachments?: string[];
  lastUpdateAt?: string;
}

export interface WebhookLog extends BaseEntity {
  userId: string;
  event: string;
  url: string;
  status: number;
  response: string;
  payload: string;
  timestamp: string;
}

export interface DeveloperProfile extends BaseEntity {
  userId: string;
  webhookUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  apiKey?: string;
  apiKeyCreatedAt?: string;
  isApiKeyRevoked?: boolean;
  secretKey?: string;
  businessName?: string;
  email?: string;
  useCase?: string;
  rateLimit?: number;
  apiCallCount?: number;
}

export interface PlatformPayment extends BaseEntity {
  userId: string;
  amount: number;
  currency: string;
  type: 'WALLET_FUNDING' | 'SUBSCRIPTION' | 'SERVICE_FEE';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  reference: string;
  metadata?: Record<string, any>;
}

export type HubPoint = HubCenter;

export interface HubCenter extends BaseEntity {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  ownerId: string;
  isVerified: boolean;
  type: 'FILLING_STATION' | 'SUPERMARKET' | 'PHARMACY' | 'OTHER';
  location?: {
    lat: number;
    lng: number;
  };
  gps?: {
    lat: number;
    lng: number;
  };
  lga?: string;
  trustScore: number;
  rating: number;
  reviews?: number;
  services?: string[];
  operatingHours: string;
  contactPhone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  totalPoints?: number;
  starRating?: number;
  nationalRanking?: number;
  localRanking?: number;
  activeDays?: number;
  parcelSuccessRate?: number;
}

export type ParcelStatus =
  | 'DRAFT'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'AWAITING_DROP_OFF'
  | 'RECEIVED_AT_ORIGIN'
  | 'AWAITING_DISPATCH'
  | 'IN_TRANSIT'
  | 'TRANSFERRED_BETWEEN_POINTS'
  | 'ARRIVED_AT_DESTINATION'
  | 'READY_FOR_PICKUP'
  | 'COLLECTED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'LOST'
  | 'DAMAGED'
  | 'RETURNED'
  | 'REFUND_PENDING'
  | 'DISPUTED'
  | 'ARCHIVED'
  | 'RECEIVED_AT_CENTER'
  | 'EXCEPTION'
  | 'PENDING_WE_SABI_DELIVERY';

export interface Parcel extends BaseEntity {
  shipmentId: string; // Globally unique
  parcelId: string;
  trackingNumber: string;
  senderId: string;
  recipientInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  originCenterId: string;
  destinationCenterId: string;
  status: ParcelStatus;
  deliveryMethod?: 'standard' | 'express';
  fulfillmentMethod?: 'HUB_PICKUP' | 'LOGISTICS_DELIVERY';
  category?: string;
  estimatedValue?: number;
  weightKg: number;
  dimensions?: {
    l: number;
    w: number;
    h: number;
  };
  // Step 7.6: Measurement Verification Fields
  verifiedWeightKg?: number;
  verifiedDimensions?: {
    l: number;
    w: number;
    h: number;
  };
  measurementSource?: 'API' | 'MERCHANT' | 'HUB';
  measurementVerifiedBy?: string; // UserId
  measurementVerifiedAt?: string;
  measurementDiscrepancy?: {
    originalWeight: number;
    verifiedWeight: number;
    originalDimensions: { l: number; w: number; h: number };
    verifiedDimensions: { l: number; w: number; h: number };
    notes: string;
  };
  pricing: {
    baseFee: number;
    taxes: number;
    commission: number;
    total: number;
    currency: string;
    transferDiscount?: number; // Retrieved from business rules
  };
  protectionStatus: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
  SafePayStatus?: SafePayStatus;
  // Whether the merchant chose to use SafePay (protected buyer-seller
  // payment via Flutterwave) for this specific shipment. Optional and
  // per-transaction -- most shipments will not have this enabled.
  protectionEnabled?: boolean;
  qrCodeUrl?: string;
  barcodeUrl?: string;
  commissionRecordId?: string;
  exceptionReason?: string;
  exceptionDetails?: string;
  reportedBy?: string;
  condition?: string;
  shelfLocation?: string;

  // Secure Parcel Verification and Collection System
  pickupPin?: string;
  pickupPinExpiry?: string;
  pickupPinAttempts?: number;
  pickupPinVerified?: boolean;
  verificationToken?: string;
  qrExpiry?: string;
  signatureUrl?: string; // Base64 digital signature string
  signatureDate?: string;
  parcelPhotos?: string[]; // URLs or base64 photo strings of label, parcel, condition
  collectedBy?: {
    name: string;
    phone: string;
    relation: 'SELF' | 'OTHER';
  };
  deliveryAddress?: string;
  collectionStaff?: {
    staffId: string;
    staffName: string;
    staffRole: string;
    centerId: string;
    device?: string;
    gps?: { lat: number; lng: number };
    timestamp: string;
  };
}

export interface TrackingEvent extends BaseEntity {
  eventId?: string;
  parcelId: string;
  shipmentId?: string;
  status: ParcelStatus;
  eventType?: 'STATUS_CHANGE' | 'PAYMENT' | 'CUSTODY_TRANSFER' | 'HOLD' | 'INSPECTION' | 'EXCEPTION' | 'DISPUTE' | 'RELEASE' | 'MEASUREMENT_VERIFIED' | 'SYSTEM_ALERT';
  actorId: string;
  actorRole?: 'MERCHANT' | 'CUSTOMER' | 'HUB_STAFF' | 'LOGISTICS_RIDER' | 'SUPER_ADMIN' | 'SYSTEM';
  location: string;
  locationName?: string;
  hubId?: string;
  centerId?: string;
  remarks: string;
  statusDescription?: string;
  timestamp: string;
  relatedLogisticsJobId?: string;
  relatedShiftId?: string;
  relatedTransactionId?: string;
  metadata?: Record<string, any>;
  isAuditOnly?: boolean;
  isPrivateInternal?: boolean;
}

export interface ParcelMilestone {
  key: string;
  title: string;
  description: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'EXCEPTION';
  timestamp?: string;
  location?: string;
  matchedEvent?: TrackingEvent;
}

export interface ParcelTransfer extends BaseEntity {
  parcelId: string;
  transferId: string;
  fromId: string; // UserId or CenterId
  toId: string; // UserId or CenterId
  fromType: 'MERCHANT' | 'POINT' | 'LOGISTICS';
  toType: 'POINT' | 'LOGISTICS' | 'CUSTOMER';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  timestamp: string;
}

export interface CustodyRecord extends BaseEntity {
  parcelId: string;
  currentHolderId: string;
  previousHolderId: string;
  receivingUserId: string;
  releasingUserId: string;
  locationId: string; // HubCenterId
  vehicleId?: string;
  condition: string;
  notes?: string;
  photoUrl?: string;
  gps?: { lat: number; lng: number };
  verificationMethod?: string;
  timestamp: string;
}

export interface Wallet extends BaseEntity {
  uid: string;
  balance: number; // Available balance immediately withdrawable
  pendingBalance: number; // Funds pending settlement
  SafePayBalance: number; // Funds secured under payment protection
  totalEarned: number; // Cumulative historical earnings
  merchantEarnings?: number;
  centreEarnings?: number;
  dispatchEarnings?: number;
  platformEarnings?: number;
  apiPartnerEarnings?: number;
  referralEarnings?: number;
  currency: string;
  status?: string; // e.g., 'ACTIVE', 'FROZEN', 'UNDER_REVIEW'
  lastUpdated: string;
  bankInfo?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
}

export interface Transaction extends BaseEntity {
  walletId: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  category: 'SHIPMENT_PAYMENT' | 'PAYOUT' | 'COMMISSION' | 'REFUND' | 'PROTECTION_RELEASE' | 'WALLET_FUNDING' | 'REGISTRATION_FEE' | 'PLATFORM_CHARGE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  referenceId: string; // e.g. shipmentId or payoutId
  description?: string;
  metadata?: any;
  timestamp: string;
}

export interface WithdrawalRequest extends BaseEntity {
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  bankInfo: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  reason?: string;
  txReference?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  targetId?: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
}

export interface MerchantBusiness extends BaseEntity {
  merchantId: string;
  businessName: string;
  name?: string; // Backward compatibility
  description?: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  email?: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  apiKey?: string;
  apiKeyCreatedAt?: string;
  isApiKeyRevoked?: boolean;
  webhookUrl?: string;
  logoUrl?: string; // Step 7.8
  brandColor?: string;
  storeTheme?: string;
  notificationSettings?: Record<string, boolean>;
}

export interface MerchantCustomer extends BaseEntity {
  merchantId: string;
  phone: string;
  email?: string;
  name: string;
  isFavorite: boolean;
  notes?: string;
  lastShipmentId?: string;
  totalShipments: number;
  totalSpent: number;
  tags?: string[];
}

export interface LogisticsCompany extends BaseEntity {
  ownerId: string;
  name: string;
  companyName?: string; // Compatibility
  fleetSize: number;
  serviceAreas: string[]; // cities/zones
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rating: number;
  apiKey?: string;
  apiKeyCreatedAt?: string;
  isApiKeyRevoked?: boolean;
  webhookUrl?: string;
  connectorActive?: boolean;
  rateLimit?: number;
  liabilityTerms?: string;
}

export interface PointEmployee extends BaseEntity {
  uid: string;
  pointId: string;
  role: 'MANAGER' | 'STAFF';
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
}

export interface Invitation extends BaseEntity {
  code: string;
  senderId: string;
  role: UserRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  acceptedBy?: string;
  hubId?: string;
  companyId?: string;
  expiryDate?: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'WESABICHAT' | 'SHIPMENT' | 'PAYMENT' | 'RETURN' | 'STORAGE' | 'COMPLAINT' | 'DISPUTE' | 'ANNOUNCEMENT' | 'APPROVAL' | 'INVITATION' | 'API' | 'PLATFORM' | 'SECURITY' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  timestamp: string;
}

export interface ScanLog extends BaseEntity {
  parcelId: string;
  userId: string;
  role: UserRole;
  location: string;
  action: 'RECEIVED' | 'RELEASED' | 'TRANSFER_CONFIRMED' | 'PICKUP_CONFIRMED' | 'DELIVERY_CONFIRMED' | 'EXCEPTION';
  result: 'SUCCESS' | 'FAILED';
  remarks?: string;
  timestamp: string;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
  category: 'COMPANY' | 'SOLUTIONS' | 'SUPPORT' | 'LEGAL';
  enabled: boolean;
  order: number;
}

export interface SystemSettings extends BaseEntity {
  platformName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
    whatsapp?: string;
    telegram?: string;
    website?: string;
  };
  branding: {
    logoUrl: string;
    logoDarkUrl: string;
    logoLightUrl: string;
    logoWithTaglineUrl?: string;
    faviconUrl: string;
    appIconUrl: string;
    emailLogoUrl: string;
    documentLogoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    typography: {
      headingFont: string;
      bodyFont: string;
      baseFontSize?: string;
    };
    defaultTheme: 'light' | 'dark' | 'system';
    emailBranding?: {
      headerColor: string;
      footerColor: string;
      accentColor: string;
    };
    watermarks?: {
      enabled: boolean;
      text?: string;
      imageUrl?: string;
    };
    brandGuidelinesUrl?: string;
  };
  landingPage: {
    hero: {
      title: string;
      subtitle: string;
      ctaText: string;
      ctaLink: string;
      backgroundImageUrl?: string;
      videoUrl?: string;
    };
    cta: {
      title: string;
      description: string;
      buttonText: string;
      buttonLink: string;
    };
    aboutUsText?: string;
    descriptions: {
      networkSummary: string;
      merchantValueProp: string;
      logisticsValueProp: string;
      centerValueProp: string;
    };
    features: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      enabled: boolean;
      order: number;
    }>;
    statistics: Array<{
      id: string;
      label: string;
      value: string;
      order: number;
    }>;
    testimonials: Array<{
      id: string;
      name: string;
      role: string;
      content: string;
      avatarUrl?: string;
    }>;
  };
  footer: {
    aboutText: string;
    copyrightNotice: string;
    links: FooterLink[];
  };
  countryConfig: {
    defaultCountry: string;
    defaultCurrency: string;
    defaultCurrencySymbol: string;
    defaultTimezone: string;
    defaultPhoneCode: string;
    defaultDateFormat: string;
    defaultAddressFormat: string;
    defaultWeightUnit: 'kg' | 'lb';
    defaultMeasurementUnit: 'metric' | 'imperial';
    taxSettings: {
      vatRate: number;
      enabled: boolean;
    };
    consumerProtectionRules: string;
    supportedCountries: string[]; // Country codes
    multiCountryEnabled: boolean;
    languages: string[];
  };
  policies: {
    privacyPolicy: string;
    termsOfService: string;
    paymentProtectionPolicy: string;
    returnsPolicy: string;
    storagePolicy: string;
    merchantPolicy: string;
    centreAgreement: string;
    developerAgreement: string;
    communityGuidelines: string;
  };
  complianceConfig?: {
    mandatoryPolicies: string[];
    roleSpecificPolicies: Record<string, string[]>;
    countrySpecificPolicies: Record<string, string[]>;
  };
  companyPages: {
    aboutUs: string;
    howItWorks: string;
    solutions: string;
    merchants: string;
    logistics: string;
    hubs: string;
  };
  contactInfo: {
    supportEmail: string;
    supportPhone: string;
    whatsapp: string;
    address: string;
    workingHours: string;
  };
  featureFlags: {
    enableMerchantRegistration: boolean;
    enableLogisticsOnboarding: boolean;
    enableHubCenterApplications: boolean;
    enablePublicMarketplace: boolean;
    enableAIAssistant: boolean;
    enableGlobalSearch: boolean;
    enableSafePay: boolean;
  };
  maintenanceMode: boolean;
  platformFees: {
    percentage: number;
    fixed: number;
  };
  paymentConfig?: {
    primaryProvider: string;
    backupProvider: string;
    enabledProviders: string[];
    primarySafePayProvider: string;
    primaryPlatformProvider: string;
    enableFallback: boolean;
    allowedFallbackTypes: string[];
    retryLimits: number;
    timeoutDuration: number;
    paymentMaintenanceMode: boolean;
    providerPriority: string[];
    supportedCurrencies?: string[];
    webhookEndpoint?: string;
    settlementDelays?: number;
    refundRules?: string[];
    isFlutterwaveEnabled?: boolean;
    isPaystackEnabled?: boolean;
    isCardPaymentEnabled?: boolean;
    isBankTransferEnabled?: boolean;
    allowedPaymentMethods?: string[];
    providerHealthStatus?: Record<string, 'HEALTHY' | 'DEGRADED' | 'DOWN'>;
  };
  mapsConfig?: {
    mapsProvider: string;
    defaultSearchRadiusKm: number;
    maxDispatchRadiusKm: number;
    defaultCountry: string;
    distanceUnits: 'km' | 'miles';
    locationUpdateIntervalMs: number;
    geofenceRadiusMeters: number;
    locationAccuracyThresholdMeters: number;
    routeDeviationThresholdMeters: number;
    enableRouteDeviationDetection: boolean;
    enableLiveRiderTracking: boolean;
    enableGeofencing: boolean;
  };
  telegramConfig?: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
  smsConfig?: {
    provider: 'TWILIO' | 'INFOBIP' | 'FALLBACK';
    apiKey?: string;
    senderId?: string;
    enabled: boolean;
  };
  emailConfig?: {
    provider: 'SENDGRID' | 'MAILGUN' | 'SES' | 'FALLBACK';
    apiKey?: string;
    defaultSender: string;
    enabled: boolean;
  };
  communicationSettings?: {
    notificationLimits: number;
    retryPolicy: {
      maxAttempts: number;
      delaySeconds: number;
    };
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
  parcelVerification?: {
    pickupPinExpiryMinutes: number;
    maxVerificationAttempts: number;
    qrValidityPeriodMinutes: number;
    signatureRequired: boolean;
    mandatoryParcelPhotos: boolean;
    gpsRequired: boolean;
    chainOfCustodyEnabled: boolean;
    successAnimationStyle?: 'confetti' | 'checkmark' | 'fireworks' | 'coins' | 'ripple' | 'stars' | 'burst' | 'sparkle' | 'pulse' | 'badge' | 'glow' | 'particles' | 'celebration' | 'trophy' | 'balloons' | 'ribbon' | 'laser' | 'snowfall' | 'cosmic' | 'heartbeat' | 'diamonds' | 'sunburst' | 'neon' | 'quantum' | 'swirl' | 'fireflies' | 'shimmer' | 'comet' | 'supernova' | 'shield';
  };
  notificationTemplates?: {
    received?: { title: string; body: string; enabled: boolean };
    approved?: { title: string; body: string; enabled: boolean };
    rejected?: { title: string; body: string; enabled: boolean };
    reupload?: { title: string; body: string; enabled: boolean };
    suspended?: { title: string; body: string; enabled: boolean };
  };
  verificationRules?: {
    ocrAutoVerify?: boolean;
    kycCheckThreshold?: string;
    maxSubmissionAttempts?: number;
    autoApproveCustomers?: boolean;
    reRouteDelayHours?: number;
    requireSelfieMatch?: boolean;
  };
}

export interface PricingRule extends BaseEntity {
  name: string;
  country: string;
  currency: string;
  version: number;
  isActive: boolean;
  basePrice: number;
  minPrice: number;
  maxWeightKg: number;
  pricePerKg: number;
  dimensionMultiplier: number;
  distanceBasePrice: number;
  pricePerKm: number;
  serviceMultipliers: {
    STANDARD: number;
    EXPRESS: number;
    SAME_DAY: number;
  };
  transferDiscountPercentage: number;
  commissions: {
    platformPercentage: number;
    hubPointPercentage: number;
    logisticsPercentage: number;
  };
  taxesPercentage: number;
}

export interface PricingBreakdown {
  basePrice: number;
  weightCharge: number;
  dimensionCharge: number;
  distanceCharge: number;
  serviceCharge: number;
  transferAdjustment: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  ruleVersion: number;
  commissions: {
    platform: number;
    hubPoint: number;
    logistics: number;
  };
}

export interface ParcelHistory extends BaseEntity {
  parcelId: string;
  status: ParcelStatus;
  location: string;
  updatedBy: string; // UserId
  details: string;
  timestamp: string;
}

export interface VerificationRequest extends BaseEntity {
  userId: string;
  type: 'IDENTITY' | 'BUSINESS' | 'VEHICLE';
  documents: string[]; // Storage paths
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Driver extends BaseEntity {
  uid: string;
  logisticsCompanyId: string;
  licenseNumber: string;
  vehicleInfo: {
    type: string;
    plateNumber: string;
    model: string;
  };
  currentStatus: 'ONLINE' | 'OFFLINE' | 'ON_JOB';
  rating: number;
}

export interface ServiceZone extends BaseEntity {
  name: string;
  city: string;
  state: string;
  country: string;
  active: boolean;
}

export interface PromotionRule extends BaseEntity {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  currentUsage: number;
  active: boolean;
}

export interface Country extends BaseEntity {
  name: string;
  code: string; // ISO code
  flag?: string;
  currency: string;
  currencySymbol: string;
  phoneNumberFormat: string;
  phoneCode: string;
  addressFormat: string;
  postalCodeRules: string;
  states: string[];
  cities: string[];
  supportedLanguages: string[];
  timeZone: string;
  weightUnits: 'kg' | 'lb';
  measurementUnits: 'metric' | 'imperial';
  dateFormat: string;
  taxSettings?: {
    vatRate: number;
    enabled: boolean;
    taxIdName: string; // e.g. TIN, SSN
    taxIdFormat: string;
  };
  consumerProtectionRules: string;
  defaultPaymentProvider: string;
  defaultMapRegion: {
    lat: number;
    lng: number;
    zoom: number;
  };
  active: boolean;
  registrationRules?: {
    enabledRoles: string[];
    requiredDocuments: Record<string, string[]>;
    manualApprovalOnlyRoles: string[];
    kycVerificationRequired: boolean;
  };
}

export interface PointRule extends BaseEntity {
  label: string;
  points: number;
  isActive: boolean;
  isSystem?: boolean;
}

export interface StarThreshold extends BaseEntity {
  name: string;
  minPoints: number;
  maxPoints: number;
  boost: string;
  visibility: string;
  stars: number;
}

export interface TrustFactor extends BaseEntity {
  label: string;
  weight: number;
  isActive: boolean;
}

export interface RankingFactor extends BaseEntity {
  label: string;
  weight: number;
}

export interface PointAuditLog extends BaseEntity {
  hubId: string;
  type: 'POINT_AWARD' | 'POINT_DEDUCTION' | 'TRUST_SCORE_UPDATE' | 'STAR_RATING_CHANGE';
  points?: number;
  oldValue: any;
  newValue: any;
  reason: string;
  timestamp: string;
  metadata?: any;
}

export interface BonusCampaign extends BaseEntity {
  name: string;
  multiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetActivity?: string;
}

// =========================================================================
// WESABICHAT: BUYER-SELLER COMMUNICATION & PAYMENT PROTECTION EVIDENCE
// =========================================================================

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ItemInformation {
  title: string;
  description: string;
  quantity: number;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  estimatedValue: number;
  images: string[]; // URLs of attached item photos
  videos: string[]; // URLs of attached item videos
  buyerAcknowledged: boolean;
  acknowledgedAt?: string;
}

export interface MediaAttachment {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE';
  name?: string;
  size?: number;
  thumbnailUrl?: string; // For videos/images
}

export interface Conversation extends BaseEntity {
  type: 'SHIPMENT' | 'USERNAME';
  participants: string[]; // List of user IDs
  participantNames?: Record<string, string>; // userId -> Name
  participantUsernames?: Record<string, string>; // userId -> wesabiUsername
  participantRoles?: Record<string, UserRole>; // userId -> primary role, shown as a badge in chat

  // Required for backward compatibility and payment protection, but optional for general chats
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerName?: string;

  shipmentId?: string;       // Connected shipmentId
  parcelId?: string;         // Connected parcelId (e.g. tracking index)
  trackingNumber?: string;   // Connected trackingNumber

  status: 'PENDING' | 'ACTIVE' | 'DECLINED' | 'BLOCKED' | 'DISPUTED' | 'CLOSED';
  initiatorId?: string; // the user who started it

  protectionEnabled?: boolean;
  linkedShipmentId?: string; // If a username chat was later linked

  isDisputed?: boolean;
  disputeId?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageStatus?: MessageStatus;
  itemInfo?: ItemInformation; // Optional attached item details
  typingStatus?: Record<string, boolean>; // userId -> isTyping
  metadata?: {
    aiSummary?: string;       // Future-ready AI Summary
    isEncrypted?: boolean;    // Future-ready End-to-End Encryption
    languageCode?: string;    // Future-ready Translation support
  };
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  text: string;
  mediaUrl?: string;          // Deprecated, use attachments instead
  mediaType?: 'IMAGE' | 'VIDEO' | 'FILE' | 'VOICE'; // Deprecated
  fileName?: string;          // Deprecated
  fileSize?: number;          // Deprecated
  attachments?: MediaAttachment[]; // Multiple media support
  replyToId?: string;         // Message reply
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  readBy?: Record<string, string>; // userId -> timestamp
  status: MessageStatus;
  delivered: boolean;
  timestamp: string;
  deviceInfo?: {              // Forensic evidence
    userAgent: string;
    platform: string;
    ipAddress?: string;
  };
  callInfo?: {                // Payment Protection Verified Call signaling
    callType: 'AUDIO' | 'VIDEO' | 'VERIFIED_PACKING' | 'VERIFIED_UNPACKING';
    durationSeconds?: number;
    status: 'MISSED' | 'COMPLETED' | 'REJECTED' | 'RECORDING_SAVED';
    recordingUrl?: string;
    consentedParties?: string[]; // userIds of those who consented
  };
}

// =========================================================================
// OPERATIONAL COMMUNICATION SYSTEM
// =========================================================================

export type OperationalNotificationType =
  | 'PARCEL_RECEIVED_AT_HUB'
  | 'PARCEL_TRANSFERRED'
  | 'PARCEL_READY_FOR_PICKUP'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'DELIVERY_COMPLETED'
  | 'EXCEPTION_REPORTED';

export interface OperationalNotification extends BaseEntity {
  parcelId: string;
  shipmentId: string;
  trackingNumber: string;
  type: OperationalNotificationType;
  title: string;
  message: string;
  actorId: string; // The staff/driver who triggered the update
  actorName: string;
  actorRole: UserRole;
  visibleToRoles: UserRole[]; // Who should see this update
  timestamp: string;
  metadata?: any;
}

export interface DisputeNote {
  id: string;
  note: string;
  authorId: string;
  authorName: string;
  timestamp: string;
}

export interface Dispute extends BaseEntity {
  conversationId: string;
  shipmentId: string;
  parcelId: string;
  trackingNumber: string;
  initiatorId: string;
  initiatorRole: UserRole;
  reason: string;
  details: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'NEW' | 'PENDING_REVIEW' | 'WAITING_FOR_BUYER' | 'WAITING_FOR_MERCHANT' | 'EVIDENCE_REQUESTED' | 'UNDER_INVESTIGATION' | 'AWAITING_DECISION' | 'REFUND_APPROVED' | 'PARTIAL_REFUND_APPROVED' | 'MERCHANT_PAID' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  resolvedBy?: string;
  assignedTo?: string;
  assignedName?: string;
  assignedAdminId?: string;
  resolutionNotes?: string;
  resolutionType?: string;
  escalationReason?: string;
  evidence: {
    conversationSnapshot: Message[]; // Deep immutable freeze of messages
    itemInfo?: ItemInformation;
    shipmentInfo?: any;              // Frozen parcel snapshot
    trackingHistory?: any[];         // Frozen tracking events
    buyerEvidenceDocs?: string[];    // Extra evidence uploaded
    merchantEvidenceDocs?: string[]; // Extra evidence uploaded
  };
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category?: string;
  buyerId?: string;
  buyerName?: string;
  merchantId?: string;
  merchantName?: string;
  latestActivity?: string;
  protectionStatus?: string;
  aiAssessment?: string;
  internalNotes?: DisputeNote[];
}

export interface Complaint extends BaseEntity {
  userId: string;
  userRole: UserRole;
  userName: string;
  title: string;
  description: string;
  category: 'SHIPMENT' | 'PAYMENT' | 'SERVICE' | 'TECHNICAL' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED_AI' | 'RESOLVED_ADMIN' | 'PENDING_ADMIN' | 'CLOSED';
  relatedEntityId?: string;
  aiResponse?: string;
  adminNotes?: string;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}


// =========================================================================
// PAYMENT PROTECTION WORKFLOW ENGINE (Formerly SafePay)
// =========================================================================

export type PaymentProtectionStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'AWAITING_PARTY_ACCEPTANCE'
  | 'AGREED'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PENDING'
  | 'FUNDS_SECURED'
  | 'READY_FOR_FULFILLMENT'
  | 'IN_TRANSIT'
  | 'SHIPMENT_IN_TRANSIT'
  | 'DELIVERED'
  | 'DELIVERED_AWAITING_CONFIRMATION'
  | 'INSPECTION'
  | 'INSPECTION_IN_PROGRESS'
  | 'ACCEPTED'
  | 'RELEASE_PENDING'
  | 'PAYMENT_RELEASED'
  | 'CANCELLED'
  | 'DISPUTE_OPENED'
  | 'UNDER_INVESTIGATION'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'REFUND_APPROVED'
  | 'PARTIAL_REFUND_APPROVED'
  | 'PAYMENT_COMPLETED'
  | 'TRANSACTION_CLOSED'
  | 'EXPIRED'
  | 'FAILED';

export type SafePayFeePayer = 'BUYER' | 'SELLER' | 'SPLIT';

export interface SafePayFeeConfig {
  percentageFee: number;
  fixedFee: number;
  minimumFee: number;
  maximumFee: number;
  isActive: boolean;
  currency: string;
  effectiveDate: string;
}

export interface SafePayAgreementTerms {
  itemCondition: string;
  testing: string;
  warranty: string;
  returnPolicy: string;
  authenticity: string;
  contents: string;
  serialImei: string;
  packaging: string;
  delivery: string;
  inspection: string;
  defectDefinition: string;
  specialInstructions?: string;
  customTerms?: Array<{ key: string; value: string }>;
}

export interface SafePayAgreementVersion {
  version: number;
  transactionId: string;
  conversationId?: string;
  proposerId: string;
  proposerRole: 'BUYER' | 'SELLER';
  timestamp: string;
  previousVersionRef?: string;
  terms: SafePayAgreementTerms;
  agreedAmount: number;
  feeConfigSnapshot: SafePayFeeConfig;
  feePayer: SafePayFeePayer;
  feeAmount: number;
  buyerFeeShare: number;
  sellerFeeShare: number;
  buyerAccepted: boolean;
  buyerAcceptedAt?: string;
  sellerAccepted: boolean;
  sellerAcceptedAt?: string;
  safePayTermsAcceptedByBuyer: boolean;
  safePayTermsAcceptedBySeller: boolean;
  status: 'DRAFT' | 'PROPOSED' | 'AWAITING_PARTY_ACCEPTANCE' | 'AGREED' | 'SUPERSEDED';
}

export interface SafePayTransaction extends BaseEntity {
  transactionId: string;
  conversationId?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  itemTitle: string;
  itemDescription?: string;
  itemPrice: number;
  orderId?: string;
  parcelId?: string;
  trackingNumber?: string;
  logisticsChoice: 'NONE' | 'WESABIHUB_HUB' | 'WESABIHUB_RIDER' | 'EXTERNAL_COURIER' | 'SELLER_DELIVERY' | 'BUYER_PICKUP';
  agreedAmount: number;
  feeAmount: number;
  feePayer: SafePayFeePayer;
  buyerFeeShare: number;
  sellerFeeShare: number;
  authoritativePaymentRequired: number;
  currentVersion: number;
  versions: SafePayAgreementVersion[];
  activeAgreement?: SafePayAgreementVersion;
  status: PaymentProtectionStatus;
  paymentStatus: 'UNPAID' | 'PAYMENT_PENDING' | 'FUNDS_SECURED' | 'RELEASED' | 'REFUNDED' | 'FAILED';
  flutterwaveRef?: string;
  provider: string;
  isSandbox?: boolean;
  disputeId?: string;
  evidence?: {
    sellerPreDispatchVideo?: { url: string; durationSeconds: number; timestamp: string };
    buyerUnboxingVideo?: { url: string; durationSeconds: number; timestamp: string };
    photos?: string[];
  };
  auditLog: Array<{
    timestamp: string;
    actorId: string;
    action: string;
    details?: any;
  }>;
}

export type SafePayStatus = PaymentProtectionStatus;
export type SafePayRecord = PaymentProtectionRecord;
export type SafePaySettings = PaymentProtectionSettings;

export interface PaymentProtectionRecord extends BaseEntity {
  paymentProtectionId: string;
  shipmentId?: string;
  parcelId?: string;
  trackingNumber?: string;
  customerId: string; // Buyer
  merchantId: string; // Seller
  amount: number;
  currency: string;
  status: PaymentProtectionStatus;
  inspectionPeriodHours?: number;
  inspectionStartedAt?: string;
  inspectionExpiresAt?: string;
  paymentReleasedAt?: string;
  releasedBy?: string; // User ID or 'SYSTEM'
  disputeId?: string;
  refundAmount?: number;
  metadata?: any;
  flutterwaveRef?: string;
  provider?: string;
  isSandbox?: boolean;
  verifyMetadata?: any;
  webhookReceived?: boolean;
  // Extended fields for P1 SafePay Workspace
  transactionId?: string;
  conversationId?: string;
  agreedAmount?: number;
  feeAmount?: number;
  feePayer?: SafePayFeePayer;
  buyerFeeShare?: number;
  sellerFeeShare?: number;
  authoritativePaymentRequired?: number;
  logisticsChoice?: string;
  currentVersion?: number;
  versions?: SafePayAgreementVersion[];
  activeAgreement?: SafePayAgreementVersion;
  auditLog?: Array<{
    timestamp: string;
    actorId: string;
    action: string;
    details?: any;
  }>;
}

export interface PaymentProtectionSettings extends BaseEntity {
  defaultInspectionPeriodHours: number;
  maxExtensionHours: number;
  allowInspectionExtension: boolean;
  autoReleaseAfterInspection: boolean;
  supportedPaymentProviders: string[];
  // Extended SafePay Fee Configuration
  feeConfig?: SafePayFeeConfig;
}

// =========================================================================
// RETURN MANAGEMENT
// =========================================================================

export interface MerchantReturnPolicy {
  merchantId: string;
  returnsAccepted: boolean;
  returnWindowDays: number;
  acceptedReasons: string[];
  returnShippingPaidBy: 'CUSTOMER' | 'MERCHANT';
  restockingFeePercentage: number;
  nonReturnableCategories: string[];
  specialConditions?: string;
}

export interface ReturnRequest extends BaseEntity {
  shipmentId: string;
  parcelId: string;
  customerUserId: string;
  merchantId: string;
  reason: string;
  description: string;
  photos: string[];
  videoUrl?: string;
  notes?: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED_AT_CENTER' | 'COMPLETED' | 'CANCELLED';
  requestedAt: string;
}

export interface ReturnAuthorization extends BaseEntity {
  returnRequestId: string;
  trackingNumber: string;
  qrCodeUrl: string;
  pickupPin: string;
  expiryAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED';
}

export interface ReturnIntakeRecord extends BaseEntity {
  returnRequestId: string;
  centerId: string;
  receivingStaffId: string;
  parcelPhotos: string[];
  packagingCondition: string;
  damageNotes?: string;
  gps?: { lat: number; lng: number };
  customerSignatureUrl?: string;
  recordedAt: string;
}

export interface CentreStorage extends BaseEntity {
  parcelId: string;
  centerId: string;
  status: 'STORED' | 'PAID' | 'COLLECTED';
  storedAt: string;
  feePerDay: number;
  totalFeesAccrued: number;
  lastPaymentAt?: string;
}

export interface PackagingRequirement extends BaseEntity {
  category: string;
  requirement: 'TRANSPARENT' | 'FACTORY_SEALED' | 'TAMPER_EVIDENT' | 'SPECIAL';
  details?: string;
}

export interface CountryComplianceRules extends BaseEntity {
  countryCode: string;
  mandatoryReturnPeriodDays: number;
  allowNoReturns: boolean;
  requiresSpecialConditions: boolean;
}

export interface Announcement extends BaseEntity {
  title: string;
  body: string;
  imageUrl?: string;
  buttonText?: string;
  destinationUrl?: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'INFO';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  views: number;
}

export interface Advertisement extends BaseEntity {
  headline: string;
  description: string;
  imageUrl: string;
  destinationUrl: string;
  priority: number;
  enabled: boolean;
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface PolicyVersion extends BaseEntity {
  policyKey: string;
  version: string;
  content: string;
  publishedBy: string;
  publishedAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  requiresReAcceptance: boolean;
}

export interface UserConsent extends BaseEntity {
  userId: string;
  policyKey: string;
  policyVersion: string;
  acceptedAt: string;
  deviceInfo: string;
  ipAddress?: string;
  country?: string;
  accountType?: UserRole;
  registrationMethod?: 'EMAIL' | 'GOOGLE' | 'PHONE';
}

export interface Course extends BaseEntity {
  title: string;
  description: string;
  category: string;
  roleRequirements: string[];
  isMandatory: boolean;
  lessons: Lesson[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'IMAGE' | 'TEXT' | 'SOP';
  content: string;
  order: number;
}

export interface CourseCategory extends BaseEntity {
  name: string;
}

export interface UserCourseProgress extends BaseEntity {
  userId: string;
  courseId: string;
  completedLessons: string[];
  quizScore?: number;
  isCompleted: boolean;
  completedAt?: string;
  timeSpent: number;
}

export interface Quiz extends BaseEntity {
  courseId: string;
  questions: Question[];
  passingScore: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: string;
}

export interface QuizAttempt extends BaseEntity {
  userId: string;
  courseId: string;
  score: number;
  passed: boolean;
}

export interface Certificate extends BaseEntity {
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: string;
}

export interface Receipt extends BaseEntity {
  receiptId: string; // e.g. REC-XXXXXX or REL-XXXXXX
  type: 'INTAKE' | 'RELEASE';
  shipmentId: string;
  trackingNumber: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  hubId: string;
  hubName: string;
  staffId: string;
  staffName: string;
  shelfLocation?: string;
  verificationToken: string;
  qrCodeDataUrl?: string;
  items?: string;
  weight?: number;
  packagingCondition?: string;
  recipientRelation?: string; // For RELEASE
}

export interface IdVerification extends BaseEntity {
  userId: string;
  userEmail: string;
  userDisplayName: string;
  documentType: 'PASSPORT' | 'NIN_CARD' | 'DRIVERS_LICENSE' | 'OTHER';
  capturedImageUrl: string;
  extractedDetails: {
    fullName: string;
    docNumber: string;
    expiryDate: string;
    dob: string;
  };
  aiAnalysis: {
    confidence: number;
    verified: boolean;
    message: string;
    timestamp: string;
  };
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface DocumentRequirement extends BaseEntity {
  name: string;
  description: string;
  isRequired: boolean;
  applicableRoles: UserRole[];
  applicableCountries: string[]; // e.g. ["NG", "GH"] or ["ALL"]
  acceptedFileTypes: string[]; // e.g. ["pdf", "png", "jpg", "jpeg"]
  maxFileSizeMb: number;
  requiresExpiryDate: boolean;
  renewalReminderDays: number;
  adminVerificationRequired: boolean;
  autoApprovalAllowed: boolean;
  displayOrder: number;
  helpText: string;
  isActive: boolean;
}

export interface PaymentGateway {
  name: string;
  initiatePayment(data: PaymentInitiationData): Promise<PaymentResponse>;
  verifyPayment(reference: string): Promise<PaymentVerificationResponse>;
  refundPayment?(reference: string, amount: number): Promise<any>;
  releasePayment?(reference: string): Promise<any>;
}

export interface PaymentInitiationData {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  metadata?: Record<string, any>;
  paymentType?: 'SAFEPAY' | 'WALLET_FUNDING' | 'REGISTRATION_FEE' | 'MEMBERSHIP' | 'SUBSCRIPTION' | 'GENERAL_PLATFORM_CHARGE' | string;
  paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'WALLET' | string;
  userId?: string;
}

export interface PaymentResponse {
  reference: string;
  authorizationUrl?: string;
  checkoutUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  provider?: string;
}

export interface PaymentVerificationResponse {
  reference: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  gatewayId?: string;
  rawResponse?: any;
}

export interface CommunicationLog extends BaseEntity {
  userId: string;
  recipient: string; // email, phone, or chatId
  channel: 'IN_APP' | 'TELEGRAM' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP' | 'ANNOUNCEMENT' | 'AD';
  category: 'SYSTEM' | 'PAYMENT' | 'PARCEL' | 'DISPATCH' | 'CENTRE' | 'MERCHANT' | 'API' | 'SECURITY' | 'ADMIN' | 'SCHEDULED';
  title: string;
  body: string;
  provider: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  error?: string;
  timestamp: string;
}

export type ShiftStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface ShiftLocation {
  lat?: number;
  lng?: number;
  address?: string;
}

export interface Shift extends BaseEntity {
  shiftId: string;
  hubId: string;
  hubName: string;
  staffId: string;
  staffName: string;
  role: string;
  startTime: string;
  endTime?: string;
  status: ShiftStatus;
  startLocation?: ShiftLocation;
  endLocation?: ShiftLocation;
  parcelsProcessed: number;
  parcelsReceived: number;
  parcelsReleased: number;
  exceptionsRecorded: number;
  custodyActionsPerformed: number;
  totalOperationalActions: number;
  notes?: string;
}

export type RatingTargetType = 'HUB' | 'MERCHANT' | 'LOGISTICS' | 'RIDER' | 'CUSTOMER' | 'STAFF';

export type RatingRelationshipType =
  | 'CUSTOMER_TO_HUB'
  | 'MERCHANT_TO_HUB'
  | 'CUSTOMER_TO_MERCHANT'
  | 'MERCHANT_TO_CUSTOMER'
  | 'CUSTOMER_TO_LOGISTICS'
  | 'HUB_TO_LOGISTICS'
  | 'CUSTOMER_TO_STAFF';

export type RatingStatus = 'PUBLISHED' | 'PENDING' | 'HIDDEN' | 'REMOVED' | 'REPORTED';

export interface RatingReview extends BaseEntity {
  ratingId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  targetId: string;
  targetType: RatingTargetType;
  relationshipType: RatingRelationshipType;
  ratingValue: number; // 1 to 5
  reviewText?: string;
  shipmentId?: string;
  parcelId?: string;
  logisticsJobId?: string;
  status: RatingStatus;
  reportReason?: string;
  reportedBy?: string;
  reportedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
  moderatedAt?: string;
}

export type TrustTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface TrustScoreBreakdown {
  entityId: string;
  entityType: RatingTargetType;
  trustScore: number; // 0 to 100
  tier: TrustTier;
  averageRating: number;
  totalRatingsCount: number;
  completedTransactions: number;
  successRatePercent: number;
  disputeCount: number;
  cancellationCount: number;
  identityVerified: boolean;
  calculatedAt: string;
}
