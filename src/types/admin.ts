
import {
  Users,
  Store,
  Truck,
  MapPin,
  CheckCircle2,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  BarChart3,
  Bell,
  Ticket,
  Globe,
  TrendingUp,
  ClipboardList,
  Palette,
  Image as ImageIcon,
  Megaphone,
  Briefcase,
  HelpCircle,
  GraduationCap,
  Radio,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';

export interface AdminStats {
  totalUsers: number;
  activePoints: number;
  activeMerchants: number;
  activeLogistics: number;
  pendingVerifications: number;
  revenuePlaceholder: string;
  protectionSummary: string;
  systemHealth: number;
}

export interface BrandAssets {
  name: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  faviconUrl: string;
  appIconUrl: string;
  emailLogoUrl: string;
  documentLogoUrl: string;
  typography: string;
  companyInfo: {
    address: string;
    email: string;
    phone: string;
  };
}

export const ADMIN_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'cctv-monitoring', label: 'CCTV Operational Monitor', icon: Radio, href: '/admin/cctv-monitoring', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'overview', label: 'Platform Overview', icon: BarChart3, href: '/admin/overview', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER'] },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'hub-approvals', label: 'Hub Approvals', icon: MapPin, href: '/admin/hub-approvals', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'verification', label: 'Verification', icon: ShieldCheck, href: '/admin/verification', badge: '12', allowedRoles: ['SUPER_ADMIN', 'VERIFICATION_OFFICER'] },
  { id: 'business-rules', label: 'Business Rules', icon: Briefcase, href: '/admin/business-rules', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_OFFICER'] },
  { id: 'disputes', label: 'Protection Disputes', icon: ShieldCheck, href: '/admin/disputes', badge: '3', allowedRoles: ['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER'] },
  { id: 'chat', label: 'Omorfi Chat', icon: MessageSquare, href: '/admin/chat', allowedRoles: ['SUPER_ADMIN', 'SUPPORT_OFFICER', 'OPERATIONS_MANAGER', 'DISPUTE_ADMIN'] },
  { id: 'security-audit', label: 'Anti-Fraud & Security', icon: ShieldAlert, href: '/admin/audit', allowedRoles: ['SUPER_ADMIN', 'SECURITY_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/admin/reports', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'SUPPORT_OFFICER', 'VERIFICATION_OFFICER', 'FINANCE_OFFICER'] },
  { id: 'test-mode', label: 'Test Mode (Sandbox)', icon: ShieldCheck, href: '/admin/test-mode', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'settings', label: 'System Settings', icon: Settings, href: '/admin/settings', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'secrets', label: 'API Secrets Vault', icon: ShieldCheck, href: '/admin/secrets', allowedRoles: ['SUPER_ADMIN'] },
  { id: 'infrastructure', label: 'Infrastructure', icon: ShieldCheck, href: '/admin/infrastructure', allowedRoles: ['SUPER_ADMIN'] },
  { id: 'content-cms', label: 'Content (CMS)', icon: FileText, href: '/admin/content', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'help-center-config', label: 'AI Help Desk Config', icon: HelpCircle, href: '/admin/help-center', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'training', label: 'Training Academy', icon: GraduationCap, href: '/admin/training', allowedRoles: ['SUPER_ADMIN', 'OPERATIONS_MANAGER'] },
  { id: 'platform-ops', label: 'Platform Operations', icon: Settings, href: '/admin/platform-ops', allowedRoles: ['SUPER_ADMIN'] },
];

import { BRAND_ASSETS } from '../lib/brand';

// ... (previous lines)

export const MOCK_BRAND_ASSETS: BrandAssets = {
  name: 'OmorfiHub',
  slogan: 'Seamless Logistics for Everyone',
  primaryColor: BRAND_ASSETS.primaryColor,
  secondaryColor: BRAND_ASSETS.secondaryColor,
  logoUrl: BRAND_ASSETS.fullLogo,
  logoDarkUrl: BRAND_ASSETS.fullLogo,
  logoLightUrl: BRAND_ASSETS.fullLogo,
  faviconUrl: BRAND_ASSETS.iconLogo,
  appIconUrl: BRAND_ASSETS.iconLogo,
  emailLogoUrl: BRAND_ASSETS.fullLogo,
  documentLogoUrl: BRAND_ASSETS.fullLogo,
  typography: BRAND_ASSETS.typography,
  companyInfo: {
    address: '123 Logistics Way, Tech City',
    email: 'wesabibookcare@gmail.com',
    phone: '+1 234 567 890'
  }
};
