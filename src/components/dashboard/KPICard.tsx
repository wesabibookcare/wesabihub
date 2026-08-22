import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

export function KPICard({ title, value, icon: Icon, trend }: { title: string, value: string | number, icon: LucideIcon, trend?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}
