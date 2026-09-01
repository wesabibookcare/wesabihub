import React from 'react';
import { CustomerLayout } from '@/src/layouts/CustomerLayout';
import { NotificationCenter } from '@/src/components/common/NotificationCenter';

export const NotificationsPage: React.FC = () => {
  return (
    <CustomerLayout>
      <NotificationCenter />
    </CustomerLayout>
  );
};
