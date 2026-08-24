
/**
 * Shared constants for the OmorfiHub platform.
 */

export const PARCEL_STATUSES = {
  PENDING_DROP_OFF: 'Pending Drop-off',
  AT_ORIGIN_CENTER: 'At Origin Center',
  IN_TRANSIT: 'In Transit',
  AT_DESTINATION_CENTER: 'At Destination Center',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'Customer',
  MERCHANT: 'Merchant',
  CENTER_OWNER: 'Center Owner',
  CENTER_STAFF: 'Center Staff',
  LOGISTICS_PARTNER: 'Logistics Partner',
  PLATFORM_ADMIN: 'Platform Admin',
} as const;

export const HUB_TYPES = {
  FILLING_STATION: 'Filling Station',
  SUPERMARKET: 'Supermarket',
  PHARMACY: 'Pharmacy',
  OTHER: 'Other',
} as const;
