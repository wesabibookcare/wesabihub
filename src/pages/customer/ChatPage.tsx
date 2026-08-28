import React from 'react';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { BuyerSellerChat } from '../../components/chat/BuyerSellerChat';

export const CustomerChatPage = () => {
  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display dark:text-white">Omorfi Chat</h1>
          <p className="text-sm text-slate-900">Official premium communication between Buyer and Seller with secure SafePay evidence.</p>
        </div>
        <BuyerSellerChat />
      </div>
    </CustomerLayout>
  );
};
