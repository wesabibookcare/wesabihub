
import {
  DollarSign,
  Percent,
  ShieldCheck,
  Star,
  TrendingUp,
  CreditCard,
  Package,
  Map,
  Zap,
  Tag,
  Globe,
  Settings,
  Scale
} from 'lucide-react';

export const RULE_NAV_ITEMS = [
  { id: 'pricing', label: 'Pricing Rules', icon: DollarSign, href: '/admin/business-rules/pricing' },
  { id: 'commissions', label: 'Commission Rules', icon: Percent, href: '/admin/business-rules/commissions' },
  { id: 'payment-protection', label: 'Payment Protection Rules', icon: ShieldCheck, href: '/admin/business-rules/payment-protection' },
  { id: 'points', label: 'WeSabiPoints Rules', icon: Zap, href: '/admin/business-rules/points' },
  { id: 'trust-score', label: 'Trust Score Rules', icon: Scale, href: '/admin/business-rules/trust-score' },
  { id: 'ranking', label: 'Search Ranking Rules', icon: TrendingUp, href: '/admin/business-rules/ranking' },
  { id: 'payouts', label: 'Payout Rules', icon: CreditCard, href: '/admin/business-rules/payouts' },
  { id: 'parcels', label: 'Parcel Rules', icon: Package, href: '/admin/business-rules/parcels' },
  { id: 'zones', label: 'Zone Management', icon: Map, href: '/admin/business-rules/zones' },
  { id: 'services', label: 'Service Levels', icon: Star, href: '/admin/business-rules/services' },
  { id: 'promotions', label: 'Promotions', icon: Tag, href: '/admin/business-rules/promotions' },
  { id: 'taxes', label: 'Taxes & Fees', icon: Globe, href: '/admin/business-rules/taxes' },
  { id: 'global', label: 'Global Configuration', icon: Settings, href: '/admin/business-rules/global' },
];

export interface PricingRule {
  id: string;
  name: string;
  baseFee: number;
  baseWeight: number;
  maxWeight: number;
  weightMultiplier: number;
  distanceMultiplier: number;
  serviceType: 'STANDARD' | 'EXPRESS' | 'SAME_DAY';
}
