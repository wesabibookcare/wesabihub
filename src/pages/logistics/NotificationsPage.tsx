import React from 'react';
import { LogisticsLayout } from '@/src/layouts/LogisticsLayout';
import { NotificationCenter } from '@/src/components/common/NotificationCenter';

export const NotificationsPage: React.FC = () => {
  return (
    <LogisticsLayout>
      <NotificationCenter />
    </LogisticsLayout>
  );
};
