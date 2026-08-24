import React from 'react';
import {
  User,
  ShoppingBag,
  MapPin,
  Users,
  Truck,
  Code,
  Shield,
  LifeBuoy,
  Settings,
  Zap,
  Package
} from 'lucide-react';
import { UserRole } from '../types';

export interface RoleInfo {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
  approvalStatus: 'IMMEDIATE' | 'REQUIRED' | 'APPLICATION';
  responsibilities: string[];
  benefits: string[];
  learnMore: {
    capabilities: string[];
    process: string;
    features: string[];
  };
}

// ==========================================================
// PAUSED ROLES (temporarily hidden from public self-signup)
// ==========================================================
// To bring any of these back, just remove its id from this array.
// Nothing else needs to change -- the full role definitions below are
// untouched, and all existing accounts/routes/dashboards for these roles
// still work exactly as before. This only affects what NEW users are
// offered when they register.
export const PAUSED_ROLES: string[] = [
  'LOGISTICS_COMPANY',
  'DISPATCH_COMPANY',
  'FLEET_MANAGER',
  'DRIVER',
  'DEVELOPER',
  'API_MERCHANT_PARTNER',
  // Internal staff/admin roles were never meant to be self-service signups;
  // hiding them here too so the public registration page only offers roles
  // an ordinary visitor should actually be choosing from.
  'SUPER_ADMIN',
  'OPERATIONS_MANAGER',
  'SUPPORT_OFFICER',
  'VERIFICATION_OFFICER',
  'FINANCE_OFFICER',
  'DISPUTE_ADMIN',
];

