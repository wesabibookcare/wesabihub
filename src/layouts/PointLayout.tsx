import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  PackagePlus,
  PackageCheck,
  Boxes,
  Users,
  CalendarDays,
  Wallet,
  TrendingUp,
  LifeBuoy,
  Settings,
  Building2,
  CheckSquare,
  Layers
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { GlobalHeaderRight } from '../components/layout/GlobalHeaderRight';
import { ResponsiveLayout, MenuItem } from './ResponsiveLayout';

export const PointLayout = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<'owner' | 'staff'>('owner');
  const navigate = useNavigate();

  const toggleRole = () => {
    const newRole = role === 'owner' ? 'staff' : 'owner';
    setRole(newRole);
    navigate(newRole === 'owner' ? '/point/dashboard/owner' : '/point/dashboard/staff');
  };

  const ownerItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/point/dashboard/owner' },
    { icon: Building2, label: 'Book Merchant Shipment', href: '/point/shipments/book' },
    { icon: PackagePlus, label: 'Receive Parcel', href: '/point/parcels/receive' },
    { icon: Layers, label: 'Bulk Check-In', href: '/point/parcels/bulk-intake' },
    { icon: PackageCheck, label: 'Release Parcel', href: '/point/parcels/release' },
    { icon: Boxes, label: 'Parcel Inventory', href: '/point/inventory' },
    { icon: PackageSearch, label: 'Parcel Search', href: '/point/search' },
    { icon: Users, label: 'Employees', href: '/point/employees' },
    { icon: CalendarDays, label: 'Shifts', href: '/point/shifts' },
    { icon: Wallet, label: 'Earnings', href: '/point/earnings' },
    { icon: TrendingUp, label: 'Reports', href: '/point/reports' },
    { icon: LifeBuoy, label: 'Support', href: '/point/support' },
    { icon: Building2, label: 'Business Profile', href: '/point/profile' },
    { icon: Settings, label: 'Settings', href: '/point/settings' },
  ];

  const staffItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/point/dashboard/staff' },
    { icon: Building2, label: 'Book Merchant Shipment', href: '/point/shipments/book' },
    { icon: PackagePlus, label: 'Receive Parcel', href: '/point/parcels/receive' },
    { icon: Layers, label: 'Bulk Check-In', href: '/point/parcels/bulk-intake' },
    { icon: PackageCheck, label: 'Release Parcel', href: '/point/parcels/release' },
    { icon: Boxes, label: 'Parcel Inventory', href: '/point/inventory' },
    { icon: PackageSearch, label: 'Parcel Search', href: '/point/search' },
    { icon: CheckSquare, label: "Today's Tasks", href: '/point/staff/tasks' },
    { icon: LifeBuoy, label: 'Support', href: '/point/support' },
  ];

  const items = role === 'owner' ? ownerItems : staffItems;

  const headerContent = (
    <>
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700 uppercase tracking-widest mr-auto shrink-0">
         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
         Hub Online: ID-4029-LEK
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleRole}
        className="rounded-full text-[10px] h-8 px-4 font-bold uppercase tracking-widest bg-primary-50 dark:bg-primary-900/10 text-primary-600 border-primary-100 dark:border-primary-800 shrink-0 hidden md:inline-flex"
      >
        Switch to {role === 'owner' ? 'Staff' : 'Owner'}
      </Button>

      <GlobalHeaderRight />
    </>
  );

  return (
    <ResponsiveLayout
      menuItems={items}
      subtitle="Point"
      headerContent={headerContent}
    >
      {children}
    </ResponsiveLayout>
  );
};
