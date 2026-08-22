import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Map as MapIcon,
  Users,
  Package,
  TrendingUp,
  Wallet,
  LifeBuoy,
  Settings,
  Search,
  ShieldCheck,
  QrCode,
  Briefcase,
  History,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { GlobalHeaderRight } from '../components/layout/GlobalHeaderRight';
import { ResponsiveLayout, MenuItem } from './ResponsiveLayout';
import { useAuth } from '../context/AuthContext';

interface LogisticsLayoutProps {
  children: React.ReactNode;
}

export const LogisticsLayout = ({ children }: LogisticsLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user?.role === 'LOGISTICS_COMPANY';
  const isStaff = user?.role === 'FLEET_MANAGER' || user?.role === 'DRIVER';

  const ownerItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/logistics/dashboard/owner' },
    { icon: MapIcon, label: 'Assigned Routes', href: '/logistics/routes' },
    { icon: Briefcase, label: 'Transport Jobs', href: '/logistics/jobs' },
    { icon: Truck, label: 'Fleet', href: '/logistics/fleet' },
    { icon: Users, label: 'Team', href: '/logistics/drivers' },
    { icon: Package, label: 'Shipments', href: '/logistics/shipments' },
    { icon: Wallet, label: 'Earnings', href: '/logistics/earnings' },
    { icon: History, label: 'Payouts', href: '/logistics/payouts' },
    { icon: TrendingUp, label: 'Reports', href: '/logistics/reports' },
    { icon: AlertTriangle, label: 'Report Exception', href: '/logistics/exception' },
    { icon: LifeBuoy, label: 'Support', href: '/logistics/support' },
    { icon: ShieldCheck, label: 'Company Profile', href: '/logistics/profile' },
    { icon: Settings, label: 'Settings', href: '/logistics/settings' },
  ];

  const staffItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/logistics/dashboard/staff' },
    { icon: Briefcase, label: "Today's Jobs", href: '/logistics/staff/jobs' },
    { icon: MapIcon, label: 'Assigned Routes', href: '/logistics/staff/routes' },
    { icon: QrCode, label: 'Scan Workspace', href: '/logistics/scan' },
    { icon: Package, label: 'Completed Deliveries', href: '/logistics/staff/completed' },
    { icon: AlertTriangle, label: 'Report Exception', href: '/logistics/exception' },
    { icon: LifeBuoy, label: 'Support', href: '/logistics/support' },
  ];

  const menuItems = isOwner ? ownerItems : staffItems;

  const headerContent = (
    <>
      <div className="hidden md:flex items-center gap-6 flex-1 max-w-xl mr-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search jobs, drivers, vehicles..."
            className="w-full h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary-500/50 transition-all"
          />
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <Badge variant="outline" className="rounded-full text-[10px] h-8 px-4 font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-900/10 text-amber-600 border-amber-100 dark:border-amber-800 shrink-0">
          Admin Preview Mode
        </Badge>
      )}

      <GlobalHeaderRight />
    </>
  );

  return (
    <ResponsiveLayout
      menuItems={menuItems}
      subtitle="Logistics"
      headerContent={headerContent}
    >
      {children}
    </ResponsiveLayout>
  );
};
