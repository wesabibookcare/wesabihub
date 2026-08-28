import React from 'react';
import {
  LayoutDashboard,
  Send,
  Files,
  ShoppingBag,
  Search,
  History,
  ShieldCheck,
  Wallet,
  Users,
  MapPin,
  BarChart3,
  LifeBuoy,
  Settings,
  FileText,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { GlobalHeaderRight } from '../components/layout/GlobalHeaderRight';
import { ResponsiveLayout, MenuItem } from './ResponsiveLayout';

export const MerchantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/merchant/dashboard' },
    { icon: Send, label: 'Create Shipment', href: '/merchant/shipments/create' },
    { icon: Files, label: 'Bulk Shipments', href: '/merchant/shipments/bulk' },
    { icon: ShoppingBag, label: 'Orders', href: '/merchant/orders' },
    { icon: Search, label: 'Track Shipments', href: '/merchant/shipments/track' },
    { icon: History, label: 'Shipment History', href: '/merchant/shipments/history' },
    { icon: FileText, label: 'Parcel Flyers Studio', href: '/merchant/flyer' },
    { icon: ShieldCheck, label: 'SafePay Escrow', href: '/safepay' },
    { icon: Wallet, label: 'Wallet', href: '/merchant/wallet' },
    { icon: Users, label: 'Customers', href: '/merchant/customers' },
    { icon: MapPin, label: 'Saved OmorfiHub Points', href: '/merchant/hubs/saved' },
    { icon: BarChart3, label: 'Reports', href: '/merchant/reports' },
    { icon: Sparkles, label: 'OmorfiHubChat', href: '/merchant/chat' },
    { icon: LifeBuoy, label: 'Support', href: '/merchant/support' },
    { icon: Settings, label: 'Settings', href: '/merchant/settings' },
  ];

  const headerContent = (
    <GlobalHeaderRight />
  );

  return (
    <ResponsiveLayout
      menuItems={menuItems}
      subtitle="Merchant"
      title="Merchant Console"
      headerContent={headerContent}
    >
      {children}
    </ResponsiveLayout>
  );
};
