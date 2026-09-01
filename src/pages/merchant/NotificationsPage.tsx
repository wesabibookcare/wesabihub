import React from 'react';
import { MerchantLayout } from '@/src/layouts/MerchantLayout';
import { NotificationCenter } from '@/src/components/common/NotificationCenter';

export const MerchantNotificationsPage: React.FC = () => {
  return (
    <MerchantLayout>
      <NotificationCenter />
    </MerchantLayout>
  );
};

export const NotificationsPage = MerchantNotificationsPage;
