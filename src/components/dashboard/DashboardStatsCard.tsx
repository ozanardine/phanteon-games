import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

type DashboardStatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string | number;
    positive: boolean;
  };
  className?: string;
};

export function DashboardStatsCard({ 
  title, 
  value, 
  icon, 
  change, 
  className = '' 
}: DashboardStatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            
            {change && (
              <p className={`text-xs mt-1 ${change.positive ? 'text-green-500' : 'text-red-500'}`}>
                {change.positive ? '+' : ''}{change.value}
              </p>
            )}
          </div>
          
          <div className="p-2 bg-phanteon-orange/20 rounded-lg">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}