export const ROLES: RoleInfo[] = [
  {
    id: 'CUSTOMER',
    title: 'Customer',
    description: 'Buy, receive and track parcels securely using Payment Protection.',
    icon: User,
    approvalStatus: 'IMMEDIATE',
    responsibilities: [
      'Sending personal parcels',
      'Receiving items from merchants',
      'Tracking shipments in real-time'
    ],
    benefits: [
      'Payment Protection',
      'Secure PUDO collection points',
      'Low shipment costs'
    ],
    learnMore: {
      capabilities: ['Create personal shipments', 'Request pickups', 'Access 24/7 support'],
      process: 'Instant activation upon registration.',
      features: ['Tracking dashboard', 'Secure PIN collection', 'Wallet system']
    }
  },
  {
    id: 'MERCHANT',
    title: 'Merchant',
    description: 'Sell products, manage shipments and communicate with customers through OmorfiHubChat.',
    icon: ShoppingBag,
    approvalStatus: 'REQUIRED',
    responsibilities: [
      'Managing business inventory',
      'Shipping orders to customers',
      'Handling customer inquiries'
    ],
    benefits: [
      'Business dashboard',
      'API integration support',
      'Verified Merchant badge'
    ],
    learnMore: {
      capabilities: ['Bulk shipment creation', 'Sales analytics', 'Customer chat'],
      process: 'Requires business verification (KYC). Approval typically takes 24-48 hours.',
      features: ['Storefront management', 'Inventory tracking', 'Payment protection payouts']
    }
  },
  {
    id: 'CENTER_OWNER',
    title: 'Centre Owner',
    description: 'Operate an approved OmorfiHub collection centre and manage staff.',
    icon: MapPin,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Operating a physical PUDO point',
      'Managing hub staff',
      'Ensuring parcel security'
    ],
    benefits: [
      'Earn commissions on every parcel',
      'Increase foot traffic to location',
      'Hub management software'
    ],
    learnMore: {
      capabilities: ['Onboard hub staff', 'Monitor center activity', 'Withdraw earnings'],
      process: 'Physical site inspection and business registration required. Multi-stage approval.',
      features: ['Staff management', 'Earning analytics', 'QR scan system']
    }
  },
  {
    id: 'CENTER_STAFF',
    title: 'Centre Staff',
    description: 'Work under an approved Centre Owner to receive, verify and release parcels.',
    icon: Users,
    approvalStatus: 'REQUIRED',
    responsibilities: [
      'Scanning parcels on arrival',
      'Verifying customer collection PINs',
      'Managing daily hub operations'
    ],
    benefits: [
      'Employment at certified hubs',
      'Simplified operational tools',
      'Mobile scanning app access'
    ],
    learnMore: {
      capabilities: ['Process drop-offs', 'Verify collections', 'Report exceptions'],
      process: 'Must be invited by a Hub Owner or apply with a Hub ID for verification.',
      features: ['Mobile scanner', 'Duty logs', 'Shift management']
    }
  },
  {
    id: 'LOGISTICS_COMPANY',
    title: 'Logistics Partner',
    description: 'Deliver parcels between hubs and manage your delivery fleet.',
    icon: Truck,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Inter-hub parcel transfers',
      'Managing drivers and vehicles',
      'Maintaining delivery timelines'
    ],
    benefits: [
      'Guaranteed shipment volume',
      'Fleet management dashboard',
      'Automated route optimization'
    ],
    learnMore: {
      capabilities: ['Assign drivers to routes', 'Track fleet movement', 'Manage payouts'],
      process: 'Logistics license and vehicle verification required.',
      features: ['Fleet console', 'Route planner', 'Driver performance tracking']
    }
  },
  {
    id: 'DISPATCH_RIDER',
    title: 'Dispatch Rider',
    description: 'Onboard as an independent dispatch rider to deliver packages and build your Trust Score.',
    icon: Truck,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Transporting parcels between hubs and customers',
      'Confirming pickups and drop-offs via secure QR verification',
      'Maintaining high ratings, training status, and safety practices'
    ],
    benefits: [
      'Access to consistent parcel volume across hubs',
      'Digital ID Card with custom QR verification code',
      'Transparent earnings wallet with payout settlement flexibility'
    ],
    learnMore: {
      capabilities: ['Manage individual delivery routes', 'Request wallet settlement payouts', 'Complete training courses'],
      process: 'Submit identity KYC, guarantor detail forms, vehicle registration, and driver credentials for manual operations review.',
      features: ['Digital ID card generator', 'Withdrawals portal', 'Trust Tier tracking']
    }
  },
  {
    id: 'DEVELOPER',
    title: 'Developer / API Partner',
    description: 'Integrate your application or marketplace with OmorfiHub through secure APIs.',
    icon: Code,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Building custom integrations',
      'Maintaining API security',
      'Providing marketplace solutions'
    ],
    benefits: [
      'Sandbox testing environment',
      'Technical documentation access',
      'Direct developer support'
    ],
    learnMore: {
      capabilities: ['Create shipments via API', 'Real-time webhook updates', 'Custom labels'],
      process: 'Developer profile review and sandbox verification required.',
      features: ['API keys management', 'Webhook console', 'SDK access']
    }
  },
  {
    id: 'API_MERCHANT_PARTNER',
    title: 'API Merchant Partner',
    description: 'Corporate partners using our high-volume API for enterprise e-commerce logistics.',
    icon: Zap,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'High-volume transaction management',
      'Integrating enterprise ERP with OmorfiHub',
      'Maintaining dedicated API credentials'
    ],
    benefits: [
      'Bulk volume discounts',
      'Priority API processing',
      'Dedicated account manager'
    ],
    learnMore: {
      capabilities: ['Enterprise API keys', 'SLA guaranteed support', 'Custom reporting'],
      process: 'Corporate verification and partnership agreement required.',
      features: ['API management console', 'Volume statistics', 'Priority support']
    }
  },
  {
    id: 'DRIVER',
    title: 'Fleet Driver',
    description: 'Work as a driver for a registered Logistics Partner to move parcels between hubs.',
    icon: Package,
    approvalStatus: 'REQUIRED',
    responsibilities: [
      'Driving assigned vehicles on routes',
      'Scanning parcels at each hub',
      'Maintaining vehicle logs'
    ],
    benefits: [
      'Steady fleet-based employment',
      'Mobile scanning app',
      'Assigned routes'
    ],
    learnMore: {
      capabilities: ['Assigned route navigation', 'Parcel scanning', 'Incident reporting'],
      process: 'Must be invited by a registered Logistics Partner.',
      features: ['Driver mobile app', 'Route logs', 'Earnings view']
    }
  },
  {
    id: 'SUPPORT_OFFICER',
    title: 'Support Officer',
    description: 'Official platform staff responsible for resolving customer issues and disputes.',
    icon: LifeBuoy,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Resolving support tickets',
      'Managing shipment disputes',
      'Providing customer assistance'
    ],
    benefits: [
      'Internal platform access',
      'Support management tools',
      'Official staff designation'
    ],
    learnMore: {
      capabilities: ['Ticket management', 'Dispute resolution', 'User lookup'],
      process: 'Internal recruitment and HR verification required.',
      features: ['Support dashboard', 'Chat console', 'Ticket system']
    }
  },
  {
    id: 'OPERATIONS_MANAGER',
    title: 'Operations Manager',
    description: 'Manage hub networks, service zones, and overall platform operational efficiency.',
    icon: Shield,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Monitoring hub network health',
      'Optimizing logistics routes',
      'Managing operational staff'
    ],
    benefits: [
      'Network-wide visibility',
      'Operational control tools',
      'Data-driven optimization'
    ],
    learnMore: {
      capabilities: ['Hub management', 'Route optimization', 'Performance analytics'],
      process: 'Internal recruitment for management positions.',
      features: ['Operations console', 'Network map', 'Analytics engine']
    }
  },
  {
    id: 'SUPER_ADMIN',
    title: 'Super Admin',
    description: 'Ultimate platform authority responsible for system security and global configuration.',
    icon: Settings,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'System-wide configuration',
      'Security auditing',
      'Admin role management'
    ],
    benefits: [
      'Total system access',
      'Security control',
      'Policy management'
    ],
    learnMore: {
      capabilities: ['Global settings management', 'Audit log access', 'User management'],
      process: 'Restricted to platform founders and security heads.',
      features: ['Security console', 'Global settings', 'System logs']
    }
  },
  {
    id: 'VERIFICATION_OFFICER',
    title: 'Verification Officer',
    description: 'Staff member responsible for auditing role applications and document verification.',
    icon: Shield,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Auditing candidate credentials',
      'Verifying ID scans',
      'Approving role applications'
    ],
    benefits: [
      'Internal auditor status',
      'Verification toolset access',
      'Staff dashboard'
    ],
    learnMore: {
      capabilities: ['Review applications', 'Manage document requirements', 'Identity auditing'],
      process: 'Internal recruitment and training required.',
      features: ['Verification queue', 'Document analyzer', 'Audit logs']
    }
  },
  {
    id: 'FINANCE_OFFICER',
    title: 'Finance Officer',
    description: 'Staff member responsible for managing payouts, settlements, and financial reconciliation.',
    icon: Zap,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Processing withdrawal requests',
      'Reconciling hub commissions',
      'Managing platform fees'
    ],
    benefits: [
      'Financial control tools',
      'Settlement management',
      'Finance dashboard'
    ],
    learnMore: {
      capabilities: ['Manage payouts', 'View transaction history', 'Hub settlements'],
      process: 'Internal recruitment for finance department.',
      features: ['Payouts portal', 'Financial reporting', 'Transaction ledger']
    }
  },
  {
    id: 'DISPUTE_ADMIN',
    title: 'Dispute Administrator',
    description: 'Senior staff responsible for arbitrating complex disputes and escalated cases.',
    icon: LifeBuoy,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Resolving high-priority disputes',
      'Managing arbitration policy',
      'Overseeing support tickets'
    ],
    benefits: [
      'Arbitration authority',
      'Dispute management console',
      'Senior staff status'
    ],
    learnMore: {
      capabilities: ['Final resolution authority', 'Manage support admins', 'Policy overrides'],
      process: 'Internal promotion and senior management review.',
      features: ['Dispute resolution center', 'Case management', 'Evidence auditing']
    }
  },
  {
    id: 'DISPATCH_COMPANY',
    title: 'Dispatch Company',
    description: 'Independent delivery company focused on high-volume last-mile delivery services.',
    icon: Truck,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Managing high-volume deliveries',
      'Operating last-mile logistics',
      'Ensuring delivery SLAs'
    ],
    benefits: [
      'Volume dispatch access',
      'Business logistics portal',
      'Priority routing'
    ],
    learnMore: {
      capabilities: ['Fleet oversight', 'Bulk dispatch management', 'Priority SLA support'],
      process: 'Business license and dispatch operational audit required.',
      features: ['Dispatch console', 'Volume analytics', 'SLA monitoring']
    }
  },
  {
    id: 'FLEET_MANAGER',
    title: 'Fleet Manager',
    description: 'Manager responsible for overseeing drivers and vehicles for a Logistics or Dispatch partner.',
    icon: Users,
    approvalStatus: 'APPLICATION',
    responsibilities: [
      'Assigning drivers to shifts',
      'Vehicle maintenance tracking',
      'Monitoring driver performance'
    ],
    benefits: [
      'Fleet oversight tools',
      'Performance tracking',
      'Fleet manager dashboard'
    ],
    learnMore: {
      capabilities: ['Driver assignment', 'Real-time fleet tracking', 'Maintenance logs'],
      process: 'Verification of fleet management experience and company sponsorship.',
      features: ['Driver console', 'Fleet tracking', 'Efficiency metrics']
    }
  }
];

// What the public registration page should actually offer today. Paused
// roles are filtered out here only -- their full definitions above are
// untouched and instantly available again by editing PAUSED_ROLES.
export const PUBLIC_SIGNUP_ROLES: RoleInfo[] = ROLES.filter(r => !PAUSED_ROLES.includes(r.id));
