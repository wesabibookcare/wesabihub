import React from 'react';
import {
  LayoutDashboard,
  Send,
  Download,
  Search,
  MapPin,
  History,
  Wallet,
  BookMarked,
  CreditCard,
  LifeBuoy,
  Settings,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { GlobalHeaderRight } from '../components/layout/GlobalHeaderRight';
import { ResponsiveLayout, MenuItem } from './ResponsiveLayout';
import { useAuth } from '../context/AuthContext';
import { permissionService } from '../services/permissionService';

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ...(permissionService.hasPermission(user, 'SEND_PARCEL') ? [{ icon: Send, label: 'Send Parcel', href: '/customer/send' }] : []),
    { icon: Download, label: 'Receive Parcel', href: '/customer/receive' },
    { icon: Search, label: 'Track Parcel', href: '/customer/track' },
    { icon: MapPin, label: 'Find Hub Point', href: '/customer/hubs' },
    { icon: History, label: 'Shipment History', href: '/customer/history' },
    { icon: Wallet, label: 'Wallet', href: '/customer/wallet' },
    { icon: BookMarked, label: 'Saved Addresses', href: '/customer/addresses' },
    { icon: CreditCard, label: 'Payment Methods', href: '/customer/payments' },
    { icon: Sparkles, label: 'SafePay', href: '/safepay' },
    { icon: Sparkles, label: 'Omorfi Chat', href: '/customer/chat' },
    { icon: LifeBuoy, label: 'Support', href: '/customer/support' },
    { icon: Settings, label: 'Settings', href: '/customer/settings' },
  ];

  const headerContent = (
    <>
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Track a parcel..."
            className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 transition-all dark:text-white"
          />
        </div>
      </div>
      <GlobalHeaderRight />
    </>
  );

  return (
    <ResponsiveLayout
      menuItems={menuItems}
      headerContent={headerContent}
    >
      {children}
    </ResponsiveLayout>
  );
};
