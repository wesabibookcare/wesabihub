
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { RULE_NAV_ITEMS } from '../types/rules';
import { AdminLayout } from './AdminLayout';
import { ChevronRight } from 'lucide-react';

export const BusinessRulesLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <AdminLayout>
      <div className="flex flex-col xl:flex-row gap-8 ">
        {/* Rules Sidebar */}
        <aside className="w-full xl:w-80 shrink-0">
          <div className="sticky top-28 space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Rules Engine</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Configure platform logic & fees.</p>
            </div>

            <nav className="space-y-1 bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100">
              {RULE_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon size={18} className={cn(isActive ? "text-primary-400" : "text-slate-400 group-hover:text-slate-900")} />
                    <span className="text-sm font-bold flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="text-primary-400" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Notice</h4>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                Changes made here are applied globally in real-time. Please use the simulator before publishing.
              </p>
            </div>
          </div>
        </aside>

        {/* Rules Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </AdminLayout>
  );
};
