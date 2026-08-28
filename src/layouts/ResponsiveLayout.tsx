import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Package,
  ChevronRight,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/Button';
import { useAccountPending } from '../components/auth/AccountPendingWrapper';
import { BrandLogo } from '@/src/components/brand/BrandLogo';
import { useSettings } from '../context/SettingsContext';
import { BRAND_ASSETS } from '../lib/brand';

export interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  subtitle?: string;
  headerContent?: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, href, isActive, isCollapsed, onClick }) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
      isActive
        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    )}
    title={isCollapsed ? label : undefined}
  >
    <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "group-hover:text-primary-500")} />
    {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{label}</span>}
    {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
  </Link>
);

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  menuItems,
  subtitle,
  headerContent,
  title,
  showBackButton = true
}) => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omorfihub_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  const { user, activeRole } = useAuth();
  const { isPending, requestedRole } = useAccountPending();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Full menu items are available so user can immediately use Customer features
  const filteredMenuItems = menuItems;

  const getDashboardPath = () => {
    switch (activeRole) {
      case 'SUPER_ADMIN':
      case 'OPERATIONS_MANAGER':
        return '/admin';
      case 'MERCHANT':
        return '/merchant/dashboard';
      case 'CENTER_OWNER':
      case 'CENTER_STAFF':
        return '/point/dashboard/owner';
      case 'LOGISTICS_OWNER':
      case 'LOGISTICS_COMPANY':
      case 'DRIVER':
        return '/logistics/dashboard/owner';
      case 'CUSTOMER':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isDesktop = windowWidth >= 1200;
  const isLaptop = windowWidth >= 992 && windowWidth < 1200;
  const isSmallScreen = windowWidth < 992;

  useEffect(() => {
    if (isLaptop) {
      setIsCollapsed(true);
    } else if (isDesktop) {
      const saved = localStorage.getItem('omorfihub_sidebar_collapsed');
      setIsCollapsed(saved === 'true');
    }
  }, [isLaptop, isDesktop]);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    if (isDesktop) {
      localStorage.setItem('omorfihub_sidebar_collapsed', String(newValue));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDrawerOpen) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = touchStart - currentX;

    // Swipe left to close
    if (diff > 50) {
      setIsDrawerOpen(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const isDashboardPage =
    location.pathname === '/' ||
    location.pathname === '/dashboard' ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/dashboard' ||
    location.pathname === '/merchant/dashboard' ||
    location.pathname === '/point/dashboard/owner' ||
    location.pathname === '/point/dashboard/staff' ||
    location.pathname === '/logistics/dashboard/owner' ||
    location.pathname === '/logistics/dashboard/staff';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-all duration-300 w-full overflow-hidden">
      {/* Mobile/Tablet Backdrop */}
      <AnimatePresence>
        {isSmallScreen && isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        animate={{
          width: isSmallScreen ? 288 : (isCollapsed ? 80 : 288),
          x: isSmallScreen ? (isDrawerOpen ? 0 : -288) : 0
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={cn(
          isSmallScreen ? "fixed inset-y-0 left-0 shadow-2xl" : "relative border-r",
          "bg-white dark:bg-slate-900 z-50 border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-screen"
        )}
      >
        <div className="h-full flex flex-col p-4">
          <Link
            to={getDashboardPath()}
            className="flex items-center gap-3 mb-8 px-2 overflow-hidden shrink-0"
            onClick={() => isSmallScreen && setIsDrawerOpen(false)}
          >
            {(!isCollapsed || isSmallScreen) ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col min-w-0 w-full"
              >
                <BrandLogo size={32} />
                {subtitle && (
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest truncate mt-1">{subtitle}</span>
                )}
              </motion.div>
            ) : (
              <BrandLogo size={32} className="[&>span]:hidden" />
            )}
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar -mx-2 px-2">
            {filteredMenuItems.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)}
                isCollapsed={!isSmallScreen && isCollapsed}
                onClick={() => {
                  if (isSmallScreen) setIsDrawerOpen(false);
                }}
              />
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
            {!isSmallScreen && (
              <button
                onClick={toggleCollapse}
                className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-xl text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all font-semibold"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
              </button>
            )}
            <button
              onClick={() => {
                if (isSmallScreen) setIsDrawerOpen(false);
                navigate('/login');
              }}
              className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all dark:text-slate-400 dark:hover:bg-red-950/20"
              title={isCollapsed && !isSmallScreen ? "Sign Out" : undefined}
            >
              <LogOut size={20} className="shrink-0" />
              {(!isCollapsed || isSmallScreen) && <span className="font-semibold whitespace-nowrap">Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center gap-4">
            {isSmallScreen && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            )}
            {title && (
              <div className="hidden sm:block">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h2>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0">
            {headerContent}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {isPending && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 max-w-[1600px] mx-auto w-full">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>
                  <strong>Account Status:</strong> You're approved as a Customer for now, your <strong>{(requestedRole || user?.requestedRole || 'role').replace(/_/g, ' ')}</strong> application is under review by admin.
                </span>
              </div>
            </div>
          )}
          <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {showBackButton && !isDashboardPage && (
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.history.length <= 2) {
                      navigate(getDashboardPath());
                    } else {
                      // Navigate back, but fallback to active user dashboard if browser history lands on /login or /register
                      navigate(-1);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
            )}
            {children}
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <img
                src={settings?.omorfiLogo || BRAND_ASSETS.omorfiLogo}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                alt="Omorfi Logo"
                className="h-4 w-4 object-contain inline-block"
              />
              <span>{settings?.attributionText || BRAND_ASSETS.attributionText}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
