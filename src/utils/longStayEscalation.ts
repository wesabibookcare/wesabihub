export type LongStayTier =
  | 'NORMAL'
  | 'REMINDER' // 3 days
  | 'WARNING' // 7 days
  | 'STORAGE_WARNING' // 14 days
  | 'ESCALATED_VISIBILITY' // 30 days
  | 'RECOVERY_REVIEW' // 90 days
  | 'RED_ALERT'; // 10 months (300 days)

export interface LongStayEscalationInfo {
  tier: LongStayTier;
  label: string;
  badgeVariant: 'info' | 'warning' | 'error' | 'outline' | 'success';
  description: string;
  actionRequired: string;
  isRedAlert: boolean;
}

export function getLongStayEscalationInfo(daysInHub: number): LongStayEscalationInfo {
  if (daysInHub >= 300) { // 10 months (~300 days)
    return {
      tier: 'RED_ALERT',
      label: '10-Month RED ALERT',
      badgeVariant: 'error',
      description: 'Parcel has exceeded 10 months in hub custody. Red alert triggered for authorized administrative confiscation/recovery review.',
      actionRequired: 'Super Admin + Hub Owner Documented Decision Required',
      isRedAlert: true,
    };
  }
  if (daysInHub >= 90) { // 90 days
    return {
      tier: 'RECOVERY_REVIEW',
      label: '90-Day Recovery Review',
      badgeVariant: 'error',
      description: 'Parcel has reached 90 days in hub custody. Pending operational recovery review.',
      actionRequired: 'Hub Owner / Operations Review',
      isRedAlert: false,
    };
  }
  if (daysInHub >= 30) { // 30 days
    return {
      tier: 'ESCALATED_VISIBILITY',
      label: '30-Day Escalated Visibility',
      badgeVariant: 'warning',
      description: 'Parcel has reached 30 days in hub custody. High storage warning escalated to Admin.',
      actionRequired: 'Contact Customer / Merchant Escalation',
      isRedAlert: false,
    };
  }
  if (daysInHub >= 14) { // 14 days
    return {
      tier: 'STORAGE_WARNING',
      label: '14-Day Storage Warning',
      badgeVariant: 'warning',
      description: 'Parcel in hub for 14 days. Customer storage warning triggered.',
      actionRequired: 'Send Storage Warning Notification',
      isRedAlert: false,
    };
  }
  if (daysInHub >= 7) { // 7 days
    return {
      tier: 'WARNING',
      label: '7-Day Warning',
      badgeVariant: 'warning',
      description: 'Parcel in hub for 7 days. Collection warning issued.',
      actionRequired: 'Send Collection Warning Notification',
      isRedAlert: false,
    };
  }
  if (daysInHub >= 3) { // 3 days
    return {
      tier: 'REMINDER',
      label: '3-Day Pickup Reminder',
      badgeVariant: 'info',
      description: 'Parcel in hub for 3 days. Standard pickup reminder active.',
      actionRequired: 'Send Automated Pickup Reminder',
      isRedAlert: false,
    };
  }

  return {
    tier: 'NORMAL',
    label: 'Standard Holding',
    badgeVariant: 'success',
    description: 'Parcel within normal pickup window.',
    actionRequired: 'None',
    isRedAlert: false,
  };
}
