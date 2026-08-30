import React from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { BuyerSellerChat } from '../../components/chat/BuyerSellerChat';

export const AdminChatPage: React.FC = () => {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <p className="text-primary-600 font-bold uppercase tracking-widest text-[9px] mb-1">Super Admin & Support Oversight</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Omorfi Chat Control Center</h1>
          <p className="text-xs text-slate-600">Inspect conversations, search by username/tracking number/email, and handle evidence disputes across the platform.</p>
        </div>
        <BuyerSellerChat />
      </div>
    </AdminLayout>
  );
};

export default AdminChatPage;
