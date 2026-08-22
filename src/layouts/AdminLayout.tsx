
import React, { useState } from 'react';
import {
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '../types/admin';
import { GlobalHeaderRight } from '../components/layout/GlobalHeaderRight';
import { ResponsiveLayout, MenuItem } from './ResponsiveLayout';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems: MenuItem[] = ADMIN_NAV_ITEMS
    .filter(item => !item.allowedRoles || (user && user.roles.some(role => item.allowedRoles!.includes(role))))
    .map(item => ({
      icon: item.icon,
      label: item.label,
      href: item.href
    }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const headerContent = (
    <>
      <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl w-80 mr-auto focus-within:ring-2 focus-within:ring-primary-500 transition-all">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search everything..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-sm font-medium w-full"
        />
      </form>
      <GlobalHeaderRight />
    </>
  );

  return (
    <ResponsiveLayout
      menuItems={menuItems}
      subtitle="Admin"
      title="Platform Control"
      headerContent={headerContent}
      showBackButton={true}
    >
      {children}
    </ResponsiveLayout>
  );
};
