import React from 'react';
import { MerchantLayout } from '../../layouts/MerchantLayout';
import { BuyerSellerChat } from '../../components/chat/BuyerSellerChat';

export const MerchantChatPage = () => {
  return (
    <MerchantLayout>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-display dark:text-white">WeSabiChat</h1>
          <p className="text-sm text-slate-800">Premium merchant communication platform with official SafePay evidence logs.</p>
        </div>
        <BuyerSellerChat />
      </div>
    </MerchantLayout>
  );
};
